import { motion } from "framer-motion";

const models = [
  { name: "Megsy AI", flagship: true },
  { name: "Megsy Lite" },
  { name: "Megsy Pro" },
  { name: "Megsy Image" },
  { name: "Megsy Video" },
  { name: "Megsy Slides" },
  { name: "Megsy Docs" },
  { name: "Megsy Code" },
  { name: "Megsy Research" },
  { name: "Megsy OS" },
];

const StatsMarquee = () => {
  const items = [...models, ...models, ...models, ...models];

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7 }}
      className="relative overflow-hidden border-y border-border/10 bg-background py-5 md:py-8 mt-10 md:mt-16"
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 md:w-40 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 md:w-40 bg-gradient-to-l from-background to-transparent" />
      <div className="landing-marquee">
        <div className="landing-marquee-track" style={{ animationDuration: "60s" }}>
          {items.map((m, i) => (
            <span
              key={i}
              className={`inline-flex items-center whitespace-nowrap px-5 md:px-12 text-lg md:text-3xl font-bold tracking-tight ${
                m.flagship
                  ? "font-display text-primary text-xl md:text-4xl"
                  : "text-muted-foreground/30"
              }`}
            >
              {m.name}
            </span>
          ))}
        </div>

      </div>
    </motion.section>
  );
};

export default StatsMarquee;
