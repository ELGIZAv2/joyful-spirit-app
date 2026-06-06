import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import FancyButton from "@/components/branding/FancyButton";

interface FeatureBlockProps {
  bigText: string;
  title: string;
  description: string;
  media: string;
  mediaType?: "image" | "video";
  accentColor?: string;
  reverse?: boolean;
}

const FeatureBlock = ({
  bigText,
  title,
  description,
  media,
  mediaType = "image",
  accentColor = "text-primary",
  reverse = false,
}: FeatureBlockProps) => {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden py-24 md:py-40">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 1.1 }}
        className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center select-none overflow-hidden"
      >
        <span className={`font-display text-[28vw] font-black uppercase leading-[0.85] tracking-tighter ${accentColor} opacity-20 md:text-[22vw]`}>
          {bigText}
        </span>
      </motion.div>

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <div className={`flex flex-col items-center gap-12 lg:gap-20 ${reverse ? "lg:flex-row-reverse" : "lg:flex-row"}`}>
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 60 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            className="w-full flex-1"
          >
            <div className="relative overflow-hidden rounded-3xl border border-border bg-card/30 shadow-xl">
              {mediaType === "video" ? (
                <video src={media} autoPlay loop muted playsInline preload="metadata" className="aspect-video w-full object-cover" />
              ) : (
                <img src={media} alt={title} className="aspect-video w-full object-cover" loading="lazy" />
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: reverse ? -80 : 80 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.85, delay: 0.15 }}
            className="w-full flex-1"
          >
            <h2 className="mb-6 font-display text-5xl font-black uppercase leading-[0.9] tracking-tight text-foreground md:text-7xl lg:text-8xl">
              {title}
            </h2>
            <p className="mb-8 text-lg leading-relaxed text-muted-foreground md:text-xl lg:text-2xl">
              {description}
            </p>

            <div className="flex flex-wrap gap-4">
              <FancyButton onClick={() => navigate("/auth")} className="text-base">
                Start now
              </FancyButton>
              <button
                onClick={() => navigate("/auth")}
                className="rounded-full border border-border bg-card/30 px-7 py-3 text-sm font-medium text-foreground/80 transition-all hover:border-foreground/40 hover:text-foreground"
              >
                Learn more
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default FeatureBlock;
