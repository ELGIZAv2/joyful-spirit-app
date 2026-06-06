import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PageSettingsImages {
  styles: string[];
  aspectRatios: string[];
  maxImages: number;
  defaultStyle: string;
  defaultAspect: string;
  defaultNumImages: number;
}

export interface PageSettingsVideos {
  aspectRatios: string[];
  durations: number[];
  resolutions: string[];
  defaultAspect: string;
  defaultDuration: number;
  defaultResolution: string;
}

const DEFAULT_IMAGE_SETTINGS: PageSettingsImages = {
  styles: [],
  aspectRatios: ["2:3", "1:1", "16:9"],
  maxImages: 4,
  defaultStyle: "none",
  defaultAspect: "1:1",
  defaultNumImages: 1,
};

const DEFAULT_VIDEO_SETTINGS: PageSettingsVideos = {
  aspectRatios: ["9:16", "16:9", "1:1", "4:3"],
  durations: [4, 5, 6, 8, 10],
  resolutions: ["720p", "1080p", "2K", "4K"],
  defaultAspect: "16:9",
  defaultDuration: 5,
  defaultResolution: "1080p",
};

export function usePageSettings(page: "images" | "videos") {
  const [settings, setSettings] = useState<PageSettingsImages | PageSettingsVideos>(
    page === "images" ? DEFAULT_IMAGE_SETTINGS : DEFAULT_VIDEO_SETTINGS
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("memories")
        .select("value")
        .eq("key", `page_settings_${page}`)
        .maybeSingle();

      if (data?.value) {
        try {
          const parsed = JSON.parse(data.value);
          setSettings(prev => ({ ...prev, ...parsed }));
        } catch { /* use defaults */ }
      }
      setLoading(false);
    };
    load();
  }, [page]);

  return { settings, loading };
}
