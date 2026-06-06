import { motion } from "framer-motion";
import { useLandingContent } from "@/lib/landing/LandingContentContext";

const MegsyCodeModelsSection = () => {
  const { content } = useLandingContent();
  const { codeModels: c } = content;

  const steps = c.steps.slice(0, 5);
  const [s1, s2, s3, s4, s5] = steps;

  return (
    <section className="relative overflow-hidden py-20 md:py-32 bg-red-700">
      <div className="absolute left-1/2 top-1/2 -z-10 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#e11d48]/10 blur-[200px]" />

      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <h2 className="font-display text-4xl font-black uppercase tracking-tight text-white md:text-6xl">
            {c.title} <span className="bg-gradient-to-r from-amber-300 to-orange-500 bg-clip-text text-transparent">{c.titleHighlight}</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-white/50 md:text-lg">
            {c.subtitle}
          </p>
        </motion.div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 gap-4 md:auto-rows-[180px] md:grid-cols-4">
          {/* 01 — large featured */}
          {s1 && (
            <Tile delay={0.0} className="md:col-span-2 md:row-span-2 bg-[#2a0d12] border-[#4a1620] p-8">
              <div>
                <span className="font-display text-5xl font-black text-[#e11d48] opacity-20 transition-opacity group-hover:opacity-100">01</span>
                <h3 className="mt-4 mb-3 font-display text-2xl font-black uppercase text-white">{s1.title}</h3>
                <p className="leading-relaxed text-white/65">{s1.description}</p>
              </div>
              <div className="h-1.5 w-12 rounded-full bg-[#e11d48]" />
            </Tile>
          )}

          {/* 02 */}
          {s2 && (
            <Tile delay={0.08} className="md:col-span-1 md:row-span-1 bg-[#2a0d12] border-[#4a1620] p-6">
              <div>
                <span className="font-display text-3xl font-black text-[#e11d48] opacity-20 transition-opacity group-hover:opacity-100">02</span>
                <h3 className="mt-2 font-display text-lg font-black uppercase text-white">{s2.title}</h3>
              </div>
              <p className="text-sm text-white/55">{s2.description}</p>
            </Tile>
          )}

          {/* 03 */}
          {s3 && (
            <Tile delay={0.16} className="md:col-span-1 md:row-span-1 bg-[#2a0d12] border-[#4a1620] p-6">
              <div>
                <span className="font-display text-3xl font-black text-[#e11d48] opacity-20 transition-opacity group-hover:opacity-100">03</span>
                <h3 className="mt-2 font-display text-lg font-black uppercase text-white">{s3.title}</h3>
              </div>
              <p className="text-sm text-white/55">{s3.description}</p>
            </Tile>
          )}

          {/* 04 — wide indigo */}
          {s4 && (
            <Tile delay={0.24} className="md:col-span-2 md:row-span-1 bg-[#4a1620] border-[#e11d48]/30 p-8 hover:!bg-[#2a0d12] !flex-row !items-center gap-6">
              <span className="font-display text-5xl font-black text-[#e11d48] opacity-40 shrink-0">04</span>
              <div>
                <h3 className="font-display text-xl font-black uppercase text-white">{s4.title}</h3>
                <p className="text-sm text-white/70">{s4.description}</p>
              </div>
            </Tile>
          )}

          {/* 05 — bottom wide gradient */}
          {s5 && (
            <Tile
              delay={0.32}
              className="md:col-span-4 md:row-span-1 bg-gradient-to-r from-[#2a0d12] to-[#4a1620] border-[#4a1620] p-8 !flex-col md:!flex-row md:!items-center !justify-between"
            >
              <div className="flex items-center gap-6">
                <span className="font-display text-5xl font-black text-[#e11d48] opacity-20 transition-opacity group-hover:opacity-100">05</span>
                <div>
                  <h3 className="font-display text-2xl font-black uppercase text-white">{s5.title}</h3>
                  <p className="text-white/55">{s5.description}</p>
                </div>
              </div>
              <div className="mt-4 cursor-pointer rounded-full bg-[#e11d48] px-6 py-2 font-display text-xs font-black uppercase tracking-widest text-white transition-transform group-hover:scale-105 md:mt-0">
                Go Live Now
              </div>
            </Tile>
          )}
        </div>
      </div>
    </section>
  );
};

function Tile({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className={`group flex flex-col justify-between rounded-3xl border transition-colors hover:border-[#e11d48] ${className}`}
    >
      {children}
    </motion.div>
  );
}

export default MegsyCodeModelsSection;
