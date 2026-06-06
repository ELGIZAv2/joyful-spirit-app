import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowUp } from "lucide-react";
import MegsyStar from "@/components/files/MegsyStar";
import { goBackOr } from "@/lib/navigation";

const SUGGESTIONS = [
  "A YC pitch coach",
  "A TikTok hooks copywriter",
  "A senior code reviewer",
  "A no-nonsense legal advisor",
  "A growth-loop strategist",
  "A 5th grade math tutor",
];

export default function SkillsNewPage() {
  const navigate = useNavigate();
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 180) + "px";
  }, [value]);

  useEffect(() => {
    setTimeout(() => ref.current?.focus(), 80);
  }, []);

  const start = (text: string) => {
    const t = text.trim();
    if (!t) return;
    navigate("/settings/skills", { state: { seed: t } });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 bg-background/85 backdrop-blur-xl border-b border-border/30">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => goBackOr(navigate, "/settings/skills")}
            className="p-2 -ml-2 rounded-xl hover:bg-accent/60 transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-[15px] font-semibold tracking-tight flex-1">New Skill</h1>
        </div>
      </header>

      <section className="max-w-2xl w-full mx-auto px-5 sm:px-6 pt-16 sm:pt-24 text-center">
        <div className="flex justify-center mb-4">
          <MegsyStar size={32} static />
        </div>
        <h2 className="font-extrabold tracking-tight leading-[1.05] text-3xl sm:text-4xl">
          <span className="text-foreground">Describe an expert,</span>{" "}
          <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
            we&apos;ll build the skill.
          </span>
        </h2>
        <p className="mt-3 text-muted-foreground text-sm">
          Tell us the role, tone, and tools — your AI Skill Designer drafts it in seconds.
        </p>

        <div className="mt-7">
          <div className="relative rounded-3xl border border-border/60 bg-card shadow-[0_8px_30px_-12px_rgba(0,0,0,0.18)] focus-within:border-foreground/30 transition-colors">
            <textarea
              ref={ref}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && (typeof window === 'undefined' || window.innerWidth >= 768)) {
                  e.preventDefault();
                  start(value);
                }
              }}
              rows={1}
              placeholder="Describe the expert you want…"
              className="w-full resize-none bg-transparent outline-none text-[15px] leading-relaxed px-5 pt-4 pb-14 placeholder:text-muted-foreground/70"
            />
            <button
              onClick={() => start(value)}
              disabled={!value.trim()}
              aria-label="Design skill"
              className="absolute right-3 bottom-3 h-9 w-9 rounded-full bg-foreground text-background flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105 active:scale-95 transition-transform"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 justify-center">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => start(s)}
              className="text-[12.5px] px-3 py-1.5 rounded-full border border-border/50 bg-card text-muted-foreground hover:text-foreground hover:border-border transition-all"
            >
              {s}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
