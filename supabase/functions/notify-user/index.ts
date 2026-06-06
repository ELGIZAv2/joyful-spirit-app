// Unified notifications integration: email (Resend) + Telegram chat alerts.
// Stores per-user preferences in public.user_integrations.

import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const TELEGRAM_BOT_TOKEN =
  Deno.env.get("TELEGRAM_BOT_TOKEN") || Deno.env.get("TELEGRAM_API_KEY");

interface JsonBody {
  action?: string;
  app?: "email" | "telegram";
  email_address?: string;
  telegram_chat_id?: string;
  telegram_username?: string;
  subject?: string;
  html?: string;
  text?: string;
  message?: string;
}

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function getUser(req: Request) {
  const auth = req.headers.get("Authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const supa = createClient(SUPABASE_URL, SERVICE_ROLE, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data, error } = await supa.auth.getUser(token);
  if (error) return null;
  return data.user;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const user = await getUser(req);
    if (!user) return json(401, { error: "unauthorized" });

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const body: JsonBody = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const action = body.action || "status";

    // Load current row
    const { data: row } = await admin
      .from("user_integrations")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (action === "status") {
      return json(200, {
        email: {
          available: !!RESEND_API_KEY,
          connected: !!row?.email_enabled && !!row?.email_address,
          email_address: row?.email_address ?? user.email ?? null,
        },
        telegram: {
          available: !!TELEGRAM_BOT_TOKEN,
          connected: !!row?.telegram_chat_id,
          telegram_chat_id: row?.telegram_chat_id ?? null,
          telegram_username: row?.telegram_username ?? null,
        },
      });
    }

    if (action === "connect") {
      if (body.app === "email") {
        const email_address = (body.email_address || user.email || "").trim();
        if (!email_address || !email_address.includes("@"))
          return json(400, { error: "valid email_address required" });
        await admin.from("user_integrations").upsert({
          user_id: user.id,
          email_enabled: true,
          email_address,
          telegram_chat_id: row?.telegram_chat_id ?? null,
          telegram_username: row?.telegram_username ?? null,
        });
        return json(200, { ok: true });
      }
      if (body.app === "telegram") {
        const chat_id = (body.telegram_chat_id || "").trim();
        if (!chat_id) return json(400, { error: "telegram_chat_id required" });
        await admin.from("user_integrations").upsert({
          user_id: user.id,
          email_enabled: row?.email_enabled ?? false,
          email_address: row?.email_address ?? null,
          telegram_chat_id: chat_id,
          telegram_username: body.telegram_username ?? null,
        });
        return json(200, { ok: true });
      }
      return json(400, { error: "unknown app" });
    }

    if (action === "disconnect") {
      if (body.app === "email") {
        await admin
          .from("user_integrations")
          .update({ email_enabled: false, email_address: null })
          .eq("user_id", user.id);
        return json(200, { ok: true });
      }
      if (body.app === "telegram") {
        await admin
          .from("user_integrations")
          .update({ telegram_chat_id: null, telegram_username: null })
          .eq("user_id", user.id);
        return json(200, { ok: true });
      }
      return json(400, { error: "unknown app" });
    }

    if (action === "send_email") {
      if (!RESEND_API_KEY) return json(400, { error: "RESEND_API_KEY not configured" });
      const to = row?.email_address || user.email;
      if (!to || !row?.email_enabled) return json(400, { error: "email not connected" });
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Notifications <onboarding@resend.dev>",
          to: [to],
          subject: body.subject || "Notification",
          html: body.html || `<p>${body.text || body.message || ""}</p>`,
        }),
      });
      const data = await r.json();
      if (!r.ok) return json(r.status, { error: data });
      return json(200, { ok: true, id: data.id });
    }

    if (action === "send_telegram") {
      if (!TELEGRAM_BOT_TOKEN) return json(400, { error: "TELEGRAM_BOT_TOKEN not configured" });
      if (!row?.telegram_chat_id) return json(400, { error: "telegram not connected" });
      const r = await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: row.telegram_chat_id,
            text: body.message || body.text || "Notification",
            parse_mode: "HTML",
          }),
        },
      );
      const data = await r.json();
      if (!r.ok) return json(r.status, { error: data });
      return json(200, { ok: true });
    }

    return json(400, { error: `unknown action: ${action}` });
  } catch (e) {
    return json(500, { error: e instanceof Error ? e.message : String(e) });
  }
});
