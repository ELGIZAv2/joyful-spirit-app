// supabase/functions/cloudflare-deploy/index.ts
// Publish a user project to Cloudflare Pages.
//
// Flow:
//   1. Verify caller JWT and ownership of the project.
//   2. Fetch all source files from ai_project_files.
//   3. Bundle JS + CSS with esbuild-wasm (see ./bundler.ts).
//   4. Compose index.html (Tailwind Play CDN + bundled assets + SEO).
//   5. Upload to Cloudflare Pages via Direct Upload (see ./cf-pages.ts).
//   6. Persist published_url on the project row.

import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { composeRuntimeHtml, BuildFile } from "./runtime-html.ts";
import { deployToPages, PageFile } from "./cf-pages.ts";

// ─── Helpers ─────────────────────────────────────────────────────────
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

function projectNameFor(projectId: string): string {
  // Cloudflare Pages: lowercase, [a-z0-9-], must start with a letter, ≤58 chars.
  return `megsy-${projectId.replace(/-/g, "").toLowerCase()}`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" } as any)[c]
  );
}

// Standard shadcn-style Tailwind theme tokens injected into the Play CDN config.
// This makes classes like `bg-primary`, `text-muted-foreground`, `border-border`
// work without us having to evaluate the user's tailwind.config.ts in Deno.
const TAILWIND_CONFIG = `
tailwind.config = {
  darkMode: ['class'],
  theme: {
    container: { center: true, padding: '2rem', screens: { '2xl': '1400px' } },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        popover: { DEFAULT: 'hsl(var(--popover))', foreground: 'hsl(var(--popover-foreground))' },
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
};
`;

interface DeploySettings {
  slug?: string;
  title?: string;
  description?: string;
  ogImage?: string;
  favicon?: string;
}

function composeIndexHtml(opts: {
  userHtml: string | undefined;
  settings: DeploySettings;
  jsHref: string;
  cssHref: string;
}): string {
  const title = escapeHtml(opts.settings.title || "App");
  const desc = escapeHtml(opts.settings.description || "");
  const og = escapeHtml(opts.settings.ogImage || "");
  const favicon = escapeHtml(opts.settings.favicon || "/favicon.ico");

  const head = `
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    ${desc ? `<meta name="description" content="${desc}" />` : ""}
    ${og ? `<meta property="og:image" content="${og}" />` : ""}
    <meta property="og:title" content="${title}" />
    ${desc ? `<meta property="og:description" content="${desc}" />` : ""}
    <link rel="icon" href="${favicon}" />
    <link rel="stylesheet" href="${opts.cssHref}" />
    <script src="https://cdn.tailwindcss.com"></script>
    <script>${TAILWIND_CONFIG}</script>
  `;
  return `<!DOCTYPE html>
<html lang="en">
  <head>${head}</head>
  <body>
    <div id="root"></div>
    <script type="module" src="${opts.jsHref}"></script>
  </body>
</html>
`;
}

