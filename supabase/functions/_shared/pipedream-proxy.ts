// Shared Pipedream Connect Proxy helper — used by pipedream-proxy edge function
// and directly by chat-alibaba when running tool calls inline.

const PD_PROJECT_ID = Deno.env.get("PIPEDREAM_PROJECT_ID")!;
const PD_CLIENT_ID = Deno.env.get("PIPEDREAM_CLIENT_ID")!;
const PD_CLIENT_SECRET = Deno.env.get("PIPEDREAM_CLIENT_SECRET")!;
const PD_ENV = "production";
const PD_API = "https://api.pipedream.com/v1";

let cachedToken: { token: string; exp: number } | null = null;

export async function getPdAccessToken(): Promise<string> {
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

function b64url(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function proxyRequest(opts: {
  externalUserId: string;
  accountId: string;
  method: string;
  url: string;
  body?: unknown;
  headers?: Record<string, string>;
}) {
  const token = await getPdAccessToken();
  const encodedUrl = b64url(opts.url);
  const proxyUrl = `${PD_API}/connect/${PD_PROJECT_ID}/proxy/${encodedUrl}` +
    `?external_user_id=${encodeURIComponent(opts.externalUserId)}` +
    `&account_id=${encodeURIComponent(opts.accountId)}`;

  const init: RequestInit = {
    method: opts.method,
    headers: {
      Authorization: `Bearer ${token}`,
      "X-PD-Environment": PD_ENV,
      "Content-Type": "application/json",
      ...(opts.headers || {}),
    },
  };
  if (opts.body !== undefined && opts.method !== "GET") {
    init.body = typeof opts.body === "string" ? opts.body : JSON.stringify(opts.body);
  }
  const r = await fetch(proxyUrl, init);
  const text = await r.text();
  let data: unknown = text;
  try { data = JSON.parse(text); } catch { /* keep text */ }
  return { ok: r.ok, status: r.status, data };
}
