import { motion, AnimatePresence } from "framer-motion";
import { AGENTS, type AgentDef } from "@/lib/agentRegistry";
import { useMemo } from "react";

interface MentionDropdownProps {
  query: string; // text after "@"
  onSelect: (agent: AgentDef) => void;
  onClose: () => void;
  visible: boolean;
  /** Which categories to show. Defaults to all. */
  categories?: string[];
}

const MentionDropdown = ({ query, onSelect, onClose, visible, categories }: MentionDropdownProps) => {
  const filtered = useMemo(() => {
    let list = AGENTS;
    if (categories?.length) list = list.filter(a => categories.includes(a.category));
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(a => a.label.toLowerCase().includes(q) || a.mention.slice(1).toLowerCase().includes(q));
    }
    return list;
  }, [query, categories]);

  if (!visible || filtered.length === 0) return null;

  return (
    <>
      <div className="fixed inset-0 z-[44]" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        className="absolute bottom-full mb-2 left-0 z-[46] w-72 rounded-2xl border border-border/30 bg-black/80 backdrop-blur-2xl p-2 max-h-[280px] overflow-y-auto"
      >
        <p className="text-[10px] text-muted-foreground/60 uppercase px-3 py-1.5 select-none">Agents</p>
        {filtered.map(agent => {
          const Icon = agent.icon;
          return (
            <button
              key={agent.id}
              onClick={() => onSelect(agent)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-white/5 transition-colors group"
            >
              <div className={`w-8 h-8 rounded-lg ${agent.bg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-4 h-4 ${agent.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{agent.label}</span>
                  <span className={`text-[11px] font-mono ${agent.color}`}>{agent.mention}</span>
                </div>
                <p className="text-[11px] text-muted-foreground truncate">{agent.description}</p>
              </div>
            </button>
          );
        })}
      </motion.div>
    </>
  );
};

export default MentionDropdown;
