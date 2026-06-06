import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, CheckCircle2 } from "lucide-react";
import MegsyStar from "@/components/files/MegsyStar";

export type ResearchTask = {
  id: string;
  kind: "search" | "read" | "analyze" | "wiki" | "academic" | "social" | "synthesize" | string;
  label: string;
  target?: string;
  status: "running" | "done" | "error";
  summary?: string;
};

interface Props {
  tasks: ResearchTask[];
  isActive: boolean;
}

const ResearchTaskTimeline = ({ tasks, isActive }: Props) => {
  const [open, setOpen] = useState(true);

  const stats = useMemo(() => {
    const sources = new Set<string>();
    tasks.forEach((t) => { if (t.target) sources.add(t.target); });
    return { sources: sources.size, total: tasks.length };
  }, [tasks]);

  if (tasks.length === 0 && !isActive) return null;

  // Show only the current/last task to keep the UI clean
  const current = tasks[tasks.length - 1];
  const lastRunning = [...tasks].reverse().find((t) => t.status === "running");

  const headline = isActive
    ? (lastRunning?.label || current?.label || "Researching…")
    : `Researched ${stats.sources} source${stats.sources === 1 ? "" : "s"}`;

  return (
    <div className="mb-3 rounded-2xl border border-border/40 bg-background/40 backdrop-blur-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-accent/30 transition-colors"
      >
        {isActive ? (
          <MegsyStar size={16} />
        ) : (
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        )}
        <span className="text-sm font-medium text-foreground/90 flex-1 text-left truncate">{headline}</span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence initial={false}>
        {open && current && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3">
              <AnimatePresence mode="wait">
                <motion.div
                  key={current.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.18 }}
                  className="text-xs text-foreground/80 leading-relaxed break-words"
                >
                  {current.label}
                  {current.target && (
                    <span className="ml-1.5 text-muted-foreground">
                      — {current.target.length > 60 ? current.target.slice(0, 60) + "…" : current.target}
                    </span>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ResearchTaskTimeline;
