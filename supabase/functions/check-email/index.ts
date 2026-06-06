// check-email — authoritative "does this account exist?" check for the auth screen.
//
// The sign-in/sign-up flow asks this BEFORE the user is authenticated:
//   • exists  → show the password step (sign in)
//   • !exists → start OTP sign-up (new account)
//
// We determine existence with the GoTrue admin API via the service role.
// `generateLink({ type: "recovery" })` returns the user when the account
// exists and errors with "user not found" when it does not — and crucially it
// does NOT create a user and does NOT send any email. This is far more reliable
// than scanning the full user list.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const NOT_FOUND_RE = /user not found|not found|no user|does not exist|404|422/i;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { email } = await req.json().catch(() => ({}));
    const normalized = String(email || "").trim().toLowerCase();
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!normalized || !emailRe.test(normalized)) {
      return json({ error: "A valid email is required" }, 400);
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Probe existence without side effects.
    const { data, error } = await admin.auth.admin.generateLink({
      type: "recovery",
      email: normalized,
    });

    if (error) {
      // User not found → treat as a new account so the UI starts OTP sign-up.
      if (NOT_FOUND_RE.test(error.message || "")) {
        return json({ exists: false, two_factor_enabled: false });
      }
      // Any other error (rate limit, config) → surface it; the UI will show a
      // retry message instead of silently misclassifying the account.
      console.error("[check-email] generateLink error", error.message);
      return json({ error: error.message || "Could not check email" }, 500);
    }

    const userId = data?.user?.id;
    let twoFactorEnabled = false;
    if (userId) {
      const { data: profile } = await admin
        .from("profiles")
        .select("two_factor_enabled")
        .eq("id", userId)
        .maybeSingle();
      twoFactorEnabled = Boolean(profile?.two_factor_enabled);
    }

    return json({ exists: true, two_factor_enabled: twoFactorEnabled });
  } catch (e) {
    console.error("[check-email] uncaught", e);
    return json({ error: (e as Error)?.message || "Internal error" }, 500);
  }
});
