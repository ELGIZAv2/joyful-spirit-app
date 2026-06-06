// Shared rotation pool for v0 API keys.
// Each key gets 7 messages per 24h sliding window, then auto-resets.
// On first call, if the pool is empty, seeds it from the V0_API_KEY env secret.

import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2";

let _admin: SupabaseClient | null = null;
function admin(): SupabaseClient {
  if (_admin) return _admin;
  _admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
  return _admin;
}

export interface V0KeyPick {
  id: string;
  api_key: string;
}

async function seedFromEnv() {
  const envKey = Deno.env.get("V0_API_KEY");
  if (!envKey) return;
  await admin().from("v0_api_keys").insert({
    name: "v0-key-env",
    api_key: envKey,
  }).select().maybeSingle().then(() => {}).catch(() => {});
}

export async function pickV0Key(): Promise<V0KeyPick | null> {
  // Try pool first
  let { data, error } = await admin().rpc("pick_v0_key");
  if (error) {
    console.error("[v0-keys] pick_v0_key error:", error.message);
  }
  let row = Array.isArray(data) ? data[0] : data;

  if (!row) {
    // Pool empty or fully exhausted — try seeding env key once, then retry.
    await seedFromEnv();
    const retry = await admin().rpc("pick_v0_key");
    row = Array.isArray(retry.data) ? retry.data[0] : retry.data;
  }

  if (!row) return null;
  return { id: row.id as string, api_key: row.api_key as string };
}

export async function blockV0Key(id: string, reason: string) {
  const { error } = await admin().rpc("block_v0_key", { p_id: id, p_reason: reason.slice(0, 500) });
  if (error) console.error("[v0-keys] block_v0_key error:", error.message);
}

/**
 * If a v0 call fails with auth/quota status, mark the key as blocked so the
 * next request rotates to a different one.
 */
export function shouldBlockOnStatus(status: number): boolean {
  return status === 401 || status === 402 || status === 403 || status === 429;
}
