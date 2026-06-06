// In-browser runtime for Megsy Code project previews.
// Bundles project files (TSX/TS/JS/CSS) into a single HTML document that uses
// Babel-standalone to transpile JSX at runtime + Tailwind via CDN.
// No build server required — everything runs inside a sandboxed iframe.

export type ProjectFile = { path: string; content: string };

const ESM_REACT = "https://esm.sh/react@18.3.1";
const ESM_REACT_DOM = "https://esm.sh/react-dom@18.3.1/client";

const PASSTHROUGH_EXTERNALS: Record<string, string> = {
  react: ESM_REACT,
  "react/": "https://esm.sh/react@18.3.1/",
  "react/jsx-runtime": "https://esm.sh/react@18.3.1/jsx-runtime",
  "react/jsx-dev-runtime": "https://esm.sh/react@18.3.1/jsx-dev-runtime",
  "react-dom": "https://esm.sh/react-dom@18.3.1",
  "react-dom/client": ESM_REACT_DOM,
  "react-router-dom": "https://esm.sh/react-router-dom@6.28.0?external=react,react-dom",
  "framer-motion": "https://esm.sh/framer-motion@11.11.17?external=react",
  "lucide-react": "https://esm.sh/lucide-react@0.462.0?external=react",
  "@radix-ui/react-slot": "https://esm.sh/@radix-ui/react-slot@1.1.0?external=react",
  clsx: "https://esm.sh/clsx@2.1.1",
  "tailwind-merge": "https://esm.sh/tailwind-merge@2.6.0",
  "class-variance-authority": "https://esm.sh/class-variance-authority@0.7.1",
};

