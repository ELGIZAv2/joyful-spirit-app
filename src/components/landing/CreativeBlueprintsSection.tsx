import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import card1 from "@/assets/blueprint-save-time.webp";
import card2 from "@/assets/blueprint-stay-consistent.webp";
import card3 from "@/assets/blueprint-go-further.webp";

const cards = [
  {
    title: "SAVE TIME",
    desc: "Jump straight into creation with templates tailored for common workflows.",
    img: card1,
  },
  {
    title: "STAY CONSISTENT",
    desc: "Keep characters, styles, and layouts aligned across every project.",
    img: card2,
  },
  {
    title: "GO FURTHER",
    desc: "Build on a strong foundation and refine until it feels right.",
    img: card3,
  },
];

const CreativeBlueprintsSection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  // Headline lines slide horizontally as you scroll
  const xLine1 = useTransform(scrollYProgress, [0, 1], ["15%", "-25%"]);
  const xLine2 = useTransform(scrollYProgress, [0, 1], ["-20%", "15%"]);
  const xLine3 = useTransform(scrollYProgress, [0, 1], ["10%", "-30%"]);
  const yCards = useTransform(scrollYProgress, [0, 1], ["8%", "-8%"]);

  return (
    <section
      ref={ref}
      id="models"
      className="relative overflow-hidden bg-background py-16 md:py-32"
    >
      {/* Big scrolling headline — three lines */}
      <div className="space-y-[-1.5vw] md:space-y-[-1vw]">
        <motion.h2
          style={{ x: xLine1 }}
          className="whitespace-nowrap font-display text-[18vw] font-black uppercase leading-[0.85] tracking-tighter text-foreground"
        >
          BLUEPRINTS
        </motion.h2>
        <motion.h2
          style={{ x: xLine2 }}
          className="whitespace-nowrap font-display text-[18vw] font-black uppercase leading-[0.85] tracking-tighter text-foreground"
        >
          BUILT FOR{" "}
          <span className="inline-block align-middle text-purple-500">
            ▶▶▶
          </span>
        </motion.h2>
        <motion.h2
          style={{ x: xLine3 }}
          className="whitespace-nowrap font-display text-[18vw] font-black uppercase leading-[0.85] tracking-tighter text-foreground"
        >
          <span className="inline-block align-middle text-purple-500">✿</span>{" "}
          CREATIVES
        </motion.h2>
      </div>

      {/* Cards row with parallax */}
      <motion.div
        style={{ y: yCards }}
        className="mx-auto mt-10 grid max-w-7xl grid-cols-1 gap-4 px-5 sm:grid-cols-2 md:mt-28 md:gap-6 md:px-6 md:grid-cols-3"
      >
        {cards.map((card, i) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
            className={`group relative h-[340px] md:h-[520px] overflow-hidden rounded-3xl border border-white/10 ${
              i === 2 ? "sm:col-span-2 md:col-span-1" : ""
            }`}
          >
            <img
              src={card.img}
              alt={card.title}
              width={1024}
              height={1024}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

            <div className="absolute inset-x-4 bottom-4 md:inset-x-5 md:bottom-5 rounded-2xl border border-white/15 bg-black/40 p-4 md:p-5 backdrop-blur-md">
              <h3 className="font-display text-lg md:text-3xl font-black uppercase tracking-tight text-white">
                {card.title}
              </h3>
              <p className="mt-1.5 md:mt-2 text-[12px] md:text-sm leading-relaxed text-white/75">
                {card.desc}
              </p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="mx-auto mt-10 md:mt-16 max-w-3xl px-5 md:px-6 text-center"
      >
        <p className="text-sm md:text-xl text-muted-foreground">
          Skip the trial and error. Blueprints are pre-designed templates that give you a structured starting point, saving time and ensuring your outputs stay consistent, polished, and on-brand.
        </p>
        <a
          href="#pricing"
          className="mt-6 md:mt-8 inline-flex items-center justify-center rounded-full bg-foreground px-6 py-3 md:px-8 md:py-4 font-display text-xs md:text-sm font-bold uppercase tracking-wider text-background transition-transform hover:scale-105"
        >
          Generate with Blueprints
        </a>
      </motion.div>
    </section>
  );
};

export default CreativeBlueprintsSection;
