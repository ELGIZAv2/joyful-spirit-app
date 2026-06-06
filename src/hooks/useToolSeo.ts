import { useEffect } from "react";

/**
 * Per-tool / per-feature SEO registry. Each entry produces real, indexable
 * <title>, meta description, canonical and OpenGraph tags so every tool
 * and feature page can rank independently in Google.
 *
 * Keep titles under ~60 chars and descriptions under ~160 chars.
 */
export type ToolSeoEntry = {
  title: string;
  description: string;
  path: string;
  keywords?: string;
  image?: string;
};

const SITE = "https://megsyai.com";
const DEFAULT_IMAGE =
  "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/fae3cd77-3f99-4a10-8225-ba5e64510390/id-preview-b1f21eef--70a3240c-12ec-46ff-99ea-54f772181a95.lovable.app-1772787005803.png";

export const TOOL_SEO: Record<string, ToolSeoEntry> = {
  // ── Image tools ────────────────────────────────────────────────
  inpaint: {
    title: "AI Inpainting — Edit & Replace Anything in a Photo",
    description: "Brush over any area and let AI replace, remove or restyle it. Pixel-perfect AI inpainting powered by Nano Banana Pro and GPT-Image 2.",
    path: "/images/tools/inpaint",
    keywords: "ai inpainting, photo inpaint, replace object in photo, ai photo editor",
  },
  "clothes-changer": {
    title: "AI Clothes Changer — Try On Any Outfit Instantly",
    description: "Swap outfits on any photo with AI. Try on dresses, suits and styles in seconds — realistic results, no photoshoot needed.",
    path: "/images/tools/clothes-changer",
    keywords: "ai clothes changer, virtual try on, outfit swap ai",
  },
  headshot: {
    title: "AI Headshot Generator — Professional Photos in Seconds",
    description: "Generate studio-quality professional headshots from a single selfie. Perfect for LinkedIn, resumes and team pages.",
    path: "/images/tools/headshot",
    keywords: "ai headshot, professional headshot generator, linkedin photo ai",
  },
  "bg-remover": {
    title: "AI Background Remover — Free, Instant, Pixel-Perfect",
    description: "Remove image backgrounds in one click with edge-perfect AI. Transparent PNG export, no signup required to preview.",
    path: "/images/tools/bg-remover",
    keywords: "background remover, remove bg, transparent png, ai cutout",
  },
  "portrait-studio": {
    title: "AI Portrait Studio — Face Swap & Identity Preservation",
    description: "Swap faces between photos with realistic lighting and identity preservation. Powered by the latest face-aware diffusion models.",
    path: "/images/tools/portrait-studio",
    keywords: "ai face swap, portrait ai, identity preserving face swap",
  },
  relight: {
    title: "AI Relight — Change Lighting in Any Photo",
    description: "Restage any photo with cinematic lighting. Studio, golden hour, neon or HDR — AI relights without re-shooting.",
    path: "/images/tools/relight",
    keywords: "ai relight, photo lighting, change lighting ai",
  },
  colorizer: {
    title: "AI Photo Colorizer — Bring Black & White to Life",
    description: "Colorize old black and white photos with historically accurate, natural color. Restore family memories with AI.",
    path: "/images/tools/colorizer",
    keywords: "ai colorize, black and white to color, photo restoration",
  },
  "character-studio": {
    title: "AI Character Studio — Consistent Characters Across Scenes",
    description: "Create a custom character and place them in any scene, pose or style with identity-locked AI generation.",
    path: "/images/tools/character-studio",
    keywords: "ai character generator, consistent character ai, character swap",
  },
  storyboard: {
    title: "AI Storyboard Generator — From Script to Shots",
    description: "Turn a script or idea into a complete shot-by-shot storyboard with consistent characters and cinematic framing.",
    path: "/images/tools/storyboard",
    keywords: "ai storyboard, script to storyboard, shot generator",
  },
  "sketch-to-image": {
    title: "Sketch to Image AI — Draw, Render, Done",
    description: "Turn rough sketches into photoreal or stylized renders. Perfect for designers, illustrators and concept artists.",
    path: "/images/tools/sketch-to-image",
    keywords: "sketch to image, drawing to ai art, sketch render",
  },
  retouching: {
    title: "AI Photo Retouching — Magazine-Quality in One Click",
    description: "Smooth skin, fix lighting, remove blemishes and enhance details with non-destructive AI retouching.",
    path: "/images/tools/retouching",
    keywords: "ai retouching, photo enhancer, skin retouch ai",
  },
  remover: {
    title: "AI Object Remover — Delete Anything from Photos",
    description: "Erase people, objects, watermarks or text from any photo. Clean fills, photoreal results — free preview.",
    path: "/images/tools/remover",
    keywords: "object remover, remove people from photo, watermark remover",
  },
  "hair-changer": {
    title: "AI Hair Changer — Try Hairstyles & Colors Instantly",
    description: "Preview new hairstyles and colors on your own photo. Cuts, lengths, dyes — see the result before the salon.",
    path: "/images/tools/hair-changer",
    keywords: "ai hairstyle, hair color changer, virtual hair try on",
  },
  cartoon: {
    title: "AI Cartoonizer — Turn Photos into Stunning Cartoons",
    description: "Convert any photo into Pixar-style, anime, Studio Ghibli or comic-book art with one tap.",
    path: "/images/tools/cartoon",
    keywords: "cartoonize photo, ai cartoon, anime filter, pixar style ai",
  },
  "avatar-generator": {
    title: "AI Avatar Generator — Unique Profile Pics in Seconds",
    description: "Generate stunning AI avatars for social, gaming and team pages. Hundreds of styles, full ownership of every result.",
    path: "/images/tools/avatar-generator",
    keywords: "ai avatar, profile picture generator, pfp ai",
  },
  "product-photo": {
    title: "AI Product Photography — Studio Shots Without a Studio",
    description: "Upload your product and get magazine-quality lifestyle and ecommerce photos in any setting.",
    path: "/images/tools/product-photo",
    keywords: "ai product photo, ecommerce photography, product shoot ai",
  },
  "logo-generator": {
    title: "AI Logo Generator — Brand-Ready Logos in Minutes",
    description: "Create a unique vector-ready logo with AI. Explore variations, download print-ready files, own all rights.",
    path: "/images/tools/logo-generator",
    keywords: "ai logo generator, logo maker, brand logo ai",
  },
  "perspective-correction": {
    title: "AI Perspective Correction — Straighten Any Photo",
    description: "Fix tilted buildings, skewed documents and crooked horizons automatically with AI perspective correction.",
    path: "/images/tools/perspective-correction",
    keywords: "perspective correction, straighten photo ai, keystone fix",
  },

  // ── Video tools ────────────────────────────────────────────────
  "video-character-studio": {
    title: "AI Video Character Swap — Replace Anyone in a Clip",
    description: "Swap characters in any video with identity-locked AI. Keeps motion, lighting and lip-sync intact.",
    path: "/videos/tools/character-studio",
    keywords: "video face swap, character swap video, ai video",
  },
  "video-upscale": {
    title: "AI Video Upscaler — Up to 4K with Frame Restoration",
    description: "Upscale any video to 4K, restore detail and smooth motion with frame-accurate AI.",
    path: "/videos/tools/upscale",
    keywords: "video upscaler, ai 4k upscale, video enhance",
  },
  "talking-photo": {
    title: "Talking Photo AI — Make Any Image Speak",
    description: "Animate any portrait with realistic lip-sync from text or voice. Bring photos, paintings and characters to life.",
    path: "/videos/tools/talking-photo",
    keywords: "talking photo, ai lip sync, photo to video",
  },
  "video-extender": {
    title: "AI Video Extender — Continue Any Clip Seamlessly",
    description: "Extend videos by seconds or minutes with motion-consistent AI generation. Perfect for ads and social cuts.",
    path: "/videos/tools/video-extender",
    keywords: "video extender, ai video extension, extend clip ai",
  },
  "auto-caption": {
    title: "AI Auto Captions — Burned-In Subtitles in 90+ Languages",
    description: "Generate accurate, styled subtitles for any video. Translate and export to SRT, VTT or burned-in.",
    path: "/videos/tools/auto-caption",
    keywords: "ai captions, auto subtitle, video subtitles ai",
  },
  "lip-sync": {
    title: "AI Lip Sync — Dub Any Video into Any Language",
    description: "Sync lips perfectly to new audio or translated speech in 50+ languages. Studio-grade dubbing with AI.",
    path: "/videos/tools/lip-sync",
    keywords: "ai lip sync, video dubbing, ai dubbing",
  },
  "video-to-text": {
    title: "Video to Text — AI Transcription with Speaker Labels",
    description: "Transcribe any video to text with speaker diarization, timestamps and 99+ language support.",
    path: "/videos/tools/video-to-text",
    keywords: "video to text, ai transcription, speech to text",
  },
  "green-screen": {
    title: "AI Green Screen — Remove Backgrounds from Video",
    description: "Replace any video background with AI matting — no green screen, no studio required.",
    path: "/videos/tools/green-screen",
    keywords: "ai green screen, video background remover, ai matting",
  },
  "video-colorizer": {
    title: "AI Video Colorizer — Colorize Historical Footage",
    description: "Add accurate, vivid color to black and white video. Perfect for documentaries and family archives.",
    path: "/videos/tools/video-colorizer",
    keywords: "video colorizer, ai colorize video, restore old video",
  },
  "video-watermark": {
    title: "AI Video Watermark Remover — Clean Any Clip",
    description: "Remove watermarks, logos and overlays from videos with frame-accurate AI inpainting.",
    path: "/videos/tools/video-watermark",
    keywords: "watermark remover video, remove logo from video",
  },
  "video-bg-replacer": {
    title: "AI Video Background Replacer — Any Scene, Any Style",
    description: "Replace video backgrounds with photoreal AI scenes. Studio quality without a green screen.",
    path: "/videos/tools/video-bg-replacer",
    keywords: "video background replacer, ai background video",
  },
  "video-intro": {
    title: "AI Video Intro Maker — Cinematic Openers in Minutes",
    description: "Generate branded video intros with motion graphics, sound design and cinematic openers using AI.",
    path: "/videos/tools/video-intro",
    keywords: "video intro maker, ai intro, opener generator",
  },
  "video-denoise": {
    title: "AI Video Denoiser — Remove Grain & Compression Artifacts",
    description: "Clean up noisy, grainy or low-light video with temporal-aware AI denoising.",
    path: "/videos/tools/video-denoise",
    keywords: "video denoise, ai denoiser, clean video footage",
  },
  "thumbnail-generator": {
    title: "AI Thumbnail Generator — Click-Worthy YouTube Covers",
    description: "Generate high-CTR YouTube and short-form thumbnails with custom faces, expressions and text.",
    path: "/videos/tools/thumbnail-generator",
    keywords: "youtube thumbnail generator, ai thumbnail, video cover ai",
  },
};

