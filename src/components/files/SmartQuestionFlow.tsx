import { forwardRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface SmartQuestion {
  title: string;
  options: string[];
  allowText?: boolean;
}

interface Props {
  questions: SmartQuestion[];
  onComplete: (answer: string) => void;
  answered?: boolean;
  finalAnswer?: string;
  /** Optional helper line shown under the title. */
  subtitle?: string;
}

const spring = { type: "spring" as const, damping: 24, stiffness: 320 };

/**
 * Ultra-minimal clean smart-questions card. Single accent (foreground),
 * thin border, tabular numbered options. Fully theme-tokenised; mirrors
 * RTL automatically through the surrounding chat container.
 */
const SmartQuestionFlow = forwardRef<HTMLDivElement, Props>(
  ({ questions, onComplete, answered, finalAnswer, subtitle }, ref) => {
    const [index, setIndex] = useState(0);
    const [answers, setAnswers] = useState<{ q: string; a: string }[]>([]);
    const [text, setText] = useState("");

    if (answered) {
      const collapsed = finalAnswer || answers.map(a => `${a.q}: ${a.a}`).join("  ·  ");
      return (
        <div ref={ref} className="rounded-xl border border-border/60 bg-card px-4 py-3 text-sm text-muted-foreground max-w-md">
          {collapsed || "Answered"}
        </div>
      );
    }

    if (!questions || questions.length === 0) return null;
    const q = questions[index];
    if (!q) return null;

    const finish = (extra: { q: string; a: string }[]) => {
      const all = [...answers, ...extra];
      onComplete(all.map(p => `${p.q}\n${p.a}`).join("\n\n"));
    };

    const choose = (option: string) => {
      const next = { q: q.title, a: option };
      if (index < questions.length - 1) {
        setAnswers([...answers, next]);
        setIndex(index + 1);
      } else {
        finish([next]);
      }
    };

    const submitText = () => {
      const v = text.trim();
      if (!v) return;
      setText("");
      choose(v);
    };

    const skip = () => onComplete("");

    const progress = ((index + 1) / questions.length) * 100;

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring}
        className="w-full max-w-md overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
      >
        {/* Progress bar */}
        <div className="h-1 w-full bg-muted/40">
          <motion.div
            className="h-full bg-foreground"
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>

        <div className="p-6 flex flex-col gap-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={spring}
              className="flex flex-col gap-6"
            >
              {/* Title + subtitle */}
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-foreground leading-snug">
                  {q.title}
                </h3>
                {subtitle && (
                  <p className="text-sm text-muted-foreground">{subtitle}</p>
                )}
              </div>

              {/* Option buttons */}
              <div className="flex flex-col gap-2">
                {q.options.map((opt, i) => (
                  <motion.button
                    key={i}
                    whileTap={{ scale: 0.99 }}
                    transition={spring}
                    onClick={() => choose(opt)}
                    className="group flex items-center w-full px-4 py-3.5 bg-muted/30 hover:bg-muted/60 border border-border hover:border-border/80 rounded-lg text-foreground/90 hover:text-foreground transition-all text-start"
                  >
                    <span className="flex-none w-6 text-muted-foreground group-hover:text-foreground/80 font-medium tabular-nums text-sm">
                      {i + 1}.
                    </span>
                    <span className="text-sm font-medium">{opt}</span>
                  </motion.button>
                ))}
              </div>

              {/* Free-text answer */}
              {q.allowText !== false && (
                <div className="flex items-center gap-2">
                  <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submitText(); } }}
                    placeholder="…"
                    className="flex-1 bg-background border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-foreground/40 transition-colors"
                  />
                  {text.trim() && (
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      transition={spring}
                      onClick={submitText}
                      className="bg-foreground hover:bg-foreground/90 text-background font-semibold text-sm px-5 py-3 rounded-lg transition-colors"
                    >
                      Send
                    </motion.button>
                  )}
                </div>
              )}

              {/* Skip */}
              <div className="text-center">
                <button
                  onClick={skip}
                  className="text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
                >
                  Skip — assume the best
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    );
  }
);

SmartQuestionFlow.displayName = "SmartQuestionFlow";

export default SmartQuestionFlow;
