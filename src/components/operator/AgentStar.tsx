import { memo } from "react";
import { motion } from "framer-motion";

export type AgentKey = "ceo" | "coo" | "cto" | "executor" | "assistant" | "system";

export const AGENT_COLORS: Record<AgentKey, { label: string; color: string; bg: string }> = {
  ceo:       { label: "CEO",       color: "#f59e0b", bg: "rgba(245,158,11,0.10)" }, // amber
  coo:       { label: "COO",       color: "#a855f7", bg: "rgba(168,85,247,0.10)" }, // purple
  cto:       { label: "CTO",       color: "#0ea5e9", bg: "rgba(14,165,233,0.10)" }, // sky
  executor:  { label: "Executor",  color: "#10b981", bg: "rgba(16,185,129,0.10)" }, // emerald
  assistant: { label: "Megsy",     color: "#f59e0b", bg: "rgba(245,158,11,0.10)" },
  system:    { label: "System",    color: "#94a3b8", bg: "rgba(148,163,184,0.10)" },
};

type Props = {
  agent: AgentKey;
  size?: number;
  active?: boolean; // true = animated full opacity, false = static faded
};

const AgentStar = ({ agent, size = 16, active = false }: Props) => {
  const c = AGENT_COLORS[agent] ?? AGENT_COLORS.system;
  const path = "M50 5 L60 40 L95 50 L60 60 L50 95 L40 60 L5 50 L40 40 Z";
  if (!active) {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" style={{ color: c.color, opacity: 0.35 }} className="shrink-0">
        <path d={path} fill="currentColor" />
      </svg>
    );
  }
  return (
    <motion.svg
      width={size} height={size} viewBox="0 0 100 100"
      style={{ color: c.color }} className="shrink-0"
      animate={{ rotate: [0, 180, 360], scale: [1, 1.15, 1] }}
      transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
    >
      <path d={path} fill="currentColor" />
    </motion.svg>
  );
};

export default memo(AgentStar);
