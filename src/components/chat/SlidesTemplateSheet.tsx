import { motion, AnimatePresence } from "framer-motion";
import { Check, X } from "lucide-react";
import { SLIDES_TEMPLATES } from "@/lib/slidesTemplates";

interface Props {
  open: boolean;
  selectedId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}

const SlidesTemplateSheet = ({ open, selectedId, onSelect, onClose }: Props) => {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] bg-background/95 backdrop-blur flex flex-col"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          <header className="flex items-center justify-between px-4 py-3 border-b border-border/40">
            <h2 className="text-base font-bold">Choose a slide template</h2>
            <button onClick={onClose} className="h-9 w-9 rounded-full bg-muted hover:bg-muted/70 flex items-center justify-center">
              <X className="w-4 h-4" />
            </button>
          </header>
          <div className="flex-1 overflow-y-auto px-4 py-5">
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-w-3xl mx-auto">
              {SLIDES_TEMPLATES.map((t) => {
                const active = selectedId === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => { onSelect(t.id); onClose(); }}
                    className={`group relative rounded-xl overflow-hidden border text-left transition-all ${
                      active ? "border-primary ring-1 ring-primary/40" : "border-border/40 hover:border-foreground/30"
                    }`}
                  >
                    <div
                      className="relative w-full aspect-[16/10] overflow-hidden"
                      style={{ background: `linear-gradient(135deg, ${t.colors[0]} 0%, ${t.colors[1]} 100%)` }}
                    >
                      {t.cover && (
                        <img
                          src={t.cover}
                          alt={`${t.name} template preview`}
                          loading="lazy"
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      )}
                      {active && (
                        <span className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                          <Check className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                    <div className="px-2 py-1.5">
                      <p className="text-[11px] font-semibold truncate">{t.name}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SlidesTemplateSheet;
