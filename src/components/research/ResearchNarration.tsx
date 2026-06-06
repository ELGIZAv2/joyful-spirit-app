import { useState } from "react";
import { detectLang, langDir } from "@/lib/detectLang";

interface Props {
  items: string[];
  active: boolean;
}

/* ────────────────────────────────────────────────────────────────
   Custom hand-crafted SVG icon set — designed specifically for the
   research narration. Each glyph is a single-stroke geometric mark
   built from primitives (no external icon library).
   ──────────────────────────────────────────────────────────────── */
type IconKind =
  | "search" | "orbit" | "think" | "read" | "source"
  | "write"  | "design" | "done"  | "spark" | "loader"
  | "caretDown" | "caretUp";

function CustomIcon({ kind, className = "" }: { kind: IconKind; className?: string }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    className,
  };
  switch (kind) {
    case "search": // lens with two ripple arcs (discovery)
      return (
        <svg {...common}>
          <circle cx="10.5" cy="10.5" r="4.2" />
          <path d="M14 14l4 4" />
          <path d="M3.5 10.5a7 7 0 0 1 1.6-4.2" opacity="0.55" />
          <path d="M5.2 14.4a7 7 0 0 1-1.7-3.9" opacity="0.35" />
        </svg>
      );
    case "orbit": // planet with elliptical orbit (web)
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3.4" />
          <ellipse cx="12" cy="12" rx="9" ry="3.4" transform="rotate(-28 12 12)" />
          <circle cx="19.4" cy="8.4" r="0.9" fill="currentColor" stroke="none" />
        </svg>
      );
    case "think": // interlocked loops (reasoning)
      return (
        <svg {...common}>
          <path d="M8.5 7.5c-2.5 0-3.8 2-3.8 4 0 2.4 1.6 3.6 3 3.8.4 1.4 1.6 2.4 3.3 2.4 2 0 3.4-1.4 3.4-3.4" />
          <path d="M15.5 16.5c2.5 0 3.8-2 3.8-4 0-2.4-1.6-3.6-3-3.8-.4-1.4-1.6-2.4-3.3-2.4-2 0-3.4 1.4-3.4 3.4" />
        </svg>
      );
    case "read": // 3 stacked lines tapering — content extraction
      return (
        <svg {...common}>
          <path d="M5 7.5h14" />
          <path d="M5 12h11" opacity="0.75" />
          <path d="M5 16.5h7" opacity="0.45" />
        </svg>
      );
    case "source": // diamond with two trailing dots — citation node
      return (
        <svg {...common}>
          <path d="M12 4.5l5 5-5 5-5-5z" />
          <circle cx="17" cy="17" r="1.1" fill="currentColor" stroke="none" />
          <circle cx="20" cy="20" r="0.7" fill="currentColor" stroke="none" opacity="0.6" />
        </svg>
      );
    case "write": // pen nib triangle with ink dot
      return (
        <svg {...common}>
          <path d="M12 4l4.5 11-4.5-2-4.5 2z" />
          <path d="M12 12.5v3.5" />
          <circle cx="12" cy="19" r="0.9" fill="currentColor" stroke="none" />
        </svg>
      );
    case "design": // layered cards
      return (
        <svg {...common}>
          <rect x="6" y="6" width="11" height="11" rx="2" opacity="0.45" />
          <rect x="8.5" y="8.5" width="11" height="11" rx="2" />
        </svg>
      );
    case "done": // soft check inside subtle ring
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.5" opacity="0.4" />
          <path d="M8 12.4l2.8 2.6L16.4 9" />
        </svg>
      );
    case "spark": // 4-point asterisk star (default — generative)
      return (
        <svg {...common}>
          <path d="M12 4v6.5" />
          <path d="M12 13.5V20" />
          <path d="M4 12h6.5" />
          <path d="M13.5 12H20" />
          <path d="M12 12l4-4" opacity="0.45" />
          <path d="M12 12l-4 4" opacity="0.45" />
        </svg>
      );
    case "loader": // 3 dots arc — animated via wrapper
      return (
        <svg {...common} className={`${className} animate-spin`}>
          <circle cx="12" cy="4.5" r="1.1" fill="currentColor" stroke="none" />
          <circle cx="18.5" cy="9.5" r="1.1" fill="currentColor" stroke="none" opacity="0.6" />
          <circle cx="16" cy="17.5" r="1.1" fill="currentColor" stroke="none" opacity="0.3" />
        </svg>
      );
    case "caretDown":
      return (
        <svg {...common}><path d="M6 9.5l6 5 6-5" /></svg>
      );
    case "caretUp":
      return (
        <svg {...common}><path d="M6 14.5l6-5 6 5" /></svg>
      );
  }
}

