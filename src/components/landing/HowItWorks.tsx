import { motion } from "framer-motion";
import type { ReactNode } from "react";

const iconClass = "h-full w-full text-value-ink";

const BoltIcon = () => (
  <svg viewBox="0 0 260 260" aria-hidden="true" className={iconClass} fill="currentColor">
    <path d="M116 24c-4 0-8 2-11 5l-75 75c-6 6-2 17 7 17h91c7 0 11 8 6 13L78 197c-9 10 3 25 14 18l136-91c8-5 4-18-6-18h-73c-8 0-12-9-7-15l55-51c7-6 2-16-7-16h-74Z" />
  </svg>
);

const HumanStarIcon = () => (
  <svg viewBox="0 0 260 260" aria-hidden="true" className={iconClass} fill="currentColor">
    <path d="M138 22c-54 0-69 50-82 105-3 12 7 23 19 23h16v33c0 9 7 16 16 16h89l-27-127c-7-33-17-50-31-50Z" />
    <path d="M124 101 114 82c-3-7 4-13 10-9l19 11 19-14c6-5 14 1 12 8l-5 23 20 14c6 4 3 13-4 14l-24 3-9 22c-3 7-12 7-16 1l-12-20-24-1c-7 0-10-9-5-14l18-16Z" fill="hsl(var(--value-yellow))" />
  </svg>
);

const BurstIcon = () => (
  <svg viewBox="0 0 260 260" aria-hidden="true" className={iconClass} fill="currentColor">
    <path d="M119 30c0-7 5-12 12-12s12 5 12 12v67l51-50c5-5 13-5 18 0s5 13 0 18l-48 48 65 10c7 1 12 8 11 15-1 7-8 12-15 11l-67-11 26 62c3 7 0 14-7 17-7 2-15-1-18-8l-28-66-27 66c-3 7-11 10-18 8-7-3-10-10-7-17l26-62-67 11c-7 1-14-4-15-11-1-7 4-14 11-15l65-10-48-48c-5-5-5-13 0-18s13-5 18 0l50 50V30Z" />
    <path d="M131 103c-22 0-40 18-40 40v73c0 7 5 12 12 12h56c7 0 12-5 12-12v-73c0-22-18-40-40-40Z" />
  </svg>
);

const ArrowIcon = () => (
  <svg viewBox="0 0 260 260" aria-hidden="true" className={iconClass} fill="currentColor">
    <path d="M121 26c5-5 13-5 18 0l81 73c9 9 3 24-10 24h-48l38 69c5 10-2 22-13 22H72c-11 0-18-12-13-22l39-69H50c-13 0-19-15-10-24l81-73Z" />
  </svg>
);

const FlowerCupIcon = () => (
  <svg viewBox="0 0 260 260" aria-hidden="true" className={iconClass} fill="currentColor">
    <path d="M82 31c-27 0-49 16-49 36s22 36 49 36c14 0 27-4 37-12 10 8 23 12 38 12 27 0 49-16 49-36s-22-36-49-36c-14 0-27 4-38 12-10-8-23-12-37-12Z" />
    <path d="M61 126c-8-8-22-2-22 10v47c0 25 20 45 45 45h91c25 0 45-20 45-45v-47c0-12-14-18-22-10l-39 39c-7 7-20 5-24-5l-7-18-7 18c-4 10-17 12-24 5l-36-39Z" />
  </svg>
);

const items = [
  {
    bg: "bg-value-yellow",
    icon: <BoltIcon />,
    title: "ONE PROMPT, EVERYTHING",
    desc: "Generate chat, images, video, slides, and full-stack apps from one prompt — no switching tools, no extra accounts.",
  },
  {
    bg: "bg-value-yellow",
    icon: <HumanStarIcon />,
    title: "INFINITE REMIX",
    desc: "Edit any output endlessly — restyle, upscale, animate, or convert formats while keeping your original safe.",
  },
  {
    bg: "bg-value-yellow",
    icon: <BurstIcon />,
    title: "AI CINEMA STUDIO",
    desc: "Turn a script into a full cinematic scene with lip-sync, voice acting, and consistent characters — built in.",
  },
  {
    bg: "bg-value-yellow",
    icon: <ArrowIcon />,
    title: "ONE MODEL, EVERY TASK",
    desc: "Megsy AI handles chat, images, video, slides, docs and code — one subscription, no juggling tools.",
  },
  {
    bg: "bg-value-yellow",
    icon: <FlowerCupIcon />,
    title: "PROMPT TO LIVE APP",
    desc: "Describe an idea and Megsy ships a deployed full-stack app — database, auth, and custom domain in minutes.",
  },
] satisfies Array<{ bg: string; icon: ReactNode; title: string; desc: string }>;

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="relative overflow-hidden bg-background py-14 md:py-32">
      <div className="mx-auto max-w-7xl px-5 md:px-6">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-10 md:mb-16 text-center"
        >
          <h2 className="font-display text-4xl font-black uppercase tracking-tight text-white md:text-8xl">
            ONLY ON MEGSY
          </h2>
          <p className="mx-auto mt-4 md:mt-6 max-w-2xl text-sm md:text-xl text-white/60">
            Features you won't find anywhere else — built to replace your entire creative stack with one workspace.
          </p>
        </motion.div>

        {/* Color blocks */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-5">
          {items.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.08 }}
              className={`group relative flex aspect-[0.85] md:aspect-[0.745] flex-col overflow-hidden rounded-lg ${step.bg} px-3 pb-3 pt-3 md:px-6 md:pb-6 md:pt-5 transition-transform duration-300 hover:-translate-y-2 ${
                i === 4 ? "col-span-2 sm:col-span-1 aspect-[1.7] md:aspect-[0.745]" : ""
              }`}
            >
              {/* Big icon filling top */}
              <div className="flex min-h-0 flex-1 items-center justify-center px-1 pb-1">
                <div className="h-[clamp(80px,28vw,300px)] md:h-[clamp(200px,17.5vw,300px)] w-full max-w-[305px] transition-transform duration-300 group-hover:scale-105">
                  {step.icon}
                </div>
              </div>

              {/* Text */}
              <div className="shrink-0 space-y-1.5 md:space-y-2 text-value-ink">
                <h3 className="font-display text-[13px] md:text-[clamp(1.1rem,1.55vw,1.55rem)] font-black uppercase leading-none tracking-normal">
                  {step.title}
                </h3>
                <p className="text-[11px] md:text-[clamp(0.86rem,0.96vw,1rem)] font-medium leading-[1.2] text-value-ink/75">
                  {step.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default HowItWorks;
