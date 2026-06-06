// Lip-Sync model registry — ported from Open-Generative-AI.
// These models drive the Lip Sync Studio. The backend dispatches to fal.ai
// (default) or Muapi when MUAPI_API_KEY is configured.

export type LipSyncCategory = "image" | "video";

export interface LipSyncModel {
  id: string;
  name: string;
  endpoint: string;
  family: string;
  category: LipSyncCategory;
  description: string;
  resolutions?: string[];
  defaultResolution?: string;
  hasPrompt?: boolean;
  cost: number; // credits
  badge?: "fast" | "quality" | "new";
}

export const lipsyncModels: LipSyncModel[] = [
  // Image + Audio → Video
  {
    id: "infinitetalk-image-to-video",
    name: "Infinite Talk",
    endpoint: "infinitetalk-image-to-video",
    family: "infinitetalk",
    category: "image",
    description: "Animate a portrait into a talking video driven by audio.",
    resolutions: ["480p", "720p"],
    defaultResolution: "480p",
    hasPrompt: true,
    cost: 10,
    badge: "quality",
  },
  {
    id: "wan2.2-speech-to-video",
    name: "Wan 2.2 Speech to Video",
    endpoint: "wan2.2-speech-to-video",
    family: "wan",
    category: "image",
    description: "Talking portrait from image + audio using Wan 2.2.",
    resolutions: ["480p", "720p"],
    defaultResolution: "480p",
    hasPrompt: true,
    cost: 10,
  },
  {
    id: "ltx-2.3-lipsync",
    name: "LTX 2.3 Lipsync",
    endpoint: "ltx-2.3-lipsync",
    family: "ltx",
    category: "image",
    description: "High-quality lipsync from portrait image and audio using LTX 2.3.",
    resolutions: ["480p", "720p", "1080p"],
    defaultResolution: "720p",
    hasPrompt: true,
    cost: 14,
    badge: "quality",
  },
  {
    id: "ltx-2-19b-lipsync",
    name: "LTX 2 19B Lipsync",
    endpoint: "ltx-2-19b-lipsync",
    family: "ltx",
    category: "image",
    description: "Lipsync from portrait image and audio using LTX 2 19B.",
    resolutions: ["480p", "720p", "1080p"],
    defaultResolution: "720p",
    hasPrompt: true,
    cost: 12,
  },
  // Video + Audio → Video
  {
    id: "sync-lipsync",
    name: "Sync Lipsync",
    endpoint: "fal-ai/sync-lipsync",
    family: "lipsync",
    category: "video",
    description: "Realistic lipsync animations from audio using Sync.",
    cost: 6,
    badge: "fast",
  },
  {
    id: "sync-lipsync-pro",
    name: "Sync Lipsync Pro",
    endpoint: "fal-ai/sync-lipsync/v2/pro",
    family: "lipsync",
    category: "video",
    description: "Premium Sync v2 — higher mouth fidelity.",
    cost: 12,
    badge: "quality",
  },
  {
    id: "latent-sync",
    name: "LatentSync",
    endpoint: "latentsync-video",
    family: "lipsync",
    category: "video",
    description: "Video-to-video lipsync with LatentSync.",
    cost: 8,
  },
  {
    id: "creatify-lipsync",
    name: "Creatify Lipsync",
    endpoint: "creatify-lipsync",
    family: "lipsync",
    category: "video",
    description: "Optimized for speed, quality, and consistency by Creatify.",
    cost: 8,
    badge: "fast",
  },
  {
    id: "veed-lipsync",
    name: "Veed Lipsync",
    endpoint: "veed-lipsync",
    family: "lipsync",
    category: "video",
    description: "Realistic lipsync from any audio using VEED's latest model.",
    cost: 8,
  },
  {
    id: "infinitetalk-video-to-video",
    name: "Infinite Talk V2V",
    endpoint: "infinitetalk-video-to-video",
    family: "infinitetalk",
    category: "video",
    description: "Apply audio-driven lipsync to an existing video.",
    resolutions: ["480p", "720p"],
    defaultResolution: "480p",
    hasPrompt: true,
    cost: 12,
  },
];

export const imageLipSyncModels = lipsyncModels.filter((m) => m.category === "image");
export const videoLipSyncModels = lipsyncModels.filter((m) => m.category === "video");

export const getLipSyncModelById = (id: string): LipSyncModel | undefined =>
  lipsyncModels.find((m) => m.id === id);