// ─── Main handler ────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "POST only" });

  // Auth.
  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader.startsWith("Bearer ")) return json(401, { error: "Unauthorized" });
  const supaUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const svcKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const userClient = createClient(supaUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: claims, error: claimsErr } = await userClient.auth.getClaims(
    authHeader.slice("Bearer ".length),
  );
  if (claimsErr || !claims?.claims?.sub) return json(401, { error: "Unauthorized" });
  const userId = claims.claims.sub as string;

  // Body.
  let body: { project_id?: string; mode?: string; settings?: DeploySettings; source?: string } = {};
  try { body = await req.json(); } catch { return json(400, { error: "Bad JSON body" }); }
  const projectId = body.project_id;
  if (!projectId || !/^[0-9a-f-]{36}$/i.test(projectId)) {
    return json(400, { error: "Invalid project_id" });
  }
  const settings = body.settings || {};
  // "ai" (default, megsy-pr) or "code" (megsy /code workspace)
  const source = body.source === "code" ? "code" : "ai";
  const projectsTable = source === "code" ? "code_projects" : "projects";
  const ownerCol = source === "code" ? "owner_id" : "user_id";
  const filesTable = source === "code" ? "code_project_files" : "ai_project_files";

  // Service-role client for trusted reads/writes after we've verified ownership.
  const admin = createClient(supaUrl, svcKey);

  // Ownership check.
  const { data: project, error: pErr } = await admin
    .from(projectsTable)
    .select(`id, ${ownerCol}, name`)
    .eq("id", projectId)
    .single();
  if (pErr || !project) return json(404, { error: "Project not found" });
  if ((project as any)[ownerCol] !== userId) return json(403, { error: "Forbidden" });

  // ─── /code projects: deploy via Freestyle.sh (agent-native) ──────────
  if (source === "code") {
    const fsKey = Deno.env.get("FREESTYLE_API_KEY");
    if (!fsKey) return json(503, { error: "FREESTYLE_API_KEY missing in Supabase secrets." });

    const allFiles: { path: string; content: string }[] = [];
    const PAGE = 1000;
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await admin
        .from(filesTable)
        .select("path, content")
        .eq("project_id", projectId)
        .range(from, from + PAGE - 1);
      if (error) return json(500, { error: `db: ${error.message}` });
      if (!data || data.length === 0) break;
      for (const r of data) allFiles.push({ path: (r.path as string).replace(/^\/+/, ""), content: (r.content as string) ?? "" });
      if (data.length < PAGE) break;
    }
    if (allFiles.length === 0) return json(400, { error: "Project has no files" });

    // Build a minimal POSIX-ustar tar archive, then gzip via CompressionStream.
    const tarBytes = makeTar(allFiles);
    const gzipped = await gzip(tarBytes);
    const b64 = bytesToBase64(gzipped);

    const dr = await fetch("https://api.freestyle.sh/web/v1/deploy", {
      method: "POST",
      headers: { Authorization: `Bearer ${fsKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        source: { kind: "tar_gz_base64", data: b64 },
        config: { entrypoint: "npm run build && npx serve -s dist -l 8080", build: true, port: 8080 },
      }),
    });
    const dj = await dr.json().catch(() => ({}));
    if (!dr.ok) return json(502, { error: "Freestyle deploy failed", status: dr.status, details: dj });

    const deployUrl: string | undefined = dj.url || dj.domain || dj.deploymentUrl;
    if (deployUrl) {
      await admin.from("code_projects").update({ published_url: deployUrl }).eq("id", projectId);
    }
    return json(200, { ok: true, url: deployUrl, deploy_id: dj.id, raw: dj });
  }

  // ─── Default (ai/megsy-pr): Cloudflare Pages ─────────────────────────
  const cfToken = Deno.env.get("CLOUDFLARE_API_TOKEN");
  const accountId = Deno.env.get("CLOUDFLARE_ACCOUNT_ID");
  if (!cfToken || !accountId) {
    return json(503, {
      error: "Publishing isn't configured. Missing CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID.",
    });
  }

  // Pull all files (Supabase caps at 1000 rows per query; paginate to be safe).
  const files: BuildFile[] = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await admin
      .from(filesTable)
      .select("path, content")
      .eq("project_id", projectId)
      .range(from, from + PAGE - 1);
    if (error) return json(500, { error: `db: ${error.message}` });
    if (!data || data.length === 0) break;
    for (const r of data) files.push({ path: r.path as string, content: (r.content as string) ?? "" });
    if (data.length < PAGE) break;
  }
  if (files.length === 0) return json(400, { error: "Project has no files" });

  // Compose a single self-contained index.html (Babel + esm.sh runtime).
  // No bundler — zero CPU, fits comfortably inside the edge function limits.
  const entry = files.find((f) => f.path === "src/App.tsx") ? "src/App.tsx"
    : files.find((f) => f.path === "src/main.tsx") ? "src/main.tsx"
    : "src/App.tsx";
  const html = composeRuntimeHtml(files, entry, settings?.title || "Megsy App");
  const warnings: string[] = [];

  const enc = new TextEncoder();
  const pageFiles: PageFile[] = [
    { path: "/index.html", content: enc.encode(html), contentType: "text/html; charset=utf-8" },
  ];
  for (const f of files) {
    if (!f.path.startsWith("public/")) continue;
    const rel = "/" + f.path.slice("public/".length);
    const ct = guessContentType(rel);
    pageFiles.push({ path: rel, content: enc.encode(f.content), contentType: ct });
  }

  // Deploy.
  const name = projectNameFor(projectId);
  let deploy;
  try {
    deploy = await deployToPages({
      apiToken: cfToken,
      accountId,
      projectName: name,
      files: pageFiles,
      production: true,
    });
  } catch (e) {
    return json(500, { error: `Cloudflare deploy: ${(e as Error).message}` });
  }

  // Persist URL.
  await admin
    .from(projectsTable)
    .update({ published_url: deploy.url, preview_url: deploy.url })
    .eq("id", projectId);

  return json(200, {
    ok: true,
    url: deploy.url,
    subdomain: deploy.subdomain,
    deploymentId: deploy.deploymentId,
    uploaded: deploy.uploaded,
    reused: deploy.reused,
    warnings,
  });
});

function guessContentType(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() || "";
  const map: Record<string, string> = {
    html: "text/html; charset=utf-8",
    js: "application/javascript; charset=utf-8",
    mjs: "application/javascript; charset=utf-8",
    css: "text/css; charset=utf-8",
    json: "application/json",
    svg: "image/svg+xml",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    webp: "image/webp",
    gif: "image/gif",
    ico: "image/x-icon",
    woff: "font/woff",
    woff2: "font/woff2",
    ttf: "font/ttf",
    otf: "font/otf",
    txt: "text/plain; charset=utf-8",
    xml: "application/xml",
    pdf: "application/pdf",
    mp4: "video/mp4",
    webm: "video/webm",
  };
  return map[ext] || "application/octet-stream";
}

// ─── tar.gz helpers (POSIX ustar, used for Freestyle deploys) ────────
function makeTar(files: { path: string; content: string }[]): Uint8Array {
  const enc = new TextEncoder();
  const blocks: Uint8Array[] = [];
  for (const f of files) {
    const data = enc.encode(f.content);
    const header = new Uint8Array(512);
    const setStr = (off: number, str: string, len: number) => {
      const b = enc.encode(str);
      header.set(b.slice(0, len), off);
    };
    const setOct = (off: number, n: number, len: number) => {
      const s = n.toString(8).padStart(len - 1, "0");
      setStr(off, s, len);
    };
    const name = f.path.slice(0, 100);
    setStr(0, name, 100);
    setOct(100, 0o644, 8);
    setOct(108, 0, 8);
    setOct(116, 0, 8);
    setOct(124, data.length, 12);
    setOct(136, Math.floor(Date.now() / 1000), 12);
    // checksum placeholder = 8 spaces
    for (let i = 148; i < 156; i++) header[i] = 0x20;
    header[156] = 0x30; // typeflag '0' (regular file)
    setStr(257, "ustar\0", 6);
    setStr(263, "00", 2);
    let cs = 0;
    for (const b of header) cs += b;
    setOct(148, cs, 7);
    header[155] = 0;
    blocks.push(header);
    blocks.push(data);
    const pad = (512 - (data.length % 512)) % 512;
    if (pad) blocks.push(new Uint8Array(pad));
  }
  blocks.push(new Uint8Array(1024)); // two empty 512-byte blocks = end
  const total = blocks.reduce((s, b) => s + b.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const b of blocks) { out.set(b, off); off += b.length; }
  return out;
}

async function gzip(data: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([data]).stream().pipeThrough(new CompressionStream("gzip"));
  const buf = await new Response(stream).arrayBuffer();
  return new Uint8Array(buf);
}

function bytesToBase64(bytes: Uint8Array): string {
  let s = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    s += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(s);
}
