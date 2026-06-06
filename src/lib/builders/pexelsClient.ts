import { supabase } from "@/integrations/supabase/client";

export interface PexelsImage {
  id: number;
  src: string;
  thumb: string;
  alt: string;
  photographer?: string;
}

/**
 * Search Pexels for stock photos via the pexels-search edge function.
 * Returns up to `perPage` images (default 6).
 */
export async function searchPexelsImages(query: string, perPage = 6): Promise<PexelsImage[]> {
  try {
    const { data, error } = await supabase.functions.invoke("pexels-search", {
      body: { query, perPage },
    });
    if (error) {
      console.warn("pexels-search error:", error);
      return [];
    }
    if (!data?.success || !Array.isArray(data.images)) return [];
    return data.images as PexelsImage[];
  } catch (e) {
    console.warn("pexels-search failed:", e);
    return [];
  }
}
