// Hook + types for fal image/video models catalog
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface FalImageModel {
  id: string;
  slug: string;
  display_name: string;
  provider: string;
  description: string | null;
  thumbnail_url: string | null;
  endpoint_text_to_image: string | null;
  endpoint_image_to_image: string | null;
  endpoint_multi_reference: string | null;
  unit: "image" | "megapixel";
  fal_unit_cost_usd: number;
  credits: number;
  supports_multi_image: boolean;
  max_input_images: number;
  supported_aspects: string[];
  supported_resolutions: string[];
  default_aspect: string;
  default_resolution: string;
  is_premium: boolean;
  is_new: boolean;
  is_featured: boolean;
  sort_order: number;
}

export interface FalVideoModel {
  id: string;
  slug: string;
  display_name: string;
  provider: string;
  description: string | null;
  thumbnail_url: string | null;
  endpoint_text_to_video: string | null;
  endpoint_image_to_video: string | null;
  endpoint_reference_to_video: string | null;
  endpoint_start_end_frame: string | null;
  unit: "second" | "video";
  cost_per_second_usd: number | null;
  cost_per_video_usd: number | null;
  credits_per_second: number | null;
  credits_per_video: number | null;
  supports_multi_image: boolean;
  max_input_images: number;
  supports_start_end_frame: boolean;
  supports_audio: boolean;
  supported_aspects: string[];
  supported_resolutions: string[];
  supported_durations: number[];
  default_aspect: string;
  default_resolution: string;
  default_duration: number;
  is_premium: boolean;
  is_new: boolean;
  is_featured: boolean;
  sort_order: number;
}

const LEONARDO_VEO_DURATIONS = [4, 6, 8] as const;

function normalizeVideoModel(model: FalVideoModel): FalVideoModel {
  const isLeonardoVeo = model.slug.startsWith("veo-3");
  const supportedDurations = Array.from(new Set((isLeonardoVeo ? [...LEONARDO_VEO_DURATIONS] : model.supported_durations)
    .map(Number)
    .filter((value) => Number.isFinite(value) && value > 0))).sort((a, b) => a - b);
  const defaultDuration = supportedDurations.includes(model.default_duration)
    ? model.default_duration
    : supportedDurations[0] ?? model.default_duration;

  return {
    ...model,
    supported_durations: supportedDurations.length ? supportedDurations : [model.default_duration],
    default_duration: defaultDuration,
  };
}

export function useFalImageModels() {
  const [models, setModels] = useState<FalImageModel[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from("fal_image_models")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      setModels((data ?? []) as FalImageModel[]);
      setLoading(false);
    })();
  }, []);
  return { models, loading };
}

export function useFalVideoModels() {
  const [models, setModels] = useState<FalVideoModel[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from("fal_video_models")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      setModels(((data ?? []) as FalVideoModel[]).map(normalizeVideoModel));
      setLoading(false);
    })();
  }, []);
  return { models, loading };
}

export function videoModelCreditsFor(model: FalVideoModel, duration: number) {
  if (model.unit === "video") return model.credits_per_video ?? 1;
  return Math.max(1, (model.credits_per_second ?? 1) * duration);
}
