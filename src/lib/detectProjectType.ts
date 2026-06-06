export type ProjectRuntime = "static" | "vite" | "next" | "node" | "python" | "unknown";

export function detectProjectRuntime(files: Array<{ path: string; content?: string }>): ProjectRuntime {
  const paths = new Set(files.map((f) => f.path));
  if (paths.has("package.json")) {
    const pkg = files.find((f) => f.path === "package.json");
    const txt = pkg?.content ?? "";
    if (/"next"\s*:/.test(txt)) return "next";
    if (/"vite"\s*:/.test(txt)) return "vite";
    return "node";
  }
  if (paths.has("requirements.txt") || paths.has("pyproject.toml")) return "python";
  if (paths.has("index.html")) return "static";
  return "unknown";
}
