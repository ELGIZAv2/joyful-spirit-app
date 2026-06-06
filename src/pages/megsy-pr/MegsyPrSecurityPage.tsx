// @ts-nocheck — imported design from external repo; backend wiring deferred.
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ChevronLeft, ChevronDown, ChevronRight, HelpCircle, Loader2, MessageSquare,
  ArrowUpRight, X, Sparkles, ShieldAlert,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Level = "error" | "warn" | "info";
interface Finding {
  id: string;
  level: Level;
  scanner_name: string;
  internal_id: string;
  title: string;
  description: string;
  details: string;
  learn_more_url: string | null;
  fix_prompt: string;
  status: "open" | "ignored" | "fixed";
  ignored_reason: string | null;
  created_at: string;
}
interface Scan {
  id: string;
  status: string;
  completed_at: string | null;
  summary: any;
  error_count: number;
  warning_count: number;
  info_count: number;
}

const SCANNER_LABEL: Record<string, string> = {
  header: "Security headers check",
  tls: "Transport security check",
  secret: "Exposed secret check",
  mixed_content: "Mixed-content check",
  exposed_file: "Exposed file check",
  form: "Form security check",
  http: "Reachability check",
};

function LevelBadge({ level }: { level: Level }) {
  const map: Record<Level, string> = {
    error: "bg-red-500/10 text-red-600 dark:text-red-400",
    warn: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    info: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  };
  const label: Record<Level, string> = { error: "Error", warn: "Warning", info: "Info" };
  return (
    <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${map[level]}`}>
      {label[level]}
    </span>
  );
}

const DEFAULT_MEMORY = `# Project security notes

## About this project
(Write a couple of lines about the project and how it controls access permissions)

## Things that must never happen
(List cases that must never occur in the business logic)

## Knowingly accepted exceptions
Tip: use this section to document only what you intentionally choose to ignore, not every possible risk.
`;

export default function MegsyPrSecurityPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [scan, setScan] = useState<Scan | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [tab, setTab] = useState<"errors" | "warnings" | "all">("errors");
  const [running, setRunning] = useState(false);
  const [outOfDate, setOutOfDate] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [advancedView, setAdvancedView] = useState(false);

  // Memory modal state
  const [memOpen, setMemOpen] = useState(false);
  const [memIntro, setMemIntro] = useState(true);
  const [memContent, setMemContent] = useState("");
  const [memSaving, setMemSaving] = useState(false);

  // Ignore modal state
  const [ignoreFor, setIgnoreFor] = useState<Finding | null>(null);
  const [ignoreReason, setIgnoreReason] = useState("");

  useEffect(() => { if (projectId) loadLatest(); }, [projectId]);

  async function loadLatest() {
    if (!projectId) return;
    const { data: scans } = await supabase
      .from("security_scans")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(1);
    const s = scans?.[0] as Scan | undefined;
    if (s) {
      setScan(s);
      const ageMs = s.completed_at ? Date.now() - new Date(s.completed_at).getTime() : 0;
      setOutOfDate(ageMs > 1000 * 60 * 60 * 24); // > 24h
      const { data: f } = await supabase
        .from("security_findings")
        .select("*")
        .eq("scan_id", s.id)
        .order("level", { ascending: true })
        .order("created_at", { ascending: true });
      setFindings((f || []) as Finding[]);
    } else {
      setOutOfDate(true);
    }
  }

  async function runScan() {
    if (!projectId) return;
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke("security-scan", {
        body: { project_id: projectId },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      await loadLatest();
      toast.success("Scan complete");
    } catch (e) {
      toast.error((e as Error).message || "Scan failed");
    } finally {
      setRunning(false);
    }
  }

  async function openMemory() {
    if (!projectId) return;
    const { data } = await supabase
      .from("security_memory").select("content").eq("project_id", projectId).maybeSingle();
    setMemContent(data?.content || DEFAULT_MEMORY);
    setMemIntro(true);
    setMemOpen(true);
  }

  async function saveMemory() {
    if (!projectId) return;
    setMemSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setMemSaving(false); return; }
    const { error } = await supabase.from("security_memory").upsert({
      project_id: projectId, user_id: user.id, content: memContent, updated_at: new Date().toISOString(),
    });
    setMemSaving(false);
    if (error) { toast.error(error.message); return; }
    setMemOpen(false);
    toast.success("Saved");
  }

  async function confirmIgnore() {
    if (!ignoreFor) return;
    const { error } = await supabase
      .from("security_findings")
      .update({ status: "ignored", ignored_reason: ignoreReason || null })
      .eq("id", ignoreFor.id);
    if (error) { toast.error(error.message); return; }
    setFindings(f => f.map(x => x.id === ignoreFor.id ? { ...x, status: "ignored", ignored_reason: ignoreReason || null } : x));
    setIgnoreFor(null); setIgnoreReason("");
  }

  async function sendToChat(prompt: string) {
    if (!projectId) return;
    try {
      const { saveProjectDraft } = await import("@/lib/projectDrafts");
      await saveProjectDraft(projectId, prompt);
      sessionStorage.setItem(`autosend:${projectId}`, "1");
    } catch { /* noop */ }
    navigate(`/build/${projectId}/chat?prompt=${encodeURIComponent(prompt)}&autosend=1`);
  }

  function tryFixAll() {
    const open = findings.filter(f => f.status === "open");
    if (!open.length) { toast.info("Nothing to fix"); return; }
    const prompt = "Fix the following security issues in the project:\n\n" +
      open.map((f, i) => `${i + 1}. [${f.level.toUpperCase()}] ${f.title}\n   ${f.fix_prompt}`).join("\n\n");
    sendToChat(prompt);
  }

  const visible = findings.filter(f => {
    if (!advancedView && f.status !== "open") return false;
    if (tab === "errors") return f.level === "error";
    if (tab === "warnings") return f.level === "warn";
    return true;
  });

  const counts = {
    errors: findings.filter(f => f.level === "error" && (advancedView || f.status === "open")).length,
    warnings: findings.filter(f => f.level === "warn" && (advancedView || f.status === "open")).length,
    all: findings.filter(f => advancedView || f.status === "open").length,
  };

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col">
      <button
        onClick={() => navigate(`/build/${projectId}`)}
        aria-label="Back"
        className="fixed top-4 start-4 z-50 w-11 h-11 rounded-full grid place-items-center backdrop-blur-2xl backdrop-saturate-150 border border-foreground/10 shadow-[0_4px_16px_-6px_rgba(0,0,0,0.18)] dark:shadow-[0_4px_16px_-6px_rgba(0,0,0,0.6)] transition"
        style={{ backgroundColor: "color-mix(in oklab, hsl(var(--background)) 55%, transparent)" }}
      >
        <ChevronLeft className="w-5 h-5 rtl:rotate-180" />
      </button>

      <div className="flex-1 overflow-y-auto px-4 pt-20 pb-10">
        <div className="mb-6 text-center">
          <h1 className="text-[22px] font-bold tracking-tight">Security</h1>
          <p className="mt-1.5 text-[13px] text-muted-foreground leading-relaxed">
            A real scan of your published site to detect common vulnerabilities, missing security headers, and leaked files, with a clear explanation for each result.
          </p>
        </div>
        {/* Scan card */}
        <div
          className="rounded-2xl backdrop-blur-2xl backdrop-saturate-150 border border-foreground/10 p-4 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.15)] dark:shadow-[0_4px_20px_-10px_rgba(0,0,0,0.5)]"
          style={{ backgroundColor: "color-mix(in oklab, hsl(var(--background)) 55%, transparent)" }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-semibold text-[15px]">Security scan</div>
              {!outOfDate && scan && (
                <div className="text-[11px] text-muted-foreground mt-1">
                  Last run {new Date(scan.completed_at!).toLocaleString()}
                </div>
              )}
            </div>
          </div>
          <div className="mt-4 flex flex-col items-end gap-2">
            <button
              onClick={openMemory}
              className="px-3 py-1.5 rounded-lg backdrop-blur-2xl border border-foreground/10 text-[13px] hover:bg-foreground/[0.06] transition"
              style={{ backgroundColor: "color-mix(in oklab, hsl(var(--background)) 55%, transparent)" }}
            >
              Edit security memory
            </button>
            <button
              onClick={runScan}
              disabled={running}
              className="px-4 py-2 rounded-lg backdrop-blur-2xl backdrop-saturate-150 border border-primary/25 text-primary text-[13px] font-semibold flex items-center gap-2 disabled:opacity-60 transition"
              style={{ backgroundColor: "color-mix(in oklab, hsl(var(--primary)) 18%, transparent)" }}
            >
              {running ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {running ? "Scanning…" : (scan ? "Update Scan" : "Run Scan")}
              <span className="opacity-70 font-normal">(Free)</span>
            </button>
          </div>
        </div>

        {/* Detected issues */}
        <div className="mt-6 flex items-center justify-between">
          <h2 className="font-bold text-[18px]">Detected issues</h2>
          <button
            onClick={tryFixAll}
            className="px-3 py-1.5 rounded-lg backdrop-blur-2xl border border-foreground/10 text-[12px] font-semibold flex items-center gap-1 disabled:opacity-50 transition"
            style={{ backgroundColor: "color-mix(in oklab, hsl(var(--foreground)) 8%, transparent)" }}
          >
            Try to fix all <span className="opacity-70 font-normal">(Free)</span>
          </button>
        </div>

        <div
          className="mt-3 inline-flex gap-1 p-1 rounded-full backdrop-blur-2xl border border-foreground/10"
          style={{ backgroundColor: "color-mix(in oklab, hsl(var(--background)) 55%, transparent)" }}
        >
          {([
            ["errors", `Errors`, counts.errors],
            ["warnings", `Warnings`, counts.warnings],
            ["all", `All`, counts.all],
          ] as const).map(([k, label, n]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`px-3 py-1.5 rounded-full text-[13px] font-medium flex items-center gap-1.5 transition ${
                tab === k ? "bg-foreground/[0.08] text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
              {n > 0 && (
                <span className={`px-1.5 rounded-md text-[10px] ${
                  k === "errors" ? "bg-red-500/15 text-red-600 dark:text-red-400"
                  : k === "warnings" ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                  : "bg-foreground/10 text-foreground"
                }`}>{n}</span>
              )}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[12px] text-muted-foreground">
          {tab === "errors" && "Critical problems that need your attention right away"}
          {tab === "warnings" && "Issues you should review and fix if necessary"}
          {tab === "all" && "All findings from the latest scan"}
        </p>

        {outOfDate && scan && (
          <div className="mt-3 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 px-3 py-2 text-[12.5px] leading-relaxed">
            Some security scanners of your project have outdated results. Click Update to get the latest findings.
          </div>
        )}

        {/* Findings list */}
        <div
          className="mt-3 rounded-2xl backdrop-blur-2xl backdrop-saturate-150 border border-foreground/10 overflow-hidden shadow-[0_4px_20px_-10px_rgba(0,0,0,0.15)] dark:shadow-[0_4px_20px_-10px_rgba(0,0,0,0.5)]"
          style={{ backgroundColor: "color-mix(in oklab, hsl(var(--background)) 55%, transparent)" }}
        >
          <div className="grid grid-cols-[90px_1fr_24px] px-4 py-2 text-[11px] text-muted-foreground border-b border-foreground/10">
            <div>Level</div><div>Issue</div><div />
          </div>
          {visible.length === 0 && (
            <div className="px-4 py-10 text-center text-[13px] text-muted-foreground">
              {scan ? "No issues at this level" : "Run a scan to see findings"}
            </div>
          )}
          {visible.map(f => {
            const open = expanded === f.id;
            return (
              <div key={f.id} className="border-t border-foreground/10">
                <button
                  onClick={() => setExpanded(open ? null : f.id)}
                  className="w-full grid grid-cols-[90px_1fr_24px] items-center px-4 py-3 text-left hover:bg-foreground/[0.02]"
                >
                  <div className="flex items-center gap-1">
                    {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    <LevelBadge level={f.level} />
                  </div>
                  <div className="text-[13px] font-medium truncate flex items-center gap-2">
                    {f.title}
                    {f.status === "ignored" && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-foreground/10 text-muted-foreground">ignored</span>
                    )}
                  </div>
                  <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground justify-self-end" />
                </button>

                {open && (
                  <div className="px-4 pb-4 -mt-1">
                    {f.learn_more_url && null}
                    <p className="mt-3 text-[13px] leading-relaxed text-foreground/85">{f.description}</p>
                    {f.details && (
                      <pre className="mt-2 text-[12px] leading-relaxed text-muted-foreground whitespace-pre-wrap font-sans">
                        {f.details}
                      </pre>
                    )}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {f.status === "open" && (
                        <>
                          <button
                            onClick={() => sendToChat(f.fix_prompt || `Fix this security issue: ${f.title}\n\n${f.description}`)}
                            className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-[12px] font-medium"
                          >
                            Fix with AI
                          </button>
                          <button
                            onClick={() => { setIgnoreFor(f); setIgnoreReason(""); }}
                            className="px-3 py-1.5 rounded-lg bg-foreground/10 text-foreground text-[12px] font-medium"
                          >
                            Ignore issue
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>

      {/* Edit memory modal */}
      {memOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setMemOpen(false)}>
          <div onClick={(e) => e.stopPropagation()}
            className="bg-background rounded-2xl w-full max-w-md p-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-bold text-[18px]">Security notebook</h3>
              <button onClick={() => setMemOpen(false)} className="p-1 -m-1"><X className="w-5 h-5" /></button>
            </div>

            {memIntro ? (
              <>
                <p className="text-[13px] text-muted-foreground leading-relaxed">
                  Add quick details about your project here so the scanner understands it and gives you more accurate, relevant results.
                </p>
                <div className="mt-4">
                  <div className="font-semibold text-[14px] mb-2">Examples you can take inspiration from:</div>
                  <ul className="space-y-2 text-[13px] leading-relaxed">
                    <li><b>Project type:</b> "A personal experiment open to the public with no sensitive data."</li>
                    <li><b>Users:</b> "Used by the internal team only."</li>
                    <li><b>Data sensitivity:</b> "Contains private messages that no other user should see."</li>
                  </ul>
                </div>
                <div className="mt-4 rounded-xl bg-amber-500/10 p-3 text-[12.5px] leading-relaxed text-amber-700 dark:text-amber-300">
                  <b>Note:</b> These notes are for context only — they are not a way to dismiss real vulnerabilities.
                </div>
                <div className="mt-5 flex gap-2 justify-end">
                  <button onClick={() => setMemOpen(false)} className="px-4 py-2 rounded-lg border border-foreground/15 text-[13px]">Cancel</button>
                  <button onClick={() => setMemIntro(false)} className="px-4 py-2 rounded-lg bg-foreground text-background text-[13px] font-semibold">
                    Start editing
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-[13px] text-muted-foreground leading-relaxed mb-3">
                  These notes are sent with the scanner so it can consider them when evaluating your project.
                </p>
                <textarea
                  value={memContent}
                  onChange={(e) => setMemContent(e.target.value)}
                  rows={12}
                  className="w-full rounded-xl border border-foreground/10 bg-foreground/[0.02] p-3 font-mono text-[12px] leading-relaxed resize-y"
                />
                <div className="mt-4 flex gap-2 justify-end">
                  <button onClick={() => setMemOpen(false)} className="px-4 py-2 rounded-lg border border-foreground/15 text-[13px]">Cancel</button>
                  <button onClick={saveMemory} disabled={memSaving}
                    className="px-4 py-2 rounded-lg bg-foreground text-background text-[13px] font-semibold disabled:opacity-60">
                    {memSaving ? "Saving…" : "Save"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Ignore reason modal */}
      {ignoreFor && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setIgnoreFor(null)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-background rounded-2xl w-full max-w-sm p-5">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-bold text-[16px]">Ignore issue</h3>
              <button onClick={() => setIgnoreFor(null)} className="p-1 -m-1"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-[12.5px] text-muted-foreground mb-3">{ignoreFor.title}</p>
            <textarea
              value={ignoreReason}
              onChange={(e) => setIgnoreReason(e.target.value)}
              placeholder="Why is this not applicable? (​, helps future scans)"
              rows={4}
              className="w-full rounded-xl border border-foreground/10 bg-foreground/[0.02] p-3 text-[13px] resize-y"
            />
            <div className="mt-4 flex gap-2 justify-end">
              <button onClick={() => setIgnoreFor(null)} className="px-4 py-2 rounded-lg border border-foreground/15 text-[13px]">Cancel</button>
              <button onClick={confirmIgnore} className="px-4 py-2 rounded-lg bg-foreground text-background text-[13px] font-semibold">
                Ignore
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
