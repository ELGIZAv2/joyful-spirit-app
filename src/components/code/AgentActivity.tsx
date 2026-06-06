// @ts-nocheck — imported design from external repo; backend wiring deferred.
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Search, FileText, FolderTree, Check } from "lucide-react";

export interface ActivityStep {
  step: string;
  detail?: string;
}

interface Props {
  steps: ActivityStep[];
  isActive?: boolean;
}

const iconFor = (label: string) => {
  if (label.includes("list_repo")) return FolderTree;
  if (label.includes("read_file")) return FileText;
  if (label.includes("search")) return Search;
  if (label.includes("response ready")) return Check;
  return Sparkles;
};

export default function AgentActivity({ steps, isActive }: Props) {
  if (!steps.length) return null;
  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-4 space-y-2">
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-white/60 mb-2">
        <Sparkles className="w-3.5 h-3.5" />
        Agent Activity
      </div>
      <AnimatePresence initial={false}>
        {steps.map((s, i) => {
          const Icon = iconFor(s.step);
          const last = i === steps.length - 1;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 text-sm text-white/80"
            >
              <span
                className={`shrink-0 w-7 h-7 rounded-full grid place-items-center ${
                  last && isActive ? "bg-primary/20 animate-pulse" : "bg-white/5"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
              </span>
              <span className="flex-1 truncate">
                {s.step}
                {s.detail ? <span className="opacity-50 ml-2 text-xs">{s.detail.slice(0, 80)}</span> : null}
              </span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