/** Pick a custom icon kind based on the narration text (AR + EN). */
function pickIconKind(text: string): IconKind {
  const t = (text || "").toLowerCase();
  if (/Search|Search|Searching|looking|search|google|googling|looking|query/i.test(t)) return "search";
  if (/Open|Site|Link|Page|open|visit|browsing|website|url|page/i.test(t)) return "orbit";
  if (/Think|Thinking|Analysis|Analyzing|think|analy[sz]|reason/i.test(t)) return "think";
  if (/read|Reading|Read|Content|read|reading|content|extract/i.test(t)) return "read";
  if (/Source|Reference|source|reference|cite|citation/i.test(t)) return "source";
  if (/Book|Writing|Write|Report|Output|Output|writ|draft|generat|compos/i.test(t)) return "write";
  if (/File|Design|Design|file|design|format|layout|export|render/i.test(t)) return "design";
  if (/Done|Done|Finish|finished|done|complete|ready/i.test(t)) return "done";
  return "spark";
}

const ResearchNarration = ({ items, active }: Props) => {
  const [expanded, setExpanded] = useState(false);
  const visible = (items || []).filter((t) => (t || "").trim().length > 0 || active);
  if (visible.length === 0 && !active) return null;

  if (visible.length === 0 && active) {
    return (
      <div className="flex items-center gap-2 py-2 text-primary">
        <CustomIcon kind="loader" className="w-3.5 h-3.5" />
        <span className="inline-flex gap-1">
          <span className="w-1 h-1 rounded-full bg-current animate-pulse" />
          <span className="w-1 h-1 rounded-full bg-current animate-pulse [animation-delay:120ms]" />
          <span className="w-1 h-1 rounded-full bg-current animate-pulse [animation-delay:240ms]" />
        </span>
      </div>
    );
  }

  const dir = langDir(detectLang(items.join(" ")));
  const lastIdx = items.length - 1;

  const activeItem = items[lastIdx] || "";
  const pastItems = items.slice(0, lastIdx).filter((t) => (t || "").trim().length > 0);

  const showAll = expanded || pastItems.length <= 3;
  const hiddenCount = pastItems.length - 3;
  const displayedPast = showAll ? pastItems : pastItems.slice(-3);

  return (
    <div dir={dir} className="mb-3 max-w-md w-full animate-fade-in">
      <div className="relative flex flex-col gap-4">
        {/* Active status step */}
        <div className="flex flex-col gap-1 p-5 rounded-2xl bg-foreground/5 border border-border/40 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
              Deep Researching
            </span>
            {active && (
              <span className="inline-flex gap-1 ms-1">
                <span className="w-1 h-1 rounded-full bg-primary animate-pulse" />
                <span className="w-1 h-1 rounded-full bg-primary animate-pulse [animation-delay:120ms]" />
                <span className="w-1 h-1 rounded-full bg-primary animate-pulse [animation-delay:240ms]" />
              </span>
            )}
          </div>
          <p className="text-sm leading-relaxed text-foreground/90 mt-1 break-words">
            {activeItem}
            {active && (
              <span className="inline-block w-[2px] h-[14px] bg-primary/70 align-middle ms-0.5 animate-pulse" />
            )}
          </p>
        </div>

        {/* Past steps — narrative flow */}
        {displayedPast.length > 0 && (
          <div className="flex flex-col gap-3 px-5 border-s border-border/60 ms-6">
            {displayedPast.map((t, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-foreground shrink-0" />
                <span className="text-xs text-foreground break-words">{t}</span>
              </div>
            ))}
            {hiddenCount > 0 && !showAll && (
              <button
                onClick={() => setExpanded(true)}
                className="self-start flex items-center gap-1.5 text-[10px] font-medium text-primary hover:text-primary/80 transition-colors"
              >
                <CustomIcon kind="caretDown" className="w-3 h-3" />
                <span>Show {hiddenCount} more</span>
              </button>
            )}
            {expanded && hiddenCount > 0 && (
              <button
                onClick={() => setExpanded(false)}
                className="self-start flex items-center gap-1.5 text-[10px] font-medium text-primary hover:text-primary/80 transition-colors"
              >
                <CustomIcon kind="caretUp" className="w-3 h-3" />
                <span>Show less</span>
              </button>
            )}
          </div>
        )}

        {/* Progress shimmer */}
        {active && (
          <div className="mx-5 h-1 bg-foreground/5 rounded-full overflow-hidden">
            <div className="h-full bg-primary/40 w-2/3 rounded-full relative overflow-hidden">
              <div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                style={{ backgroundSize: "200% 100%", animation: "shimmer 2.5s infinite linear" }}
              />
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};


export default ResearchNarration;
