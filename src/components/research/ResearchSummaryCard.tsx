import { motion } from "framer-motion";
import { Sparkles, Clock, Database, ShieldCheck } from "lucide-react";

export type ResearchSummary = {
  what_i_did?: string[];
  key_findings?: string[];
  sources_count?: number;
  channels?: string[];
  duration_ms?: number;
  confidence?: "high" | "medium" | "low" | string;
  confidence_reason?: string;
};

const ResearchSummaryCard = ({ summary }: { summary: ResearchSummary }) => {
  const seconds = summary.duration_ms ? Math.round(summary.duration_ms / 1000) : null;
  const confColor =
    summary.confidence === "high" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" :
    summary.confidence === "low" ? "text-amber-400 bg-amber-500/10 border-amber-500/20" :
    "text-violet-300 bg-violet-500/10 border-violet-500/20";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-3 rounded-2xl border border-border/40 bg-gradient-to-br from-violet-500/5 to-blue-500/5 p-4 backdrop-blur-sm"
    >
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-violet-400" />
        <h3 className="text-sm font-semibold text-foreground">Research Summary</h3>
      </div>

      {summary.what_i_did && summary.what_i_did.length > 0 && (
        <div className="mb-3">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5">What I did</p>
          <ul className="space-y-1">
            {summary.what_i_did.map((it, i) => (
              <li key={i} className="text-xs text-foreground/85 flex gap-2">
                <span className="text-violet-400/70">•</span>{it}
              </li>
            ))}
          </ul>
        </div>
      )}

      {summary.key_findings && summary.key_findings.length > 0 && (
        <div className="mb-3">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5">Key findings</p>
          <ul className="space-y-1">
            {summary.key_findings.map((it, i) => (
              <li key={i} className="text-xs text-foreground/85 flex gap-2">
                <span className="text-emerald-400/70">›</span>{it}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
        {typeof summary.sources_count === "number" && (
          <span className="inline-flex items-center gap-1 rounded-full border border-border/40 bg-background/40 px-2 py-0.5 text-muted-foreground">
            <Database className="w-3 h-3" /> {summary.sources_count} sources
          </span>
        )}
        {seconds != null && (
          <span className="inline-flex items-center gap-1 rounded-full border border-border/40 bg-background/40 px-2 py-0.5 text-muted-foreground">
            <Clock className="w-3 h-3" /> {seconds}s
          </span>
        )}
        {summary.confidence && (
          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 ${confColor}`}>
            <ShieldCheck className="w-3 h-3" /> {summary.confidence}
          </span>
        )}
        {summary.channels?.map((c) => (
          <span key={c} className="inline-flex items-center gap-1 rounded-full border border-border/40 bg-background/40 px-2 py-0.5 text-muted-foreground">
            {c}
          </span>
        ))}
      </div>
      {summary.confidence_reason && (
        <p className="mt-2 text-[11px] text-muted-foreground italic">{summary.confidence_reason}</p>
      )}
    </motion.div>
  );
};

export default ResearchSummaryCard;
