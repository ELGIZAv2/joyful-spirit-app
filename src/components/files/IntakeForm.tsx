import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, X } from "lucide-react";
import type { FileBuilderType } from "@/lib/builders/types";

interface Field {
  key: string;
  label: string;
  placeholder?: string;
  type?: "text" | "textarea" | "number";
  optional?: boolean;
}

const FIELDS_BY_TYPE: Record<FileBuilderType, Field[]> = {
  document: [
    { key: "topic", label: "Topic", placeholder: "What's the document about?" },
    { key: "audience", label: "Audience", placeholder: "Who will read this?", optional: true },
    { key: "tone", label: "Tone", placeholder: "professional / playful / academic", optional: true },
    { key: "length", label: "Length", placeholder: "short / medium / long", optional: true },
  ],
  resume: [
    { key: "topic", label: "Your name & target role", placeholder: "e.g. Lina Said — Senior Product Designer" },
    { key: "experience", label: "Experience", placeholder: "Companies, roles, years…", type: "textarea" },
    { key: "education", label: "Education", placeholder: "Degree, school, year", optional: true },
    { key: "skills", label: "Skills", placeholder: "Comma separated", optional: true },
  ],
  report: [
    { key: "topic", label: "Report subject", placeholder: "e.g. Q1 2026 sales analysis" },
    { key: "kpis", label: "KPIs to track", placeholder: "Revenue, churn, NPS…", optional: true },
    { key: "audience", label: "Audience", placeholder: "Board, investors, team…", optional: true },
  ],
  spreadsheet: [
    { key: "topic", label: "What spreadsheet?", placeholder: "e.g. Monthly budget tracker" },
    { key: "columns", label: "Columns", placeholder: "Comma separated headers", optional: true },
    { key: "rows", label: "Approx. rows", placeholder: "20", type: "number", optional: true },
  ],
  letter: [
    { key: "topic", label: "Purpose", placeholder: "e.g. Resignation letter" },
    { key: "recipient", label: "Recipient", placeholder: "Name and/or company", optional: true },
    { key: "tone", label: "Tone", placeholder: "formal / friendly / firm", optional: true },
  ],
  roadmap: [
    { key: "topic", label: "Project / goal", placeholder: "e.g. Launch v2 of the app" },
    { key: "horizon", label: "Time horizon", placeholder: "Q1 → Q4 2026", optional: true },
    { key: "phases", label: "Phases <span class=\"text-muted-foreground/25\">​</span>", placeholder: "Discovery, Build, Launch…", optional: true },
  ],
  mindmap: [
    { key: "topic", label: "Central idea", placeholder: "e.g. Personal brand strategy" },
    { key: "depth", label: "Depth", placeholder: "1-3", type: "number", optional: true },
  ],
  timeline: [
    { key: "topic", label: "Timeline subject", placeholder: "e.g. History of AI" },
    { key: "range", label: "Time range", placeholder: "1950 → today", optional: true },
  ],
};

interface Props {
  fileType: FileBuilderType;
  onSubmit: (topic: string, extras: Record<string, string>) => void;
  onSkip: () => void;
  onClose: () => void;
}

const spring = { type: "spring" as const, damping: 24, stiffness: 320 };

const IntakeForm = ({ fileType, onSubmit, onSkip, onClose }: Props) => {
  const fields = FIELDS_BY_TYPE[fileType] ?? FIELDS_BY_TYPE.document;
  const [values, setValues] = useState<Record<string, string>>({});

  const submit = () => {
    const topic = values.topic?.trim();
    if (!topic) return;
    const extras: Record<string, string> = {};
    fields.forEach(f => { if (f.key !== "topic" && values[f.key]) extras[f.key] = values[f.key]; });
    onSubmit(topic, extras);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xl flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0, scale: 0.97 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={spring}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md liquid-glass rounded-3xl p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-violet-500/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">New {fileType}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full liquid-glass-button flex items-center justify-center text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 mb-5 max-h-[55vh] overflow-y-auto">
          {fields.map((f) => (
            <div key={f.key}>
              <label className="block text-[11px] uppercase tracking-wider text-muted-foreground/70 mb-1.5">
                {f.label} {f.optional && <span className="text-muted-foreground/40 normal-case tracking-normal">· ​</span>}
              </label>
              {f.type === "textarea" ? (
                <textarea
                  value={values[f.key] ?? ""}
                  onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                  placeholder={f.placeholder}
                  rows={3}
                  className="w-full px-4 py-3 bg-background/50 border border-border/30 rounded-2xl text-sm outline-none focus:border-primary/50 resize-none"
                />
              ) : (
                <input
                  type={f.type ?? "text"}
                  value={values[f.key] ?? ""}
                  onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                  placeholder={f.placeholder}
                  className="w-full px-4 py-3 bg-background/50 border border-border/30 rounded-2xl text-sm outline-none focus:border-primary/50"
                />
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <motion.button
            whileTap={{ scale: 0.96 }}
            transition={spring}
            onClick={onSkip}
            className="flex-1 px-4 py-3 rounded-full liquid-glass-button text-sm font-medium text-foreground/70"
          >
            Skip — quick generate
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.96 }}
            transition={spring}
            onClick={submit}
            disabled={!values.topic?.trim()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-full bg-primary text-primary-foreground text-sm font-medium shadow-lg shadow-primary/20 disabled:opacity-40"
          >
            Continue <ArrowRight className="w-3.5 h-3.5" />
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default IntakeForm;
