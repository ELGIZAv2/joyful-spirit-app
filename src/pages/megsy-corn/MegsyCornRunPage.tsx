import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Sparkles, Send, Check, RefreshCw, Loader2, CheckCircle2,
  Brain, Globe, Image as ImageIcon, Megaphone, FileText, ShieldCheck, Rocket,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type AgentRow = {
  id: string; run_id: string; agent_key: string; name: string; role: string;
  status: "pending" | "running" | "done" | "failed";
  progress: number; current_task: string | null; result: any;
};
type RunRow = {
  id: string; goal: string; status: string; plan: any;
};

const ICON_MAP: Record<string, any> = {
  ceo: Brain, web: Globe, designer: ImageIcon, marketer: Megaphone,
  researcher: FileText, qa: ShieldCheck, publisher: Rocket,
};

export default function MegsyCornRunPage() {
  const navigate = useNavigate();
  const [goal, setGoal] = useState("");
  const [phase, setPhase] = useState<"idle" | "planning" | "plan" | "running" | "done">("idle");
  const [run, setRun] = useState<RunRow | null>(null);
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [refining, setRefining] = useState(false);
  const [refineText, setRefineText] = useState("");
  const channelRef = useRef<any>(null);

  // Subscribe to realtime updates when we have a run
  useEffect(() => {
    if (!run?.id) return;
    const ch = supabase
      .channel(`corn-run-${run.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "corn_agents", filter: `run_id=eq.${run.id}` }, (payload) => {
        setAgents((prev) => {
          const next = [...prev];
          if (payload.eventType === "INSERT") next.push(payload.new as AgentRow);
          else if (payload.eventType === "UPDATE") {
            const i = next.findIndex((a) => a.id === (payload.new as any).id);
            if (i >= 0) next[i] = payload.new as AgentRow; else next.push(payload.new as AgentRow);
          }
          return next;
        });
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "corn_runs", filter: `id=eq.${run.id}` }, (payload) => {
        const newRun = payload.new as RunRow;
        setRun(newRun);
        if (newRun.status === "completed") setPhase("done");
      })
      .subscribe();
    channelRef.current = ch;
    return () => { supabase.removeChannel(ch); };
  }, [run?.id]);

  const startPlanning = async (g: string) => {
    if (g.trim().length < 3) return;
    setPhase("planning");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/corn-plan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ goal: g, runId: run?.id }),
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error || "Planning failed");
      setRun(json.run);
      setPhase("plan");
      setRefining(false);
      setRefineText("");
    } catch (e: any) {
      toast.error(e.message || "Planning error occurred");
      setPhase("idle");
    }
  };

  const approve = async () => {
    if (!run?.id) return;
    setPhase("running");
    setAgents([]);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/corn-execute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ runId: run.id }),
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error || "Failed to start");
    } catch (e: any) {
      toast.error(e.message || "Run error occurred");
      setPhase("plan");
    }
  };

  const plan = run?.plan ?? {};
  const deliverables: string[] = Array.isArray(plan?.deliverables) ? plan.deliverables : [];
  const planAgents: any[] = Array.isArray(plan?.agents) ? plan.agents : [];
  const nextSteps: string[] = Array.isArray(plan?.next_steps) ? plan.next_steps : [];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <div className="sticky top-0 z-20 backdrop-blur-xl bg-background/70 border-b border-border/60">
        <div className="max-w-4xl mx-auto h-14 px-4 flex items-center justify-between">
          <button onClick={() => navigate("/megsy-corn")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-muted-foreground">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" /> MEGSY · CORN
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Goal echo */}
        {run && (
          <div className="rounded-2xl border border-border/70 bg-foreground/[0.02] p-4">
            <div className="text-xs text-muted-foreground mb-1">Your goal</div>
            <div className="text-[15px] font-medium leading-relaxed">{run.goal}</div>
          </div>
        )}

        {/* Phase: idle / input */}
        {phase === "idle" && (
          <div className="space-y-4">
            <h1 className="font-display text-2xl font-bold">What task do you want Megsy Corn to run?</h1>
            <p className="text-sm text-muted-foreground">Describe your idea in any detail. The CEO Agent will prepare a full plan in seconds.</p>
            <div className="relative">
              <textarea
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="e.g.: I want to build a girls' clothing brand with a casual identity, I need a website, images, and a marketing plan…"
                rows={5}
                className="w-full rounded-2xl border border-border/70 bg-background p-4 text-[15px] leading-relaxed resize-none focus:outline-none focus:border-amber-500/60 transition-colors"
              />
              <button
                onClick={() => startPlanning(goal)}
                disabled={goal.trim().length < 3}
                className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2 text-sm font-semibold text-slate-50 transition-all"
              >
                Start <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Phase: planning */}
        {phase === "planning" && (
          <div className="rounded-2xl border border-border/70 bg-foreground/[0.02] p-6 flex items-center gap-4">
            <div className="relative w-10 h-10">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }} className="absolute inset-0 grid place-items-center">
                <Sparkles className="w-6 h-6 text-amber-500" />
              </motion.div>
            </div>
            <div>
              <div className="font-semibold text-[15px]">CEO Agent is thinking…</div>
              <div className="text-xs text-muted-foreground mt-0.5">Analyzes the goal and generates the plan and agents.</div>
            </div>
          </div>
        )}

        {/* Phase: plan card */}
        {phase === "plan" && run && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-border/70 bg-foreground/[0.02] p-6 space-y-5">
            <div>
              <div className="text-xs font-semibold tracking-wider text-amber-600 mb-1">Suggested plan</div>
              <div className="text-[16px] font-semibold leading-relaxed">{plan?.summary || run.goal}</div>
              {plan?.timeline && <div className="text-xs text-muted-foreground mt-2">⏱ {plan.timeline}</div>}
            </div>

            {deliverables.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-muted-foreground mb-2">Outputs</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {deliverables.map((d, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                      <span>{d}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {planAgents.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-muted-foreground mb-2">Agents</div>
                <div className="flex flex-wrap gap-2">
                  {planAgents.map((a, i) => {
                    const Icon = ICON_MAP[a.key] || Brain;
                    return (
                      <div key={i} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/70 bg-foreground/[0.03] text-xs">
                        <Icon className="w-3.5 h-3.5 text-amber-500" /> {a.name}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {nextSteps.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-muted-foreground mb-2">First steps</div>
                <ol className="space-y-1.5 text-sm text-foreground/90">
                  {nextSteps.map((s, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-amber-600 font-mono text-xs mt-0.5">{String(i + 1).padStart(2, "0")}</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Refine textarea */}
            {refining && (
              <textarea
                value={refineText}
                onChange={(e) => setRefineText(e.target.value)}
                placeholder="Edit or add any details…"
                rows={3}
                className="w-full rounded-xl border border-border/70 bg-background p-3 text-sm resize-none focus:outline-none focus:border-amber-500/60"
              />
            )}

            <div className="flex flex-wrap gap-2 pt-2">
              <button onClick={approve} className="inline-flex items-center gap-2 rounded-full bg-amber-600 hover:bg-amber-500 px-5 py-2.5 text-sm font-semibold text-slate-50 transition-all">
                <Check className="w-4 h-4" /> OK, Run Agents
              </button>
              {!refining ? (
                <button onClick={() => setRefining(true)} className="inline-flex items-center gap-2 rounded-full border border-border/80 px-5 py-2.5 text-sm font-semibold hover:bg-foreground/[0.05]">
                  <RefreshCw className="w-4 h-4" /> Edit Plan
                </button>
              ) : (
                <button
                  onClick={() => startPlanning(`${run.goal}\n\nEdits: ${refineText}`)}
                  disabled={refineText.trim().length < 3}
                  className="inline-flex items-center gap-2 rounded-full border border-border/80 px-5 py-2.5 text-sm font-semibold hover:bg-foreground/[0.05] disabled:opacity-40"
                >
                  <RefreshCw className="w-4 h-4" /> Prepare a new plan
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* Phase: running / done — execution board */}
        {(phase === "running" || phase === "done") && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-bold">
                {phase === "done" ? "Task completed ✓" : "Agents are working…"}
              </h2>
              {phase === "done" && (
                <button onClick={() => { setRun(null); setAgents([]); setGoal(""); setPhase("idle"); }} className="text-xs font-semibold text-amber-600 hover:underline">
                  New task
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <AnimatePresence>
                {agents.map((a) => {
                  const Icon = ICON_MAP[a.agent_key] || Brain;
                  const isRunning = a.status === "running";
                  const isDone = a.status === "done";
                  return (
                    <motion.div
                      key={a.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`rounded-2xl border p-4 transition-colors ${
                        isDone ? "border-emerald-500/40 bg-emerald-500/5" :
                        isRunning ? "border-amber-500/40 bg-amber-500/5" :
                        "border-border/70 bg-foreground/[0.02]"
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`relative w-9 h-9 rounded-xl grid place-items-center ${isDone ? "bg-emerald-500/15 text-emerald-600" : "bg-amber-500/15 text-amber-600"}`}>
                          {isRunning ? (
                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}>
                              <Sparkles className="w-4 h-4" />
                            </motion.div>
                          ) : isDone ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm truncate">{a.name}</div>
                          <div className="text-[11px] text-muted-foreground truncate">{a.role}</div>
                        </div>
                        <div className="text-[11px] font-mono text-muted-foreground">{a.progress}%</div>
                      </div>
                      <div className="h-1 rounded-full bg-foreground/10 overflow-hidden mb-2">
                        <motion.div
                          className={isDone ? "h-full bg-emerald-500" : "h-full bg-amber-500"}
                          animate={{ width: `${a.progress}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                      <div className="text-xs text-foreground/75 leading-relaxed min-h-[2.5em]">
                        {a.current_task || (a.status === "pending" ? "Waiting…" : "—")}
                      </div>
                      {a.result?.url && (
                        <a href={a.result.url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-amber-600 hover:underline">
                          {a.result.title || "Open"} →
                        </a>
                      )}
                      {a.result?.title && !a.result?.url && (
                        <div className="mt-2 text-xs text-foreground/70">📎 {a.result.title}</div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              {agents.length === 0 && phase === "running" && (
                <div className="col-span-full rounded-2xl border border-dashed border-border/70 p-8 text-center text-sm text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                  Loading Create Agents…
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
