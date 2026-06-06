import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import FancyButton from "@/components/branding/FancyButton";
import TryBeforeSignup from "@/components/landing/TryBeforeSignup";
import { useLandingContent } from "@/lib/landing/LandingContentContext";

const heroVideos = [
  { src: "/hero/video-1.mp4", poster: "/hero/video-1.webp", rotate: -6, y: 40 },
  { src: "/hero/video-2.mp4", poster: "/hero/video-2.webp", rotate: -3, y: 15 },
  { src: "/hero/video-4.mp4", poster: "/hero/video-4.webp", rotate: 0, y: 0, center: true },
  { src: "/hero/video-3.mp4", poster: "/hero/video-3.webp", rotate: 3, y: 15 },
  { src: "/hero/bear.mp4", poster: "/hero/bear.webp", rotate: 6, y: 40 },
];

const HeroSection = () => {
  const navigate = useNavigate();
  const { content } = useLandingContent();
  const { hero } = content;

  return (
    <section className="relative flex min-h-[auto] flex-col items-center overflow-hidden bg-background pt-40 pb-0 md:min-h-screen md:pt-44">
      <div className="relative z-30 mx-auto w-full px-4 text-center">
        <motion.h1
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          className="font-display text-[9vw] uppercase leading-[0.95] tracking-tight text-foreground md:text-[5.5vw]"

        >
          {hero.h1Pre}{" "}
          <span id="anchor-hero-now" className="text-primary">{hero.h1Highlight}</span>
        </motion.h1>


        <motion.p
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mt-3 max-w-2xl px-2 text-[13px] leading-snug text-muted-foreground md:mt-6 md:text-lg"
        >
          {hero.subtitle}
        </motion.p>






        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row md:mt-8 md:gap-4"
        >
          <button
            onClick={() => navigate("/auth")}
            className="group relative rounded-full p-[2px] overflow-hidden transition-transform hover:scale-[1.03]"
            style={{
              background:
                "conic-gradient(from var(--angle, 0deg), #c0c0c0, #ffffff, #8a8a8a, #ffffff, #c0c0c0)",
              animation: "silver-spin 4s linear infinite",
            }}
          >
            <span className="relative block rounded-full bg-black px-8 py-3 text-sm font-semibold text-white md:px-10 md:py-4 md:text-base">
              {hero.ctaPrimary}
            </span>
          </button>
        </motion.div>

        <TryBeforeSignup />

      </div>

      <div className="relative z-0 mt-8 flex w-full max-w-[1500px] items-end justify-center gap-2 px-4 pb-4 md:mt-10 md:gap-5">
        {heroVideos.map((vid, i) => {
          const isEdge = Math.abs(vid.rotate) > 3;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 100, rotate: vid.rotate }}
              animate={{ opacity: 1, y: vid.y, rotate: vid.rotate }}
              transition={{ duration: 0.7, delay: 0.45 + i * 0.1, ease: "easeOut" }}
              className={`relative overflow-hidden rounded-xl border border-border/30 shadow-2xl md:rounded-2xl ${
                isEdge ? "hidden md:block" : ""
              } ${
                vid.center
                  ? "w-[34%] md:w-[20%] z-[3]"
                  : Math.abs(vid.rotate) <= 3
                  ? "w-[30%] md:w-[18%] z-[2]"
                  : "w-[15%] z-[1]"
              }`}
              style={{ aspectRatio: "3/4" }}
            >
              <video
                src={vid.src}
                poster={vid.poster}
                preload={vid.center ? "metadata" : "none"}
                autoPlay loop muted playsInline
                className="absolute inset-0 h-full w-full object-cover"
              />
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};

export default HeroSection;
