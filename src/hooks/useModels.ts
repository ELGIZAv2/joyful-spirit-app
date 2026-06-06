import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ALL_MODEL_DETAILS, type ModelDetail } from "@/lib/modelDetails";

export function useDynamicModels() {
  const [models, setModels] = useState<ModelDetail[]>(ALL_MODEL_DETAILS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [memRes, priceRes] = await Promise.all([
          supabase
            .from("memories")
            .select("key, value")
            .or("key.eq.models_hidden,key.eq.models_added,key.like.model_config_%"),
          supabase
            .from("model_pricing")
            .select("id, provider, kind, label, credits_per_unit, min_credits, max_credits, unit, icon, badge, sort_order, enabled")
            .eq("enabled", true)
            .order("sort_order", { ascending: true }),
        ]);

        const memories = memRes.data;
        const pricing = priceRes.data;

        const kindToType: Record<string, ModelDetail["type"]> = {
          image: "image", video: "video", chat: "chat", code: "chat", audio: "chat",
        };

        const pricingModels: ModelDetail[] = (pricing ?? []).map((p: any) => {
          const isRange = p.min_credits != null && p.max_credits != null;
          return {
            id: p.id,
            name: p.label,
            type: kindToType[p.kind] || "image",
            credits: Number(p.credits_per_unit) || 0,
            description: isRange
              ? `${p.min_credits}–${p.max_credits} MC per ${p.unit}`
              : `${p.credits_per_unit} MC per ${p.unit}`,
            longDescription: `${p.label} via ${p.provider}. Billed ${p.credits_per_unit} MC / ${p.unit}.`,
            icon: "Sparkles",
            modes: p.kind === "video" ? ["text-to-video"] : p.kind === "image" ? ["text-to-image"] : ["text-to-text"],
            acceptsImages: p.kind === "image",
            requiresImage: false,
            maxImages: 0,
            acceptedMimeTypes: [],
            provider: p.provider,
            speed: "standard",
            quality: "high",
            iconUrl: p.icon ?? undefined,
            badges: p.badge ? [p.badge] : [],
          } as ModelDetail;
        });

        const hiddenRaw = memories?.find(m => m.key === "models_hidden");
        const addedRaw = memories?.find(m => m.key === "models_added");
        const hidden: string[] = hiddenRaw ? JSON.parse(hiddenRaw.value) : [];
        const added: Partial<ModelDetail>[] = addedRaw ? JSON.parse(addedRaw.value) : [];

        const overrides: Record<string, Record<string, string>> = {};
        (memories ?? []).filter(m => m.key.startsWith("model_config_")).forEach(m => {
          const id = m.key.replace("model_config_", "");
          try { overrides[id] = JSON.parse(m.value); } catch { /* skip */ }
        });

        // Merge ALL_MODEL_DETAILS with model_pricing (pricing wins on conflicts)
        const byId = new Map<string, ModelDetail>();
        for (const m of ALL_MODEL_DETAILS) byId.set(m.id, m);
        for (const m of pricingModels) byId.set(m.id, m);
        let result = Array.from(byId.values()).filter(m => !hidden.includes(m.id));

        const applyOv = (m: ModelDetail, ov?: Record<string, string>): ModelDetail => {
          if (!ov) return m;
          let customization: Record<string, any> | undefined;
          if (ov.customization) { try { customization = JSON.parse(ov.customization); } catch {} }
          return {
            ...m,
            ...(ov.name && { name: ov.name }),
            ...(ov.credits !== undefined && { credits: Number(ov.credits) }),
            ...(ov.description && { description: ov.description }),
            ...(ov.speed && { speed: ov.speed as ModelDetail["speed"] }),
            ...(ov.quality && { quality: ov.quality as ModelDetail["quality"] }),
            ...(ov.requiresImage !== undefined && { requiresImage: ov.requiresImage === "true" }),
            ...(ov.maxImages !== undefined && { maxImages: Number(ov.maxImages) }),
            ...(ov.type && { type: ov.type as ModelDetail["type"] }),
            ...(customization && { customization }),
            ...(ov.icon_url && { iconUrl: ov.icon_url }),
            ...(ov.badges && { badges: ov.badges.split(",").filter(Boolean) }),
          };
        };

        result = result.map(m => applyOv(m, overrides[m.id]));

        if (added.length > 0) {
          const MIME_IMG = ["image/jpeg", "image/png", "image/webp"];
          const newModels: ModelDetail[] = added.map(a => ({
            id: a.id || "",
            name: a.name || a.id || "",
            type: (a.type || "image") as ModelDetail["type"],
            credits: a.credits ?? 0,
            description: a.description || "",
            longDescription: a.longDescription || a.description || "",
            icon: a.icon || "Image",
            modes: a.modes || ["text-to-image"],
            acceptsImages: a.acceptsImages ?? false,
            requiresImage: a.requiresImage ?? false,
            maxImages: a.maxImages ?? 0,
            acceptedMimeTypes: a.acceptedMimeTypes || (a.requiresImage ? MIME_IMG : []),
            provider: a.provider || "Megsy",
            speed: a.speed || "standard",
            quality: a.quality || "high",
          }));
          result = [...result, ...newModels.map(m => applyOv(m, overrides[m.id]))];
        }

        setModels(result);
      } catch (e) {
        console.error("Failed to load dynamic models:", e);
      }
      setLoading(false);
    };
    load();
  }, []);

  return { models, loading };
}
