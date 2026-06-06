import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, FileText, Image as ImageIcon, Sparkles, Search } from "lucide-react";

export type ActivityKind = "plan" | "search" | "read" | "image" | "write";

export interface ActivityEvent {
  id: string;
  kind: ActivityKind;
  text: string;
  url?: string;
  ts: number;
}

interface Props {
  isActive: boolean;
  startedAt: number | null;
  plan: string[];
  searches: string[];
  sources: { url: string; title?: string }[];
  images: string[];
  wordCount: number;
  targetWords?: number;
  isRtl?: boolean;
}

const Star = ({ active }: { active: boolean }) => (
  <motion.svg
    width="14" height="14" viewBox="0 0 100 100"
    className={active ? "text-primary" : "text-primary/40"}
    animate={active ? { rotate: [0, 180, 360], scale: [1, 1.15, 1] } : {}}
    transition={active ? { duration: 2.4, repeat: Infinity, ease: "easeInOut" } : {}}
  >
    <path d="M50 5 L60 40 L95 50 L60 60 L50 95 L40 60 L5 50 L40 40 Z" fill="currentColor" />
  </motion.svg>
);

const hostname = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return u; } };
const fmt = (ms: number) => {
  const s = Math.floor(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};

const LiveResearchActivity = ({
  isActive, startedAt, plan, searches, sources, images, wordCount, targetWords = 2200, isRtl,
}: Props) => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!isActive || !startedAt) return;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [isActive, startedAt]);

  const elapsed = startedAt ? now - startedAt : 0;
  const writing = wordCount > 0;
  const progress = Math.min(100, Math.round((wordCount / targetWords) * 100));

  const t = (en: string, ar: string) => (isRtl ? ar : en);

  return (
    <div className="rounded-3xl border border-foreground/10 bg-background/40 backdrop-blur-xl p-4 space-y-4">
      {/* Header: status + timer */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Star active={isActive} />
          <span className="text-sm font-bold text-foreground">
            {writing ? t("Writing the report", "Writing the report")
              : sources.length ? t("Reading sources", "Reading sources")
              : searches.length ? t("Searching the web", "Web search")
              : plan.length ? t("Planning research", "Research planning")
              : t("Starting…", "Starting…")}
          </span>
        </div>
        {startedAt && (
          <span className="font-mono text-[11px] tabular-nums text-muted-foreground">{fmt(elapsed)}</span>
        )}
      </div>

      {/* Plan chips */}
      {plan.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
            <Sparkles className="h-3 w-3" /> {t("Plan", "Plan")}
          </div>
          <div className="flex flex-wrap gap-1.5">
            <AnimatePresence>
              {plan.map((q, i) => (
                <motion.span
                  key={q + i}
                  initial={{ opacity: 0, y: 6, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-[11px] text-foreground/85"
                >
                  {q}
                </motion.span>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Searches */}
      {searches.length > 0 && (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
            <Search className="h-3 w-3" /> {t("Search queries", "Search queries")} · {searches.length}
          </div>
          <div className="space-y-1">
            <AnimatePresence initial={false}>
              {searches.slice(-6).map((q, i) => (
                <motion.div
                  key={q + i}
                  initial={{ opacity: 0, x: isRtl ? 10 : -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2 text-xs text-foreground/80"
                >
                  <span className="text-primary/60">›</span>
                  <span className="truncate">{q}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Sources with favicons */}
      {sources.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
            <Globe className="h-3 w-3" /> {t("Sources", "Sources")} · {sources.length}
          </div>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            <AnimatePresence initial={false}>
              {sources.slice(-9).map((s, i) => (
                <motion.a
                  key={s.url + i}
                  href={s.url} target="_blank" rel="noopener noreferrer"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-1.5 rounded-full border border-foreground/10 bg-foreground/[0.03] px-2 py-1 text-[11px] text-foreground/80 hover:bg-foreground/10 transition"
                >
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${hostname(s.url)}&sz=64`}
                    alt="" className="h-3.5 w-3.5 rounded-sm shrink-0" loading="lazy"
                  />
                  <span className="truncate">{hostname(s.url)}</span>
                </motion.a>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Image strip */}
      {images.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
            <ImageIcon className="h-3 w-3" /> {t("Images", "Images")} · {images.length}
          </div>
          <div className="-mx-1 overflow-x-auto px-1 pb-1 scrollbar-thin">
            <div className="flex gap-1.5">
              {images.slice(0, 14).map((img, i) => (
                <motion.div
                  key={img + i}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-foreground/10 bg-foreground/5"
                >
                  <img src={img} alt="" className="h-full w-full object-cover" loading="lazy" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Writing progress */}
      {writing && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1.5 uppercase tracking-wider">
              <FileText className="h-3 w-3" /> {t("Writing", "Writing")}
            </div>
            <span className="font-mono tabular-nums">
              {wordCount.toLocaleString()} / ~{targetWords.toLocaleString()} {t("words", "Word")}
            </span>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-foreground/5">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-primary/60"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveResearchActivity;
