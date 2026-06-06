import { Globe } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  active: boolean;
  onToggle: () => void;
}

const DeepResearchToggle = ({ active, onToggle }: Props) => {
  return (
    <motion.button
      type="button"
      onClick={onToggle}
      whileTap={{ scale: 0.96 }}
      className={`relative overflow-hidden inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium backdrop-blur-xl bg-white/5 border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] transition-colors ${
        active ? "text-violet-300" : "text-foreground/85 hover:text-foreground"
      }`}
      aria-pressed={active}
      title="Deep Research"
    >
      <span aria-hidden className="liquid-glass-pro__shine" />
      <span aria-hidden className="liquid-glass-pro__edge" />
      <Globe className="relative w-3.5 h-3.5" />
      <span className="relative">Deep Research</span>
    </motion.button>
  );
};

export default DeepResearchToggle;
