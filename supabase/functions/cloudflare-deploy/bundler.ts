// supabase/functions/cloudflare-deploy/bundler.ts
// Bundles a user Vite/React project (files from DB) using esbuild-wasm + esm.sh.
// Tailwind is handled via the Play CDN injected in the HTML — we do NOT
// compile Tailwind here (too heavy for an edge function).

import * as esbuild from "https://deno.land/x/esbuild@v0.20.2/wasm.js";

let initialized = false;
async function ensureInit() {
  if (initialized) return;
  // @ts-ignore wasmURL accepts string in browser/deno wasm build
  await esbuild.initialize({
    wasmURL: "https://deno.land/x/esbuild@v0.20.2/esbuild.wasm",
    worker: false,
  });
  initialized = true;
}

export interface BuildFile { path: string; content: string }
export interface BundleResult {
  js: string;           // bundled JS (ES module)
  css: string;          // bundled CSS (concatenated user CSS, raw)
  warnings: string[];
}

// ─── In-memory cache for esm.sh fetches (per cold-start) ─────────────
const httpCache = new Map<string, string>();
async function fetchText(url: string): Promise<string> {
  const cached = httpCache.get(url);
  if (cached !== undefined) return cached;
  const r = await fetch(url, { redirect: "follow" });
  if (!r.ok) throw new Error(`fetch ${url} → ${r.status}`);
  const t = await r.text();
  httpCache.set(url, t);
  return t;
}

// ─── Path helpers ────────────────────────────────────────────────────
function normalize(p: string): string {
  const parts: string[] = [];
  for (const seg of p.split("/")) {
    if (!seg || seg === ".") continue;
    if (seg === "..") parts.pop();
    else parts.push(seg);
  }
  return parts.join("/");
}
function dirname(p: string): string {
  const i = p.lastIndexOf("/");
  return i < 0 ? "" : p.slice(0, i);
}
function join(a: string, b: string): string {
  return normalize(a ? `${a}/${b}` : b);
}

// Resolve an import within the virtual FS. Returns the matched path or null.
function resolveInFs(target: string, files: Map<string, string>): string | null {
  const exts = ["", ".tsx", ".ts", ".jsx", ".js", ".css", ".json"];
  const indexExts = ["/index.tsx", "/index.ts", "/index.jsx", "/index.js"];
  for (const e of exts) {
    if (files.has(target + e)) return target + e;
  }
  for (const e of indexExts) {
    if (files.has(target + e)) return target + e;
  }
  return null;
}

// Rewrite bare-package imports to esm.sh URLs that bundle their deps but
// keep react/react-dom external (we'll supply them once via a top-level esm.sh).
const SHARED_DEPS = "react,react-dom,react/jsx-runtime,react/jsx-dev-runtime";
function esmShUrl(pkg: string): string {
  // Special: keep react and react-dom from one canonical URL so peers dedupe.
  if (pkg === "react" || pkg.startsWith("react/")) {
    const sub = pkg === "react" ? "" : pkg.slice("react".length);
    return `https://esm.sh/react@18.3.1${sub}?target=es2022`;
  }
  if (pkg === "react-dom" || pkg.startsWith("react-dom/")) {
    const sub = pkg === "react-dom" ? "" : pkg.slice("react-dom".length);
    return `https://esm.sh/react-dom@18.3.1${sub}?target=es2022&deps=react@18.3.1`;
  }
  // Everything else: bundle its tree but share react/react-dom.
  return `https://esm.sh/${pkg}?target=es2022&bundle-deps&external=${SHARED_DEPS}&deps=react@18.3.1,react-dom@18.3.1`;
}

// Heuristic: extract bare package name from an import specifier.
function bareName(spec: string): string {
  if (spec.startsWith("@")) {
    // @scope/pkg or @scope/pkg/subpath
    const parts = spec.split("/");
    return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : spec;
  }
  return spec.split("/")[0];
}