function normalize(path: string) {
  return path.replace(/^\.?\/+/, "").replace(/^src\//, "");
}

function pickEntry(map: Record<string, string>, requestedEntry: string) {
  const candidates = [
    "pages/Index.tsx",
    "pages/Index.jsx",
    "pages/Home.tsx",
    "pages/Home.jsx",
    requestedEntry,
    "App.tsx",
    "App.jsx",
    "main.tsx",
    "main.jsx",
    "index.tsx",
    "index.jsx",
  ];
  return candidates.find((path) => map[path]) || Object.keys(map).find((path) => /\.(tsx|jsx|ts|js)$/.test(path)) || requestedEntry;
}

const VIRTUAL_FILES: Record<string, string> = {
  "lib/utils.ts": `import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
`,
  "components/ui/button.tsx": `import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50", {
  variants: {
    variant: { default: "bg-primary text-primary-foreground hover:bg-primary/90", secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80", outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground", ghost: "hover:bg-accent hover:text-accent-foreground", link: "text-primary underline-offset-4 hover:underline", destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90" },
    size: { default: "h-10 px-4 py-2", sm: "h-9 rounded-md px-3", lg: "h-11 rounded-md px-8", icon: "h-10 w-10" },
  },
  defaultVariants: { variant: "default", size: "default" },
});

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> { asChild?: boolean }
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
});
Button.displayName = "Button";
export { buttonVariants };
`,
  "components/ui/card.tsx": `import * as React from "react";
import { cn } from "@/lib/utils";
export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => <div ref={ref} className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)} {...props} />);
export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />);
export const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(({ className, ...props }, ref) => <h3 ref={ref} className={cn("text-2xl font-semibold leading-none tracking-tight", className)} {...props} />);
export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(({ className, ...props }, ref) => <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />);
export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />);
export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />);
Card.displayName = "Card"; CardHeader.displayName = "CardHeader"; CardTitle.displayName = "CardTitle"; CardDescription.displayName = "CardDescription"; CardContent.displayName = "CardContent"; CardFooter.displayName = "CardFooter";
`,
};

/** Produce a full HTML document string ready to load into iframe srcdoc. */
export function buildPreviewHtml(files: ProjectFile[], entry = "src/App.tsx"): string {
  const map: Record<string, string> = {};
  for (const f of files) map[normalize(f.path)] = f.content;
  for (const [path, content] of Object.entries(VIRTUAL_FILES)) if (!map[path]) map[path] = content;

  const requestedEntry = normalize(entry);
  const entryKey = pickEntry(map, requestedEntry);
  if (!map[entryKey]) {
    return wrapError(`Entry file not found: ${entry}. Available files: ${Object.keys(map).slice(0, 12).join(", ") || "none"}`);
  }

  // Inline files as JSON for the runtime module-resolver.
  const filesJson = JSON.stringify(map);
  const importMap = JSON.stringify({ imports: PASSTHROUGH_EXTERNALS });

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Megsy Code Preview</title>
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
  // External — let importmap handle
  if (!spec.startsWith(".") && !spec.startsWith("/") && !spec.startsWith("@/")) return null;
  let basePath = from.split("/").slice(0, -1).join("/");
  let target = spec;
  if (spec.startsWith("@/")) {
    basePath = "";
    target = spec.slice(2);
  }
  const parts = (basePath ? basePath + "/" + target : target).split("/");
  const stack = [];
  for (const p of parts) {
    if (p === "" || p === ".") continue;
    if (p === "..") stack.pop();
    else stack.push(p);
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
    const exports = {};
    moduleCache.set(path, exports);
    return exports;
  }

  // Transform JSX/TS via Babel
  const transformed = Babel.transform(src, {
    filename: path,
    presets: [
      ["typescript", { allExtensions: true, isTSX: true }],
      ["react", { runtime: "classic" }],
    ],
    plugins: [],
  }).code;

  // Convert import/export to a require-style closure
  // Naive: collect import statements & rewrite
  const importRegex = /import\\s+(?:([\\w*{}\\s,]+)\\s+from\\s+)?["']([^"']+)["'];?/g;
  const imports = [];
  let body = transformed.replace(importRegex, (m, clause, spec) => {
    const id = "__m" + imports.length;
    imports.push({ id, clause: clause?.trim() || null, spec });
    return "/*__import__*/";
  });
  // Rewrite export default & named
  const namedExports = [];
  body = body.replace(/export\\s+default\\s+/g, "module.exports.default = ");
  body = body.replace(/export\\s+\\{([^}]+)\\};?/g, (_m, names) => {
    return names.split(",").map((n) => {
      const [orig, alias] = n.split(/\\s+as\\s+/).map(s => s.trim());
      return "module.exports[" + JSON.stringify(alias || orig) + "] = " + orig + ";";
    }).join("\\n");
  });
  body = body.replace(/export\\s+(const|let|var)\\s+(\\w+)/g, (_m, kw, name) => {
    namedExports.push(name);
    return kw + " " + name;
  });
  body = body.replace(/export\\s+(async\\s+function|function|class)\\s+(\\w+)/g, (_m, kw, name) => {
    namedExports.push(name);
    return kw + " " + name;
  });
  if (namedExports.length) {
    body += "\\n" + namedExports.map((name) => "module.exports[" + JSON.stringify(name) + "] = " + name + ";").join("\\n");
  }

  // Resolve imports — collect per-statement line groups
  const importLineGroups = [];
  for (const imp of imports) {
    const lines = [];
    const resolved = resolve(path, imp.spec);
    let mod;
    if (resolved) {
      mod = await loadModule(resolved);
    } else {
      mod = await import(/* @vite-ignore */ imp.spec);
    }
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

  // Replace import placeholders — each placeholder gets ALL lines for that statement
  let pi = 0;
  body = body.replace(/\\/\\*__import__\\*\\//g, () => {
    const group = importLineGroups[pi++] || [];
    return group.join("\\n");
  });

  const module = { exports: {} };
  const fn = new Function("module", "exports", "React", "__resolveImport", body);
  fn(module, module.exports, React, (id) => moduleCache.get("__tmp_" + id));
  // module.exports may not have .default — also set it to the whole exports
  if (!module.exports.default && typeof module.exports === "object") {
    // ok
  }
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

function wrapError(msg: string) {
  return `<!doctype html><html><body style="background:#1a0a0a;color:#fecaca;font-family:monospace;padding:24px">${msg}</body></html>`;
}

/** Built-in starter template used when a new project is created. */
export const BLANK_TEMPLATE: ProjectFile[] = [
  {
    path: "src/App.tsx",
    content: `import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export default function App() {
  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-8 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="max-w-lg"
      >
        <div className="inline-flex items-center gap-2 text-xs text-white/50 border border-white/10 rounded-full px-3 py-1 mb-8">
          <Sparkles className="w-3 h-3" />
          New Megsy Code project
        </div>
        <h1 className="text-5xl font-bold mb-4">Hello 👋</h1>
        <p className="text-white/60 leading-relaxed">
          Describe what you want to build in the chat on the left, and Megsy will build it for you right here.
        </p>
      </motion.div>
    </div>
  );
}
`,
  },
];
