import { motion } from "framer-motion";
import { useState } from "react";
import LazyVideo from "@/components/landing/LazyVideo";

const categories = [
  {
    label: "Image Models",
    description: "Generate stunning visuals with the world's most powerful image AI models.",
    items: [
      { src: "/showcase/img-1.webp", model: "Nano Banana Pro", type: "image" },
      { src: "/showcase/img-2.webp", model: "GPT-Image 2", type: "image" },
      { src: "/showcase/img-3.webp", model: "Nano Banana 2", type: "image" },
      { src: "/showcase/img-4.webp", model: "Gemini 3 Pro Image", type: "image" },
      { src: "/showcase/img-5.webp", model: "Recraft V4", type: "image" },
      { src: "/showcase/img-6.webp", model: "Ideogram 3", type: "image" },
    ],
  },
  {
    label: "Video Models",
    description: "Create cinematic videos from text or images with cutting-edge video AI.",
    items: [
      { src: "/showcase/vid-1.mp4", model: "Megsy Video", type: "video" },
      { src: "/showcase/vid-2.mp4", model: "Veo 3.1", type: "video" },
      { src: "/showcase/vid-3.mp4", model: "Kling 3.0 Pro", type: "video" },
      { src: "/showcase/vid-4.mp4", model: "Runway Gen-4", type: "video" },
      { src: "/showcase/vid-5.mp4", model: "Sora", type: "video" },
      { src: "/showcase/vid-6.mp4", model: "Pika 2.2", type: "video" },
    ],
  },
];

const ShowcaseGallery = () => {
  const [activeTab, setActiveTab] = useState(0);
  const current = categories[activeTab];

  return (
    <section className="relative overflow-hidden py-24 md:py-40">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="mx-auto mb-10 max-w-[95vw] px-6 text-center"
      >
        <h2 className="font-display text-[13vw] font-black uppercase leading-[0.85] tracking-tighter text-foreground md:text-[10vw]">
          BUILT FOR MAKERS
        </h2>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mx-auto mb-6 max-w-md px-6"
      >
        <div className="flex items-center justify-center gap-2 rounded-full border border-border bg-card/40 p-2">
          {categories.map((cat, i) => (
            <button
              key={cat.label}
              onClick={() => setActiveTab(i)}
              className={`flex-1 rounded-full px-5 py-2.5 text-sm font-bold uppercase tracking-wider transition-all md:text-base ${
                activeTab === i ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </motion.div>

      <motion.p key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto mb-10 max-w-2xl px-6 text-center text-lg text-muted-foreground">
        {current.description}
      </motion.p>

      <div className="mx-auto max-w-7xl px-6">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }} className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5">
          {current.items.map((item, i) => (
            <motion.div
              key={`${activeTab}-${i}`}
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.45, delay: i * 0.08 }}
              className="group relative overflow-hidden rounded-2xl border border-border"
            >
              {item.type === "video" ? (
                <LazyVideo src={item.src} className="aspect-[4/5] w-full" />
              ) : (
                <img src={item.src} alt={item.model} className="aspect-[4/5] w-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/85 to-transparent p-4 pt-16 md:p-6 md:pt-20">
                <p className="text-xs font-bold text-foreground md:text-sm">{item.model}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default ShowcaseGallery;
