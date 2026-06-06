// Upload assets to Cloudflare R2 and track in user_assets table.
// Client sends already-compressed file (WebP for images) via FormData.
// Edge function uploads to R2 using S3-compatible API and records metadata.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { AwsClient } from "https://esm.sh/aws4fetch@1.0.20";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const R2_ACCOUNT_ID = Deno.env.get("R2_ACCOUNT_ID")!;
const R2_ACCESS_KEY_ID = Deno.env.get("R2_ACCESS_KEY_ID")!;
const R2_SECRET_ACCESS_KEY = Deno.env.get("R2_SECRET_ACCESS_KEY")!;
const R2_BUCKET_NAME = Deno.env.get("R2_BUCKET_NAME")!;
const R2_PUBLIC_URL = (Deno.env.get("R2_PUBLIC_URL") || "").replace(/\/$/, "");

const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

const r2 = new AwsClient({
  accessKeyId: R2_ACCESS_KEY_ID,
  secretAccessKey: R2_SECRET_ACCESS_KEY,
  service: "s3",
  region: "auto",
});

const R2_ENDPOINT = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET_NAME}`;

const ALLOWED_KINDS = new Set(["avatar", "chat", "ai-image", "other"]);
const MAX_SIZE = 10 * 1024 * 1024; // 10MB per file
const ALLOWED_MIME = /^(image\/|application\/pdf$|video\/mp4$|audio\/)/;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function extFromMime(mime: string): string {
  if (mime === "image/webp") return "webp";
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/gif") return "gif";
  if (mime === "application/pdf") return "pdf";
  if (mime === "video/mp4") return "mp4";
  const m = mime.split("/")[1] || "bin";
  return m.replace(/[^a-z0-9]/gi, "").slice(0, 8) || "bin";
}

async function getUserId(req: Request): Promise<string | null> {
  const auth = req.headers.get("authorization");
  if (!auth) return null;
  const token = auth.replace(/^Bearer\s+/i, "");
  const { data } = await admin.auth.getUser(token);
  return data.user?.id ?? null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (req.method !== "POST") return json({ error: "POST only" }, 405);

    const userId = await getUserId(req);
    if (!userId) return json({ error: "unauthorized" }, 401);

    // DELETE action via JSON body
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = await req.json().catch(() => ({}));
      if (body.action === "delete" && body.id) {
        const { data: asset } = await admin
          .from("user_assets")
          .select("storage_key, user_id")
          .eq("id", body.id)
          .maybeSingle();
        if (!asset || asset.user_id !== userId) return json({ error: "not found" }, 404);

        await r2.fetch(`${R2_ENDPOINT}/${asset.storage_key}`, { method: "DELETE" });
        await admin.from("user_assets").delete().eq("id", body.id);
        return json({ ok: true });
      }
      return json({ error: "unknown json action" }, 400);
    }

    // Upload via multipart/form-data
    const form = await req.formData();
    const file = form.get("file");
    const kind = String(form.get("kind") || "other");
    const width = Number(form.get("width") || 0) || null;
    const height = Number(form.get("height") || 0) || null;

    if (!(file instanceof File)) return json({ error: "file required" }, 400);
    if (!ALLOWED_KINDS.has(kind)) return json({ error: "invalid kind" }, 400);
    if (file.size > MAX_SIZE) return json({ error: "file too large (max 10MB)" }, 400);
    if (!ALLOWED_MIME.test(file.type)) return json({ error: "mime not allowed" }, 400);

    const ext = extFromMime(file.type);
    const id = crypto.randomUUID();
    const storage_key = `${kind}/${userId}/${id}.${ext}`;

    // Upload to R2
    const buf = await file.arrayBuffer();
    const putRes = await r2.fetch(`${R2_ENDPOINT}/${storage_key}`, {
      method: "PUT",
      body: buf,
      headers: {
        "Content-Type": file.type,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
    if (!putRes.ok) {
      const t = await putRes.text();
      return json({ error: `R2 upload failed: ${putRes.status} ${t.slice(0, 200)}` }, 502);
    }

    const public_url = R2_PUBLIC_URL
      ? `${R2_PUBLIC_URL}/${storage_key}`
      : `${R2_ENDPOINT}/${storage_key}`;

    const { data: row, error: dbErr } = await admin
      .from("user_assets")
      .insert({
        user_id: userId,
        kind,
        storage_key,
        public_url,
        mime_type: file.type,
        size_bytes: file.size,
        width,
        height,
        original_filename: file.name || null,
      })
      .select("id, public_url, kind, mime_type, size_bytes")
      .single();

    if (dbErr) {
      // best-effort cleanup
      await r2.fetch(`${R2_ENDPOINT}/${storage_key}`, { method: "DELETE" }).catch(() => {});
      throw dbErr;
    }

    return json({ ok: true, asset: row });
  } catch (e) {
    return json({ error: (e as Error).message || "upload failed" }, 500);
  }
});
