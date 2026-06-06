// Admin error reporter — logs to admin_error_log and (best-effort) emails the admin.
// Never throws to the caller; returns 200 on success or {ok:false} on failure.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ADMIN_EMAIL = "elgiza0v1@gmail.com";
const MAX_LEN = 4000;

// Strip provider/internal names from any message before logging or emailing.
const PROVIDER_PATTERNS: Array<[RegExp, string]> = [
  [/lovable\s*ai\s*gateway/gi, "the service"],
  [/lovable\s*ai/gi, "the service"],
  [/lovable\.dev/gi, "the service"],
  [/openai|gpt-?\d+(\.\d+)?|chatgpt/gi, "the service"],
  [/anthropic|claude(-[a-z0-9.-]+)?/gi, "the service"],
  [/gemini|google\s*ai|vertex/gi, "the service"],
  [/mistral|llama|grok|xai/gi, "the service"],
  [/supabase/gi, "the database"],
  [/resend|sendgrid|mailgun/gi, "the email service"],
  [/e2b|sandbox\.dev/gi, "the runtime"],
  [/sk-[a-z0-9-]{20,}/gi, "[redacted]"],
  [/bearer\s+[a-z0-9._-]+/gi, "[redacted]"],
];

function sanitize(text: string): string {
  let out = (text ?? "").toString().slice(0, MAX_LEN);
  for (const [re, rep] of PROVIDER_PATTERNS) out = out.replace(re, rep);
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(SUPABASE_URL, SERVICE_KEY);

    // Require a valid signed-in user to prevent anonymous spam / admin inbox flooding.
    let userId: string | null = null;
    let userEmail: string | null = null;
    const auth = req.headers.get("Authorization");
    if (auth?.startsWith("Bearer ")) {
      try {
        const { data } = await sb.auth.getUser(auth.slice(7));
        if (data?.user) {
          userId = data.user.id;
          userEmail = data.user.email ?? null;
        }
      } catch { /* ignore */ }
    }
    // Anonymous reports are allowed (best-effort logging); never block the caller.

    const body = await req.json().catch(() => ({}));
    const source = String(body.source ?? "client").slice(0, 200);
    const route = body.route ? String(body.route).slice(0, 500) : null;
    const rawMsg = String(body.message ?? "Unknown error");
    const rawErr = body.raw_error ? String(body.raw_error) : null;
    const userAgent = body.user_agent ? String(body.user_agent).slice(0, 500) : null;
    const ctx = (body.context && typeof body.context === "object") ? body.context : {};

    const safeMessage = sanitize(rawMsg);
    const safeRaw = rawErr ? sanitize(rawErr) : null;

    const { data: row, error: insErr } = await sb.from("admin_error_log").insert({
      user_id: userId,
      user_email: userEmail,
      source,
      route,
      message: safeMessage,
      raw_error: safeRaw,
      context: ctx,
      user_agent: userAgent,
    }).select("id").maybeSingle();

    if (insErr) console.error("[report-error] insert failed", insErr);

    // Best-effort email delivery via Resend (if configured).
    const RESEND_KEY = Deno.env.get("RESEND_API_KEY");
    let emailed = false;
    if (RESEND_KEY) {
      try {
        const html = `
          <h2>New error on the site</h2>
          <p><b>Source:</b> ${escapeHtml(source)}</p>
          <p><b>Route:</b> ${escapeHtml(route ?? "-")}</p>
          <p><b>User:</b> ${escapeHtml(userEmail ?? userId ?? "anonymous")}</p>
          <p><b>Message:</b> ${escapeHtml(safeMessage)}</p>
          ${safeRaw ? `<pre style="white-space:pre-wrap;background:#f6f6f6;padding:8px;border-radius:6px;">${escapeHtml(safeRaw)}</pre>` : ""}
          <p><small>Logged at ${new Date().toISOString()}</small></p>
        `;
        const resp = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_KEY}`,
          },
          body: JSON.stringify({
            from: "Site Alerts <onboarding@resend.dev>",
            to: [ADMIN_EMAIL],
            subject: `⚠️ Site error: ${safeMessage.slice(0, 80)}`,
            html,
          }),
        });
        emailed = resp.ok;
        if (emailed && row?.id) {
          await sb.from("admin_error_log").update({ notified: true }).eq("id", row.id);
        } else if (!emailed) {
          console.error("[report-error] resend failed", resp.status, await resp.text().catch(() => ""));
        }
      } catch (e) {
        console.error("[report-error] resend exception", e);
      }
    }

    return new Response(JSON.stringify({ ok: true, id: row?.id ?? null, emailed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (e) {
    console.error("[report-error] fatal", e);
    return new Response(JSON.stringify({ ok: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }
});

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}