// Unified image edge function — Leonardo aggregator (v1 + v2 endpoints).
import { leonardoGenerateImage, LeonardoError } from "../_shared/providers/leonardo.ts";
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
  aspect_ratio?: string;
  resolution?: string;
  num_images?: number;
  seed?: number;
  negative_prompt?: string;
  workspace_id?: string | null;
  extra?: Record<string, unknown>;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Round to the nearest multiple of `step` (Leonardo requires multiples of 8/16).
function snap(n: number, step = 16, min = 512, max = 2048): number {
  const v = Math.round(n / step) * step;
  return Math.max(min, Math.min(max, v));
}

function aspectToSize(aspect: string, res: string): { width: number; height: number } {
  const base = res === "2K" ? 2048 : res === "4K" ? 2048 : 1024; // 4K not supported by most models — clamp to 2K
  const [a, b] = (aspect || "1:1").split(":").map(Number);
  if (!a || !b) return { width: snap(base), height: snap(base) };
  if (a >= b) return { width: snap(base), height: snap((base * b) / a) };
  return { width: snap((base * a) / b), height: snap(base) };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const user = await getAuthUser(req);
  if (!user) return json({ error: "auth_required" }, 401);

  let body: ReqBody;
  try { body = await req.json(); } catch { return json({ error: "invalid_json" }, 400); }
  if (!body.prompt) return json({ error: "prompt_required" }, 400);
  if (!body.model_slug) return json({ error: "model_slug_required" }, 400);

  const admin = adminClient();
  const { data: model, error: modelErr } = await admin
    .from("fal_image_models")
    .select("*")
    .eq("slug", body.model_slug)
    .eq("is_active", true)
    .maybeSingle();
  if (modelErr || !model) return json({ error: `unknown_model:${body.model_slug}` }, 400);

  const images = body.images?.filter(Boolean) ?? [];
  if (images.length > 1 && !model.supports_multi_image) {
    return json({ error: "model_does_not_support_multi_image" }, 400);
  }

  const aspect = body.aspect_ratio || model.default_aspect;
  const resolution = body.resolution || model.default_resolution;
  const wh = aspectToSize(aspect, resolution);
  const numImages = Math.max(1, Math.min(4, body.num_images ?? 1));
  const credits = Math.max(1, (model.credits ?? 1) * numImages);

  const { data: deduct, error: deductErr } = await admin.rpc("spend_credits_auto", {
    p_user_id: user.id,
    p_amount: credits,
    p_action_type: "leonardo_image_generation",
    p_description: `${model.display_name} (${images.length ? "edit" : "generate"})`,
  });
  if (deductErr) return json({ error: `credit_error:${deductErr.message}` }, 500);
  if (deduct && deduct.success === false) {
    return json({ error: deduct.error || "insufficient_credits", credits: deduct.credits }, 402);
  }

  try {
    const providerModelId =
      (images.length && model.endpoint_image_to_image) || model.endpoint_text_to_image || model.endpoint_image_to_image;
    if (!providerModelId) return json({ error: "no_endpoint_for_model" }, 400);

    const { urls } = await leonardoGenerateImage({
      spec: { api_version: (model.api_version as "v1" | "v2") || "v2", modelId: providerModelId },
      prompt: body.prompt,
      width: wh.width,
      height: wh.height,
      num_images: numImages,
      seed: body.seed,
      negative_prompt: body.negative_prompt,
      referenceUrls: images,
    });

    if (!urls.length) return json({ error: "no_images_returned" }, 502);

    const saved: string[] = [];
    for (const u of urls) {
      const a = await saveRemoteAsset({
        admin, userId: user.id, remoteUrl: u, kind: "image",
        provider: "leonardo", model: model.slug,
        prompt: body.prompt, costCredits: credits / urls.length,
        width: wh.width, height: wh.height,
        workspaceId: body.workspace_id ?? null,
        metadata: { aspect, resolution, input_images: images.length },
      });
      if (a) saved.push(a.public_url);
    }
    const finalUrls = saved.length ? saved : urls;
    return json({ image_urls: finalUrls, image_url: finalUrls[0], credits_charged: credits, provider: "leonardo" });
  } catch (err) {
    const status = err instanceof LeonardoError ? err.status : 500;
    const msg = err instanceof Error ? err.message : String(err);
    console.error("media-image error", msg);
    return json({ error: msg, provider: "leonardo" }, status);
  }
});
