// @ts-nocheck — imported design from external repo; backend wiring deferred.
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, ChevronDown, ChevronRight, FileText, Folder, FolderOpen, Search, Copy, X, Play, Square, Loader2, Code as CodeIcon, Monitor, Terminal as TerminalIcon, RefreshCcw, ExternalLink, WandSparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { projectSandbox, type SandboxRow, type SandboxStatus } from "@/lib/projectSandbox";
import { detectProjectRuntime } from "@/lib/detectProjectType";
import WebContainerPreview from "@/components/code/WebContainerPreview";

interface FileRow { id: string; path: string; content: string; updated_at: string }

type TreeNode = {
  name: string;
  path: string;
  isDir: boolean;
  children: Record<string, TreeNode>;
  file?: FileRow;
};

function buildTree(files: FileRow[]): TreeNode {
  const root: TreeNode = { name: "", path: "", isDir: true, children: {} };
  for (const f of files) {
    const parts = f.path.split("/").filter(Boolean);
    let cur = root;
    for (let i = 0; i < parts.length; i++) {
      const name = parts[i];
      const isLast = i === parts.length - 1;
      if (!cur.children[name]) {
        cur.children[name] = { name, path: parts.slice(0, i + 1).join("/"), isDir: !isLast, children: {} };
      }
      if (isLast) { cur.children[name].file = f; cur.children[name].isDir = false; }
      cur = cur.children[name];
    }
  }
  return root;
}

function langOf(path: string) {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  return ({ ts: "TypeScript", tsx: "TSX", js: "JavaScript", jsx: "JSX", json: "JSON", css: "CSS", html: "HTML", md: "Markdown", sql: "SQL", toml: "TOML", svg: "SVG" } as any)[ext] ?? (ext.toUpperCase() || "Plain");
}

function fmtBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

const glassBg = { backgroundColor: "color-mix(in oklab, hsl(var(--background)) 55%, transparent)" } as const;
const glassBgStrong = { backgroundColor: "color-mix(in oklab, hsl(var(--background)) 75%, transparent)" } as const;

