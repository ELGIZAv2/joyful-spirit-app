import { motion } from "framer-motion";
import type { AgentModel } from "@/lib/agentRegistry";

interface ModelPickerDropdownProps {
  models: AgentModel[];
  query: string;
  onSelect: (model: AgentModel) => void;
  onClose: () => void;
}

const ModelPickerDropdown = ({ models, query, onSelect, onClose }: ModelPickerDropdownProps) => {
  const filtered = query
    ? models.filter(m => m.label.toLowerCase().includes(query.toLowerCase()) || m.id.toLowerCase().includes(query.toLowerCase()))
    : models;

  if (filtered.length === 0) return null;

  return (
    <>
      <div className="fixed inset-0 z-[44]" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        className="absolute bottom-full mb-2 left-0 z-[46] w-64 rounded-2xl border border-border/30 bg-black/80 backdrop-blur-2xl p-2 shadow-[0_24px_80px_rgba(0,0,0,0.4)] max-h-[240px] overflow-y-auto"
      >
        <p className="text-[10px] text-muted-foreground/60 uppercase px-3 py-1.5 select-none">Models</p>
        {filtered.map(model => (
          <button
            key={model.id}
            onClick={() => onSelect(model)}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left hover:bg-white/5 transition-colors"
          >
            <span className="text-sm text-foreground">{model.label}</span>
            <span className="text-[11px] text-muted-foreground bg-muted/30 px-2 py-0.5 rounded-full">{model.cost} MC</span>
          </button>
        ))}
      </motion.div>
    </>
  );
};

export default ModelPickerDropdown;
