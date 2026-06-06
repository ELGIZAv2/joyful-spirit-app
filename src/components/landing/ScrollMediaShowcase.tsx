import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const firstSet = [
  { src: "/api-showcase/showcase-1.webp", type: "image" },
  { src: "/api-showcase/video-2.mp4", type: "video" },
  { src: "/api-showcase/showcase-2.webp", type: "image" },
  { src: "/api-showcase/video-3.mp4", type: "video" },
] as const;

const secondSet = [
  { src: "/api-showcase/showcase-3.webp", type: "image" },
  { src: "/api-showcase/video-4.mp4", type: "video" },
  { src: "/api-showcase/showcase-4.webp", type: "image" },
  { src: "/api-showcase/video-5.mp4", type: "video" },
] as const;

const ScrollMediaShowcase = () => {
  const ref = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  const firstOpacity = useTransform(scrollYProgress, [0, 0.22, 0.36], [1, 1, 0]);
  const firstScale = useTransform(scrollYProgress, [0, 0.36], [1, 1.55]);

  const secondOpacity = useTransform(scrollYProgress, [0.26, 0.46, 0.64], [0, 1, 0]);
  const secondScale = useTransform(scrollYProgress, [0.26, 0.64], [0.92, 1.46]);

  const finalOpacity = useTransform(scrollYProgress, [0.62, 0.8], [0, 1]);
  const finalScale = useTransform(scrollYProgress, [0.62, 0.9], [0.84, 1]);

  return (
    <section id="media-flow" ref={ref} className="relative h-[300vh] bg-background">
      <div className="sticky top-16 flex h-[calc(100vh-4rem)] items-center overflow-hidden border-y border-border bg-background">
        <div className="absolute inset-x-0 top-8 z-20 px-6 text-center">
          <h2 className="font-display text-[10vw] font-black uppercase leading-[0.85] tracking-tighter text-foreground md:text-[7vw]">
            VISUAL STORIES
          </h2>
        </div>

        <motion.div
          style={{ opacity: firstOpacity, scale: firstScale }}
          className="absolute inset-x-0 mx-auto grid w-full max-w-7xl grid-cols-1 gap-5 px-6 pt-28 md:grid-cols-2"
        >
          {firstSet.map((item, index) => (
            <div key={`first-${index}`} className="overflow-hidden rounded-3xl border border-border bg-card/40">
              {item.type === "video" ? (
                <video src={item.src} autoPlay loop muted playsInline preload="metadata" className="aspect-video w-full object-cover" />
              ) : (
                <img src={item.src} alt="Megsy media" loading="lazy" className="aspect-video w-full object-cover" />
              )}
            </div>
          ))}
        </motion.div>

        <motion.div
          style={{ opacity: secondOpacity, scale: secondScale }}
          className="absolute inset-x-0 mx-auto grid w-full max-w-7xl grid-cols-1 gap-5 px-6 pt-28 md:grid-cols-2"
        >
          {secondSet.map((item, index) => (
            <div key={`second-${index}`} className="overflow-hidden rounded-3xl border border-border bg-card/40">
              {item.type === "video" ? (
                <video src={item.src} autoPlay loop muted playsInline preload="metadata" className="aspect-video w-full object-cover" />
              ) : (
                <img src={item.src} alt="Megsy media" loading="lazy" className="aspect-video w-full object-cover" />
              )}
            </div>
          ))}
        </motion.div>

        <motion.div style={{ opacity: finalOpacity, scale: finalScale }} className="absolute inset-x-0 mx-auto w-full max-w-5xl px-6 pt-20">
          <div className="overflow-hidden rounded-[2rem] border border-border bg-card/50 p-3 md:p-4">
            <video
              src="/api-showcase/video-6.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="aspect-video w-full rounded-[1.5rem] object-cover"
            />
            <div className="px-3 pb-2 pt-5 text-center">
              <p className="font-display text-3xl font-black uppercase tracking-tight text-foreground md:text-5xl">
                CINEMATIC VIDEO OUTPUT
              </p>
              <p className="mt-2 text-sm text-muted-foreground md:text-base">
                Scroll-powered transition from image cards to a hero video reveal.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ScrollMediaShowcase;
