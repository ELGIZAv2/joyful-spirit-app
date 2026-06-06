// Client-side image → WebP conversion. Falls back to original if WebP unsupported.
export async function toWebP(file: File, quality = 0.85, maxDim = 2048): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  if (file.type === "image/webp" || file.type === "image/gif" || file.type === "image/svg+xml") return file;
  try {
    const bmp = await createImageBitmap(file);
    let { width, height } = bmp;
    const scale = Math.min(1, maxDim / Math.max(width, height));
    width = Math.round(width * scale);
    height = Math.round(height * scale);
    const canvas = typeof OffscreenCanvas !== "undefined"
      ? new OffscreenCanvas(width, height)
      : Object.assign(document.createElement("canvas"), { width, height });
    const ctx = (canvas as HTMLCanvasElement | OffscreenCanvas).getContext("2d") as
      | CanvasRenderingContext2D
      | OffscreenCanvasRenderingContext2D;
    if (!ctx) return file;
    ctx.drawImage(bmp, 0, 0, width, height);
    const blob: Blob | null = "convertToBlob" in canvas
      ? await (canvas as OffscreenCanvas).convertToBlob({ type: "image/webp", quality })
      : await new Promise((res) => (canvas as HTMLCanvasElement).toBlob(res, "image/webp", quality));
    if (!blob || blob.size >= file.size) return file;
    const newName = file.name.replace(/\.(png|jpe?g|bmp|tiff?)$/i, ".webp");
    return new File([blob], newName, { type: "image/webp", lastModified: Date.now() });
  } catch {
    return file;
  }
}

export async function toWebPMany(files: File[]): Promise<File[]> {
  return Promise.all(files.map((f) => toWebP(f)));
}
