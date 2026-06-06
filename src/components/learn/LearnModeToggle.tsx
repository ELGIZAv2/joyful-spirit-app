import { GraduationCap } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  active: boolean;
  onToggle: () => void;
}

const LearnModeToggle = ({ active, onToggle }: Props) => {
  return (
    <motion.button
      type="button"
      onClick={onToggle}
      whileTap={{ scale: 0.96 }}
      className={`liquid-glass-pro relative overflow-hidden inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
        active ? "text-emerald-300" : "text-foreground/85 hover:text-foreground"
      }`}
      aria-pressed={active}
      title="Learn Mode"
    >
      <span aria-hidden className="liquid-glass-pro__shine" />
      <span aria-hidden className="liquid-glass-pro__edge" />
      <GraduationCap className="relative w-3.5 h-3.5" />
      <span className="relative">Learn</span>
    </motion.button>
  );
};

export default LearnModeToggle;
