// Verifies a Dodo checkout session / payment status
import { getAuthUser } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const DODO_BASE = "https://live.dodopayments.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const authUser = await getAuthUser(req);
  if (!authUser) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const apiKey = Deno.env.get("dodo-key");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "dodo-key missing" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const checkoutId =
      url.searchParams.get("checkout_id") ||
      url.searchParams.get("payment_id") ||
      url.searchParams.get("subscription_id");
    if (!checkoutId) {
      return new Response(JSON.stringify({ error: "payment identifier required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Try checkouts endpoint first, then payments as fallback
    let res = await fetch(`${DODO_BASE}/checkouts/${checkoutId}`, {
      headers: { "Authorization": `Bearer ${apiKey}` },
    });
    let data = await res.json();

    if (!res.ok) {
      res = await fetch(`${DODO_BASE}/payments/${checkoutId}`, {
        headers: { "Authorization": `Bearer ${apiKey}` },
      });
      data = await res.json();
    }

    if (!res.ok) {
      res = await fetch(`${DODO_BASE}/subscriptions/${checkoutId}`, {
        headers: { "Authorization": `Bearer ${apiKey}` },
      });
      data = await res.json();
    }

    if (!res.ok) {
      return new Response(JSON.stringify({ error: "not_found", detail: data }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Normalize to a status the frontend understands
    const raw = (data.status || data.payment_status || "").toLowerCase();
    let status: "succeeded" | "open" | "failed" = "open";
    if (["succeeded", "paid", "active", "completed"].includes(raw)) status = "succeeded";
    else if (["failed", "cancelled", "canceled", "expired"].includes(raw)) status = "failed";

    // Prevent cross-user payment metadata leakage: if metadata pins a user_id, it must match caller.
    const metaUserId = data?.metadata?.user_id;
    if (metaUserId && metaUserId !== authUser.id) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      status,
      raw_status: raw,
      amount: data.total_amount || data.amount,
      currency: data.currency,
      product_name: data.product_cart?.[0]?.name || data.product_name,
      metadata: data.metadata,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