function setMeta(name: string, content: string, attr: "name" | "property" = "name") {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

/**
 * Apply per-feature SEO to a page. Pass either a registered slug (from
 * TOOL_SEO) or a custom { title, description, path } object. Works without
 * react-helmet — writes directly to document.head and restores nothing on
 * unmount because the next page will overwrite the same tags.
 */
export function useToolSeo(slugOrEntry: string | ToolSeoEntry) {
  useEffect(() => {
    const entry: ToolSeoEntry | undefined =
      typeof slugOrEntry === "string" ? TOOL_SEO[slugOrEntry] : slugOrEntry;
    if (!entry) return;
    const url = `${SITE}${entry.path}`;
    const img = entry.image || DEFAULT_IMAGE;
    document.title = entry.title;
    setMeta("description", entry.description);
    if (entry.keywords) setMeta("keywords", entry.keywords);
    setLink("canonical", url);
    // Make sure the tool page is indexable even if a parent layout set noindex
    setMeta("robots", "index, follow");
    setMeta("og:title", entry.title, "property");
    setMeta("og:description", entry.description, "property");
    setMeta("og:url", url, "property");
    setMeta("og:type", "website", "property");
    setMeta("og:image", img, "property");
    setMeta("og:site_name", "Megsy AI", "property");
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", entry.title);
    setMeta("twitter:description", entry.description);
    setMeta("twitter:image", img);
  }, [slugOrEntry]);
}

export default useToolSeo;
