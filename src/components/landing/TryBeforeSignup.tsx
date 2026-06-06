import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MessageSquare, Presentation, FileText, ArrowRight, Sparkles } from "lucide-react";

type Intent = "chat" | "slides" | "docs";

const INTENTS: { id: Intent; label: string; icon: typeof MessageSquare; placeholder: string }[] = [
  { id: "chat", label: "Chat", icon: MessageSquare, placeholder: "Ask anything... e.g.: summarize the latest AI news for me" },
  { id: "slides", label: "Slides", icon: Presentation, placeholder: "Design a 10-slide presentation about the future of education" },
  { id: "docs", label: "Document", icon: FileText, placeholder: "Write a detailed business plan for a delivery app" },
];

export default function TryBeforeSignup() {
  const navigate = useNavigate();
  const [intent, setIntent] = useState<Intent>("chat");
  const [prompt, setPrompt] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleStart = () => {
    const trimmed = prompt.trim();
    if (!trimmed) {
      inputRef.current?.focus();
      return;
    }
    try {
      sessionStorage.setItem(
        "megsy_pending_first_prompt",
        JSON.stringify({ intent, prompt: trimmed, ts: Date.now() }),
      );
    } catch { /* noop */ }
    const next = encodeURIComponent("/chat");
    navigate(`/auth?next=${next}&mode=signup`);
  };

  const active = INTENTS.find((i) => i.id === intent)!;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.5 }}
      className="mx-auto mt-6 w-full max-w-2xl px-3 md:mt-8"
    >
      <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-md shadow-2xl shadow-black/20 overflow-hidden">
        {/* Intent chips */}
        <div className="flex items-center gap-1 px-2 pt-2">
          {INTENTS.map((it) => {
            const Icon = it.icon;
            const isActive = intent === it.id;
            return (
              <button
                key={it.id}
                onClick={() => setIntent(it.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {it.label}
              </button>
            );
          })}
          <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <Sparkles className="w-2.5 h-2.5" />
            Free
          </span>
        </div>

        {/* Composer */}
        <textarea
          ref={inputRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleStart();
          }}
          placeholder={active.placeholder}
          rows={2}
          className="w-full px-4 py-3 bg-transparent border-none outline-none focus:ring-0 resize-none text-sm text-foreground placeholder:text-muted-foreground/60 text-left"
        />

        <div className="flex items-center justify-between px-3 py-2 border-t border-border/40 bg-muted/20">
          <span className="text-[10px] text-muted-foreground hidden md:inline">
            ⌘/Ctrl + Enter to send
          </span>
          <button
            onClick={handleStart}
            className="ms-auto inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 active:scale-[0.98] transition"
          >
            Start now
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <p className="mt-2 text-center text-[11px] text-muted-foreground">
        No credit card • One-second signup after you see the result
      </p>
    </motion.div>
  );
}
