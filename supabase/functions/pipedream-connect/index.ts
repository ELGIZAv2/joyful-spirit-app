// Pipedream Connect — generate connect tokens & manage connected accounts.
// Docs: https://pipedream.com/docs/connect/api
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { proxyRequest } from "../_shared/pipedream-proxy.ts";

const PD_PROJECT_ID = Deno.env.get("PIPEDREAM_PROJECT_ID")!;
const PD_CLIENT_ID = Deno.env.get("PIPEDREAM_CLIENT_ID")!;
const PD_CLIENT_SECRET = Deno.env.get("PIPEDREAM_CLIENT_SECRET")!;
const PD_ENV = Deno.env.get("PIPEDREAM_ENVIRONMENT") ?? "production";
const PD_API = "https://api.pipedream.com/v1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

let cachedToken: { token: string; exp: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.exp > Date.now() + 30_000) return cachedToken.token;
  const r = await fetch(`${PD_API}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: PD_CLIENT_ID,
      client_secret: PD_CLIENT_SECRET,
    }),
  });
  if (!r.ok) throw new Error(`pd_oauth_failed: ${await r.text()}`);
  const j = await r.json();
  cachedToken = { token: j.access_token, exp: Date.now() + (j.expires_in ?? 3600) * 1000 };
  return cachedToken.token;
}

async function pd(path: string, init: RequestInit = {}) {
  const token = await getAccessToken();
  const r = await fetch(`${PD_API}/connect/${PD_PROJECT_ID}${path}`, {
    ...init,
    headers: {
      ...(init.headers || {}),
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-PD-Environment": PD_ENV,
    },
  });
  const text = await r.text();
  const data = text ? JSON.parse(text) : {};
  if (!r.ok) throw new Error(`pd_${r.status}: ${text}`);
  return data;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const body = await req.json().catch(() => ({}));
    const action = body.action as string;
    const externalUserId = user.id;

    if (action === "create_token") {
      // Don't restrict allowed_origins here — Pipedream uses the project's
      // configured allowed origins, which avoids the "invalid link" message
      // when the popup's origin differs slightly from the request origin.
      const result = await pd(`/tokens`, {
        method: "POST",
        body: JSON.stringify({
          external_user_id: externalUserId,
        }),
      });
      return Response.json({
        token: result.token,
        expires_at: result.expires_at,
        connect_link_url: result.connect_link_url,
        environment: PD_ENV,
      }, { headers: corsHeaders });
    }

    if (action === "list_accounts") {
      // Try Pipedream first (source of truth), fall back to cache.
      try {
        const result = await pd(
          `/accounts?external_user_id=${encodeURIComponent(externalUserId)}&include_credentials=0`,
        );
        const accounts = (result.data ?? result.accounts ?? []) as any[];
        // Sync DB cache
        for (const a of accounts) {
          await admin.from("pipedream_accounts").upsert({
            user_id: user.id,
            app_slug: a.app?.name_slug ?? a.app?.slug ?? a.name_slug,
            account_id: a.id,
            external_user_id: externalUserId,
            account_name: a.name ?? a.app?.name,
            healthy: a.healthy ?? true,
            metadata: { app: a.app },
          }, { onConflict: "user_id,app_slug,account_id" });
        }
        return Response.json({ accounts }, { headers: corsHeaders });
      } catch (_e) {
        const { data } = await admin
          .from("pipedream_accounts")
          .select("*")
          .eq("user_id", user.id);
        return Response.json({ accounts: data ?? [], cached: true }, { headers: corsHeaders });
      }
    }

    if (action === "delete_account") {
      const accountId = body.account_id as string;
      if (!accountId) throw new Error("account_id_required");
      await pd(`/accounts/${accountId}`, { method: "DELETE" });
      await admin
        .from("pipedream_accounts")
        .delete()
        .eq("user_id", user.id)
        .eq("account_id", accountId);
      return Response.json({ ok: true }, { headers: corsHeaders });
    }

    if (action === "google_drive_upload") {
      const filename = String(body.filename || "research.md");
      const content = String(body.content || "");
      const mime = String(body.mime || "text/markdown");
      // Find a connected Google Drive account
      let driveAccount: any = null;
      try {
        const result = await pd(
          `/accounts?external_user_id=${encodeURIComponent(externalUserId)}&include_credentials=0`,
        );
        const accounts = (result.data ?? result.accounts ?? []) as any[];
        driveAccount = accounts.find((a) =>
          (a.app?.name_slug ?? a.app?.slug ?? a.name_slug) === "google_drive"
        );
      } catch (_e) {
        const { data } = await admin
          .from("pipedream_accounts").select("*")
          .eq("user_id", user.id).eq("app_slug", "google_drive").limit(1);
        driveAccount = data?.[0] ? { id: data[0].account_id } : null;
      }
      if (!driveAccount) {
        return Response.json({ needs_connect: true, app_slug: "google_drive" }, { headers: corsHeaders });
      }
      // Multipart upload to Drive
      const boundary = "----lovable" + crypto.randomUUID().replace(/-/g, "");
      const metadata = { name: filename, mimeType: mime };
      const multipart =
        `--${boundary}\r\n` +
        `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
        JSON.stringify(metadata) + `\r\n` +
        `--${boundary}\r\n` +
        `Content-Type: ${mime}\r\n\r\n` +
        content + `\r\n` +
        `--${boundary}--`;
      const resp = await proxyRequest({
        externalUserId,
        accountId: driveAccount.id,
        method: "POST",
        url: "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink",
        body: multipart,
        headers: { "Content-Type": `multipart/related; boundary=${boundary}` },
      });
      return Response.json({ ok: true, file: resp }, { headers: corsHeaders });
    }

    return new Response(JSON.stringify({ error: "unknown_action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
