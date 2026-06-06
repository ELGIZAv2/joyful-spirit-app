import type { PublishPlatform } from "./imageModelCapabilities";

export interface VideoModelCapability {
  acceptsImages: boolean;
  requiresImage: boolean;
  maxImages: number;
  acceptedMimeTypes: string[];
  helperText: string;
}

const DEFAULT_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

const TEXT_TO_VIDEO_HELPER = "Text → Video only (no image input).";

// All video model capabilities are now dynamic via admin bot.
// This map is kept for any manually-added overrides only.
const VIDEO_MODEL_CAPABILITIES: Record<string, VideoModelCapability> = {};

const FALLBACK_CAPABILITY: VideoModelCapability = {
  acceptsImages: false,
  requiresImage: false,
  maxImages: 0,
  acceptedMimeTypes: [],
  helperText: TEXT_TO_VIDEO_HELPER,
};

export const getVideoModelCapability = (modelId: string): VideoModelCapability =>
  VIDEO_MODEL_CAPABILITIES[modelId] || FALLBACK_CAPABILITY;

export { type PublishPlatform };
export { PUBLISH_PLATFORM_TO_APP } from "./imageModelCapabilities";