function TreeView({ node, depth = 0, expanded, onToggle, onPick, active }: {
  node: TreeNode; depth?: number; expanded: Set<string>; onToggle: (p: string) => void;
  onPick: (f: FileRow) => void; active: string | null;
}) {
  const entries = Object.values(node.children).sort((a, b) => {
    if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  return (
    <ul className="text-[14px]">
      {entries.map((c) => {
        const open = expanded.has(c.path);
        return (
          <li key={c.path}>
            {c.isDir ? (
              <>
                <button
                  onClick={() => onToggle(c.path)}
                  className="w-full flex items-center gap-2 py-2 px-2 rounded-xl hover:bg-foreground/[0.05] text-start transition"
                  style={{ paddingInlineStart: 8 + depth * 14 }}
                >
                  {open ? <ChevronDown className="w-3.5 h-3.5 opacity-50 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 opacity-50 shrink-0 rtl:rotate-180" />}
                  {open ? <FolderOpen className="w-4 h-4 text-primary/80 shrink-0" /> : <Folder className="w-4 h-4 text-primary/80 shrink-0" />}
                  <span className="truncate font-medium">{c.name}</span>
                </button>
                {open && (
                  <TreeView node={c} depth={depth + 1} expanded={expanded} onToggle={onToggle} onPick={onPick} active={active} />
                )}
              </>
            ) : (
              <button
                onClick={() => c.file && onPick(c.file)}
                className={`w-full flex items-center gap-2 py-2 px-2 rounded-xl text-start transition ${active === c.path ? "bg-primary/15 text-primary font-medium" : "hover:bg-foreground/[0.05]"}`}
                style={{ paddingInlineStart: 8 + (depth + 1) * 14 + 14 }}
              >
                <FileText className="w-3.5 h-3.5 opacity-60 shrink-0" />
                <span className="truncate">{c.name}</span>
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export default function MegsyPrCodePage() {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const [files, setFiles] = useState<FileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<FileRow | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["src"]));
  const [query, setQuery] = useState("");

  // ── Sandbox state (Run / Preview / Terminal) ──
  const [sandbox, setSandbox] = useState<SandboxRow | null>(null);
  const [overlayTab, setOverlayTab] = useState<"code" | "preview" | "terminal">("code");
  const [busy, setBusy] = useState(false);
  const [logs, setLogs] = useState("");
  const [logsBusy, setLogsBusy] = useState(false);
  const [pythonBusy, setPythonBusy] = useState(false);
  const previewIframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeKey, setIframeKey] = useState(0);

  useEffect(() => {
    if (!projectId) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("ai_project_files")
        .select("id,path,content,updated_at")
        .eq("project_id", projectId)
        .order("path", { ascending: true });
      if (error) { toast.error(error.message); setLoading(false); return; }
      const list = (data ?? []) as FileRow[];
      setFiles(list);
      const initialOpen = new Set<string>();
      for (const f of list) {
        const parts = f.path.split("/");
        if (parts[0]) initialOpen.add(parts[0]);
        if (parts.length > 1) initialOpen.add(parts.slice(0, 2).join("/"));
      }
      setExpanded(initialOpen);
      setLoading(false);
    })();
  }, [projectId]);

  // Load sandbox status once + subscribe to realtime updates
  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    projectSandbox.status(projectId).then((r) => {
      if (cancelled) return;
      if (r && typeof r === "object" && "ok" in r && r.ok && r.data) setSandbox(r.data as SandboxRow);
    }).catch(() => {});
    const channel = supabase
      .channel(`sandbox-${projectId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "project_sandboxes", filter: `project_id=eq.${projectId}` },
        (payload) => {
          const next = (payload.new ?? null) as SandboxRow | null;
          if (next) setSandbox(next);
          else if (payload.eventType === "DELETE") setSandbox(null);
        },
      )
      .subscribe();
    // Also listen for file changes (agent edits) → refresh tree
    const fileChannel = supabase
      .channel(`files-${projectId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ai_project_files", filter: `project_id=eq.${projectId}` },
        async () => {
          const { data } = await supabase
            .from("ai_project_files")
            .select("id,path,content,updated_at")
            .eq("project_id", projectId)
            .order("path");
          setFiles((data ?? []) as FileRow[]);
        },
      )
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
      supabase.removeChannel(fileChannel);
    };
  }, [projectId]);

  const tree = useMemo(() => buildTree(files), [files]);

  const toggle = (p: string) => setExpanded(prev => {
    const n = new Set(prev);
    if (n.has(p)) n.delete(p); else n.add(p);
    return n;
  });

  const filtered = useMemo(() => {
    if (!query.trim()) return files;
    const q = query.toLowerCase();
    return files.filter(f => f.path.toLowerCase().includes(q));
  }, [files, query]);

  const copyContent = async () => {
    if (!active) return;
    try { await navigator.clipboard.writeText(active.content); toast.success("Copied"); } catch { /* noop */ }
  };

  // ── Sandbox handlers ──
  const sbStatus: SandboxStatus = sandbox?.status ?? "stopped";
  const isRunning = sbStatus === "running";
  const isStarting = sbStatus === "starting";

  const handleRun = async () => {
    if (!projectId || busy) return;
    setBusy(true);
    try {
      if (isRunning || isStarting) {
        const r = await projectSandbox.stop(projectId);
        if (!r.ok) toast.error(r.error || "Failed to stop sandbox");
        else toast.success("Sandbox stopped");
      } else {
        toast.info("Sandbox is starting… first time takes 1-2 minutes for npm install");
        const r = await projectSandbox.start(projectId);
        if (!r.ok) toast.error(r.error || "Failed to start sandbox");
        else toast.success("Sandbox running");
      }
    } finally {
      setBusy(false);
    }
  };

  const refreshLogs = async () => {
    if (!projectId) return;
    setLogsBusy(true);
    try {
      const r = await projectSandbox.logs(projectId, 400);
      if (r && typeof r === "object" && "ok" in r && r.ok) setLogs((r.data as { logs: string })?.logs ?? "");
    } finally {
      setLogsBusy(false);
    }
  };

  const runPythonBuildCheck = async () => {
    if (!projectId || pythonBusy) return;
    setPythonBusy(true);
    setActive({ id: "__preview__", path: "terminal", content: "", updated_at: "" } as FileRow);
    setOverlayTab("terminal");
    try {
      if (!isRunning) {
        toast.info("Starting E2B sandbox first…");
        const started = await projectSandbox.start(projectId);
        if (!started.ok) throw new Error(started.error || "Failed to start E2B sandbox");
      }
      const result = await projectSandbox.runPython(projectId, `import os, json, pathlib\nroot = pathlib.Path('/home/user/app')\nfiles = sorted(str(p.relative_to(root)) for p in root.rglob('*') if p.is_file() and '.git' not in p.parts and 'node_modules' not in p.parts)\nprint('E2B Python OK')\nprint('project_file_count=', len(files))\nprint('sample_files=', json.dumps(files[:20], ensure_ascii=False))`, 120000);
      if (!result.ok) throw new Error(result.error || "Python execution failed");
      setLogs([result.data?.stdout, result.data?.stderr, result.data?.error].filter(Boolean).join("\n") || "E2B Python finished with no output");
      toast.success("Python was tested inside E2B successfully");
    } catch (e) {
      const msg = String((e as Error).message);
      setLogs(msg);
      toast.error(msg);
    } finally {
      setPythonBusy(false);
    }
  };

  useEffect(() => {
    if (overlayTab === "terminal" && active) {
      refreshLogs();
      const t = setInterval(refreshLogs, 4000);
      return () => clearInterval(t);
    }
  }, [overlayTab, active, projectId]);


  return (
    <div className="min-h-[100dvh] w-full bg-background text-foreground relative overflow-hidden">
      {/* Floating back */}
      <button
        onClick={() => navigate(`/build/${projectId}/chat`)}
        aria-label="Back"
        className="fixed top-4 start-4 z-50 w-11 h-11 rounded-full grid place-items-center backdrop-blur-2xl backdrop-saturate-150 border border-foreground/10 shadow-[0_4px_16px_-6px_rgba(0,0,0,0.18)] dark:shadow-[0_4px_16px_-6px_rgba(0,0,0,0.6)] transition"
        style={glassBg}
      >
        <ChevronLeft className="w-5 h-5 rtl:rotate-180" />
      </button>

      {/* Header */}
      <div className="px-5 pt-20 pb-3 text-center">
        <h1 className="text-[26px] font-bold tracking-tight">Code</h1>
        <p className="mt-1 text-[12.5px] text-muted-foreground">
          {loading ? "Loading…" : `${files.length} files in your project`}
        </p>
      </div>

      {/* Floating search + Run pill */}
      <div className="px-4 sticky top-3 z-30">
        <div className="flex items-center gap-2">
          <div
            className="flex-1 flex items-center gap-2 h-12 rounded-2xl px-4 backdrop-blur-2xl backdrop-saturate-150 border border-foreground/10 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.18)] dark:shadow-[0_4px_20px_-10px_rgba(0,0,0,0.55)]"
            style={glassBg}
          >
            <Search className="w-4 h-4 opacity-60 shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search files…"
              className="flex-1 bg-transparent outline-none text-[14px] placeholder:text-muted-foreground"
            />
            {query && (
              <button onClick={() => setQuery("")} className="opacity-60 hover:opacity-100">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            onClick={handleRun}
            disabled={busy}
            aria-label={isRunning ? "Stop sandbox" : "Run sandbox"}
            title={isRunning ? "Stop sandbox" : "Run sandbox"}
            className={`h-12 px-4 rounded-2xl flex items-center gap-2 text-[13px] font-semibold backdrop-blur-2xl backdrop-saturate-150 border border-foreground/10 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.18)] dark:shadow-[0_4px_20px_-10px_rgba(0,0,0,0.55)] transition ${isRunning ? "text-rose-500" : "text-emerald-500"} disabled:opacity-50`}
            style={glassBg}
          >
            {busy || isStarting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isRunning ? (
              <Square className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current" />
            )}
            <span className="hidden sm:inline">{isRunning ? "Stop" : isStarting ? "Starting…" : "Run"}</span>
          </button>
          {(isRunning || sandbox?.dev_url) && (
            <button
              onClick={() => { setActive({ id: "__preview__", path: "preview", content: "", updated_at: "" } as FileRow); setOverlayTab("preview"); }}
              aria-label="Open preview"
              title="Preview"
              className="h-12 w-12 rounded-2xl grid place-items-center backdrop-blur-2xl backdrop-saturate-150 border border-foreground/10 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.18)] dark:shadow-[0_4px_20px_-10px_rgba(0,0,0,0.55)] transition"
              style={glassBg}
            >
              <Monitor className="w-4 h-4 text-primary" />
            </button>
          )}
          <button
            onClick={runPythonBuildCheck}
            disabled={pythonBusy || busy}
            aria-label="Run Python in E2B"
            title="Run Python in E2B"
            className="h-12 w-12 rounded-2xl grid place-items-center backdrop-blur-2xl backdrop-saturate-150 border border-foreground/10 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.18)] dark:shadow-[0_4px_20px_-10px_rgba(0,0,0,0.55)] transition disabled:opacity-50"
            style={glassBg}
          >
            {pythonBusy ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : <WandSparkles className="w-4 h-4 text-primary" />}
          </button>
        </div>
        {sandbox?.last_error && (
          <div className="mt-2 text-[11px] text-rose-500 px-2 truncate" dir="ltr">{sandbox.last_error}</div>
        )}
      </div>

      {/* File list */}
      <div className="px-4 pt-4 pb-10">
        <div
          className="rounded-3xl backdrop-blur-2xl backdrop-saturate-150 border border-foreground/10 p-2 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.15)] dark:shadow-[0_4px_20px_-10px_rgba(0,0,0,0.5)]"
          style={glassBg}
        >
          {loading ? (
            <div className="text-center text-sm text-muted-foreground py-10">Loading files…</div>
          ) : files.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-10">No files yet</div>
          ) : query ? (
            <ul className="text-[14px]">
              {filtered.map((f) => (
                <li key={f.id}>
                  <button
                    onClick={() => setActive(f)}
                    className="w-full flex items-center gap-2 py-2 px-3 rounded-xl text-start hover:bg-foreground/[0.05] transition"
                  >
                    <FileText className="w-3.5 h-3.5 opacity-60 shrink-0" />
                    <span className="truncate" dir="ltr">{f.path}</span>
                  </button>
                </li>
              ))}
              {filtered.length === 0 && (
                <div className="text-center text-xs text-muted-foreground py-6">No results</div>
              )}
            </ul>
          ) : (
            <TreeView
              node={tree}
              expanded={expanded}
              onToggle={toggle}
              onPick={setActive}
              active={active?.path ?? null}
            />
          )}
        </div>
      </div>

      {/* Glass code viewer overlay */}
      {active && (
        <div
          className="fixed inset-0 z-40 flex flex-col animate-fade-in"
          style={glassBgStrong}
        >
          <div className="absolute inset-0 backdrop-blur-2xl backdrop-saturate-150 -z-10" />
          {/* Header */}
          <div
            className="shrink-0 flex items-center gap-2 px-3 h-14 border-b border-foreground/10 backdrop-blur-2xl backdrop-saturate-150"
            style={glassBg}
          >
            <button
              onClick={() => { setActive(null); setOverlayTab("code"); }}
              aria-label="Close"
              className="w-10 h-10 rounded-full grid place-items-center hover:bg-foreground/[0.06] transition"
            >
              <ChevronLeft className="w-5 h-5 rtl:rotate-180" />
            </button>

            {/* Tabs (only meaningful when sandbox exists) */}
            <div
              className="flex items-center gap-0.5 rounded-2xl p-0.5 border border-foreground/10 backdrop-blur-2xl"
              style={glassBg}
            >
              {([
                { id: "code", icon: CodeIcon, label: "Code" },
                { id: "preview", icon: Monitor, label: "Preview" },
                { id: "terminal", icon: TerminalIcon, label: "Terminal" },
              ] as const).map((t) => {
                const Icon = t.icon;
                const disabled = (t.id === "preview" || t.id === "terminal") && !sandbox?.sandbox_id;
                const selected = overlayTab === t.id;
                return (
                  <button
                    key={t.id}
                    disabled={disabled}
                    onClick={() => setOverlayTab(t.id)}
                    className={`h-9 px-3 rounded-xl text-[12px] font-medium flex items-center gap-1.5 transition ${selected ? "bg-foreground/10 text-foreground" : "text-muted-foreground hover:bg-foreground/[0.06]"} disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{t.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex-1 min-w-0 ps-2">
              {overlayTab === "code" && active.id !== "__preview__" ? (
                <>
                  <div className="text-[13px] font-semibold truncate" dir="ltr">{active.path.split("/").pop()}</div>
                  <div className="text-[11px] text-muted-foreground truncate" dir="ltr">{active.path}</div>
                </>
              ) : overlayTab === "preview" ? (
                <div className="text-[11px] text-muted-foreground truncate" dir="ltr">{sandbox?.dev_url ?? "—"}</div>
              ) : overlayTab === "terminal" ? (
                <div className="text-[11px] text-muted-foreground truncate" dir="ltr">/tmp/dev.log</div>
              ) : null}
            </div>

            {overlayTab === "code" && active.id !== "__preview__" && (
              <>
                <span className="text-[11px] text-muted-foreground hidden sm:inline">{langOf(active.path)}</span>
                <span className="text-[11px] text-muted-foreground">{fmtBytes(active.content.length)}</span>
                <button
                  onClick={copyContent}
                  className="ms-1 h-9 px-3 rounded-full text-[12px] font-medium flex items-center gap-1.5 backdrop-blur-2xl border border-foreground/10 hover:bg-foreground/[0.06] transition"
                  style={glassBg}
                >
                  <Copy className="w-3.5 h-3.5" /> Copy
                </button>
              </>
            )}

            {overlayTab === "preview" && sandbox?.dev_url && (
              <>
                <button
                  onClick={() => setIframeKey((k) => k + 1)}
                  aria-label="Refresh preview"
                  className="w-9 h-9 rounded-full grid place-items-center hover:bg-foreground/[0.06] transition"
                >
                  <RefreshCcw className="w-4 h-4" />
                </button>
                <a
                  href={sandbox.dev_url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Open in new tab"
                  className="w-9 h-9 rounded-full grid place-items-center hover:bg-foreground/[0.06] transition"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </>
            )}

            {overlayTab === "terminal" && (
              <button
                onClick={refreshLogs}
                disabled={logsBusy}
                aria-label="Refresh logs"
                className="w-9 h-9 rounded-full grid place-items-center hover:bg-foreground/[0.06] transition disabled:opacity-40"
              >
                {logsBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
              </button>
            )}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-auto">
            {overlayTab === "code" && active.id !== "__preview__" && (
              <pre dir="ltr" className="text-[12.5px] leading-[1.6] font-mono p-4 whitespace-pre text-foreground/90">
                <code>{active.content || "// (empty file)"}</code>
              </pre>
            )}
            {overlayTab === "code" && active.id === "__preview__" && (
              <div className="grid place-items-center h-full text-sm text-muted-foreground">
                Pick a file from the list to view its content here.
              </div>
            )}
            {overlayTab === "preview" && (() => {
              const runtime = detectProjectRuntime(files);
              if (runtime === "webcontainer" && projectId && files.length > 0) {
                return <WebContainerPreview projectId={projectId} files={files} />;
              }
              return sandbox?.dev_url ? (
                <iframe
                  ref={previewIframeRef}
                  key={iframeKey}
                  src={sandbox.dev_url}
                  title="Live preview"
                  className="w-full h-full border-0 bg-white"
                />
              ) : (
                <div className="grid place-items-center h-full text-sm text-muted-foreground p-6 text-center">
                  No active sandbox. Press Run from the top of the page to start the preview.
                </div>
              );
            })()}
            {overlayTab === "terminal" && (
              <pre dir="ltr" className="text-[12px] leading-[1.55] font-mono p-4 whitespace-pre-wrap text-foreground/90">
                {logs || (sandbox?.sandbox_id ? "(no logs yet)" : "No active sandbox.")}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
