// @ts-nocheck — imported design from external repo; backend wiring deferred.
import { useEffect, useRef, useState } from "react";
import { Loader2, RefreshCw, ExternalLink } from "lucide-react";
import { webcontainerPreview, type Stage } from "@/lib/webcontainerPreview";

interface FileRow { path: string; content: string }

interface Props {
  projectId: string;
  files: FileRow[];
}

const STAGE_LABEL: Record<Stage, string> = {
  idle: "Idle",
  booting: "Booting Node.js in browser…",
  mounting: "Mounting project files…",
  installing: "Installing dependencies…",
  starting: "Starting dev server…",
  ready: "Ready",
  error: "Error",
};

export default function WebContainerPreview({ projectId, files }: Props) {
  const [stage, setStage] = useState<Stage>("idle");
  const [url, setUrl] = useState<string | null>(null);
  const [log, setLog] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [reloadKey, setReloadKey] = useState(0);
  const startedRef = useRef<string | null>(null);

  useEffect(() => {
    const unsub = webcontainerPreview.subscribe((s) => {
      setStage(s.stage);
      setUrl(s.url);
      setLog(s.log);
      setError(s.error);
    });
    return () => { unsub(); };
  }, []);

  // Boot + mount once per project
  useEffect(() => {
    if (!projectId || !files.length) return;
    if (startedRef.current === projectId) return;
    startedRef.current = projectId;
    webcontainerPreview.start(projectId, files).catch((e) => {
      setError(e?.message ?? String(e));
    });
  }, [projectId, files]);

  // Live-sync individual file changes (after initial mount)
  const lastSnapshotRef = useRef<Map<string, string>>(new Map());
  useEffect(() => {
    if (stage !== "ready" && stage !== "starting") {
      // Seed snapshot during initial mount so we don't re-write everything
      lastSnapshotRef.current = new Map(files.map((f) => [f.path, f.content]));
      return;
    }
    const prev = lastSnapshotRef.current;
    const next = new Map(files.map((f) => [f.path, f.content]));
    for (const [p, c] of next) {
      if (prev.get(p) !== c) webcontainerPreview.writeFile(p, c);
    }
    lastSnapshotRef.current = next;
  }, [files, stage]);

  const isBusy = stage !== "ready" && stage !== "error";

  return (
    <div className="w-full h-full flex flex-col bg-background">
      {/* Top status bar */}
      <div className="h-10 flex items-center gap-2 px-3 border-b border-border/60 text-[12px]">
        {isBusy ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
        ) : stage === "ready" ? (
          <span className="w-2 h-2 rounded-full bg-green-500" />
        ) : (
          <span className="w-2 h-2 rounded-full bg-red-500" />
        )}
        <span className="text-foreground/80">{STAGE_LABEL[stage]}</span>
        {url && (
          <div className="ms-auto flex items-center gap-1">
            <button
              onClick={() => setReloadKey((k) => k + 1)}
              className="p-1.5 rounded-md hover:bg-foreground/[0.06] text-foreground/70"
              title="Reload"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 rounded-md hover:bg-foreground/[0.06] text-foreground/70"
              title="Open in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
      </div>

      {/* Preview area */}
      <div className="flex-1 relative bg-white">
        {url ? (
          <iframe
            key={reloadKey}
            src={url}
            title="WebContainer preview"
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
          />
        ) : error ? (
          <div className="h-full grid place-items-center p-6 text-center">
            <div>
              <div className="text-sm font-medium text-red-500 mb-2">Preview failed</div>
              <pre className="text-[11px] text-foreground/60 max-w-md whitespace-pre-wrap" dir="ltr">{error}</pre>
            </div>
          </div>
        ) : (
          <div className="h-full grid place-items-center text-sm text-foreground/60">
            <div className="text-center">
              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-3 text-primary" />
              {STAGE_LABEL[stage]}
              {log && (
                <pre dir="ltr" className="mt-4 text-[10px] text-foreground/50 max-w-lg max-h-40 overflow-auto whitespace-pre-wrap text-left">
                  {log.slice(-1500)}
                </pre>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
