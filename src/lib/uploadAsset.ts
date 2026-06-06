import { supabase } from "@/integrations/supabase/client";

export type AssetKind = "avatar" | "chat" | "ai-image" | "other";

export interface UploadedAsset {
  id: string;
  public_url: string;
  kind: AssetKind;
  mime_type: string;
  size_bytes: number;
}

const MAX_DIM = 2048;
const WEBP_QUALITY = 0.85;

/**
 * Compress an image client-side using Canvas → WebP.
 * - Resizes to MAX_DIM (longest edge) if larger.
 * - Skips already-tiny GIFs/SVGs (returns original).
 */
async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  if (file.type === "image/gif" || file.type === "image/svg+xml") return file;

  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;

  const { width: w, height: h } = bitmap;
  const scale = Math.min(1, MAX_DIM / Math.max(w, h));
  const nw = Math.round(w * scale);
  const nh = Math.round(h * scale);

  const canvas = document.createElement("canvas");
  canvas.width = nw;
  canvas.height = nh;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, nw, nh);
  bitmap.close();

  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/webp", WEBP_QUALITY),
  );
  if (!blob || blob.size >= file.size) {
    // Compression made it bigger — keep original
    return file;
  }
  const newName = file.name.replace(/\.[^.]+$/, "") + ".webp";
  return new File([blob], newName, { type: "image/webp" });
}

/**
 * Upload a file to Cloudflare R2 via the edge function.
 * Images are auto-compressed to WebP and resized to ≤2048px.
 */
export async function uploadAsset(
  file: File,
  kind: AssetKind = "other",
): Promise<UploadedAsset> {
  const compressed = await compressImage(file);

  // Capture dimensions for images
  let width: number | undefined;
  let height: number | undefined;
  if (compressed.type.startsWith("image/")) {
    try {
      const bmp = await createImageBitmap(compressed);
      width = bmp.width;
      height = bmp.height;
      bmp.close();
    } catch {}
  }

  const form = new FormData();
  form.append("file", compressed);
  form.append("kind", kind);
  if (width) form.append("width", String(width));
  if (height) form.append("height", String(height));

  const { data, error } = await supabase.functions.invoke("upload-asset", {
    body: form,
  });

  if (error) throw error;
  if (!data?.ok || !data.asset) throw new Error(data?.error || "Upload failed");
  return data.asset as UploadedAsset;
}

/**
 * Delete an asset by id (also removes the file from R2).
 */
export async function deleteAsset(id: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke("upload-asset", {
    body: { action: "delete", id },
  });
  if (error) throw error;
  if (!data?.ok) throw new Error(data?.error || "Delete failed");
}
