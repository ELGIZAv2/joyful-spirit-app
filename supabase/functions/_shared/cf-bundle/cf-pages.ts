// supabase/functions/cloudflare-deploy/cf-pages.ts
// Cloudflare Pages Direct Upload — same flow wrangler uses.
//
// Steps:
//   1. ensureProject   → create the Pages project if it doesn't exist.
//   2. getUploadJwt    → short-lived token for the assets API.
//   3. computeManifest → sha256(content+ext).slice(0,32) per file.
//   4. checkMissing    → which hashes are NOT already uploaded.
//   5. uploadAssets    → POST missing in batches with the JWT.
//   6. createDeployment→ multipart with manifest, returns live URL.

const CF_API = "https://api.cloudflare.com/client/v4";

export interface PageFile {
  path: string;          // leading "/", e.g. "/index.html"
  content: Uint8Array;   // raw bytes
  contentType: string;   // mime type
}

interface CfResp<T = any> { success: boolean; errors: any[]; messages: any[]; result: T }

export async function ensureProject(args: {
  apiToken: string;
  accountId: string;
  name: string;
}): Promise<{ subdomain: string; created: boolean }> {
  const auth = { Authorization: `Bearer ${args.apiToken}` };
  const probe = await fetch(
    `${CF_API}/accounts/${args.accountId}/pages/projects/${args.name}`,
    { headers: auth },
  );
  if (probe.status === 200) {
    const j = (await probe.json()) as CfResp<{ subdomain: string }>;
    return { subdomain: j.result.subdomain, created: false };
  }
  if (probe.status !== 404) {
    throw new Error(`probe project ${args.name}: ${probe.status} ${await probe.text()}`);
  }
  // Create it.
  const create = await fetch(
    `${CF_API}/accounts/${args.accountId}/pages/projects`,
    {
      method: "POST",
      headers: { ...auth, "Content-Type": "application/json" },
      body: JSON.stringify({
        name: args.name,
        production_branch: "main",
      }),
    },
  );
  if (!create.ok) throw new Error(`create project: ${create.status} ${await create.text()}`);
  const j = (await create.json()) as CfResp<{ subdomain: string }>;
  return { subdomain: j.result.subdomain, created: true };
}

async function getUploadJwt(args: {
  apiToken: string;
  accountId: string;
  name: string;
}): Promise<string> {
  const r = await fetch(
    `${CF_API}/accounts/${args.accountId}/pages/projects/${args.name}/upload-token`,
    { headers: { Authorization: `Bearer ${args.apiToken}` } },
  );
  if (!r.ok) throw new Error(`upload-token: ${r.status} ${await r.text()}`);
  const j = (await r.json()) as CfResp<{ jwt: string }>;
  return j.result.jwt;
}

// hash = sha256(base64(content) + extension_without_dot).slice(0, 32)
// (this matches @cloudflare/pages-shared which wrangler uses)
function bytesToBase64(bytes: Uint8Array): string {
  let bin = "";
  // chunk to avoid call-stack blow-up on big inputs
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(bin);
}
async function sha256Hex(s: string): Promise<string> {
  const enc = new TextEncoder().encode(s);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  const arr = Array.from(new Uint8Array(buf));
  return arr.map((b) => b.toString(16).padStart(2, "0")).join("");
}
function extOf(path: string): string {
  const base = path.split("/").pop() || "";
  const i = base.lastIndexOf(".");
  return i < 0 ? "" : base.slice(i + 1);
}

interface PreparedFile { path: string; hash: string; b64: string; contentType: string }

async function prepare(files: PageFile[]): Promise<PreparedFile[]> {
  const out: PreparedFile[] = [];
  for (const f of files) {
    const b64 = bytesToBase64(f.content);
    const hash = (await sha256Hex(b64 + extOf(f.path))).slice(0, 32);
    out.push({ path: f.path, hash, b64, contentType: f.contentType });
  }
  return out;
}

async function checkMissing(jwt: string, hashes: string[]): Promise<Set<string>> {
  const r = await fetch(`${CF_API}/pages/assets/check-missing`, {
    method: "POST",
    headers: { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" },
    body: JSON.stringify({ hashes }),
  });
  if (!r.ok) throw new Error(`check-missing: ${r.status} ${await r.text()}`);
  const j = (await r.json()) as CfResp<string[]>;
  return new Set(j.result ?? []);
}

async function uploadBatch(jwt: string, items: PreparedFile[]) {
  const payload = items.map((it) => ({
    key: it.hash,
    value: it.b64,
    metadata: { contentType: it.contentType },
    base64: true,
  }));
  const r = await fetch(`${CF_API}/pages/assets/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error(`upload: ${r.status} ${await r.text()}`);
}

async function uploadAssets(jwt: string, missing: PreparedFile[]) {
  // Keep batches ≤ ~4 MB of base64 payload to stay well below CF limits.
  const MAX = 4 * 1024 * 1024;
  let batch: PreparedFile[] = [];
  let size = 0;
  for (const it of missing) {
    if (size + it.b64.length > MAX && batch.length) {
      await uploadBatch(jwt, batch);
      batch = []; size = 0;
    }
    batch.push(it);
    size += it.b64.length;
  }
  if (batch.length) await uploadBatch(jwt, batch);
}

async function createDeployment(args: {
  apiToken: string;
  accountId: string;
  name: string;
  manifest: Record<string, string>; // "/path": hash
  production: boolean;
}): Promise<{ url: string; id: string }> {
  const fd = new FormData();
  fd.append("manifest", JSON.stringify(args.manifest));
  // branch=main forces a production deploy that aliases to the bare subdomain.
  if (args.production) fd.append("branch", "main");
  const r = await fetch(
    `${CF_API}/accounts/${args.accountId}/pages/projects/${args.name}/deployments`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${args.apiToken}` },
      body: fd,
    },
  );
  if (!r.ok) throw new Error(`create deployment: ${r.status} ${await r.text()}`);
  const j = (await r.json()) as CfResp<{ url: string; id: string }>;
  return { url: j.result.url, id: j.result.id };
}

export async function deployToPages(args: {
  apiToken: string;
  accountId: string;
  projectName: string;
  files: PageFile[];
  production?: boolean;
}): Promise<{ url: string; subdomain: string; deploymentId: string; uploaded: number; reused: number }> {
  const proj = await ensureProject({
    apiToken: args.apiToken,
    accountId: args.accountId,
    name: args.projectName,
  });

  const jwt = await getUploadJwt({
    apiToken: args.apiToken,
    accountId: args.accountId,
    name: args.projectName,
  });

  const prepared = await prepare(args.files);
  const missingHashes = await checkMissing(jwt, prepared.map((p) => p.hash));
  const missing = prepared.filter((p) => missingHashes.has(p.hash));
  await uploadAssets(jwt, missing);

  const manifest: Record<string, string> = {};
  for (const p of prepared) manifest[p.path] = p.hash;

  const dep = await createDeployment({
    apiToken: args.apiToken,
    accountId: args.accountId,
    name: args.projectName,
    manifest,
    production: args.production ?? true,
  });

  // Always advertise the bare subdomain URL — it's the stable production URL.
  const url = args.production === false
    ? dep.url
    : `https://${proj.subdomain}`;

  return {
    url,
    subdomain: proj.subdomain,
    deploymentId: dep.id,
    uploaded: missing.length,
    reused: prepared.length - missing.length,
  };
}

export const _internal = { prepare, sha256Hex, extOf, bytesToBase64 };
