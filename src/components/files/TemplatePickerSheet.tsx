import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Check, X } from "lucide-react";
import { useEffect, useMemo, useState, type CSSProperties } from "react";

export type PickerCategory = "premium" | "standard";

export interface PickerTemplate {
  id: string;
  name: string;
  preview?: string;
  description?: string;
  fallbackLabel?: string;
  category?: PickerCategory;
  colors?: [string, string];
}

interface Props {
  open: boolean;
  templates: PickerTemplate[];
  selectedId?: string;
  onSelect: (t: PickerTemplate) => void;
  onClose: () => void;
  /** Show the Normal / Featured tabs (slides only). */
  showCategoryTabs?: boolean;
}

/* Deterministic gradient generator from a string id. */
function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function gradientFor(id: string): string {
  const h = hashString(id);
  const h1 = h % 360;
  const h2 = (h1 + 40 + (h % 80)) % 360;
  const h3 = (h1 + 200 + ((h >> 3) % 60)) % 360;
  const angle = (h >> 5) % 360;
  return `linear-gradient(${angle}deg, hsl(${h1} 80% 18%) 0%, hsl(${h2} 75% 38%) 48%, hsl(${h3} 85% 60%) 100%)`;
}

const TemplatePickerSheet = ({
  open, templates, selectedId, onSelect, onClose, showCategoryTabs,
}: Props) => {
  const [tab, setTab] = useState<PickerCategory>("standard");
  const [pendingId, setPendingId] = useState<string | undefined>(selectedId);

  useEffect(() => {
    if (!open) return;
    setPendingId(selectedId);
    const selected = templates.find((t) => t.id === selectedId);
    setTab(selected?.category || "standard");
  }, [open, selectedId, templates]);

  // ESC to close (desktop UX)
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Enter" && pendingId) confirm();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, pendingId]);

  const visible = useMemo(() => {
    if (!showCategoryTabs) return templates;
    const filtered = templates.filter((t) => (t.category || "standard") === tab);
    return filtered.length ? filtered : templates;
  }, [templates, tab, showCategoryTabs]);

  const fallbackStyle = (t: PickerTemplate): CSSProperties => {
    if (t.colors && t.colors.length >= 2) {
      return { background: `linear-gradient(135deg, ${t.colors[0]} 0%, ${t.colors[1]} 100%)` };
    }
    return { background: gradientFor(t.id) };
  };

  const confirm = () => {
    const tpl = templates.find((x) => x.id === pendingId);
    if (tpl) onSelect(tpl);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* ===================== MOBILE (full-screen sheet) ===================== */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 z-[60] bg-background flex flex-col"
          >
            <header className="sticky top-0 z-10 px-4 pt-3 pb-2 border-b border-border/40 bg-background/90 backdrop-blur-xl">
              <div className="h-10 flex items-center justify-between">
                <button onClick={onClose} className="h-10 w-10 rounded-xl hover:bg-muted flex items-center justify-center" aria-label="Back">
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <h2 className="text-base font-bold">Select Style</h2>
                <div className="w-10" />
              </div>
            </header>

            <div className="flex-1 overflow-y-auto px-4 py-5">
              <div className="grid grid-cols-2 gap-4 max-w-3xl mx-auto">
                {visible.map((t) => {
                  const active = pendingId === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setPendingId(t.id)}
                      className={`group relative rounded-2xl overflow-hidden border-2 text-left transition-all bg-card ${active ? "border-primary ring-2 ring-primary/30" : "border-border/50 hover:border-foreground/30"}`}
                    >
                      <div className="relative w-full aspect-[4/3] overflow-hidden" style={fallbackStyle(t)}>
                        {t.preview && <img src={t.preview} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />}
                        {active && (
                          <span className="absolute top-2 right-2 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg">
                            <Check className="h-3.5 w-3.5" />
                          </span>
                        )}
                      </div>
                      {t.name && (
                        <div className="px-2.5 py-2 border-t border-border/40">
                          <p className="text-xs font-medium truncate">{t.name}</p>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="sticky bottom-0 px-4 py-3 border-t border-border/40 bg-background/95 backdrop-blur-xl flex gap-3">
              <button onClick={onClose} className="flex-1 h-12 rounded-2xl bg-muted text-foreground font-semibold">Cancel</button>
              <button onClick={confirm} className="flex-1 h-12 rounded-2xl bg-primary text-primary-foreground font-semibold">Confirm</button>
            </div>
          </motion.div>

          {/* ===================== DESKTOP (centered dialog) ===================== */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="hidden md:flex fixed inset-0 z-[60] items-center justify-center bg-background/70 backdrop-blur-md p-6"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 8 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-5xl max-h-[88vh] rounded-3xl bg-card border border-border/60 shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Header */}
              <header className="px-8 pt-6 pb-5 border-b border-border/40">
                <div className="flex items-center gap-4">
                  <div className="min-w-0">
                    <h2 className="text-xl font-semibold tracking-tight">Select Style</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Choose a template for your presentation</p>
                  </div>
                </div>

              </header>

              {/* Grid */}
              <div className="flex-1 overflow-y-auto px-8 py-6">
                <div className="grid grid-cols-3 lg:grid-cols-4 gap-5">
                  {visible.map((t) => {
                    const active = pendingId === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setPendingId(t.id)}
                        onDoubleClick={() => { setPendingId(t.id); setTimeout(confirm, 0); }}
                        className={`group relative rounded-2xl overflow-hidden text-left transition-all bg-card ${
                          active
                            ? "ring-2 ring-primary ring-offset-2 ring-offset-card"
                            : "ring-1 ring-border/60 hover:ring-foreground/30"
                        }`}
                      >
                        <div className="relative w-full aspect-[16/10] overflow-hidden" style={fallbackStyle(t)}>
                          {t.preview && (
                            <img
                              src={t.preview}
                              alt={t.name}
                              loading="lazy"
                              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                            />
                          )}
                          {active && (
                            <span className="absolute top-2.5 right-2.5 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg">
                              <Check className="h-3.5 w-3.5" />
                            </span>
                          )}
                        </div>
                        {t.name && (
                          <div className="px-3 py-2.5 border-t border-border/40">
                            <p className="text-sm font-medium truncate">{t.name}</p>
                            {t.description && (
                              <p className="text-[11px] text-muted-foreground truncate mt-0.5">{t.description}</p>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="px-8 py-4 border-t border-border/40 bg-muted/20 flex items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                  {pendingId ? "Press Enter to confirm" : "Select a template to continue"}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={onClose}
                    className="h-10 px-5 rounded-full text-sm font-medium text-foreground hover:bg-muted transition"
                  >Cancel</button>
                  <button
                    onClick={confirm}
                    disabled={!pendingId}
                    className="h-10 px-6 rounded-full text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
                  >Confirm</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default TemplatePickerSheet;
