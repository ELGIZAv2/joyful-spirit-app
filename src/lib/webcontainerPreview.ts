// Stub for in-browser preview runtime. The real implementation boots a
// WebContainer; here we expose a no-op API so consumers render gracefully.

export type Stage =
  | "idle"
  | "booting"
  | "installing"
  | "starting"
  | "ready"
  | "error";

export interface PreviewState {
  stage: Stage;
  url: string | null;
  log: string;
  error?: string | null;
}

type Listener = (s: PreviewState) => void;

class Stub {
  private state: PreviewState = { stage: "idle", url: null, log: "", error: null };
  private listeners = new Set<Listener>();

  subscribe(fn: Listener) {
    this.listeners.add(fn);
    fn(this.state);
    return () => this.listeners.delete(fn);
  }

  async start(_projectId: string, _files: Array<{ path: string; content: string }>) {
    this.state = { stage: "error", url: null, log: "", error: "WebContainer preview is not enabled in this project." };
    this.listeners.forEach((l) => l(this.state));
  }

  async writeFile(_path: string, _content: string) {}
  async stop() {
    this.state = { stage: "idle", url: null, log: "", error: null };
    this.listeners.forEach((l) => l(this.state));
  }
}

export const webcontainerPreview = new Stub();
