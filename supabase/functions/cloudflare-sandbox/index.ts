/**
 * cloudflare-sandbox edge function (now E2B-powered for /code projects)
 *
 * Boots an E2B sandbox, syncs all code_project_files into /home/user/app,
 * runs `npm install` + `vite --host 0.0.0.0 --port 5173`, and exposes the
 * public preview URL `https://5173-<sandboxId>.e2b.app`.
 *
 * Sandbox lives for 1h with autoPause; same sandbox is reused across
 * subsequent syncs (just rewrites files + restarts vite).
 *
 * Required env: E2B_API_KEY
 */
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const E2B_API_KEY = Deno.env.get("E2B_API_KEY");

const APP_DIR = "/home/user/app";
const PORT = 5173;

async function e2b(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`https://api.e2b.dev${path}`, {
    ...init,
    headers: {
      "X-API-Key": E2B_API_KEY!,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
}

async function exec(sandboxId: string, command: string, timeoutMs = 120_000): Promise<{ stdout: string; stderr: string; exit: number }> {
  const r = await e2b(`/sandboxes/${sandboxId}/processes`, {
    method: "POST",
    body: JSON.stringify({ cmd: "bash", args: ["-c", command], envVars: {}, timeoutMs }),
  });
  const data = await r.json().catch(() => ({}));
  return {
    stdout: String(data.stdout || data.output || ""),
    stderr: String(data.stderr || ""),
    exit: data.exitCode ?? data.exit_code ?? 0,
  };
}

async function writeFile(sandboxId: string, path: string, content: string) {
  const form = new FormData();
  form.append("file", new Blob([content]), "upload.txt");
  const r = await fetch(
    `https://api.e2b.dev/sandboxes/${sandboxId}/files?path=${encodeURIComponent(path)}`,
    { method: "POST", headers: { "X-API-Key": E2B_API_KEY! }, body: form },
  );
  if (!r.ok) throw new Error(`write ${path}: ${r.status}`);
}

async function isSandboxAlive(sandboxId: string): Promise<boolean> {
  try {
    const r = await e2b(`/sandboxes/${sandboxId}`);
    return r.ok;
  } catch { return false; }
}

async function createSandbox(): Promise<string> {
  const r = await e2b("/sandboxes", {
    method: "POST",
    body: JSON.stringify({ templateID: "base", timeout: 3600, autoPause: true }),
  });
  if (!r.ok) throw new Error(`E2B create failed: ${r.status} ${await r.text()}`);
  const data = await r.json();
  return data.sandboxID || data.sandboxId || data.id;
}

function pkgJson(projectName: string): string {
  return JSON.stringify({
    name: projectName.toLowerCase().replace(/[^a-z0-9-]+/g, "-").slice(0, 40) || "app",
    private: true,
    type: "module",
    scripts: { dev: "vite", build: "vite build", preview: "vite preview" },
    dependencies: {
      react: "^18.3.1",
      "react-dom": "^18.3.1",
      "react-router-dom": "^6.26.0",
      "framer-motion": "^11.3.0",
      "lucide-react": "^0.460.0",
      "@tanstack/react-query": "^5.56.0",
    },
    devDependencies: {
      vite: "^5.4.0",
      "@vitejs/plugin-react": "^4.3.0",
      typescript: "^5.5.0",
      "@types/react": "^18.3.0",
      "@types/react-dom": "^18.3.0",
      tailwindcss: "^3.4.0",
      autoprefixer: "^10.4.0",
      postcss: "^8.4.0",
    },
  }, null, 2);
}

const VITE_CONFIG = `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  server: { host: '0.0.0.0', port: ${PORT}, strictPort: true, allowedHosts: true },
});
`;

const TS_CONFIG = JSON.stringify({
  compilerOptions: {
    target: "ES2022",
    lib: ["ES2022", "DOM", "DOM.Iterable"],
    module: "ESNext",
    jsx: "react-jsx",
    moduleResolution: "bundler",
    strict: false,
    esModuleInterop: true,
    skipLibCheck: true,
    allowSyntheticDefaultImports: true,
    resolveJsonModule: true,
    baseUrl: ".",
    paths: { "@/*": ["./src/*"] },
  },
  include: ["src"],
}, null, 2);

const POSTCSS_CONFIG = `export default { plugins: { tailwindcss: {}, autoprefixer: {} } };\n`;
const TAILWIND_CONFIG = `/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
};
`;
const INDEX_HTML = (name: string) => `<!doctype html>
<html lang="ar" dir="rtl"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${name}</title></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>
`;
const MAIN_TSX = `import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
`;

function ensureScaffold(files: Map<string, string>, projectName: string) {
  if (!files.has("package.json")) files.set("package.json", pkgJson(projectName));
  if (!files.has("vite.config.ts") && !files.has("vite.config.js")) files.set("vite.config.ts", VITE_CONFIG);
  if (!files.has("tsconfig.json")) files.set("tsconfig.json", TS_CONFIG);
  if (!files.has("postcss.config.js") && !files.has("postcss.config.cjs")) files.set("postcss.config.js", POSTCSS_CONFIG);
  if (!files.has("tailwind.config.ts") && !files.has("tailwind.config.js")) files.set("tailwind.config.js", TAILWIND_CONFIG);
  if (!files.has("index.html")) files.set("index.html", INDEX_HTML(projectName));
  if (!files.has("src/main.tsx") && !files.has("src/main.jsx")) files.set("src/main.tsx", MAIN_TSX);
  if (!files.has("src/index.css")) files.set("src/index.css", "@tailwind base;\n@tailwind components;\n@tailwind utilities;\n");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const J = (b: unknown, s = 200) =>
    new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "content-type": "application/json" } });

  try {
    if (!E2B_API_KEY) return J({ error: "e2b_not_configured", message: "E2B_API_KEY is missing from Supabase secrets." }, 503);

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return J({ error: "unauthorized" }, 401);

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claims, error: cErr } = await userClient.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (cErr || !claims?.claims) return J({ error: "unauthorized" }, 401);
    const userId = claims.claims.sub as string;

    const body = await req.json() as { action: "sync" | "destroy" | "preview"; projectId: string };
    const { action, projectId } = body;
    if (!projectId) return J({ error: "missing_projectId" }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: project } = await admin
      .from("code_projects")
      .select("id, owner_id, name, entry_file")
      .eq("id", projectId)
      .maybeSingle();
    if (!project || project.owner_id !== userId) return J({ error: "forbidden" }, 403);

    const upsert = (patch: Record<string, unknown>, sandboxId?: string) =>
      admin.from("code_project_sandboxes")
        .upsert({ project_id: projectId, ...(sandboxId ? { sandbox_id: sandboxId } : {}), ...patch }, { onConflict: "project_id" });

    if (action === "destroy") {
      const { data: row } = await admin.from("code_project_sandboxes").select("sandbox_id").eq("project_id", projectId).maybeSingle();
      if (row?.sandbox_id) {
        try { await e2b(`/sandboxes/${row.sandbox_id}`, { method: "DELETE" }); } catch {}
      }
      await admin.from("code_project_sandboxes").delete().eq("project_id", projectId);
      return J({ ok: true });
    }

    if (action === "preview") {
      const { data } = await admin.from("code_project_sandboxes").select("preview_url, status, sandbox_id").eq("project_id", projectId).maybeSingle();
      return J(data ?? {});
    }

    // === sync: ensure sandbox, write files, (re)start vite ===
    await upsert({ status: "building", last_error: null });

    // Reuse existing sandbox if still alive
    const { data: existing } = await admin
      .from("code_project_sandboxes")
      .select("sandbox_id")
      .eq("project_id", projectId)
      .maybeSingle();

    let sandboxId = existing?.sandbox_id || "";
    if (sandboxId && !(await isSandboxAlive(sandboxId))) sandboxId = "";
    if (!sandboxId) {
      sandboxId = await createSandbox();
      await upsert({ status: "building", last_error: null }, sandboxId);
      await exec(sandboxId, `mkdir -p ${APP_DIR}`);
    }

    // Pull all files from DB
    const { data: rows } = await admin
      .from("code_project_files")
      .select("path, content")
      .eq("project_id", projectId);
    const filesArr = (rows ?? []) as { path: string; content: string }[];
    if (filesArr.length === 0) {
      await upsert({ status: "error", last_error: "no_files" });
      return J({ error: "no_files" }, 400);
    }

    const files = new Map<string, string>();
    for (const f of filesArr) files.set(f.path.replace(/^\/+/, ""), f.content ?? "");
    ensureScaffold(files, project.name);

    // Wipe the src dir on every sync so deleted files actually disappear; keep node_modules
    await exec(sandboxId, `rm -rf ${APP_DIR}/src ${APP_DIR}/public ${APP_DIR}/index.html 2>/dev/null; mkdir -p ${APP_DIR}`);

    // Sync files (sequential to avoid overwhelming the sandbox)
    for (const [path, content] of files) {
      try { await writeFile(sandboxId, `${APP_DIR}/${path}`, content); }
      catch (e) {
        await upsert({ status: "error", last_error: `write ${path}: ${(e as Error).message}` }, sandboxId);
        return J({ error: "write_failed", path, message: (e as Error).message }, 500);
      }
    }

    // Install + restart vite (kill anything on the port first)
    const install = await exec(
      sandboxId,
      `cd ${APP_DIR} && (test -d node_modules || npm install --no-audit --no-fund --loglevel=error 2>&1 | tail -n 40) && pkill -f vite 2>/dev/null; nohup npx vite --host 0.0.0.0 --port ${PORT} --strictPort > /tmp/vite.log 2>&1 & disown; sleep 2; echo started`,
      180_000,
    );
    if (install.exit !== 0 && !install.stdout.includes("started")) {
      await upsert({ status: "error", last_error: `dev: ${install.stderr.slice(0, 400) || install.stdout.slice(0, 400)}` }, sandboxId);
      return J({ error: "dev_failed", stderr: install.stderr.slice(0, 2000), stdout: install.stdout.slice(0, 2000) }, 500);
    }

    const previewUrl = `https://${PORT}-${sandboxId}.e2b.app`;
    await upsert({
      status: "ready",
      preview_url: previewUrl,
      last_synced_at: new Date().toISOString(),
    }, sandboxId);

    return J({ ok: true, preview_url: previewUrl, sandbox_id: sandboxId });
  } catch (e) {
    console.error("cloudflare-sandbox (E2B) error", e);
    return new Response(JSON.stringify({ error: "server_error", message: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }
});
