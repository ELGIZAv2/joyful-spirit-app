import { supabase } from "@/integrations/supabase/client";
import type { FileBuilderType, AnyBuilderSchema } from "./types";

function sanitizeArtifactFileName(fileName: string): string {
  const trimmed = fileName.trim() || "artifact";
  const dotIndex = trimmed.lastIndexOf(".");
  const rawBase = dotIndex > 0 ? trimmed.slice(0, dotIndex) : trimmed;
  const rawExt = dotIndex > 0 ? trimmed.slice(dotIndex + 1) : "";

  const base = rawBase
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._ -]/g, "_")
    .replace(/\s+/g, "-")
    .replace(/_+/g, "_")
    .replace(/-+/g, "-")
    .replace(/^[-_.]+|[-_.]+$/g, "")
    .slice(0, 80) || "artifact";

  const ext = rawExt
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 10);

  return ext ? `${base}.${ext}` : base;
}

/**
 * Ask the dedicated edge function to produce a structured JSON for the given builder.
 * Uses Gemini json_object response_format for strict reliability.
 */
export async function generateBuilderSchema<T extends AnyBuilderSchema>(
  fileType: FileBuilderType,
  topic: string,
  context: { brief?: unknown; extraText?: string; userLanguage?: string } = {}
): Promise<T | null> {
  const tryOnce = async (): Promise<T | null> => {
    const { data, error } = await supabase.functions.invoke("generate-builder-schema", {
      body: {
        fileType,
        topic,
        brief: context.brief,
        userLanguage: context.userLanguage,
        extra: context.extraText ? { text: context.extraText.slice(0, 4000) } : undefined,
      },
    });
    if (error) { console.warn("[builder-schema] invoke error:", error); return null; }
    if (!data?.success || !data?.schema) {
      console.warn("[builder-schema] no schema returned:", data);
      return null;
    }
    return data.schema as T;
  };

  try {
    const first = await tryOnce();
    if (first) return first;
    // One automatic retry — Gemini occasionally returns empty JSON on first call.
    await new Promise(r => setTimeout(r, 600));
    return await tryOnce();
  } catch (e) {
    console.warn("[builder-schema] exception:", e);
    return null;
  }
}

/** Upload an arbitrary blob to a public bucket and return its public URL. */
export async function uploadArtifact(
  blob: Blob,
  fileName: string,
  bucket: "slide-presentations" | "spreadsheets" | "books" = "slide-presentations"
): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const userPart = user?.id ?? "anon";
    const safeFileName = sanitizeArtifactFileName(fileName);
    const path = `${userPart}/${Date.now()}-${safeFileName}`;
    const { error } = await supabase.storage.from(bucket).upload(path, blob, {
      cacheControl: "3600",
      upsert: false,
      contentType: blob.type || "application/octet-stream",
    });
    if (error) {
      console.warn("uploadArtifact error:", error);
      return null;
    }
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data?.publicUrl ?? null;
  } catch (e) {
    console.warn("uploadArtifact failed:", e);
    return null;
  }
}
