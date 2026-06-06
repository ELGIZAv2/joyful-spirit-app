// Edge function: image-tools
// Single entry-point that routes each image service in the app to the proper
// fal.ai model, normalises the response, and returns { url } (or { error }).
//
// Frontend pages always invoke this function with:
//   { tool: <service-id>, image?: dataUrl, mask?: dataUrl, target?: dataUrl|url,
//     ref?: dataUrl, referenceImage?: dataUrl, prompt?: string, gender?: string, ... }
//
// Notes on input:
//   - `image`, `mask`, `target`, `ref`, `referenceImage` can be either a data URL
//     (data:image/png;base64,...) or a public https URL. Most modern fal models
//     accept data URLs directly in their `image_url` / `image_urls` fields.

import { falRun, extractImageUrls, FalError } from "../_shared/fal.ts";
import { ensurePublicUrl } from "../_shared/uploadDataUrl.ts";
import { getAuthUser } from "../_shared/auth.ts";
import { spendCreditsServer, creditErrorResponse } from "../_shared/credits.ts";

const MEDIA_FIELDS = ["image", "mask", "target", "ref", "referenceImage"] as const;

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
  image?: string;
  mask?: string;
  target?: string;
  ref?: string;
  referenceImage?: string;
  prompt?: string;
  gender?: string;
  [k: string]: unknown;
}

// Map every service to its fal model + payload builder.
// Each entry declares:
//   - model: fal model id
//   - requires: which body fields are mandatory
//   - build: turns the request body into the fal payload
//   - fallbackPrompt: used when the service doesn't ask the user for a prompt
type Route = {
  model: string;
  requires?: ("image" | "mask" | "target" | "prompt")[];
  build: (b: Body) => Record<string, unknown>;
};

// Default nano-banana edit model: takes image_urls[] + prompt. Great general-purpose
// image-to-image editor. We use it for most "image + prompt" services.
const nanoEdit = (b: Body, promptOverride?: string): Record<string, unknown> => {
  const images = [b.image, b.ref, b.referenceImage].filter(Boolean) as string[];
  return {
    prompt: promptOverride ?? b.prompt ?? "",
    image_urls: images,
    num_images: 1,
  };
};

