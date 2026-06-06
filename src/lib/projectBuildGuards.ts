export interface BuildFile { path: string; content: string }

// Stub — returns files unchanged. Real implementation strips problematic paths
// and validates the bundle before deploy.
export function prepareProjectFilesForDeploy(files: BuildFile[]): {
  files: BuildFile[];
  warnings: string[];
} {
  return { files, warnings: [] };
}
