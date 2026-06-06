// Edge-function contract tests: verify CORS preflight and that POST without
// auth is rejected so the resume system has a sane error surface.
//
// These tests run via `supabase--test_edge_functions` (Deno).
//
// We hit the deployed function URL directly because the server-only logic
// (createJob/runInBackground) needs the live Supabase stack.

const PROJECT_REF =
  Deno.env.get("SUPABASE_PROJECT_REF") || "ltgampdtawuefwwayncx";
const BASE = `https://${PROJECT_REF}.supabase.co/functions/v1`;
const ANON =
  Deno.env.get("SUPABASE_ANON_KEY") ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0Z2FtcGR0YXd1ZWZ3d2F5bmN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3Njk5ODAsImV4cCI6MjA4ODM0NTk4MH0.5ZOzuxCrm-TO4zzRDJ68LrCLH3f0itiznUxhbEupvGg";

async function preflight(path: string): Promise<Response> {
  return await fetch(`${BASE}${path}`, {
    method: "OPTIONS",
    headers: {
      Origin: "https://example.com",
      "Access-Control-Request-Method": "POST",
      "Access-Control-Request-Headers": "authorization, content-type, apikey",
    },
  });
}

async function postNoAuth(path: string, body: unknown): Promise<Response> {
  return await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: ANON },
    body: JSON.stringify(body),
  });
}

Deno.test("chat: CORS preflight returns ok", async () => {
  const r = await preflight("/chat");
  if (r.status !== 200 && r.status !== 204) {
    throw new Error(`preflight status ${r.status}`);
  }
  const allow = r.headers.get("access-control-allow-origin");
  if (!allow) throw new Error("missing CORS header");
  await r.body?.cancel();
});

Deno.test("docs-generate: CORS preflight returns ok", async () => {
  const r = await preflight("/docs-generate");
  if (r.status !== 200 && r.status !== 204) {
    throw new Error(`preflight status ${r.status}`);
  }
  if (!r.headers.get("access-control-allow-origin")) {
    throw new Error("missing CORS header");
  }
  await r.body?.cancel();
});


Deno.test("chat background: rejects unauthenticated background job request", async () => {
  const r = await postNoAuth("/chat", {
    background: true,
    messages: [{ role: "user", content: "ping" }],
  });
  // Without a real user JWT we expect 401 (auth_required) or 403 from the gateway.
  if (![401, 403].includes(r.status)) {
    const t = await r.text();
    throw new Error(`expected 401/403, got ${r.status}: ${t.slice(0, 200)}`);
  }
  await r.body?.cancel();
});

Deno.test("docs-generate: rejects unauthenticated request", async () => {
  const r = await postNoAuth("/docs-generate", { prompt: "resume for me" });
  if (![400, 401, 403].includes(r.status)) {
    const t = await r.text();
    throw new Error(`expected 400/401/403, got ${r.status}: ${t.slice(0, 200)}`);
  }
  await r.body?.cancel();
});

