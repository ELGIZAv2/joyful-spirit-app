// Helper: upload a data: URL (data:<mime>;base64,<...>) to the public
// `model-media` storage bucket and return a publicly accessible https URL.
// If the input is already an https URL it is returned unchanged.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const BUCKET = "model-media";

const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

const EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/webm": "webm",
  "audio/ogg": "ogg",
};

export async function ensurePublicUrl(input?: string | null, folder = "uploads"): Promise<string | undefined> {
  if (!input) return undefined;
  if (!input.startsWith("data:")) return input; // already a URL

  const match = input.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw new Error("Invalid data URL");
  const mime = match[1];
  const b64 = match[2];

  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const ext = EXT[mime] ?? mime.split("/")[1] ?? "bin";
  const path = `${folder}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

  const { error } = await admin.storage.from(BUCKET).upload(path, bytes, {
    contentType: mime,
    upsert: false,
  });
  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data } = admin.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
