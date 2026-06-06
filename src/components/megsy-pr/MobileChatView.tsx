// @ts-nocheck — imported design from external repo; backend wiring deferred.
import { useEffect, useMemo, useRef, useState } from "react";
import { Menu, ArrowUp, Square, Plus, MoreHorizontal, ThumbsUp, ThumbsDown, Copy, ChevronDown, ChevronLeft, ChevronRight, Settings, Pencil, Mic, Map, Camera, Paperclip, Eye, Play, Share2, Upload, Plug, Gauge, CloudCog, Braces, FileText, CreditCard, ShieldCheck, Rocket, GitBranch, Coins, Clock, X, Check, Sparkles, Search, FileEdit, FilePlus, FileDiff, Wrench, CheckCircle2, Bookmark, SlidersHorizontal, FolderOpen, FileSearch, Globe, Github, Terminal, Trash2, FolderTree } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ConnectorsSheet from "@/components/megsy-pr/ConnectorsSheet";
import MegsyPrPublishPage from "@/pages/megsy-pr/MegsyPrPublishPage";
import MegsyStar from "@/components/files/MegsyStar";
import { parseBuildAgentChanges, changeActionLabel } from "@/lib/buildAgentChanges";
import ChatMarkdown from "@/components/megsy-pr/ChatMarkdown";


interface Props {
  projectId: string;
  projectName: string;
  messages: any[];
  streaming: boolean;
  step?: string | null;
  input: string;
  setInput: (v: string) => void;
  onSend: () => void;
  onStop: () => void;
  onOpenSidebar: () => void;
  onOpenPreview?: () => void;
  onProjectRenamed?: (name: string) => void;
  onAction?: (id: string) => void;
}

type Theme = "light" | "dark" | "system";

const fmtDate = (d: Date) => {
  try {
    return new Intl.DateTimeFormat("ar", { hour: "numeric", minute: "2-digit", month: "long", day: "numeric" }).format(d);
  } catch { return d.toLocaleString(); }
};

