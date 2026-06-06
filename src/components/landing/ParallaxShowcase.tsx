import { motion } from "framer-motion";
import LazyVideo from "@/components/landing/LazyVideo";

const ParallaxShowcase = () => {
  return (
    <section className="py-20 md:py-32">
      <div className="mx-auto mb-12 max-w-7xl px-6 text-center">
        <motion.h2
          id="anchor-depth"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="font-display text-[10vw] font-black uppercase leading-[0.85] tracking-tighter text-foreground md:text-[6vw]"
        >
          DEPTH OF{" "}
          <span className="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
            CREATION
          </span>
        </motion.h2>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 60, scale: 0.95 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto w-full max-w-5xl px-6"
      >
        <div className="overflow-hidden rounded-2xl border border-border/40 bg-background md:rounded-[2rem]">
          <LazyVideo src="/api-showcase/showcase-main.mp4" className="aspect-video w-full" />
        </div>
      </motion.div>
    </section>
  );
};

export default ParallaxShowcase;
