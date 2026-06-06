// Server-side credit enforcement helper.
// Charges the user's active workspace credits when available, otherwise their
// personal credits. Edge functions MUST call this before performing any paid
// work — never trust the frontend to deduct.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface SpendResult {
  ok: boolean;
  status: number;
  body: Record<string, unknown>;
}

export async function spendCreditsServer(
  userId: string,
  amount: number,
  actionType: string,
  description?: string,
): Promise<SpendResult> {
  if (!userId) return { ok: false, status: 401, body: { error: "auth_required" } };
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) {
    return { ok: false, status: 500, body: { error: "server_misconfigured" } };
  }
  const admin = createClient(url, key);
  const { data, error } = await admin.rpc("spend_credits_auto" as never, {
    p_user_id: userId,
    p_amount: amount,
    p_action_type: actionType,
    p_description: description ?? null,
  } as never);
  if (error) {
    return { ok: false, status: 500, body: { error: `credit_error:${error.message}` } };
  }
  const r = (data ?? {}) as Record<string, unknown>;
  if (r.success === false) {
    return {
      ok: false,
      status: 402,
      body: {
        error: (r.error as string) || "insufficient_credits",
        credits: r.credits,
        source: r.source,
      },
    };
  }
  return { ok: true, status: 200, body: r };
}

export function creditErrorResponse(
  result: SpendResult,
  corsHeaders: Record<string, string>,
): Response {
  return new Response(JSON.stringify(result.body), {
    status: result.status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}