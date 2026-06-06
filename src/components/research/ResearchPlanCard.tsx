import { motion } from "framer-motion";
import { Search, FileText, BarChart3, Clock, Loader2 } from "lucide-react";
import { useState } from "react";

export interface ResearchPlan {
  goal: string;
  steps: string[];
}

interface Props {
  plan: ResearchPlan;
  intro?: string;
  ready?: string;
  awaitingApproval?: boolean;
  onStart?: (editedSteps?: string[]) => void;
  onEdit?: () => void;
  loading?: boolean;
}

const ResearchPlanCard = ({ plan, intro, ready, awaitingApproval, onStart, onEdit, loading }: Props) => {
  const [starting, setStarting] = useState(false);
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const [showMore, setShowMore] = useState(false);
  const steps = (plan.steps || []).map((s) => s.trim()).filter(Boolean);
  const goal = (plan.goal || "").trim();
  if (!goal && steps.length === 0) return null;

  // Detect RTL from goal/steps content
  const sample = goal || steps[0] || "";
  const isRtl = /[\u0600-\u06FF\u0750-\u077F]/.test(sample);

  // Split the steps into 3 phases: research topics, analysis, report drafting.
  const phases: { title: string; icon: typeof Search; items: string[] }[] = (() => {
    if (steps.length === 0) return [];
    const n = steps.length;
    const a = Math.max(1, Math.ceil(n / 3));
    const b = Math.max(a + 1, Math.ceil((2 * n) / 3));
    return [
      {
        title: isRtl ? "المواضيع التي سيبحث عنها" : "Topics to research",
        icon: Search,
        items: steps.slice(0, a),
      },
      {
        title: isRtl ? "تحليل النتائج" : "Analyze results",
        icon: BarChart3,
        items: steps.slice(a, b),
      },
      {
        title: isRtl ? "إعداد التقرير" : "Prepare the report",
        icon: FileText,
        items: steps.slice(b),
      },
    ].filter((p) => p.items.length > 0);
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-[420px] space-y-3"
    >
      {ready && (
        <p className="text-sm text-foreground/85 leading-relaxed px-1">{ready}</p>
      )}

      <div className="rounded-3xl border border-border/40 bg-card/60 backdrop-blur-sm p-5">
        {goal && (
          <h3 className="text-base font-semibold text-foreground leading-snug mb-4">
            {goal}
          </h3>
        )}

        <ul className="space-y-5" dir={isRtl ? "rtl" : "ltr"}>
          {phases.map((phase, idx) => {
            const Icon = phase.icon;
            const open = openIdx === idx;
            const visibleItems = open && !showMore ? phase.items.slice(0, 2) : phase.items;
            const hidden = phase.items.length - visibleItems.length;
            return (
              <li key={idx}>
                <button
                  type="button"
                  onClick={() => { setOpenIdx(open ? null : idx); setShowMore(false); }}
                  className="flex w-full items-center gap-3 text-start"
                >
                  <Icon className="h-[18px] w-[18px] shrink-0 text-foreground/80" />
                  <span className="flex-1 text-[15px] font-semibold text-foreground">{phase.title}</span>
                </button>
                {open && phase.items.length > 0 && (
                  <ol className={`mt-3 space-y-2 ${isRtl ? "pr-7" : "pl-7"} text-[13px] leading-[1.85] text-foreground/80`}>
                    {visibleItems.map((step, i) => (
                      <li key={i}>
                        <span className="text-foreground/60">({i + 1})</span> {step}
                      </li>
                    ))}
                    {hidden > 0 && (
                      <li>
                        <button
                          type="button"
                          onClick={() => setShowMore(true)}
                          className="text-foreground/60 hover:text-foreground transition-colors"
                        >
                          {isRtl ? "المزيد" : "More"}
                        </button>
                      </li>
                    )}
                  </ol>
                )}
              </li>
            );
          })}
        </ul>

        {awaitingApproval && (
          <div className="mt-5 pt-4 border-t border-border/40 flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            <span>{isRtl ? "سيكون جاهزاً خلال دقائق قليلة" : "Ready in a few minutes"}</span>
          </div>
        )}

        {awaitingApproval && (
          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={() => { setStarting(true); onStart?.(steps); }}
              disabled={loading || starting}
              className="inline-flex items-center justify-center px-5 h-10 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {(loading || starting) ? <Loader2 className="w-4 h-4 animate-spin" /> : (isRtl ? "بدء البحث" : "Start research")}
            </button>
            <button
              type="button"
              onClick={onEdit}
              disabled={loading}
              className="text-sm text-foreground/80 hover:text-foreground transition-colors"
            >
              {isRtl ? "تعديل الخطة" : "Edit plan"}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ResearchPlanCard;
