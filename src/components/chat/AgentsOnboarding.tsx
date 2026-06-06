import React from "react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CornerDownLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const PHASE_CHIPS = "chips";
const PHASE_HINT = "hint";
const PHASE_DONE = "done";

type Phase = typeof PHASE_CHIPS | typeof PHASE_HINT | typeof PHASE_DONE;

const iconCls = "w-3.5 h-3.5";
const svgProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.4,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const SERVICES: { id: string; label: string; icon: React.JSX.Element }[] = [
  {
    id: "slides",
    label: "Slides",
    icon: (
      <svg {...svgProps} className={iconCls}>
        <rect x="3.5" y="4.5" width="17" height="12" rx="1.5" />
        <path d="M8 20h8M12 16.5V20" />
      </svg>
    ),
  },
  {
    id: "learning",
    label: "Learning",
    icon: (
      <svg {...svgProps} className={iconCls}>
        <path d="M3 8.5L12 4l9 4.5-9 4.5-9-4.5z" />
        <path d="M7 11v4.2c0 1.4 2.2 2.6 5 2.6s5-1.2 5-2.6V11" />
      </svg>
    ),
  },
  {
    id: "docs",
    label: "Docs",
    icon: (
      <svg {...svgProps} className={iconCls}>
        <path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
        <path d="M14 3v5h5M9 13h6M9 17h6" />
      </svg>
    ),
  },
  {
    id: "research",
    label: "Deep Research",
    icon: (
      <svg {...svgProps} className={iconCls}>
        <circle cx="10.5" cy="10.5" r="5.5" />
        <path d="M19.5 19.5l-4.5-4.5" />
      </svg>
    ),
  },
];

interface AgentsOnboardingProps {
  alwaysShow?: boolean;
  activeAgentId?: string | null;
  onAgentToggle?: (id: string) => void;
}

const AgentsOnboarding = ({ alwaysShow = false, activeAgentId = null, onAgentToggle }: AgentsOnboardingProps) => {
  const [phase, setPhase] = useState<Phase>(PHASE_DONE);

  useEffect(() => {
    if (alwaysShow) return;
    // Per-session gate — show only once per browser session, not on every chat open.
    try {
      if (sessionStorage.getItem("megsy_agents_onboarding_shown") === "1") return;
    } catch { /* ignore */ }
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setPhase(PHASE_CHIPS); return; }
        const { data } = await supabase
          .from("profiles")
          .select("agents_onboarding_seen")
          .eq("id", user.id)
          .maybeSingle();
        if (!(data as any)?.agents_onboarding_seen) setPhase(PHASE_CHIPS);
      } catch { setPhase(PHASE_CHIPS); }
    })();
  }, [alwaysShow]);

  useEffect(() => {
    if (phase === PHASE_HINT) {
      const t = setTimeout(() => finish(), 4500);
      return () => clearTimeout(t);
    }
  }, [phase]);

  const finish = () => {
    try { sessionStorage.setItem("megsy_agents_onboarding_shown", "1"); } catch { /* ignore */ }
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) await supabase.from("profiles").update({ agents_onboarding_seen: true } as any).eq("id", user.id);
      } catch { /* ignore */ }
    })();
    setPhase(PHASE_DONE);
  };

  if (alwaysShow) {
    return (
      <div className="mb-2 px-1 flex items-center gap-1.5 flex-wrap">
        {SERVICES.map((s) => {
          const active = activeAgentId === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onAgentToggle?.(s.id)}
              className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-full border text-[12px] font-medium shrink-0 transition-colors ${
                active
                  ? "border-primary/60 bg-primary/10 text-primary"
                  : "border-border/50 bg-transparent text-foreground/80 hover:bg-foreground/5"
              }`}
            >
              {s.icon}
              <span>{s.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  if (phase === PHASE_DONE) return null;

  return (
    <AnimatePresence>
      {phase === PHASE_CHIPS && null}


      {phase === PHASE_HINT && (
        <motion.div
          key="hint"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          onClick={finish}
          className="absolute left-2 bottom-[calc(100%+8px)] z-20 cursor-pointer pointer-events-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl bg-foreground text-background text-[12px] font-medium max-w-[260px]">
            <span>You'll find these services when tapping +</span>
            <CornerDownLeft className="w-3.5 h-3.5 rotate-180 shrink-0" strokeWidth={2} />
          </div>
          <div className="absolute -bottom-1 left-4 w-2 h-2 rotate-45 bg-foreground" />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AgentsOnboarding;
