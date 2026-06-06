// Media templates are now sourced exclusively from the `showcase_items` table,
// populated by the Telegram bot (see supabase/functions/telegram-webhook).
// Keeping this file as a compatibility shim so existing imports still resolve.

export const TEMPLATE_CATEGORIES = [
  "All",
  "Creatives & Designers",
  "Marketing",
  "Photography",
  "3D & Render",
  "Lifestyle",
] as const;

export type TemplateCategory = (typeof TEMPLATE_CATEGORIES)[number];

export type DemoItem = {
  id: string;
  media_type: "image" | "video";
  media_url: string;
  prompt: string;
  category: string;
  thumbnail_url?: string;
};

export const DEMO_IMAGE_TEMPLATES: DemoItem[] = [];
export const DEMO_VIDEO_TEMPLATES: DemoItem[] = [];
