import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Pause, Play, X, Timer as TimerIcon } from "lucide-react";

interface Props {
  id: string;
  totalSec: number;
  startedAt: number;
  paused: boolean;
  pausedRemaining: number | null;
  onPauseToggle: (id: string) => void;
  onCancel: (id: string) => void;
}

const fmt = (s: number) => {
  const m = Math.max(0, Math.floor(s / 60));
  const ss = Math.max(0, Math.floor(s % 60));
  return `${m.toString().padStart(2, "0")}:${ss.toString().padStart(2, "0")}`;
};

const InChatTimerCard = ({ id, totalSec, startedAt, paused, pausedRemaining, onPauseToggle, onCancel }: Props) => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [paused]);

  const remaining = paused
    ? pausedRemaining ?? totalSec
    : Math.max(0, totalSec - Math.floor((now - startedAt) / 1000));
  const done = remaining === 0;
  const pct = totalSec > 0 ? ((totalSec - remaining) / totalSec) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.96 }}
      className="mx-auto w-fit max-w-[92%] rounded-full liquid-glass-milk px-3 py-1.5 border border-emerald-500/25 shadow-[0_8px_24px_-10px_rgba(5,150,105,0.4)] backdrop-blur-xl"
    >
      <div className="flex items-center gap-2.5">
        <div className="relative w-7 h-7 shrink-0">
          <svg viewBox="0 0 36 36" className="w-7 h-7 -rotate-90">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="3" className="text-emerald-500/15" />
            <circle
              cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="3"
              strokeDasharray={`${pct}, 100`}
              strokeLinecap="round"
              className="text-emerald-500 transition-all"
            />
          </svg>
          <TimerIcon className="absolute inset-0 m-auto w-3 h-3 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="flex flex-col min-w-0 leading-none">
          <span className="text-[9px] uppercase tracking-wide text-emerald-700/80 dark:text-emerald-400/80 font-semibold">
            {done ? "Complete" : paused ? "Paused" : "Focus"}
          </span>
          <span className="text-sm font-bold text-foreground tabular-nums">
            {done ? "🎉" : fmt(remaining)}
          </span>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          {!done && (
            <button
              onClick={() => onPauseToggle(id)}
              className="w-6 h-6 flex items-center justify-center rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 transition-colors"
              aria-label={paused ? "Resume" : "Pause"}
            >
              {paused ? <Play className="w-3 h-3" fill="currentColor" /> : <Pause className="w-3 h-3" fill="currentColor" />}
            </button>
          )}
          <button
            onClick={() => onCancel(id)}
            className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-accent/40 text-foreground/70"
            aria-label="Dismiss timer"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default InChatTimerCard;
