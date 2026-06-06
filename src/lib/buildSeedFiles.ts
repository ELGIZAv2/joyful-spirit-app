/**
 * TanStack Start project seed.
 *
 * These are the exact files Lovable injects into every new project:
 *   - configs (package.json, vite.config.ts, tsconfig.json, wrangler.jsonc, components.json, eslint.config.js)
 *   - dotfiles (.gitignore, .prettierrc, .prettierignore)
 *   - bootstrap (src/router.tsx, src/server.ts, src/start.ts)
 *   - core (src/styles.css, src/routes/__root.tsx, src/routes/index.tsx, src/lib/*, src/hooks/*)
 *   - shadcn UI (src/components/ui/*  — 47 files)
 *
 * Excluded from injection: .git, .lovable/, src/routeTree.gen.ts (auto-generated),
 * tsconfig.tsbuildinfo (cache).
 *
 * Files are stored in `buildSeedFiles.generated.ts` instead of as a real nested
 * Vite app directory. This prevents project import tools from mistaking the
 * seed template for the actual application source.
 */

import { GENERATED_BUILD_SEED_FILES } from "./buildSeedFiles.generated";

export interface SeedFile {
  path: string;
  content: string;
}

const seenSeedPaths = new Set<string>();

export const BUILD_SEED_FILES: SeedFile[] = GENERATED_BUILD_SEED_FILES
  // Defensive — drop anything that slipped through despite our cleanup.
  .filter((f) =>
    !f.path.startsWith(".git/") &&
    !f.path.startsWith(".lovable/") &&
    f.path !== "tsconfig.tsbuildinfo" &&
    f.path !== "src/routeTree.gen.ts"
  )
  // Prevent DB unique-constraint failures if a generated seed path appears twice.
  .filter((f) => {
    if (seenSeedPaths.has(f.path)) return false;
    seenSeedPaths.add(f.path);
    return true;
  });

export function getSeedFile(path: string): string | undefined {
  return BUILD_SEED_FILES.find((f) => f.path === path)?.content;
}
