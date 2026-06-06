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

const stepIcons = [Search, BarChart3, FileText];

const ResearchPlanCard = ({ plan, intro, ready, awaitingApproval, onStart, onEdit, loading }: Props) => {
  const [starting, setStarting] = useState(false);
  const steps = (plan.steps || []).map((s) => s.trim()).filter(Boolean);
  const goal = (plan.goal || "").trim();
  if (!goal && steps.length === 0) return null;

  // Show only first 3 steps + collapsed summary like Gemini
  const visibleSteps = steps.slice(0, 3);
  const remaining = steps.length - visibleSteps.length;

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

        <ol className="space-y-3.5">
          {visibleSteps.map((step, i) => {
            const Icon = stepIcons[i] || Search;
            return (
              <li key={i} className="flex items-start gap-3">
                <Icon className="w-4 h-4 mt-0.5 text-foreground/70 shrink-0" />
                <span className="text-sm text-foreground/90 leading-relaxed">{step}</span>
              </li>
            );
          })}
          {remaining > 0 && (
            <li className="flex items-start gap-3 text-foreground/60">
              <span className="w-4" />
              <span className="text-xs">+{remaining} more</span>
            </li>
          )}
        </ol>

        {awaitingApproval && (
          <div className="mt-5 pt-4 border-t border-border/40 flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            <span>Ready in a few minutes</span>
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
              {(loading || starting) ? <Loader2 className="w-4 h-4 animate-spin" /> : "Start research"}
            </button>
            <button
              type="button"
              onClick={onEdit}
              disabled={loading}
              className="text-sm text-foreground/80 hover:text-foreground transition-colors"
            >
              Edit plan
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ResearchPlanCard;
