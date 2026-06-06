// Public endpoint for external sites to verify a user's subscription.
// Authentication: send the master API key in the `x-api-key` header.
// Body / query supports either `email` or `user_id`.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

async function sha256(text: string): Promise<string> {
  const buf = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const apiKey = req.headers.get("x-api-key");
    if (!apiKey) return json({ error: "missing_api_key" }, 401);

    const url = Deno.env.get("SUPABASE_URL")!;
    const srv = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(url, srv, { auth: { persistSession: false } });

    const keyHash = await sha256(apiKey.trim());
    const { data: keyId, error: keyErr } = await admin.rpc("verify_external_api_key", {
      p_key_hash: keyHash,
    });
    if (keyErr) return json({ error: "verify_failed", detail: keyErr.message }, 500);
    if (!keyId) return json({ error: "invalid_api_key" }, 401);

    // Parse email / user_id from body (POST) or query (GET)
    let email: string | null = null;
    let userId: string | null = null;
    if (req.method === "POST") {
      try {
        const body = await req.json();
        email = body?.email ?? null;
        userId = body?.user_id ?? null;
      } catch { /* ignore */ }
    }
    if (!email && !userId) {
      const u = new URL(req.url);
      email = u.searchParams.get("email");
      userId = u.searchParams.get("user_id");
    }

    if (!email && !userId) {
      return json({ error: "email_or_user_id_required" }, 400);
    }

    const { data, error } = await admin.rpc("get_user_subscription_status", {
      p_email: email,
      p_user_id: userId,
    });
    if (error) return json({ error: "lookup_failed", detail: error.message }, 500);

    return json(data);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
