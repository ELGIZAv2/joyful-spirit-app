// @ts-nocheck — imported design from external repo; backend wiring deferred.
import { motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";

export type StepType = "thinking" | "reading" | "writing" | "editing" | "creating" | "searching" | "saving" | "done" | "pre_message" | "post_message" | "error";

export interface CodeStep {
  id: string;
  type: StepType;
  text: string;
  file?: string;
  status: "active" | "done" | "error";
}

const STEP_COLORS: Record<string, string> = {
  thinking: "hsl(var(--primary))",
  reading: "#fbbf24",
  writing: "#34d399",
  editing: "#34d399",
  creating: "#60a5fa",
  searching: "#60a5fa",
  saving: "#a78bfa",
  done: "hsl(var(--primary))",
  error: "#ef4444",
  pre_message: "hsl(var(--primary))",
  post_message: "hsl(var(--primary))",
};

const AnimatedStar = ({ color }: { color: string }) => (
  <motion.svg
    width="16"
    height="16"
    viewBox="0 0 100 100"
    className="shrink-0"
    style={{ color }}
    animate={{
      rotate: [0, 180, 360],
      scale: [1, 1.15, 1],
    }}
    transition={{
      duration: 2.4,
      repeat: Infinity,
      ease: "easeInOut",
    }}
  >
    <path d="M50 5 L60 40 L95 50 L60 60 L50 95 L40 60 L5 50 L40 40 Z" fill="currentColor" />
  </motion.svg>
);

const TypingDots = () => (
  <span className="inline-flex gap-0.5 ml-1">
    {[0, 1, 2].map(i => (
      <motion.span
        key={i}
        className="w-1 h-1 rounded-full bg-muted-foreground/60"
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
      />
    ))}
  </span>
);

interface Props {
  step: CodeStep;
  isActive: boolean;
}

const CodeStepMessage = ({ step, isActive }: Props) => {
  const color = STEP_COLORS[step.type] || "hsl(var(--primary))";
  const isMessage = step.type === "pre_message" || step.type === "post_message";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex items-start gap-2.5 py-1.5 ${isMessage ? "px-0" : ""}`}
    >
      {/* Star or check icon */}
      <div className="shrink-0 mt-0.5">
        {step.status === "done" ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center"
          >
            <Check className="w-2.5 h-2.5 text-primary" />
          </motion.div>
        ) : step.status === "error" ? (
          <div className="w-4 h-4 rounded-full bg-destructive/10 flex items-center justify-center">
            <span className="text-[10px] text-destructive">!</span>
          </div>
        ) : isActive ? (
          <AnimatedStar color={color} />
        ) : (
          <Loader2 className="w-4 h-4 text-muted-foreground/30 animate-spin" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {isMessage ? (
          <p className="text-sm text-foreground leading-relaxed" dir="auto">{step.text}</p>
        ) : (
          <span className={`text-xs font-mono ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
            {step.text}
            {step.file && <span className="text-muted-foreground/70 ml-1">{step.file}</span>}
          </span>
        )}
      </div>
    </motion.div>
  );
};

export default CodeStepMessage;
