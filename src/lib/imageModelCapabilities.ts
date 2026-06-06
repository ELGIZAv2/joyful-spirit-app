export type PublishPlatform = "facebook" | "instagram" | "linkedin";

export interface ImageModelCapability {
  acceptsImages: boolean;
  requiresImage: boolean;
  maxImages: number;
  acceptedMimeTypes: string[];
  helperText: string;
}

const DEFAULT_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

const TEXT_TO_IMAGE_HELPER = "Text → Image only (no image input).";

const TEXT_ONLY: ImageModelCapability = {
  acceptsImages: false,
  requiresImage: false,
  maxImages: 0,
  acceptedMimeTypes: [],
  helperText: TEXT_TO_IMAGE_HELPER,
};

// All image model capabilities are now dynamic via admin bot.
// This map is kept for any manually-added overrides only.
const IMAGE_MODEL_CAPABILITIES: Record<string, ImageModelCapability> = {};

const FALLBACK_CAPABILITY: ImageModelCapability = {
  acceptsImages: false,
  requiresImage: false,
  maxImages: 0,
  acceptedMimeTypes: [],
  helperText: TEXT_TO_IMAGE_HELPER,
};

export const getImageModelCapability = (modelId: string): ImageModelCapability =>
  IMAGE_MODEL_CAPABILITIES[modelId] || FALLBACK_CAPABILITY;

export const PUBLISH_PLATFORM_TO_APP: Record<PublishPlatform, string> = {
  facebook: "facebook",
  instagram: "instagram",
  linkedin: "linkedin",
};
