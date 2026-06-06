// Shared key rotation pool for Serper / Firecrawl / Leonardo.
// Picks an active key from public.api_keys, runs the request, and reports
// usage back so the key can be blocked when its $5 credit is exhausted or
// the provider returns 401/402/403/429-quota.
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export type Service = "serper" | "firecrawl" | "leonardo";

let _admin: SupabaseClient | null = null;
function admin(): SupabaseClient {
  if (_admin) return _admin;
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  _admin = createClient(url, key, { auth: { persistSession: false } });
  return _admin;
}

export async function pickKey(service: Service): Promise<{ id: string; api_key: string } | null> {
  const { data, error } = await admin().rpc("pick_api_key", { p_service: service });
  if (error) {
    console.error("pickKey error", service, error);
    return null;
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  return { id: row.id, api_key: row.api_key };
}

export async function recordUsage(
  id: string,
  costUsd: number,
  ok: boolean,
  status?: number,
  errMsg?: string,
) {
  const { error } = await admin().rpc("record_api_key_usage", {
    p_id: id,
    p_cost_usd: costUsd,
    p_ok: ok,
    p_error: errMsg ?? null,
    p_status_code: status ?? null,
  });
  if (error) console.error("recordUsage error", error);
}

export interface RunResult<T> {
  ok: boolean;
  status: number;
  data?: T;
  errorText?: string;
  costUsd?: number;
}

/**
 * Try up to `maxKeys` distinct keys from the pool. `fn` performs the actual
 * HTTP call with the given key and returns ok/status/cost. If !ok and status
 * is 401/402/403/429, the key is marked blocked and the next is tried.
 */
export async function withKeyRotation<T>(
  service: Service,
  fn: (apiKey: string) => Promise<RunResult<T>>,
  maxKeys = 5,
): Promise<{ ok: boolean; status: number; data?: T; errorText?: string }> {
  const triedIds = new Set<string>();
  let lastStatus = 503;
  let lastErr = "no_active_key";

  for (let attempt = 0; attempt < maxKeys; attempt++) {
    const pick = await pickKey(service);
    if (!pick || triedIds.has(pick.id)) break;
    triedIds.add(pick.id);

    let res: RunResult<T>;
    try {
      res = await fn(pick.api_key);
    } catch (e) {
      res = { ok: false, status: 500, errorText: e instanceof Error ? e.message : String(e) };
    }

    await recordUsage(pick.id, res.costUsd ?? 0, res.ok, res.status, res.errorText);

    if (res.ok) return { ok: true, status: res.status, data: res.data };

    lastStatus = res.status;
    lastErr = res.errorText ?? "request_failed";
    // Only retry on auth/quota errors; surface other 4xx/5xx immediately.
    if (![401, 402, 403, 429].includes(res.status)) {
      return { ok: false, status: res.status, errorText: lastErr };
    }
  }
  return { ok: false, status: lastStatus, errorText: lastErr };
}

export async function hasUnlimitedPlan(userId: string | null | undefined): Promise<boolean> {
  if (!userId) return false;
  const { data, error } = await admin().rpc("has_unlimited_plan", { p_user_id: userId });
  if (error) {
    console.error("hasUnlimitedPlan error", error);
    return false;
  }
  return !!data;
}
