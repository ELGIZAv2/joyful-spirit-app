import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, Cog, FileEdit, Loader2, Sparkles, XCircle } from "lucide-react";

type AgentEvent = {
  id: number;
  run_id: string;
  agent_name: string;
  event_type: string;
  payload: any;
  created_at: string;
};

const AGENT_LABEL: Record<string, { label: string; color: string }> = {
  orchestrator: { label: "Lead Engineer", color: "text-amber-300" },
  architect: { label: "Architect", color: "text-sky-300" },
  ui: { label: "UI Designer", color: "text-pink-300" },
  backend: { label: "Backend", color: "text-emerald-300" },
  frontend: { label: "Frontend", color: "text-violet-300" },
  devops: { label: "DevOps", color: "text-orange-300" },
  qa: { label: "QA", color: "text-cyan-300" },
};

export function AgentLiveTimeline({ runId }: { runId: string | null }) {
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!runId) { setEvents([]); return; }
    let mounted = true;

    // initial fetch (covers events that arrived before subscription)
    supabase
      .from("code_agent_events")
      .select("*")
      .eq("run_id", runId)
      .order("id", { ascending: true })
      .then(({ data }) => { if (mounted && data) setEvents(data as AgentEvent[]); });

    const channel = supabase
      .channel(`agent-events-${runId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "code_agent_events", filter: `run_id=eq.${runId}` },
        (payload) => {
          setEvents((prev) => {
            const next = payload.new as AgentEvent;
            if (prev.some((e) => e.id === next.id)) return prev;
            return [...prev, next];
          });
        }
      )
      .subscribe();

    return () => { mounted = false; supabase.removeChannel(channel); };
  }, [runId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [events.length]);

  if (!runId || events.length === 0) return null;

  const isFinished = events.some((e) => e.event_type === "run_finished" || e.event_type === "run_error");

  return (
    <div className="border border-white/10 rounded-xl bg-black/40 overflow-hidden">
      <div className="px-3 py-2 border-b border-white/10 flex items-center gap-2 text-xs text-white/70">
        {isFinished ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-300" />}
        <span className="font-mono">Multi-agent squad · {events.length} events</span>
      </div>
      <div ref={scrollRef} className="max-h-64 overflow-y-auto px-3 py-2 space-y-1.5 text-[11px]">
        {events.map((e) => {
          const agent = AGENT_LABEL[e.agent_name] || { label: e.agent_name, color: "text-white/70" };
          return (
            <div key={e.id} className="flex items-start gap-2 leading-snug">
              <EventIcon type={e.event_type} />
              <div className="flex-1 min-w-0">
                <span className={`font-semibold ${agent.color}`}>{agent.label}</span>
                <span className="text-white/40"> · </span>
                <span className="text-white/80">{describe(e)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EventIcon({ type }: { type: string }) {
  if (type === "tool_call" || type === "tool_result") return <FileEdit className="w-3 h-3 text-white/40 mt-0.5 shrink-0" />;
  if (type === "agent_started" || type === "delegate") return <Cog className="w-3 h-3 text-white/40 mt-0.5 shrink-0" />;
  if (type === "agent_finished" || type === "run_finished") return <CheckCircle2 className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0" />;
  if (type === "agent_error" || type === "run_error") return <XCircle className="w-3 h-3 text-red-400 mt-0.5 shrink-0" />;
  return <Sparkles className="w-3 h-3 text-white/40 mt-0.5 shrink-0" />;
}

function describe(e: AgentEvent): string {
  const p = e.payload || {};
  switch (e.event_type) {
    case "run_started": return "Starting squad…";
    case "delegate": return `→ delegating to ${p.specialist}`;
    case "agent_started": return `started (${p.model})`;
    case "thinking": return p.text || "thinking…";
    case "tool_call": return `${p.tool}${p.path ? ` · ${p.path}` : ""}`;
    case "tool_result": return `${p.tool} ${p.ok === false ? "failed" : "ok"}${p.bytes ? ` (${p.bytes}b)` : ""}`;
    case "agent_finished": return "done";
    case "agent_error": return `error: ${p.error}`;
    case "run_finished": return "✔ build complete";
    case "run_error": return `error: ${p.error}`;
    default: return e.event_type;
  }
}
