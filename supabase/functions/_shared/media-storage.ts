// Shared helpers: download from provider URL, upload to media-studio bucket,
// register the asset in public.media_assets, and resolve pricing from model_pricing.

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const BUCKET = "media-studio";

export interface PricingRow {
  id: string;
  provider: string;
  kind: "image" | "video" | "chat" | "audio";
  label: string;
  endpoint: string;
  unit: string;
  credits_per_unit: number | null;
  in_price_per_m: number | null;
  out_price_per_m: number | null;
  metadata: Record<string, unknown>;
}

export function adminClient(): SupabaseClient {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
}

export async function getModelPricing(
  admin: SupabaseClient,
  modelId: string,
): Promise<PricingRow | null> {
  const { data } = await admin
    .from("model_pricing")
    .select("*")
    .eq("id", modelId)
    .maybeSingle();
  return (data as PricingRow) ?? null;
}

/** Compute total credits for image generation: credits_per_unit × num_images */
export function computeImageCredits(p: PricingRow, numImages = 1): number {
  return Math.max(1, Math.ceil((p.credits_per_unit ?? 1) * numImages));
}

/** Compute credits for a video: credits_per_unit × seconds (rounded up) */
export function computeVideoCredits(p: PricingRow, seconds: number): number {
  return Math.max(1, Math.ceil((p.credits_per_unit ?? 1) * Math.max(1, seconds)));
}

/** Compute chat/code credits with clamp (0.5 → 8 credits) at 50% markup */
export function computeChatCredits(
  p: PricingRow,
  inputTokens: number,
  outputTokens: number,
): number {
  const inP = Number(p.in_price_per_m ?? p.metadata?.in_price_per_m ?? 0);
  const outP = Number(p.out_price_per_m ?? p.metadata?.out_price_per_m ?? 0);
  const costUsd = (inputTokens * inP + outputTokens * outP) / 1_000_000;
  const sell = costUsd * 1.5; // 50% margin
  const credits = sell / 0.10; // 1 credit = $0.10
  const min = Number(p.metadata?.min_credits ?? 0.5);
  const max = Number(p.metadata?.max_credits ?? 8);
  // Round to nearest 0.5
  const rounded = Math.ceil(credits * 2) / 2;
  return Math.min(max, Math.max(min, rounded));
}

export interface SavedAsset {
  id: string;
  storage_path: string;
  public_url: string;
}

/** Download a remote file, upload to bucket, insert media_assets row. */
export async function saveRemoteAsset(opts: {
  admin: SupabaseClient;
  userId: string;
  remoteUrl: string;
  kind: "image" | "video" | "audio";
  provider: string;
  model: string;
  prompt?: string;
  costCredits: number;
  width?: number;
  height?: number;
  durationSeconds?: number;
  workspaceId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<SavedAsset | null> {
  try {
    const resp = await fetch(opts.remoteUrl);
    if (!resp.ok) throw new Error(`fetch failed ${resp.status}`);
    const buf = new Uint8Array(await resp.arrayBuffer());
    const ct = resp.headers.get("content-type") || "application/octet-stream";
    const ext = guessExt(ct, opts.remoteUrl);
    const filename = `${crypto.randomUUID()}.${ext}`;
    const path = `${opts.userId}/${opts.kind}/${filename}`;

    const { error: upErr } = await opts.admin.storage
      .from(BUCKET)
      .upload(path, buf, { contentType: ct, upsert: false });
    if (upErr) throw upErr;

    const { data: pub } = opts.admin.storage.from(BUCKET).getPublicUrl(path);
    const publicUrl = pub.publicUrl;

    const { data: row, error: insErr } = await opts.admin
      .from("media_assets")
      .insert({
        user_id: opts.userId,
        workspace_id: opts.workspaceId ?? null,
        kind: opts.kind,
        provider: opts.provider,
        model: opts.model,
        prompt: opts.prompt ?? null,
        storage_path: path,
        public_url: publicUrl,
        cost_credits: opts.costCredits,
        duration_seconds: opts.durationSeconds ?? null,
        width: opts.width ?? null,
        height: opts.height ?? null,
        metadata: opts.metadata ?? {},
      })
      .select("id, storage_path, public_url")
      .single();
    if (insErr) throw insErr;
    return row as SavedAsset;
  } catch (err) {
    console.error("saveRemoteAsset failed:", err);
    return null;
  }
}

function guessExt(ct: string, url: string): string {
  if (ct.includes("png")) return "png";
  if (ct.includes("webp")) return "webp";
  if (ct.includes("jpeg") || ct.includes("jpg")) return "jpg";
  if (ct.includes("mp4")) return "mp4";
  if (ct.includes("webm")) return "webm";
  if (ct.includes("mpeg") || ct.includes("mp3")) return "mp3";
  if (ct.includes("wav")) return "wav";
  const m = url.match(/\.([a-zA-Z0-9]{2,4})(?:\?|$)/);
  return m?.[1]?.toLowerCase() ?? "bin";
}