export default function MobileChatView({
  projectId, projectName, messages, streaming, step, input, setInput,
  onSend, onStop, onOpenSidebar, onProjectRenamed, onAction,
}: Props) {
  const navigate = useNavigate();
  const [projectSheet, setProjectSheet] = useState(false);
  const [moreSheet, setMoreSheet] = useState(false);
  const [plusSheet, setPlusSheet] = useState(false);
  const [connectorsOpen, setConnectorsOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  
  const [renameOpen, setRenameOpen] = useState(false);
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const [newName, setNewName] = useState(projectName);
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "system";
    return (localStorage.getItem("theme") as Theme) || "system";
  });
  const [credits, setCredits] = useState<{ used: number; total: number } | null>(null);
  const [moreMsgId, setMoreMsgId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, "up" | "down">>({});

  // Hydrate feedback from DB (message_feedback table) on mount / project change.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
          .from("message_feedback")
          .select("message_id, value")
          .eq("user_id", user.id)
          .eq("project_id", projectId);
        if (cancelled) return;
        const map: Record<string, "up" | "down"> = {};
        for (const r of (data as any[]) ?? []) map[r.message_id] = r.value;
        setFeedback(map);
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, [projectId]);

  const setMsgFeedback = (msgId: string, value: "up" | "down") => {
    setFeedback((prev) => {
      const next = { ...prev };
      const removing = next[msgId] === value;
      if (removing) delete next[msgId];
      else next[msgId] = value;
      // Persist to DB (fire-and-forget).
      (async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
          if (removing) {
            await supabase.from("message_feedback")
              .delete().eq("user_id", user.id).eq("project_id", projectId).eq("message_id", msgId);
          } else {
            await supabase.from("message_feedback").upsert(
              { user_id: user.id, project_id: projectId, message_id: msgId, value } as any,
              { onConflict: "user_id,project_id,message_id" }
            );
          }
        } catch { /* ignore */ }
      })();
      toast.success(next[msgId] === "up" ? "Thanks for your feedback" : next[msgId] === "down" ? "We'll do better" : "Feedback removed");
      return next;
    });
  };
  const scrollRef = useRef<HTMLDivElement>(null);

  // Accumulate every step the AI goes through, with how long each took.
  type StepLog = { id: string; text: string; durationS: number };
  const [stepLog, setStepLog] = useState<StepLog[]>([]);
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [stepStart, setStepStart] = useState<number | null>(null);
  const [stepElapsed, setStepElapsed] = useState<number>(0);
  const prevStreamingRef = useRef(false);

  useEffect(() => {
    if (streaming && !prevStreamingRef.current) {
      setStepLog([]);
      setCurrentStep(null);
      setStepStart(null);
      setStepElapsed(0);
    }
    prevStreamingRef.current = streaming;
  }, [streaming]);

  // When the step text changes, archive the previous step and start a new one.
  useEffect(() => {
    if (!step) return;
    if (step === currentStep) return;
    if (currentStep && stepStart) {
      const dur = Math.max(1, Math.round((Date.now() - stepStart) / 1000));
      setStepLog((prev) => [...prev, { id: `${stepStart}-${prev.length}`, text: currentStep, durationS: dur }]);
    }
    setCurrentStep(step);
    setStepStart(Date.now());
    setStepElapsed(0);
  }, [step]);

  // When streaming stops, finalize the in-flight step into the log.
  useEffect(() => {
    if (streaming) return;
    if (currentStep && stepStart) {
      const dur = Math.max(1, Math.round((Date.now() - stepStart) / 1000));
      setStepLog((prev) => [...prev, { id: `${stepStart}-${prev.length}`, text: currentStep, durationS: dur }]);
      setCurrentStep(null);
      setStepStart(null);
      setStepElapsed(0);
    }
  }, [streaming]);

  // Live counter for the in-flight step
  useEffect(() => {
    if (!streaming || !stepStart) return;
    const id = setInterval(() => {
      setStepElapsed(Math.max(1, Math.round((Date.now() - stepStart) / 1000)));
    }, 500);
    return () => clearInterval(id);
  }, [streaming, stepStart]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, step]);

  useEffect(() => {
    if (!projectSheet) return;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("credits")
        .eq("id", user.id)
        .maybeSingle();
      const remaining = Number((data as any)?.credits ?? 0);
      const total = Math.max(remaining, 100);
      setCredits({ used: total - remaining, total });
    })();
  }, [projectSheet]);

  const applyTheme = (t: Theme) => {
    setTheme(t);
    try { localStorage.setItem("theme", t); } catch { /* noop */ }
    const dark = t === "dark" || (t === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", dark);
  };

  const submitRename = async () => {
    const n = newName.trim();
    if (!n || n === projectName) { setRenameOpen(false); return; }
    const { error } = await supabase.from("projects").update({ name: n }).eq("id", projectId);
    if (error) { toast.error(error.message); return; }
    onProjectRenamed?.(n);
    setRenameOpen(false);
    toast.success("Name changed");
  };

  const copy = async (t: string) => {
    try { await navigator.clipboard.writeText(t); toast.success("Copied"); } catch { /* noop */ }
  };

  // Date label from first message
  const firstDate = useMemo(() => {
    const f = messages[0];
    if (!f?.created_at) return null;
    return fmtDate(new Date(f.created_at));
  }, [messages]);

  return (
    <div
      className="relative flex flex-col h-[100dvh] bg-background text-foreground"
      onTouchStart={(e) => { const t = e.touches[0]; (window as any).__chatSwipe = { x: t.clientX, y: t.clientY, t: Date.now() }; }}
      onTouchEnd={(e) => {
        const s = (window as any).__chatSwipe; if (!s) return;
        const t = e.changedTouches[0];
        const dx = t.clientX - s.x, dy = t.clientY - s.y, dt = Date.now() - s.t;
        (window as any).__chatSwipe = null;
        if (dx > 60 && Math.abs(dx) > Math.abs(dy) * 1.5 && dt < 600) navigate(`/build/${projectId}/preview`);
      }}
    >
      {/* Floating glass header */}
      <header className="absolute top-0 inset-x-0 z-30 flex items-center justify-between px-4 pt-3 pb-2 pointer-events-none">
        <button
          onClick={onOpenSidebar}
          className="liquid-chip pointer-events-auto w-11 h-11 grid place-items-center rounded-full"
        >
          <Menu className="w-5 h-5" strokeWidth={2.2} />
        </button>
        <button
          onClick={() => setProjectSheet(true)}
          className="pointer-events-auto flex items-center gap-1.5 px-5 h-11 rounded-full text-[15px] font-semibold max-w-[55%] bg-white/15 dark:bg-white/[0.03] [backdrop-filter:blur(48px)_saturate(220%)] [-webkit-backdrop-filter:blur(48px)_saturate(220%)] ring-1 ring-white/30 dark:ring-white/10 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.3)]"
        >
          <span className="truncate">{projectName}</span>
          <ChevronDown className="w-4 h-4 opacity-70 shrink-0" strokeWidth={2.2} />
        </button>
        <button
          onClick={() => navigate(`/build/${projectId}/preview`)}
          className="pointer-events-auto w-11 h-11 grid place-items-center rounded-full bg-white/15 dark:bg-white/[0.03] [backdrop-filter:blur(48px)_saturate(220%)] [-webkit-backdrop-filter:blur(48px)_saturate(220%)] ring-1 ring-white/30 dark:ring-white/10 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.3)]"
        >
          <Eye className="w-[18px] h-[18px]" strokeWidth={2} />
        </button>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 pt-20 pb-[140px]">
        {firstDate && (
          <div className="text-center text-xs text-muted-foreground py-2">{firstDate}</div>
        )}

        {messages.map((m, i) => {
          const id = m.id ?? `i-${i}`;
          const rawText = typeof m.content === "string" ? m.content : "";
          // Hide raw code from chat: strip fenced blocks and obvious code lines
          const text = rawText
            .replace(/```[\s\S]*?```/g, "")
            .replace(/^[ \t]*(import|export|const|let|var|function|class|return|if|else|for|while|<\/?[A-Za-z])[^\n]*$/gm, "")
            .replace(/\n{3,}/g, "\n\n")
            .trim();

          // Dynamic context: previous user request + first line of assistant reply
          const prevUser = (() => {
            for (let j = i - 1; j >= 0; j--) {
              if (messages[j]?.role === "user") {
                const c = typeof messages[j].content === "string" ? messages[j].content : "";
                return c.trim();
              }
            }
            return "";
          })();
          const shortPrompt = prevUser.replace(/\s+/g, " ").slice(0, 70).trim();
          const firstLine = text.split("\n").map((l) => l.trim()).find((l) => l.length > 0) || "";
          const summary = firstLine.replace(/[#*_>`]+/g, "").slice(0, 80).trim();

          if (m.role === "user") {
            return (
              <div key={id} className="mt-2">
                <div className="flex justify-end">
                  <div className="max-w-[88%] rounded-3xl px-5 py-3 text-[15px] leading-relaxed bg-foreground/[0.05]">
                    {text}
                  </div>
                </div>
                <div className="flex justify-end mt-1.5 pe-1">
                  <button onClick={() => copy(text)} className="w-7 h-7 grid place-items-center text-muted-foreground hover:text-foreground">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          }

          // assistant
          if (m.pending) {
            const activeStep = currentStep || step;
            const hasAnyStep = stepLog.length > 0 || !!activeStep;
            return (
              <div key={id} className="mt-3 space-y-3">
                <div className="rounded-2xl border border-foreground/10 px-4 py-3.5 bg-foreground/[0.025]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 grid place-items-center shrink-0">
                      <MegsyStar size={22} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[15px] font-semibold">I'll start executing now</div>
                      <div className="text-[12px] text-muted-foreground truncate" dir="auto">
                        {shortPrompt || "I'll follow the edits step by step"}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-col gap-2 text-[13px]">
                    {stepLog.map((s) => (
                      <div key={s.id} className="flex items-center gap-2 rounded-xl bg-foreground/[0.035] px-3 py-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="text-foreground/85 truncate" dir="auto">{stepTitle(s.text)}</div>
                          <div className="text-[11px] text-muted-foreground truncate" dir="auto">{cleanStepText(s.text)}</div>
                        </div>
                        <span className="text-muted-foreground/70 tabular-nums shrink-0">{s.durationS}s</span>
                      </div>
                    ))}
                    {activeStep && (
                      <div className="flex items-center gap-2 rounded-xl bg-primary/[0.06] px-3 py-2">
                        <ActivityIcon step={activeStep} />
                        <div className="min-w-0 flex-1">
                          <div className="text-foreground ai-shimmer truncate" dir="auto">{stepTitle(activeStep)}</div>
                          <div className="text-[11px] text-muted-foreground truncate" dir="auto">{cleanStepText(activeStep)}</div>
                        </div>
                        <span className="text-muted-foreground/70 tabular-nums shrink-0">{stepElapsed}s</span>
                      </div>
                    )}
                    {!hasAnyStep && (
                      <div className="text-muted-foreground ai-shimmer px-1">Preparing the execution plan…</div>
                    )}
                  </div>
                </div>
                {text && <ChatMarkdown>{text}</ChatMarkdown>}
              </div>
            );
          }

          return (
            <div key={id} className="mt-4">
              {m.thoughtFor && (
                <div className="text-[15px] text-muted-foreground mb-3">Thought for {m.thoughtFor}</div>
              )}
              {/* Activity card removed per user request — answer text + change chips speak for themselves. */}

              <ChatMarkdown>{text}</ChatMarkdown>
              {m.raw && <MobileChangedFilesPill rawContent={m.raw} />}
              <div className="flex items-center gap-3 mt-3 -ms-1 text-muted-foreground">
                <button
                  onClick={() => setMsgFeedback(id, "up")}
                  className={`w-7 h-7 grid place-items-center transition ${feedback[id] === "up" ? "text-foreground" : "hover:text-foreground"}`}
                  aria-pressed={feedback[id] === "up"}
                  aria-label="Good response"
                >
                  <ThumbsUp className="w-4 h-4" {...(feedback[id] === "up" ? { fill: "currentColor" } : {})} />
                </button>
                <button
                  onClick={() => setMsgFeedback(id, "down")}
                  className={`w-7 h-7 grid place-items-center transition ${feedback[id] === "down" ? "text-foreground" : "hover:text-foreground"}`}
                  aria-pressed={feedback[id] === "down"}
                  aria-label="Bad response"
                >
                  <ThumbsDown className="w-4 h-4" {...(feedback[id] === "down" ? { fill: "currentColor" } : {})} />
                </button>
                <button onClick={() => copy(text)} aria-label="Copy" className="w-7 h-7 grid place-items-center hover:text-foreground"><Copy className="w-4 h-4" /></button>
                <button onClick={() => setMoreMsgId(moreMsgId === id ? null : id)} aria-label="More" aria-expanded={moreMsgId === id} className="w-7 h-7 grid place-items-center hover:text-foreground">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
              {moreMsgId === id && (
                <div
                  className="mt-3 rounded-2xl backdrop-blur-2xl backdrop-saturate-150 border border-foreground/10 overflow-hidden shadow-[0_8px_24px_-12px_rgba(0,0,0,0.18)] dark:shadow-[0_8px_24px_-12px_rgba(0,0,0,0.6)]"
                  style={{
                    animation: "msgmore-rise 320ms cubic-bezier(0.32,0.72,0,1) both",
                    backgroundColor: "color-mix(in oklab, hsl(var(--background)) 55%, transparent)",
                  }}
                >
                  <style>{`
                    @keyframes msgmore-rise {
                      from { opacity: 0; transform: translateY(-4px) scale(0.985); }
                      to   { opacity: 1; transform: translateY(0) scale(1); }
                    }
                  `}</style>
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-[14px] text-muted-foreground">Credits used</span>
                    <span className="text-[14px] font-semibold tabular-nums">{m.credits_used ?? "—"}</span>
                  </div>
                  <div className="h-px bg-foreground/[0.06] mx-4" />
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-[14px] text-muted-foreground">Work time</span>
                    <span className="text-[14px] font-semibold tabular-nums">
                      {m.duration_ms ? `${Math.round(m.duration_ms / 1000)}s` : "—"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}

      </div>

      {/* Floating glass input bar — content scrolls behind it */}
      <div className="absolute inset-x-0 bottom-0 z-30 pointer-events-none">
        <div className="px-3 pb-4 pt-1 animate-fade-in relative">
          <div
            className="liquid-glass-pro pointer-events-auto rounded-[28px] px-3 pt-3 pb-2.5 relative z-10"
          >
            {/* specular highlight + chromatic edge */}
            <span aria-hidden className="liquid-glass-pro__shine" />
            <span aria-hidden className="liquid-glass-pro__edge" />
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={1}
              placeholder="Queue follow-up…"
              className="w-full resize-none bg-transparent px-2 text-[15px] outline-none max-h-32 placeholder:text-muted-foreground"
            />
            <div className="flex items-center justify-between mt-1.5 relative">
              <div className="flex items-center gap-2">
                <button onClick={() => setPlusSheet(true)} className="liquid-chip w-9 h-9 grid place-items-center rounded-full transition">
                  <Plus className="w-4 h-4" strokeWidth={2.4} />
                </button>
                <button onClick={() => setMoreSheet(true)} className="liquid-chip w-9 h-9 grid place-items-center rounded-full transition">
                  <MoreHorizontal className="w-4 h-4" strokeWidth={2.4} />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={streaming ? onStop : onSend}
                  disabled={!streaming && !input.trim()}
                  className="w-9 h-9 grid place-items-center rounded-full bg-foreground text-background disabled:opacity-30 shadow-[0_6px_18px_-6px_rgba(0,0,0,0.4)]"
                >
                  {streaming ? <Square className="w-3 h-3 fill-current" /> : <ArrowUp className="w-4 h-4" strokeWidth={2.4} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Project bottom sheet */}
      {projectSheet && (
        <Sheet onClose={() => setProjectSheet(false)}>
          <button
            onClick={() => { setProjectSheet(false); navigate("/settings/billing"); }}
            className="w-full text-start rounded-2xl bg-foreground/[0.04] hover:bg-foreground/[0.06] transition px-4 py-3.5 mb-2"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold">Credits</span>
              <span className="text-sm text-muted-foreground">
                {credits ? `${(credits.total - credits.used).toFixed(1)} remaining` : "…"}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-foreground/10 overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: credits ? `${Math.max(2, ((credits.total - credits.used) / credits.total) * 100)}%` : "2%" }}
              />
            </div>
            
          </button>
          <SheetRow icon={<SlidersHorizontal className="w-5 h-5" />} label="Settings" onClick={() => { setProjectSheet(false); navigate(`/build/${projectId}/settings`); }} />
          {!renameOpen ? (
            <SheetRow icon={<Pencil className="w-5 h-5" />} label="Rename project" onClick={() => { setNewName(projectName); setRenameOpen(true); }} />
          ) : (
            <div className="px-2 py-2">
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { submitRename(); setProjectSheet(false); } if (e.key === "Escape") setRenameOpen(false); }}
                  placeholder="Project name"
                  className="flex-1 h-11 rounded-xl bg-foreground/[0.05] px-3.5 text-[15px] outline-none"
                />
                <button onClick={() => setRenameOpen(false)} className="h-11 px-3 rounded-xl text-sm text-muted-foreground hover:bg-foreground/5">Cancel</button>
                <button onClick={() => { submitRename(); setProjectSheet(false); }} className="h-11 px-4 rounded-xl bg-foreground text-background text-sm font-semibold">Save</button>
              </div>
            </div>
          )}
          {!appearanceOpen ? (
            <SheetRow
              icon={<HalfCircle />}
              label="Appearance"
              right={<span className="text-muted-foreground flex items-center gap-1 text-sm">{theme === "system" ? "System" : theme === "dark" ? "Dark" : "Light"} <ChevronRight className="w-4 h-4" /></span>}
              onClick={() => setAppearanceOpen(true)}
            />
          ) : (
            <div className="px-2 py-2">
              <div className="flex items-center justify-between mb-2 px-2">
                <span className="text-[15px] font-medium">Appearance</span>
                <button onClick={() => setAppearanceOpen(false)} className="text-sm text-muted-foreground hover:text-foreground px-2 h-8 rounded-lg">Done</button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(["light", "dark", "system"] as Theme[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => applyTheme(t)}
                    className={`h-11 rounded-xl text-sm font-medium transition ${theme === t ? "bg-foreground text-background" : "bg-foreground/[0.05] hover:bg-foreground/[0.08]"}`}
                  >
                    {t === "light" ? "Light" : t === "dark" ? "Dark" : "System"}
                  </button>
                ))}
              </div>
            </div>
          )}
        </Sheet>
      )}

      {/* Plus bottom sheet (camera/attach + suggestions) */}
      {plusSheet && (
        <Sheet onClose={() => setPlusSheet(false)}>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => { setPlusSheet(false); toast("Camera — coming soon"); }}
              className="liquid-glass-pro relative h-28 rounded-2xl transition flex flex-col items-center justify-center gap-2"
            >
              <span aria-hidden className="liquid-glass-pro__shine" />
              <span aria-hidden className="liquid-glass-pro__edge" />
              <Camera className="w-6 h-6" strokeWidth={1.8} />
              <span className="text-[15px] font-medium">Camera</span>
            </button>
            <button
              onClick={() => { setPlusSheet(false); toast("Attach — coming soon"); }}
              className="liquid-glass-pro relative h-28 rounded-2xl transition flex flex-col items-center justify-center gap-2"
            >
              <span aria-hidden className="liquid-glass-pro__shine" />
              <span aria-hidden className="liquid-glass-pro__edge" />
              <Paperclip className="w-6 h-6" strokeWidth={1.8} />
              <span className="text-[15px] font-medium">Attach</span>
            </button>
          </div>
        </Sheet>
      )}

      {/* More bottom sheet */}
      {moreSheet && (
        <Sheet onClose={() => setMoreSheet(false)}>
          {[
              { id: "settings", label: "Settings", icon: <SlidersHorizontal className="w-5 h-5" />, go: () => navigate(`/build/${projectId}/settings`) },
              { id: "connectors", label: "Connectors", icon: <Plug className="w-5 h-5" />, go: () => setConnectorsOpen(true) },
              { id: "analytics", label: "Analytics", icon: <Gauge className="w-5 h-5" />, go: () => navigate(`/build/${projectId}/analytics`) },
              { id: "cloud", label: "Cloud", icon: <CloudCog className="w-5 h-5" />, go: () => navigate(`/build/${projectId}/cloud`) },
              { id: "code", label: "Code", icon: <Braces className="w-5 h-5" />, go: () => navigate(`/build/${projectId}/code`) },
              { id: "security", label: "Security", icon: <ShieldCheck className="w-5 h-5" />, go: () => navigate(`/build/${projectId}/security`) },
              { id: "speed", label: "Speed", icon: <Rocket className="w-5 h-5" />, go: () => navigate(`/build/${projectId}/speed`) },
              { id: "versions", label: "Versions", icon: <GitBranch className="w-5 h-5" />, go: () => navigate(`/build/${projectId}/versions`) },
            ].map((it: any) => (
              <SheetRow
                key={it.id}
                icon={it.icon}
                label={it.label}
                onClick={() => {
                  setMoreSheet(false);
                  if (it.go) it.go();
                  else onAction?.(it.id);
                }}
              />
            ))}
        </Sheet>
      )}

      {connectorsOpen && <ConnectorsSheet onClose={() => setConnectorsOpen(false)} />}

      {publishOpen && (
        <div className="absolute inset-0 z-[95] bg-background animate-in fade-in duration-150 overflow-hidden">
          <MegsyPrPublishPage onClose={() => setPublishOpen(false)} />
        </div>
      )}


    </div>
  );
}

function Sheet({ children, onClose, pad = true }: { children: React.ReactNode; onClose: () => void; pad?: boolean }) {
  const [drag, setDrag] = useState(0);
  const startY = useRef<number | null>(null);
  const dragging = useRef(false);

  // Lock body scroll without shifting page content
  useEffect(() => {
    const body = document.body;
    const prevOverflow = body.style.overflow;
    const prevPaddingRight = body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = "hidden";
    if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`;
    return () => {
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPaddingRight;
    };
  }, []);

  const onTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
    dragging.current = true;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!dragging.current || startY.current == null) return;
    const dy = e.touches[0].clientY - startY.current;
    // rubber-band when pulling up (negative dy), free when pulling down
    const eased = dy < 0 ? -Math.pow(-dy, 0.7) : dy;
    setDrag(eased);
  };
  const onTouchEnd = () => {
    dragging.current = false;
    if (drag > 120) {
      onClose();
      return;
    }
    setDrag(0);
  };

  return (
    <>
      <div
        className="fixed inset-0 z-[90]"
        onClick={onClose}
        onTouchMove={(e) => e.preventDefault()}
      />
      <div
        className={`fixed inset-x-0 bottom-0 z-[91] max-h-[58dvh] overflow-y-auto overscroll-contain rounded-t-[28px] border-t border-border bg-background pb-8 pt-2.5 shadow-[0_-18px_44px_-18px_hsl(var(--foreground)/0.28)] animate-in slide-in-from-bottom duration-200 ${pad ? "px-4" : ""}`}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
        style={{
          transform: `translateY(${drag}px)`,
          transition: dragging.current ? "none" : "transform 360ms cubic-bezier(0.22, 1.4, 0.36, 1)",
          touchAction: "pan-y",
        }}
      >
        <span aria-hidden className="absolute inset-0 rounded-t-[28px] bg-background pointer-events-none" />
        <div className="w-9 h-1 rounded-full bg-foreground/25 mx-auto mb-3" />
        <div className="relative z-10">{children}</div>
      </div>
    </>
  );
}

function SheetRow({ icon, label, right, onClick }: { icon: React.ReactNode; label: string; right?: React.ReactNode; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3.5 px-3 py-3 rounded-2xl text-[15px] hover:bg-foreground/5 transition">
      <span className="opacity-80">{icon}</span>
      <span className="flex-1 text-start font-medium">{label}</span>
      {right}
    </button>
  );
}

// Step taxonomy. Backend can prefix step text with `tool:<name>` and the UI
// will render the correct icon + title automatically.
type StepKind =
  | "think" | "search" | "edit" | "write" | "fix" | "done"
  | "fs_read" | "fs_write" | "fs_list" | "fs_search" | "fs_delete"
  | "web" | "github" | "shell";

function stepKind(s: string): StepKind {
  const raw = s.trim();
  const m = /^tool:([a-z_]+)/i.exec(raw);
  if (m) {
    const n = m[1].toLowerCase();
    if (n === "fs_read" || n === "read_file") return "fs_read";
    if (n === "fs_write" || n === "write_file" || n === "fs_rename") return "fs_write";
    if (n === "fs_list" || n === "list_dir") return "fs_list";
    if (n === "fs_search" || n === "grep") return "fs_search";
    if (n === "fs_delete" || n === "delete_file") return "fs_delete";
    if (n.startsWith("web_") || n === "firecrawl" || n === "scrape" || n === "search_web") return "web";
    if (n.startsWith("gh_") || n === "github") return "github";
    if (n.startsWith("sandbox_") || n === "shell" || n === "run") return "shell";
  }
  const t = raw.toLowerCase();
  if (/done|finish|complete/.test(t)) return "done";
  if (/fix|repair|debug/.test(t)) return "fix";
  if (/read|view|open file/.test(t)) return "fs_read";
  if (/write|create file|generat/.test(t)) return "fs_write";
  if (/list dir|browse files/.test(t)) return "fs_list";
  if (/grep|search files|search code/.test(t)) return "fs_search";
  if (/delete|remove file/.test(t)) return "fs_delete";
  if (/web|fetch url|scrape|crawl/.test(t)) return "web";
  if (/github|pull request|commit|issue/.test(t)) return "github";
  if (/shell|terminal|run command|exec/.test(t)) return "shell";
  if (/search|find|explor/.test(t)) return "search";
  if (/edit|update|modify|patch/.test(t)) return "edit";
  return "think";
}

const STEP_META: Record<StepKind, { title: string; subtitle: string }> = {
  think:     { title: "Thinking",       subtitle: "Reasoning about the task" },
  search:    { title: "Searching",      subtitle: "Exploring context" },
  edit:      { title: "Editing files",  subtitle: "Applying changes" },
  write:     { title: "Generating",     subtitle: "Writing content" },
  fix:       { title: "Fixing",         subtitle: "Diagnosing and patching" },
  done:      { title: "Done",           subtitle: "Completed successfully" },
  fs_read:   { title: "Reading file",   subtitle: "Loading file contents" },
  fs_write:  { title: "Writing file",   subtitle: "Saving changes" },
  fs_list:   { title: "Listing files",  subtitle: "Scanning project tree" },
  fs_search: { title: "Searching code", subtitle: "Grepping project files" },
  fs_delete: { title: "Deleting file",  subtitle: "Removing from project" },
  web:       { title: "Web",            subtitle: "Fetching from the web" },
  github:    { title: "GitHub",         subtitle: "Calling GitHub API" },
  shell:     { title: "Running",        subtitle: "Executing in sandbox" },
};

function stepTitle(s: string) { return STEP_META[stepKind(s)].title; }
function stepSubtitle(s: string) { return STEP_META[stepKind(s)].subtitle; }
function cleanStepText(s: string) {
  return s
    .replace(/^tool:([a-z_]+)\s*/i, "")
    .replace(/^file:(create|add|update|write|delete)\s*/i, "")
    .replace(/^preview:(check|ready|deploy)\s*/i, "")
    .trim() || stepSubtitle(s);
}

const STEP_ICON: Record<StepKind, typeof Sparkles> = {
  think: Sparkles, search: Search, edit: FileEdit, write: FilePlus, fix: Wrench, done: CheckCircle2,
  fs_read: FileText, fs_write: FileEdit, fs_list: FolderTree, fs_search: FileSearch, fs_delete: Trash2,
  web: Globe, github: Github, shell: Terminal,
};

function ActivityIcon({ step }: { step: string }) {
  const Icon = STEP_ICON[stepKind(step)] ?? Sparkles;
  return (
    <div className="w-9 h-9 rounded-xl bg-foreground/[0.06] grid place-items-center shrink-0">
      <Icon className="w-4.5 h-4.5" />
    </div>
  );
}

function MobileChangedFilesPill({ rawContent }: { rawContent: string }) {
  const changed = useMemo(() => parseBuildAgentChanges(rawContent), [rawContent]);
  if (!changed.length) return null;

  return (
    <div className="flex flex-wrap gap-1.5 mt-3">
      {changed.map((f, index) => (
        <div
          key={`${f.action}:${f.path}:${f.to ?? ""}:${index}`}
          className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg bg-foreground/[0.05]"
        >
          <FileDiff className="w-3 h-3" />
          <span className="font-mono">{f.path}</span>
          {f.to && <span className="font-mono text-muted-foreground">→ {f.to}</span>}
          <span className="text-[10px] text-muted-foreground">{changeActionLabel(f.action)}</span>
        </div>
      ))}
    </div>
  );
}

// referenced by future tool integrations (keeps icon import live)
void FolderOpen;

function HalfCircle() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="8.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10 1.5 A8.5 8.5 0 0 1 10 18.5 Z" fill="currentColor" />
    </svg>
  );
}
