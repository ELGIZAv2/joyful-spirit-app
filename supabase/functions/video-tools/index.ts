// Edge function: video-tools
// Routes each video service to its dedicated fal.ai model.
//
// Request: { tool: <service-id>, model?: string, video?, image?, audio?,
//            background?, prompt?, url?, action?, ...extra }
// Response: { url: string, text?: string } | { error }

import { falRun, extractVideoUrl, FalError } from "../_shared/fal.ts";
import { ensurePublicUrl } from "../_shared/uploadDataUrl.ts";
import { getAuthUser } from "../_shared/auth.ts";
import { spendCreditsServer, creditErrorResponse } from "../_shared/credits.ts";

const MEDIA_FIELDS = ["video", "image", "audio", "background", "backgroundImage", "url"] as const;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

interface Body {
  tool: string;
  model?: string;
  video?: string;
  image?: string;
  audio?: string;
  background?: string;
  backgroundImage?: string;
  prompt?: string;
  script?: string;
  text?: string;
  url?: string;
  action?: string;
  style?: string;
  position?: string;
  resolution?: string;
  tier?: string;
  strength?: number;
  mode?: string;
  quality?: string;
  extraSeconds?: number;
  duration?: number;
  withAudio?: boolean;
  opacity?: number;
  [k: string]: unknown;
}

type Route = {
  defaultModel: string;
  requires?: (keyof Body)[];
  build: (b: Body) => Record<string, unknown>;
  /** override return: when set, returns { text } instead of { url } */
  textResult?: boolean;
};

const ROUTES: Record<string, Route> = {
  // Video + (image OR prompt) → fal-ai/video-background-replacement
  "video-bg-replacer": {
    defaultModel: "fal-ai/video-background-replacement",
    requires: ["video"],
    build: (b) => ({
      video_url: b.video,
      ...(b.backgroundImage ? { image_url: b.backgroundImage } : {}),
      ...(b.prompt ? { prompt: b.prompt } : {}),
    }),
  },

  // Video only
  "video-colorizer": {
    defaultModel: "fal-ai/ddcolor/video",
    requires: ["video"],
    build: (b) => ({ video_url: b.video }),
  },

  // Video denoise (Topaz)
  "video-denoise": {
    defaultModel: "fal-ai/topaz/video-denoise",
    requires: ["video"],
    build: (b) => ({
      video_url: b.video,
      ...(b.strength != null ? { strength: b.strength } : {}),
    }),
  },

  // Extend a video
  "video-extender": {
    defaultModel: "fal-ai/luma-dream-machine/extend-video",
    requires: ["video"],
    build: (b) => ({
      video_url: b.video,
      ...(b.extraSeconds ? { extend_duration: b.extraSeconds } : {}),
    }),
  },

  // Brand intro: image + prompt → image-to-video
  "video-intro": {
    defaultModel: "fal-ai/kling-video/v2/master/image-to-video",
    requires: ["image", "prompt"],
    build: (b) => ({
      prompt: b.prompt,
      image_url: b.image,
      duration: "5",
    }),
  },

  // Face swap in video
  "swap-characters": {
    defaultModel: "fal-ai/face-swap-video",
    requires: ["video", "image"],
    build: (b) => ({
      target_video_url: b.video,
      swap_image_url: b.image,
    }),
  },

  // Whisper transcription → returns text, not a video
  "video-to-text": {
    defaultModel: "fal-ai/whisper",
    requires: ["url"],
    build: (b) => ({ audio_url: b.url, task: "transcribe" }),
    textResult: true,
  },

  // Topaz video upscale
  "upscale": {
    defaultModel: "fal-ai/topaz/upscale/video",
    requires: ["video"],
    build: (b) => ({
      video_url: b.video,
      ...(b.resolution ? { target_resolution: b.resolution } : {}),
    }),
  },

  // Watermark via ffmpeg
  "watermark": {
    defaultModel: "fal-ai/ffmpeg-api/watermark",
    requires: ["video", "text"],
    build: (b) => ({
      video_url: b.video,
      text: b.text,
      position: b.position ?? "bottom-right",
      opacity: b.opacity ?? 0.8,
    }),
  },

  // Talking photo: image + audio
  "talking-photo": {
    defaultModel: "fal-ai/sadtalker",
    requires: ["image"],
    build: (b) => ({
      source_image_url: b.image,
      ...(b.audio ? { driven_audio_url: b.audio } : {}),
    }),
  },

  // Lip-sync: video + audio
  "lip-sync": {
    defaultModel: "fal-ai/sync-lipsync",
    requires: ["video", "audio"],
    build: (b) => ({
      video_url: b.video,
      audio_url: b.audio,
    }),
  },

  // Green-screen / video background removal
  "green-screen": {
    defaultModel: "fal-ai/ben/v2/video",
    requires: ["video"],
    build: (b) => ({
      video_url: b.video,
      ...(b.background ? { background_url: b.background } : {}),
    }),
  },

  // Auto-caption
  "auto-caption": {
    defaultModel: "fal-ai/auto-caption",
    requires: ["video"],
    build: (b) => ({
      video_url: b.video,
      ...(b.style ? { font_style: b.style } : {}),
      ...(b.position ? { position: b.position } : {}),
    }),
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authUser = await getAuthUser(req);
  if (!authUser) return json({ error: "auth_required" }, 401);

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const route = ROUTES[body.tool];
  if (!route) return json({ error: `Unknown tool: ${body.tool}` }, 400);

  for (const f of route.requires ?? []) {
    const v = body[f];
    if (!v || (typeof v === "string" && !v.trim())) {
      return json({ error: `Missing required field: ${String(f)}` }, 400);
    }
  }

  const model = body.model || route.defaultModel;

  // Server-side credit enforcement (video tools cost more than image tools)
  const cost = route.textResult ? 2 : 5;
  const spend = await spendCreditsServer(authUser.id, cost, `video_tools:${body.tool}`, `Video tool: ${body.tool}`);
  if (!spend.ok) return creditErrorResponse(spend, corsHeaders);

  try {
    // Auto-upload any data: URLs to public storage so fal can fetch them.
    for (const f of MEDIA_FIELDS) {
      const v = body[f];
      if (typeof v === "string" && v.startsWith("data:")) {
        body[f] = await ensurePublicUrl(v, `video-tools/${body.tool}`);
      }
    }
    const payload = route.build(body);
    const result = await falRun(model, payload, { maxWaitMs: 8 * 60 * 1000 });

    if (route.textResult) {
      const text = (result as any)?.text ?? (result as any)?.transcription ?? "";
      return json({ text, raw: result });
    }

    const url = extractVideoUrl(result);
    if (!url) return json({ error: "Model returned no video", raw: result }, 502);
    return json({ url });
  } catch (err) {
    const status = err instanceof FalError ? err.status : 500;
    const message = err instanceof Error ? err.message : String(err);
    console.error(`video-tools[${body.tool}] error:`, message);
    return json({ error: message }, status);
  }
});
