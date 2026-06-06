// Unified video edge function — Leonardo aggregator (v1 + v2 endpoints).
import { leonardoGenerateVideo, LeonardoError } from "../_shared/providers/leonardo.ts";
import { adminClient, saveRemoteAsset } from "../_shared/media-storage.ts";
import { getAuthUser } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ReqBody {
  model_slug: string;
  prompt: string;
  images?: string[];
  start_frame?: string | null;
  end_frame?: string | null;
  aspect_ratio?: string;
  resolution?: string;
  duration?: number;
  seed?: number;
  workspace_id?: string | null;
  extra?: Record<string, unknown>;
}

type DurationModel = {
  slug?: string | null;
  supported_durations?: number[] | null;
  default_duration?: number | null;
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getAllowedDurations(model: DurationModel): number[] {
  // Trust the DB `supported_durations` for each model. Hardcoded per-slug
  // overrides drift out of sync with Leonardo's actual constraints and cause
  // "Invalid duration" rejections (e.g. veo-3 only accepts [4,8], not [4,6,8]).
  const values = Array.isArray(model.supported_durations) ? model.supported_durations : [];
  return Array.from(new Set(values.map(Number).filter((value) => Number.isFinite(value) && value > 0))).sort((a, b) => a - b);
}

function normalizeDuration(requested: number | undefined, model: DurationModel): number {
  const allowed = getAllowedDurations(model);
  const fallback = allowed.includes(model.default_duration ?? NaN)
    ? (model.default_duration as number)
    : allowed[0] ?? model.default_duration ?? requested ?? 5;

  if (requested === undefined || requested === null || !Number.isFinite(requested)) return fallback;
  if (!allowed.length || allowed.includes(requested)) return requested;

  const nextAllowed = allowed.find((value) => value >= requested);
  return nextAllowed ?? allowed[allowed.length - 1] ?? fallback;
}

// Round to the nearest multiple of `step` to satisfy Leonardo's dimension constraints.
function snap(n: number, step = 16, min = 256, max = 1920): number {
  const v = Math.round(n / step) * step;
  return Math.max(min, Math.min(max, v));
}

function aspectToSize(aspect: string, res: string): { width: number; height: number; mode: "RESOLUTION_720" | "RESOLUTION_1080" } {
  const base = res === "1080p" ? 1080 : 720;
  const mode = base === 1080 ? "RESOLUTION_1080" as const : "RESOLUTION_720" as const;
  const [a, b] = (aspect || "16:9").split(":").map(Number);
  if (!a || !b) return { width: snap(1280), height: snap(base), mode };
  if (a >= b) return { width: snap((base * a) / b), height: snap(base), mode };
  return { width: snap(base), height: snap((base * b) / a), mode };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const user = await getAuthUser(req);
  if (!user) return json({ error: "auth_required" }, 401);

  let body: ReqBody;
  try { body = await req.json(); } catch { return json({ error: "invalid_json" }, 400); }
  if (!body.prompt && !body.images?.length && !body.start_frame) {
    return json({ error: "prompt_or_image_required" }, 400);
  }
  if (!body.model_slug) return json({ error: "model_slug_required" }, 400);

  const admin = adminClient();
  const { data: model, error: modelErr } = await admin
    .from("fal_video_models")
    .select("*")
    .eq("slug", body.model_slug)
    .eq("is_active", true)
    .maybeSingle();
  if (modelErr || !model) return json({ error: `unknown_model:${body.model_slug}` }, 400);

  const requestedDuration = body.duration;
  const duration = normalizeDuration(requestedDuration, model);
  const aspect = body.aspect_ratio || model.default_aspect;
  const resolution = body.resolution || model.default_resolution;
  const wh = aspectToSize(aspect, resolution);

  if (requestedDuration !== undefined && requestedDuration !== duration) {
    console.warn("media-video normalized unsupported duration", JSON.stringify({
      model: body.model_slug,
      requested: requestedDuration,
      normalized: duration,
    }));
  }

  // Validate model capabilities BEFORE deducting credits.
  const startFrame = body.start_frame || body.images?.[0] || null;
  const endFrame = body.end_frame || null;
  const requiresImage =
    model.api_version === "v1-i2v" ||
    (!model.endpoint_text_to_video && !!model.endpoint_image_to_video);
  if (requiresImage && !startFrame) {
    return json({
      error: "image_required",
      message: `${model.display_name} يحتاج صورة بداية (Image-to-Video فقط). ارفع صورة من زر Media.`,
      provider: "leonardo",
    }, 400);
  }

  const credits = model.unit === "video"
    ? (model.credits_per_video ?? 1)
    : Math.max(1, (model.credits_per_second ?? 1) * duration);

  const { data: deduct, error: deductErr } = await admin.rpc("spend_credits_auto", {
    p_user_id: user.id,
    p_amount: credits,
    p_action_type: "leonardo_video_generation",
    p_description: `${model.display_name}`,
  });
  if (deductErr) return json({ error: `credit_error:${deductErr.message}` }, 500);
  if (deduct && deduct.success === false) {
    return json({ error: deduct.error || "insufficient_credits", credits: deduct.credits }, 402);
  }

  try {
    const providerModelId =
      (startFrame && model.endpoint_image_to_video) || model.endpoint_text_to_video || model.endpoint_image_to_video;
    if (!providerModelId) return json({ error: "no_endpoint_for_model" }, 400);

    const apiVersion = (model.api_version as "v1" | "v2" | "v1-i2v" | "v1-t2v") || "v2";

    const { url } = await leonardoGenerateVideo({
      spec: { api_version: apiVersion, modelId: providerModelId },
      prompt: body.prompt,
      width: wh.width,
      height: wh.height,
      duration,
      resolutionMode: wh.mode,
      audio: !!model.supports_audio,
      startFrameUrl: startFrame,
      endFrameUrl: endFrame,
    });

    if (!url) return json({ error: "no_video_returned" }, 502);

    let finalUrl = url;
    const a = await saveRemoteAsset({
      admin, userId: user.id, remoteUrl: url, kind: "video",
      provider: "leonardo", model: model.slug,
      prompt: body.prompt, costCredits: credits,
      width: wh.width, height: wh.height,
      durationSeconds: duration,
      workspaceId: body.workspace_id ?? null,
      metadata: { aspect, resolution, duration, requested_duration: requestedDuration ?? null, input_image: !!startFrame },
    });
    if (a) finalUrl = a.public_url;

    return json({ video_url: finalUrl, credits_charged: credits, provider: "leonardo" });
  } catch (err) {
    const status = err instanceof LeonardoError ? err.status : 500;
    const msg = err instanceof Error ? err.message : String(err);
    console.error("media-video error", msg);
    // Refund credits on provider failure so the user isn't charged for nothing.
    try {
      await admin.rpc("add_credits", {
        p_user_id: user.id,
        p_amount: credits,
        p_action_type: "leonardo_video_refund",
        p_description: `Refund: ${model.display_name} (${msg.slice(0, 80)})`,
      });
    } catch (_) { /* best-effort refund */ }
    // Friendly mapping for common provider failures.
    const lower = msg.toLowerCase();
    let code = "provider_error";
    let userMessage = "حدث خطأ من المزود. تم استرداد الكريدتس.";
    if (lower.includes("not enough api tokens") || status === 402) {
      code = "provider_out_of_credits";
      userMessage = "الخدمة غير متاحة مؤقتًا (رصيد المزود نفد). تم استرداد كريدتسك، حاول لاحقًا.";
    } else if (status >= 500) {
      code = "provider_unavailable";
      userMessage = "المزود غير متاح حاليًا. تم استرداد كريدتسك.";
    }
    return json({ error: code, message: userMessage, provider: "leonardo", refunded: true }, status === 402 ? 503 : status);
  }
});
