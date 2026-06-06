// Server-side mirror of src/lib/codeRuntime.ts buildPreviewHtml.
// Produces a single self-contained index.html that runs the user's React
// project in-browser via Babel-standalone + esm.sh. Zero bundling, zero CPU.

export type BuildFile = { path: string; content: string };

const PASSTHROUGH_EXTERNALS: Record<string, string> = {
  react: "https://esm.sh/react@18.3.1",
  "react/": "https://esm.sh/react@18.3.1/",
  "react/jsx-runtime": "https://esm.sh/react@18.3.1/jsx-runtime",
  "react/jsx-dev-runtime": "https://esm.sh/react@18.3.1/jsx-dev-runtime",
  "react-dom": "https://esm.sh/react-dom@18.3.1",
  "react-dom/client": "https://esm.sh/react-dom@18.3.1/client",
  "framer-motion": "https://esm.sh/framer-motion@11.11.17?external=react",
  "lucide-react": "https://esm.sh/lucide-react@0.462.0?external=react",
  clsx: "https://esm.sh/clsx@2.1.1",
  "tailwind-merge": "https://esm.sh/tailwind-merge@2.6.0",
  "class-variance-authority": "https://esm.sh/class-variance-authority@0.7.1",
  "react-router-dom": "https://esm.sh/react-router-dom@6.28.0?external=react",
};

