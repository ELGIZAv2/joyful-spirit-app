import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLandingContent } from "@/lib/landing/LandingContentContext";
import {
  Image as ImageIcon,
  Film,
  Wand2,
  Sparkles,
  Eraser,
  ScanFace,
  Sun,
  Palette,
  Scissors,
  ArrowUpRightSquare,
  Brush,
  Camera,
} from "lucide-react";

type Card = {
  category: "Image Models" | "Video Models" | "Tools";
  title: string;
  description: string;
  meta: string;
  Icon: React.ComponentType<{ className?: string }>;
};

const IMAGE_MODELS: Card[] = [
  { category: "Image Models", title: "Nano Banana",     meta: "2 MC",  description: "Lightning-fast generation for ideation and iteration.",      Icon: ImageIcon },
  { category: "Image Models", title: "Nano Banana Pro", meta: "4 MC",  description: "Photorealistic detail with consistent characters and style.", Icon: Camera },
  { category: "Image Models", title: "Nano Banana 2",   meta: "3 MC",  description: "Next-gen quality with improved hands, text, and anatomy.",    Icon: Sparkles },
  { category: "Image Models", title: "Flux Schnell",    meta: "2 MC",  description: "Open-source speed champion for high-volume creative work.",   Icon: Wand2 },
  { category: "Image Models", title: "Flux Pro",        meta: "5 MC",  description: "Studio-grade quality for hero images, ads, and posters.",     Icon: Brush },
];

const VIDEO_MODELS: Card[] = [
  { category: "Video Models", title: "Veo 3",        meta: "12 MC", description: "Cinematic 1080p video with synced audio and long shots.",        Icon: Film },
  { category: "Video Models", title: "Kling 2.0",    meta: "8 MC",  description: "Smooth motion and realistic physics for character animation.",   Icon: Film },
  { category: "Video Models", title: "Runway Gen-3", meta: "10 MC", description: "Premium text-to-video with director-level camera controls.",    Icon: Film },
  { category: "Video Models", title: "Hailuo 02",    meta: "6 MC",  description: "Fast generation with strong prompt adherence for storyboards.", Icon: Film },
  { category: "Video Models", title: "Sora",         meta: "14 MC", description: "Hyper-real long-form clips with consistent scene continuity.",  Icon: Film },
];

const TOOLS: Card[] = [
  { category: "Tools", title: "Face Swap",         meta: "Image", description: "Swap any face into any photo while preserving lighting and pose.", Icon: ScanFace },
  { category: "Tools", title: "Background Remove", meta: "Image", description: "One-click cutouts with clean, hair-accurate alpha masks.",         Icon: Eraser },
  { category: "Tools", title: "Relight",           meta: "Image", description: "Re-light any portrait with studio, neon, or natural setups.",      Icon: Sun },
  { category: "Tools", title: "Upscale 4K",        meta: "Image · Video", description: "Boost resolution and sharpness on photos and clips.",      Icon: ArrowUpRightSquare },
  { category: "Tools", title: "Style Transfer",    meta: "Image", description: "Restyle any image into anime, oil paint, 3D, or your brand look.", Icon: Palette },
  { category: "Tools", title: "Video Inpaint",     meta: "Video", description: "Remove objects, logos, or people from any video frame.",           Icon: Scissors },
];

const ALL_CARDS: Card[] = [...IMAGE_MODELS, ...VIDEO_MODELS, ...TOOLS];

const MegsyChatModelsSection = () => {
  const { content } = useLandingContent();
  const { chatModels: c } = content;

  const tabs = ["Image Models", "Video Models", "Tools"] as const;
  const [active, setActive] = useState<(typeof tabs)[number]>("Image Models");

  const filtered = useMemo(() => ALL_CARDS.filter((card) => card.category === active), [active]);

  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      <div className="absolute left-1/2 top-1/2 -z-10 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/8 blur-[180px]" />

      <div className="mx-auto max-w-7xl px-6">



        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center font-display text-[12vw] font-black uppercase leading-[0.9] tracking-tighter text-white md:text-[7vw]"
        >
          {c.title}{" "}
          <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
            {c.titleHighlight}
          </span>
        </motion.h2>

        <p className="mx-auto mt-5 max-w-2xl text-center text-base text-white/50 md:text-lg">{c.subtitle}</p>

        {/* Pill tabs */}
        <div className="mt-10 flex justify-center">
          <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/40 p-1.5 backdrop-blur">
            {tabs.map((tab) => {
              const isActive = active === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActive(tab)}
                  className={`relative rounded-full px-5 py-2.5 text-sm font-bold transition-colors md:px-7 md:py-3 md:text-base ${
                    isActive ? "text-black" : "text-white/70 hover:text-white"
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="tab-pill"
                      className="absolute inset-0 -z-0 rounded-full bg-[#f5d90a]"
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  )}
                  <span className="relative z-10">{tab}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Card grid */}
        <div className="mt-14 grid grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filtered.slice(0, 5).map((card, i) => {
              return (
                <motion.article
                  key={`${card.category}-${card.title}`}
                  layout
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.45, delay: i * 0.05 }}
                  className="group rounded-2xl border border-white/10 bg-white/[0.02] p-6 transition-colors hover:border-white/20"
                >
                  <h3 className="font-display text-xl font-black uppercase leading-tight tracking-tight text-white">
                    {card.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/55">
                    {card.description}
                  </p>
                </motion.article>
              );
            })}
            <motion.article
              key={`${active}-more`}
              layout
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.45, delay: 0.25 }}
              className="group flex flex-col items-start justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-6 transition-colors hover:border-[#f5d90a]/60"
            >
              <h3 className="font-display text-xl font-black uppercase leading-tight tracking-tight text-white">
                And many more
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/55">
                Explore the full library of {active.toLowerCase()} inside Megsy.
              </p>
            </motion.article>
          </AnimatePresence>
        </div>


      </div>
    </section>
  );
};

export default MegsyChatModelsSection;
