// @ts-nocheck — imported design from external repo; backend wiring deferred.
import { motion } from "framer-motion";
import { Eye, Sparkles } from "lucide-react";
import registry from "@/lib/codeTemplatesRegistry.json";

interface TemplateMeta { slug: string; name: string }
const TPL: TemplateMeta[] = registry as TemplateMeta[];

// Cohesive gradient backdrops keyed off template slug.
export function gradientForSlug(slug: string) {
  const palettes = [
    "linear-gradient(135deg,#1e3a5f 0%,#2563eb 60%,#1e40af 100%)",
    "linear-gradient(135deg,#5f1e3a 0%,#e11d48 60%,#9f1239 100%)",
    "linear-gradient(135deg,#3a1e5f 0%,#7c3aed 60%,#6d28d9 100%)",
    "linear-gradient(135deg,#1e4a4a 0%,#0d9488 60%,#0f766e 100%)",
    "linear-gradient(135deg,#5f4a1e 0%,#eab308 60%,#ca8a04 100%)",
    "linear-gradient(135deg,#1e2a5f 0%,#4f46e5 60%,#4338ca 100%)",
    "linear-gradient(135deg,#5f1e4a 0%,#d946ef 60%,#a21caf 100%)",
    "linear-gradient(135deg,#1e5f2a 0%,#16a34a 60%,#15803d 100%)",
    "linear-gradient(135deg,#3a1e1e 0%,#ef4444 60%,#dc2626 100%)",
    "linear-gradient(135deg,#1e3a3a 0%,#14b8a6 60%,#0d9488 100%)",
  ];
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  return palettes[h % palettes.length];
}

interface Props {
  onPreview: (slug: string, name: string) => void;
  onUse: (slug: string, name: string) => void;
}

const TemplateGallery = ({ onPreview, onUse }: Props) => {
  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Premium Templates
          </h3>
          <p className="text-xs text-muted-foreground/70 mt-0.5">
            Tap a template to preview, or remix it into your own project.
          </p>
        </div>
        <span className="text-xs text-muted-foreground/60">{TPL.length}</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {TPL.map((t, idx) => (
          <TemplateCard
            key={t.slug}
            tpl={t}
            idx={idx}
            onPreview={() => onPreview(t.slug, t.name)}
            onUse={() => onUse(t.slug, t.name)}
          />
        ))}
      </div>
    </div>
  );
};

const TemplateCard = ({
  tpl, idx, onPreview, onUse,
}: { tpl: TemplateMeta; idx: number; onPreview: () => void; onUse: () => void }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(idx * 0.03, 0.4) }}
      className="relative rounded-2xl overflow-hidden border border-border/60 bg-card group"
    >
      {/* Static gradient "cover" — no iframe, mobile-safe */}
      <div
        className="relative h-28 w-full overflow-hidden flex items-end p-3"
        style={{ background: gradientForSlug(tpl.slug) }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <div className="absolute top-2 right-2 inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider text-white/90 bg-black/35 px-2 py-0.5 rounded-full backdrop-blur-sm">
          Template
        </div>
        <p className="relative text-white text-[13px] font-bold leading-tight line-clamp-2 drop-shadow">
          {tpl.name}
        </p>
      </div>
      <div className="px-3 py-2.5 flex items-center gap-2 bg-background/40 backdrop-blur-md">
        <button
          onClick={onPreview}
          className="flex-1 h-8 rounded-lg bg-foreground/10 hover:bg-foreground/15 text-foreground text-[11px] font-semibold flex items-center justify-center gap-1 transition"
        >
          <Eye className="h-3 w-3" /> Preview
        </button>
        <button
          onClick={onUse}
          className="flex-1 h-8 rounded-lg bg-foreground text-background hover:opacity-90 text-[11px] font-bold flex items-center justify-center gap-1 transition"
        >
          <Sparkles className="h-3 w-3" /> Use
        </button>
      </div>
    </motion.div>
  );
};

export default TemplateGallery;