function normalize(path: string) {
  return path.replace(/^\.?\/+/, "").replace(/^src\//, "");
}

export function composeRuntimeHtml(files: BuildFile[], entry = "src/App.tsx", title = "Megsy App"): string {
  const map: Record<string, string> = {};
  for (const f of files) map[normalize(f.path)] = f.content;
  const entryKey = normalize(entry);
  if (!map[entryKey]) {
    return `<!doctype html><html><body style="background:#1a0a0a;color:#fecaca;font-family:monospace;padding:24px">Entry file not found: ${entry}</body></html>`;
  }
  const filesJson = JSON.stringify(map);
  const importMap = JSON.stringify({ imports: PASSTHROUGH_EXTERNALS });
  const safeTitle = title.replace(/[<>]/g, "");

  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${safeTitle}</title>
<script src="https://cdn.tailwindcss.com"></script>
<script src="https://unpkg.com/@babel/standalone@7.25.6/babel.min.js"></script>
<script type="importmap">${importMap}</script>
<style>
  html, body, #root { height: 100%; margin: 0; background: #050505; color: #fff; font-family: system-ui, -apple-system, "Noto Sans Arabic", sans-serif; }
  .__megsy_err { padding: 24px; background: #1a0a0a; color: #fecaca; font: 13px/1.5 ui-monospace, monospace; white-space: pre-wrap; }
</style>
</head>
<body>
<div id="root"></div>
<script>
window.__MEGSY_FILES__ = ${filesJson};
window.__MEGSY_ENTRY__ = ${JSON.stringify(entryKey)};
</script>
<script type="module">
import React from "react";
import { createRoot } from "react-dom/client";

const FILES = window.__MEGSY_FILES__;
const ENTRY = window.__MEGSY_ENTRY__;
const moduleCache = new Map();

function resolve(from, spec) {
  if (!spec.startsWith(".") && !spec.startsWith("/") && !spec.startsWith("@/")) return null;
  let basePath = from.split("/").slice(0, -1).join("/");
  let target = spec;
  if (spec.startsWith("@/")) { basePath = ""; target = spec.slice(2); }
  const parts = (basePath ? basePath + "/" + target : target).split("/");
  const stack = [];
  for (const p of parts) {
    if (p === "" || p === ".") continue;
    if (p === "..") stack.pop(); else stack.push(p);
  }
  const joined = stack.join("/");
  const candidates = [
    joined, joined + ".tsx", joined + ".ts", joined + ".jsx", joined + ".js",
    joined + "/index.tsx", joined + "/index.ts", joined + "/index.jsx", joined + "/index.js",
  ];
  for (const c of candidates) if (FILES[c] != null) return c;
  return null;
}

async function loadModule(path) {
  if (moduleCache.has(path)) return moduleCache.get(path);
  const src = FILES[path];
  if (src == null) throw new Error("Module not found: " + path);
  if (path.endsWith(".css") || path.endsWith(".json")) {
    const exports = {}; moduleCache.set(path, exports); return exports;
  }
  const transformed = Babel.transform(src, {
    filename: path,
    presets: [["typescript", { allExtensions: true, isTSX: true }], ["react", { runtime: "classic" }]],
  }).code;
  const importRegex = /import\\s+(?:([\\w*{}\\s,]+)\\s+from\\s+)?["']([^"']+)["'];?/g;
  const imports = [];
  let body = transformed.replace(importRegex, (m, clause, spec) => {
    const id = "__m" + imports.length;
    imports.push({ id, clause: clause?.trim() || null, spec });
    return "/*__import__*/";
  });
  body = body.replace(/export\\s+default\\s+/g, "module.exports.default = ");
  body = body.replace(/export\\s+\\{([^}]+)\\};?/g, (_m, names) => {
    return names.split(",").map((n) => {
      const [orig, alias] = n.split(/\\s+as\\s+/).map(s => s.trim());
      return "module.exports[" + JSON.stringify(alias || orig) + "] = " + orig + ";";
    }).join("\\n");
  });
  body = body.replace(/export\\s+(const|let|var|function|class)\\s+(\\w+)/g, (_m, kw, name) => {
    return kw + " " + name + "; module.exports[" + JSON.stringify(name) + "] = " + name + "; " + kw + " __dummy_" + name + " = " + name;
  });
  const importLineGroups = [];
  for (const imp of imports) {
    const lines = [];
    const resolved = resolve(path, imp.spec);
    let mod;
    if (resolved) mod = await loadModule(resolved);
    else mod = await import(/* @vite-ignore */ imp.spec);
    const id = imp.id;
    moduleCache.set("__tmp_" + id, mod);
    if (!imp.clause) { importLineGroups.push(["// side-effect: " + imp.spec]); continue; }
    const clause = imp.clause;
    if (clause.startsWith("{")) {
      const names = clause.replace(/[{}]/g, "").split(",").map(s => s.trim()).filter(Boolean);
      for (const n of names) {
        const [orig, alias] = n.split(/\\s+as\\s+/).map(s => s.trim());
        lines.push("const " + (alias || orig) + " = __resolveImport(" + JSON.stringify(id) + ")[" + JSON.stringify(orig) + "];");
      }
    } else if (clause.startsWith("*")) {
      const [, , alias] = clause.split(/\\s+/);
      lines.push("const " + alias + " = __resolveImport(" + JSON.stringify(id) + ");");
    } else if (clause.includes(",")) {
      const [def, rest] = clause.split(",", 2);
      lines.push("const " + def.trim() + " = __resolveImport(" + JSON.stringify(id) + ").default;");
      const names = rest.replace(/[{}]/g, "").split(",").map(s => s.trim()).filter(Boolean);
      for (const n of names) {
        const [orig, alias] = n.split(/\\s+as\\s+/).map(s => s.trim());
        lines.push("const " + (alias || orig) + " = __resolveImport(" + JSON.stringify(id) + ")[" + JSON.stringify(orig) + "];");
      }
    } else {
      lines.push("const " + clause + " = __resolveImport(" + JSON.stringify(id) + ").default ?? __resolveImport(" + JSON.stringify(id) + ");");
    }
    importLineGroups.push(lines);
  }
  let pi = 0;
  body = body.replace(/\\/\\*__import__\\*\\//g, () => (importLineGroups[pi++] || []).join("\\n"));
  const module = { exports: {} };
  const fn = new Function("module", "exports", "React", "__resolveImport", body);
  fn(module, module.exports, React, (id) => moduleCache.get("__tmp_" + id));
  moduleCache.set(path, module.exports);
  return module.exports;
}

(async () => {
  try {
    const mod = await loadModule(ENTRY);
    const App = mod.default || mod.App;
    if (!App) throw new Error("Entry has no default export: " + ENTRY);
    const root = createRoot(document.getElementById("root"));
    root.render(React.createElement(App));
  } catch (e) {
    document.body.innerHTML = '<pre class="__megsy_err">' + (e.stack || e.message) + '</pre>';
    console.error(e);
  }
})();
</script>
</body>
</html>`;
}
