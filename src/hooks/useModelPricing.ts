import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ModelPricingRow {
  id: string;
  provider: string;
  kind: "image" | "video" | "chat" | "audio";
  label: string;
  endpoint: string;
  unit: string;
  credits_per_unit: number | null;
  in_price_per_m: number | null;
  out_price_per_m: number | null;
  icon: string | null;
  badge: string | null;
  enabled: boolean;
  sort_order: number;
  metadata: Record<string, any>;
}

export function useModelPricing(kind?: ModelPricingRow["kind"]) {
  return useQuery({
    queryKey: ["model-pricing", kind ?? "all"],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      let q = supabase
        .from("model_pricing")
        .select("*")
        .eq("enabled", true)
        .order("sort_order", { ascending: true });
      if (kind) q = q.eq("kind", kind);
      const { data, error } = await q;
      if (error) throw error;
      return (data as ModelPricingRow[]) ?? [];
    },
  });
}

/** Format the credit cost for display: "2 credits", "6 credits/sec", "~0.5/msg" */
export function formatCredits(row: ModelPricingRow, opts?: { perSecond?: boolean }): string {
  if (row.kind === "chat") {
    const min = Number(row.metadata?.min_credits ?? 0.5);
    const max = Number(row.metadata?.max_credits ?? 8);
    return `${min}–${max} Credits / Message`;
  }
  const per = row.credits_per_unit ?? 1;
  if (row.kind === "video") return `${per} Credits / second`;
  return `${per} Credits`;
}
