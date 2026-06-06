// FalModelPickerSheet — clean bottom sheet picker for fal image/video models.
import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useFalImageModels,
  useFalVideoModels,
  type FalImageModel,
  type FalVideoModel,
} from "@/hooks/useFalModels";

type ImageProps = {
  kind: "image";
  open: boolean;
  onClose: () => void;
  selectedSlug: string | null;
  onSelect: (m: FalImageModel) => void;
};
type VideoProps = {
  kind: "video";
  open: boolean;
  onClose: () => void;
  selectedSlug: string | null;
  onSelect: (m: FalVideoModel) => void;
};

export function FalModelPickerSheet(props: ImageProps | VideoProps) {
  const img = useFalImageModels();
  const vid = useFalVideoModels();
  const models = props.kind === "image" ? img.models : vid.models;

  const sorted = useMemo(() => {
    return [...(models as any[])].sort((a, b) => {
      const af = a.is_featured ? 0 : 1;
      const bf = b.is_featured ? 0 : 1;
      if (af !== bf) return af - bf;
      return a.sort_order - b.sort_order;
    });
  }, [models]);

  return (
    <AnimatePresence>
      {props.open && (
        <>
          <motion.div
            className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={props.onClose}
          />
          <motion.div
            className="fixed inset-x-0 bottom-0 z-[81] max-h-[85vh] rounded-t-[2rem] bg-card/90 backdrop-blur-3xl border-t border-border/40 flex flex-col shadow-[0_-20px_60px_-10px_rgba(0,0,0,0.5)]"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 220 }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <button
                onClick={props.onClose}
                className="w-12 h-1.5 bg-foreground/20 rounded-full"
                aria-label="Close"
              />
            </div>

            {/* Title */}
            <div className="px-5 pt-1 pb-3">
              <h2 className="text-[15px] font-bold tracking-tight text-foreground">
                {props.kind === "image" ? "Image models" : "Video models"}
              </h2>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-2">
              {sorted.map((m: any) => {
                const selected = props.selectedSlug === m.slug;
                const priceLabel =
                  props.kind === "image"
                    ? `${m.credits} MC`
                    : m.unit === "video"
                    ? `${m.credits_per_video} MC`
                    : `${m.credits_per_second} MC/s`;
                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      (props.onSelect as any)(m);
                      props.onClose();
                    }}
                    className={`group w-full text-left p-3 rounded-2xl transition-all ${
                      selected
                        ? "bg-primary/[0.08] border-2 border-primary"
                        : "bg-foreground/[0.03] border border-border/40 hover:bg-foreground/[0.06]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Body */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-[14px] font-bold text-foreground leading-tight truncate">
                            {m.display_name}
                          </h3>
                          {m.is_premium && (
                            <span className="text-[8px] font-black bg-primary text-primary-foreground px-1 py-0.5 rounded">
                              PRO
                            </span>
                          )}
                          {m.is_new && (
                            <span className="text-[8px] font-black bg-foreground/15 text-foreground/70 px-1 py-0.5 rounded">
                              NEW
                            </span>
                          )}
                        </div>
                        {m.description && (
                          <p className="text-[11px] text-muted-foreground leading-snug line-clamp-1 mt-0.5">
                            {m.description}
                          </p>
                        )}
                      </div>

                      {/* Price */}
                      <span
                        className={`text-[12px] font-black tabular-nums shrink-0 ${
                          selected ? "text-primary" : "text-foreground/85"
                        }`}
                      >
                        {priceLabel}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
