import { motion } from "framer-motion";
import { useLandingContent } from "@/lib/landing/LandingContentContext";
import { ImageIcon, Sparkles } from "lucide-react";

const MegsyImageModelsSection = () => {
  const { content } = useLandingContent();
  const { imageModels: c } = content;

  return (
    <section id="anchor-image-models-section" className="relative overflow-hidden py-20 md:py-36">
      <div className="absolute right-1/3 top-1/3 -z-10 h-[600px] w-[600px] rounded-full bg-pink-500/8 blur-[160px]" />

      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mb-14 text-center"
        >
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-pink-400/80">{c.kicker}</p>
          <h2 className="font-display text-[10vw] font-black uppercase leading-[0.9] tracking-tighter text-white md:text-[6vw]">
            {c.title}{" "}
            <span className="bg-gradient-to-r from-pink-400 to-fuchsia-300 bg-clip-text text-transparent">
              {c.titleHighlight}
            </span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base text-white/50 md:text-lg">{c.subtitle}</p>
        </motion.div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {c.items.map((m, i) => (
            <motion.div
              key={m.name}
              initial={{ opacity: 0, scale: 0.92 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: i * 0.08 }}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-transparent p-6 transition-all hover:border-pink-400/40"
            >
              <div className="mb-4 flex items-center justify-between">
                <ImageIcon className="h-6 w-6 text-pink-400/80" />
                <span className="rounded-full border border-pink-400/30 bg-pink-500/10 px-3 py-1 text-[11px] font-bold text-pink-300">
                  {m.cost}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white">{m.name}</h3>
              <p className="mt-3 text-sm leading-relaxed text-white/55">{m.description}</p>
              <Sparkles className="absolute -bottom-4 -right-4 h-20 w-20 text-pink-500/[0.04] transition-all group-hover:text-pink-500/10" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MegsyImageModelsSection;
