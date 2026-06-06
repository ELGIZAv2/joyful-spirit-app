import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MediaAsset {
  id: string;
  user_id: string;
  workspace_id: string | null;
  kind: "image" | "video" | "audio";
  provider: string;
  model: string;
  prompt: string | null;
  storage_path: string;
  public_url: string;
  cost_credits: number;
  duration_seconds: number | null;
  width: number | null;
  height: number | null;
  metadata: Record<string, any>;
  created_at: string;
}

export function useMediaAssets(kind?: MediaAsset["kind"], limit = 100) {
  return useQuery({
    queryKey: ["media-assets", kind ?? "all", limit],
    queryFn: async () => {
      let q = supabase
        .from("media_assets")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (kind) q = q.eq("kind", kind);
      const { data, error } = await q;
      if (error) throw error;
      return (data as MediaAsset[]) ?? [];
    },
  });
}

export async function deleteMediaAsset(id: string, storagePath: string) {
  await supabase.storage.from("media-studio").remove([storagePath]);
  await supabase.from("media_assets").delete().eq("id", id);
}