const ROUTES: Record<string, Route> = {
  // ─── image + mask + prompt ───────────────────────────────────────
  inpaint: {
    model: "fal-ai/flux-pro/v1/fill",
    requires: ["image", "mask", "prompt"],
    build: (b) => ({
      image_url: b.image,
      mask_url: b.mask,
      prompt: b.prompt,
    }),
  },

  // ─── image + mask (object removal) ──────────────────────────────
  remover: {
    model: "fal-ai/bria/eraser",
    requires: ["image", "mask"],
    build: (b) => ({
      image_url: b.image,
      mask_url: b.mask,
    }),
  },

  // ─── source face + target image ─────────────────────────────────
  "face-swap": {
    model: "fal-ai/face-swap",
    requires: ["image", "target"],
    build: (b) => ({
      base_image_url: b.target,
      swap_image_url: b.image,
    }),
  },
  "character-swap": {
    model: "fal-ai/face-swap",
    requires: ["image", "target"],
    build: (b) => ({
      base_image_url: b.target,
      swap_image_url: b.image,
    }),
  },

  // ─── image + prompt (nano-banana) ───────────────────────────────
  "clothes-changer": {
    model: "fal-ai/nano-banana/edit",
    requires: ["image", "prompt"],
    build: (b) => nanoEdit(b),
  },
  "hair-changer": {
    model: "fal-ai/nano-banana/edit",
    requires: ["image", "prompt"],
    build: (b) => nanoEdit(b),
  },
  headshot: {
    model: "fal-ai/nano-banana/edit",
    requires: ["image", "prompt"],
    build: (b) => nanoEdit(b),
  },
  cartoon: {
    model: "fal-ai/nano-banana/edit",
    requires: ["image", "prompt"],
    build: (b) => nanoEdit(b),
  },
  "avatar-generator": {
    model: "fal-ai/nano-banana/edit",
    requires: ["image", "prompt"],
    build: (b) => nanoEdit(b),
  },
  "product-photo": {
    model: "fal-ai/nano-banana/edit",
    requires: ["image", "prompt"],
    build: (b) => nanoEdit(b),
  },
  "sketch-to-image": {
    model: "fal-ai/nano-banana/edit",
    requires: ["image", "prompt"],
    build: (b) => nanoEdit(b),
  },
  storyboard: {
    model: "fal-ai/nano-banana/edit",
    requires: ["prompt"],
    build: (b) => nanoEdit(b),
  },

  // ─── image only (fixed prompts) ─────────────────────────────────
  colorizer: {
    model: "fal-ai/nano-banana/edit",
    requires: ["image"],
    build: (b) =>
      nanoEdit(
        b,
        "Colorize this black-and-white photo with natural, realistic colors. Preserve all details, faces, textures, and composition. Use period-appropriate tones.",
      ),
  },
  retouching: {
    model: "fal-ai/nano-banana/edit",
    requires: ["image"],
    build: (b) =>
      nanoEdit(
        b,
        "Professionally retouch this portrait: smooth skin while keeping texture, even out skin tone, remove blemishes and small imperfections, brighten eyes subtly. Keep identity 100% intact.",
      ),
  },
  "perspective-correction": {
    model: "fal-ai/nano-banana/edit",
    requires: ["image"],
    build: (b) =>
      nanoEdit(
        b,
        "Fix the perspective and straighten this photo. Correct lens distortion and keystone. Keep the subject centered and sharp.",
      ),
  },

  // ─── image + prompt with relight model ──────────────────────────
  relight: {
    model: "fal-ai/iclight-v2",
    requires: ["image", "prompt"],
    build: (b) => ({
      image_url: b.image,
      prompt: b.prompt,
      num_images: 1,
    }),
  },

  // ─── prompt only (text-to-image) ────────────────────────────────
  "logo-generator": {
    model: "fal-ai/recraft-v3",
    requires: ["prompt"],
    build: (b) => ({
      prompt: b.prompt,
      image_size: "square_hd",
      style: "vector_illustration",
    }),
  },
  "thumbnail-generator": {
    model: "fal-ai/recraft-v3",
    requires: ["prompt"],
    build: (b) => ({
      prompt: b.prompt,
      image_size: "landscape_16_9",
      style: "realistic_image",
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

  // Validate required fields
  for (const field of route.requires ?? []) {
    if (!body[field] || (typeof body[field] === "string" && !(body[field] as string).trim())) {
      return json({ error: `Missing required field: ${field}` }, 400);
    }
  }

  // Server-side credit enforcement (1 credit per image tool call)
  const spend = await spendCreditsServer(authUser.id, 1, `image_tools:${body.tool}`, `Image tool: ${body.tool}`);
  if (!spend.ok) return creditErrorResponse(spend, corsHeaders);

  try {
    for (const f of MEDIA_FIELDS) {
      const v = body[f];
      if (typeof v === "string" && v.startsWith("data:")) {
        body[f] = await ensurePublicUrl(v, `image-tools/${body.tool}`);
      }
    }
    const payload = route.build(body);
    const result = await falRun(route.model, payload, { maxWaitMs: 4 * 60 * 1000 });
    const urls = extractImageUrls(result);
    if (!urls.length) {
      return json({ error: "Model returned no images", raw: result }, 502);
    }
    return json({ url: urls[0], urls });
  } catch (err) {
    const status = err instanceof FalError ? err.status : 500;
    const message = err instanceof Error ? err.message : String(err);
    console.error(`image-tools[${body.tool}] error:`, message);
    return json({ error: message }, status);
  }
});