export async function bundleProject(rawFiles: BuildFile[]): Promise<BundleResult> {
  await ensureInit();
  const warnings: string[] = [];

  // Build the virtual FS.
  const fs = new Map<string, string>();
  for (const f of rawFiles) fs.set(f.path, f.content);

  // Find entry. Prefer src/main.tsx (Vite default), fall back to src/main.ts.
  const entry =
    ["src/main.tsx", "src/main.ts", "src/main.jsx", "src/main.js"].find((p) => fs.has(p));
  if (!entry) throw new Error("No entry: expected src/main.tsx");

  // Collect CSS imports separately. esbuild can do CSS, but we'll inline.
  const cssChunks: string[] = [];

  const virtualPlugin: esbuild.Plugin = {
    name: "virtual-fs",
    setup(b) {
      // Resolve relative + alias + bare.
      b.onResolve({ filter: /.*/ }, (args) => {
        const spec = args.path;

        // 1) Entry point.
        if (args.kind === "entry-point") {
          return { path: entry, namespace: "vfs" };
        }

        // 2) Already-resolved esm.sh URL — let the http plugin handle it.
        if (spec.startsWith("https://") || spec.startsWith("http://")) {
          return { path: spec, namespace: "http" };
        }

        const importerNs = args.namespace;

        // 3) Relative paths from an HTTP module → resolve against the HTTP URL.
        if (importerNs === "http" && (spec.startsWith("./") || spec.startsWith("../") || spec.startsWith("/"))) {
          const base = new URL(args.importer);
          const resolved = new URL(spec, base).toString();
          return { path: resolved, namespace: "http" };
        }
        // Bare imports from an HTTP module → pass through esm.sh resolution
        // (esm.sh returns absolute URLs in its source, so this is rare).
        if (importerNs === "http") {
          return { path: esmShUrl(spec), namespace: "http" };
        }

        // 4) Aliased "@/..." → "src/..."
        let target: string | null = null;
        if (spec.startsWith("@/")) {
          target = "src/" + spec.slice(2);
        } else if (spec.startsWith("./") || spec.startsWith("../")) {
          target = join(dirname(args.importer || ""), spec);
        } else if (spec.startsWith("/")) {
          target = spec.replace(/^\/+/, "");
        }

        if (target !== null) {
          const found = resolveInFs(target, fs);
          if (!found) {
            // CSS files referenced from index.html sometimes use root-relative.
            warnings.push(`unresolved relative import: ${spec} (from ${args.importer})`);
            return { errors: [{ text: `Cannot resolve "${spec}"` }] };
          }
          // Special: CSS files are captured separately and ignored by JS bundle.
          if (found.endsWith(".css")) {
            cssChunks.push(fs.get(found) || "");
            return { path: found, namespace: "css-stub" };
          }
          return { path: found, namespace: "vfs" };
        }

        // 5) Bare package → esm.sh
        const pkg = bareName(spec);
        // Skip optional / runtime-only packages we know don't ship a default
        // module (treat as empty).
        if (pkg === "lovable-tagger") {
          return { path: spec, namespace: "noop" };
        }
        return { path: esmShUrl(spec), namespace: "http" };
      });

      // Load virtual files.
      b.onLoad({ filter: /.*/, namespace: "vfs" }, (args) => {
        const content = fs.get(args.path);
        if (content == null) return { errors: [{ text: `Missing ${args.path}` }] };
        const ext = args.path.split(".").pop()!;
        const loader: esbuild.Loader =
          ext === "tsx" ? "tsx" :
          ext === "ts" ? "ts" :
          ext === "jsx" ? "jsx" :
          ext === "json" ? "json" :
          "js";
        return { contents: content, loader };
      });

      // CSS stub: pulled into cssChunks, return nothing in JS.
      b.onLoad({ filter: /.*/, namespace: "css-stub" }, () => ({
        contents: "// css stub",
        loader: "js",
      }));

      // No-op modules.
      b.onLoad({ filter: /.*/, namespace: "noop" }, () => ({
        contents: "export default {}; export const __noop = true;",
        loader: "js",
      }));

      // HTTP loader.
      b.onLoad({ filter: /.*/, namespace: "http" }, async (args) => {
        try {
          const contents = await fetchText(args.path);
          return { contents, loader: "js" };
        } catch (e) {
          return { errors: [{ text: `http fetch failed: ${args.path} :: ${(e as Error).message}` }] };
        }
      });
    },
  };

  const result = await esbuild.build({
    entryPoints: [entry],
    bundle: true,
    format: "esm",
    target: "es2022",
    platform: "browser",
    write: false,
    splitting: false,
    minify: true,
    sourcemap: false,
    legalComments: "none",
    treeShaking: true,
    define: {
      "process.env.NODE_ENV": '"production"',
      "import.meta.env.MODE": '"production"',
      "import.meta.env.PROD": "true",
      "import.meta.env.DEV": "false",
      "import.meta.env.SSR": "false",
      "import.meta.env.BASE_URL": '"/"',
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(Deno.env.get("SUPABASE_URL") ?? ""),
      "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(Deno.env.get("SUPABASE_ANON_KEY") ?? ""),
      "import.meta.env.VITE_SUPABASE_PROJECT_ID": JSON.stringify(""),
    },
    plugins: [virtualPlugin],
    logLevel: "silent",
    jsx: "automatic",
  });

  const js = result.outputFiles?.[0]?.text ?? "";
  const css = cssChunks.join("\n\n");

  return { js, css, warnings };
}
