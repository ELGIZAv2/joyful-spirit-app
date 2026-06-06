// Stub for projectSandbox — UI imports it but live runtime is not wired in this project yet.
// All operations return safe defaults so pages can render without crashing.

export type SandboxStatus = "idle" | "starting" | "running" | "stopping" | "error";

export interface SandboxRow {
  project_id: string;
  status: SandboxStatus;
  preview_url: string | null;
  dev_url?: string | null;
  updated_at?: string;
  message?: string | null;
}

const notWired = (op: string) => ({
  ok: false as const,
  error: `projectSandbox.${op} is not wired in this project yet`,
});

export const projectSandbox = {
  async status(_projectId: string): Promise<SandboxRow | null> {
    return null;
  },
  async start(_projectId: string) {
    return notWired("start");
  },
  async stop(_projectId: string) {
    return notWired("stop");
  },
  async logs(_projectId: string, _limit = 200): Promise<{ ok: boolean; logs?: string[]; error?: string }> {
    return { ok: false, error: "logs not wired" };
  },
  async runPython(_projectId: string, _code: string, _timeoutMs = 60000) {
    return notWired("runPython");
  },
};
