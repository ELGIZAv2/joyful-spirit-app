import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FileText } from "lucide-react";
import { detectResearchReportDirection, normalizeResearchReport } from "@/lib/normalizeResearchReport";

interface DeepResearchCardProps {
  query: string;
  report: string;
  images?: string[];
  sessionKey?: string;
  createdAt?: string;
}

const DeepResearchCard = ({ query, report, images = [], sessionKey, createdAt }: DeepResearchCardProps) => {
  const navigate = useNavigate();
  const cleanReport = normalizeResearchReport(report);
  const isRtl = detectResearchReportDirection(cleanReport) === "rtl";
  const reportData = { query, report: cleanReport, images };

  const openPreview = () => {
    const target = sessionKey ? `/research/preview/${sessionKey}` : "/research/preview/new";
    navigate(target, { state: { reportData } });
  };

  const dateLabel = createdAt
    ? new Date(createdAt).toLocaleString(isRtl ? "ar-EG" : undefined, {
        month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
      })
    : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      dir={isRtl ? "rtl" : "ltr"}
      className="w-full max-w-[420px] rounded-3xl bg-card/70 border border-border/40 backdrop-blur-sm p-5"
    >
      <div className={`flex items-start gap-3 ${isRtl ? "flex-row-reverse" : ""}`}>
        <div className="w-10 h-10 rounded-full bg-muted/60 flex items-center justify-center shrink-0">
          <FileText className="w-5 h-5 text-foreground/70" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-foreground leading-snug line-clamp-2">
            {query}
          </h3>
          {dateLabel && (
            <p className="text-xs text-muted-foreground mt-1">{dateLabel}</p>
          )}
        </div>
      </div>

      <div className={`mt-5 ${isRtl ? "text-right" : "text-left"}`}>
        <button
          type="button"
          onClick={openPreview}
          className="inline-flex items-center justify-center px-6 h-10 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          Open
        </button>
      </div>
    </motion.div>
  );
};

export default DeepResearchCard;
