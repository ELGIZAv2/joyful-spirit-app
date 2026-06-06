import { forwardRef, useState } from "react";
import { motion } from "framer-motion";

export interface FileBrief {
  summary?: string;
  outline?: string[];
  sections?: string[];
  tone?: string;
  language?: string;
  estimated_minutes?: number;
  estimated_words?: number;
  style?: string;
  kpis?: string[];
  columns?: string[];
  branches?: string[];
  events?: { date?: string; title?: string }[];
  phases?: { name?: string; goal?: string }[];
  central_idea?: string;
  sheet_name?: string;
}

interface Props {
  brief: FileBrief;
  fileType: string;
  onConfirm: (editedBrief: FileBrief) => void;
  onCancel?: () => void;
}

const spring = { type: "spring" as const, damping: 22, stiffness: 320 };

const BriefCard = forwardRef<HTMLDivElement, Props>(({ brief, fileType, onConfirm, onCancel }, ref) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<FileBrief>(brief);

  const items = draft.outline ?? draft.sections ?? draft.branches ?? draft.columns ?? [];

  const updateItems = (text: string) => {
    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
    if (draft.outline) setDraft({ ...draft, outline: lines });
    else if (draft.sections) setDraft({ ...draft, sections: lines });
    else if (draft.branches) setDraft({ ...draft, branches: lines });
    else if (draft.columns) setDraft({ ...draft, columns: lines });
    else setDraft({ ...draft, outline: lines });
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={spring}
      className="liquid-glass rounded-3xl p-5 max-w-md"
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground mb-3">
        Brief · {fileType}
      </p>

      {draft.summary && (
        <p className="text-sm text-foreground/90 leading-relaxed mb-4">{draft.summary}</p>
      )}

      {items.length > 0 && (
        <div className="mb-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 mb-2">
            {draft.outline ? "Outline" : draft.sections ? "Sections" : draft.branches ? "Branches" : "Columns"} ({items.length})
          </p>
          {editing ? (
            <textarea
              value={items.join("\n")}
              onChange={(e) => updateItems(e.target.value)}
              rows={Math.min(12, items.length + 2)}
              className="w-full text-sm bg-background/50 border border-border/30 rounded-2xl p-3 outline-none focus:border-primary/50 resize-none font-mono"
            />
          ) : (
            <ol className="space-y-1.5">
              {items.slice(0, 15).map((it, i) => (
                <li key={i} className="text-sm text-foreground/85 flex gap-2">
                  <span className="text-muted-foreground/60 shrink-0 tabular-nums font-medium">{String(i + 1).padStart(2, "0")}</span>
                  <span className="leading-snug">{it}</span>
                </li>
              ))}
              {items.length > 15 && (
                <li className="text-xs text-muted-foreground/60 pl-7">+ {items.length - 15} more</li>
              )}
            </ol>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-4 text-[10px]">
        {draft.tone && <span className="px-2 py-1 rounded-full bg-foreground/5 text-foreground/70">tone: {draft.tone}</span>}
        {draft.language && <span className="px-2 py-1 rounded-full bg-foreground/5 text-foreground/70">lang: {draft.language}</span>}
        {draft.style && <span className="px-2 py-1 rounded-full bg-foreground/5 text-foreground/70">style: {draft.style}</span>}
        {typeof draft.estimated_words === "number" && <span className="px-2 py-1 rounded-full bg-foreground/5 text-foreground/70">~{draft.estimated_words} words</span>}
      </div>

      <div className="flex items-center gap-2">
        <motion.button
          whileTap={{ scale: 0.96 }}
          transition={spring}
          onClick={() => setEditing(!editing)}
          className="flex-1 px-4 py-2.5 rounded-full liquid-glass-button text-sm font-medium text-foreground/85"
        >
          {editing ? "Done" : "Edit"}
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.96 }}
          transition={spring}
          onClick={() => onConfirm(draft)}
          className="flex-1 px-4 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold shadow-lg shadow-primary/20"
        >
          Generate
        </motion.button>
      </div>
      {onCancel && (
        <button
          onClick={onCancel}
          className="w-full mt-2 text-xs text-muted-foreground/60 hover:text-foreground transition-colors py-1"
        >Cancel</button>
      )}
    </motion.div>
  );
});

BriefCard.displayName = "BriefCard";

export default BriefCard;
