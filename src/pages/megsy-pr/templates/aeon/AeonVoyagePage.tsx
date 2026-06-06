import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

const HERO_VIDEO =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260418_080021_d598092b-c4c2-4e53-8e46-94cf9064cd50.mp4";
const CAP_VIDEO =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260418_094631_d30ab262-45ee-4b7d-99f3-5d5848c8ef13.mp4";

const FONT_HEAD = "'Instrument Serif', serif";
const FONT_BODY = "'Barlow', sans-serif";

const GLOBAL_CSS = `
.aeon-root { font-family: 'Barlow', sans-serif; }
.aeon-glass {
  background: rgba(255,255,255,0.01);
  background-blend-mode: luminosity;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  border: none;
  box-shadow: inset 0 1px 1px rgba(255,255,255,0.1);
  position: relative;
  overflow: hidden;
}
.aeon-glass::before {
  content: "";
  position: absolute; inset: 0;
  border-radius: inherit;
  padding: 1.4px;
  background: linear-gradient(180deg,
    rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.15) 20%,
    rgba(255,255,255,0) 40%, rgba(255,255,255,0) 60%,
    rgba(255,255,255,0.15) 80%, rgba(255,255,255,0.45) 100%);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
          mask-composite: exclude;
  pointer-events: none;
}
.aeon-glass-strong {
  background: rgba(255,255,255,0.01);
  background-blend-mode: luminosity;
  backdrop-filter: blur(50px);
  -webkit-backdrop-filter: blur(50px);
  border: none;
  box-shadow: 4px 4px 4px rgba(0,0,0,0.05), inset 0 1px 1px rgba(255,255,255,0.15);
  position: relative;
  overflow: hidden;
}
.aeon-glass-strong::before {
  content: "";
  position: absolute; inset: 0;
  border-radius: inherit;
  padding: 1.4px;
  background: linear-gradient(180deg,
    rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.2) 20%,
    rgba(255,255,255,0) 40%, rgba(255,255,255,0) 60%,
    rgba(255,255,255,0.2) 80%, rgba(255,255,255,0.5) 100%);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
          mask-composite: exclude;
  pointer-events: none;
}
`;

/* ===== FadingVideo ===== */
function FadingVideo({
  src,
  className,
  style,
}: {
  src: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const rafRef = useRef<number | null>(null);
  const fadingOutRef = useRef(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const FADE_MS = 500;
    const FADE_OUT_LEAD = 0.55;

    const fadeTo = (target: number, duration: number) => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      const start = parseFloat(video.style.opacity || "0") || 0;
      const t0 = performance.now();
      const step = (now: number) => {
        const p = Math.min(1, (now - t0) / duration);
        video.style.opacity = String(start + (target - start) * p);
        if (p < 1) rafRef.current = requestAnimationFrame(step);
      };
      rafRef.current = requestAnimationFrame(step);
    };

    const onLoaded = () => {
      video.style.opacity = "0";
      video.play().catch(() => {});
      fadeTo(1, FADE_MS);
    };
    const onTime = () => {
      if (
        !fadingOutRef.current &&
        video.duration - video.currentTime <= FADE_OUT_LEAD &&
        video.duration - video.currentTime > 0
      ) {
        fadingOutRef.current = true;
        fadeTo(0, FADE_MS);
      }
    };
    const onEnded = () => {
      video.style.opacity = "0";
      setTimeout(() => {
        video.currentTime = 0;
        video.play().catch(() => {});
        fadingOutRef.current = false;
        fadeTo(1, FADE_MS);
      }, 100);
    };

    video.addEventListener("loadeddata", onLoaded);
    video.addEventListener("timeupdate", onTime);
    video.addEventListener("ended", onEnded);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      video.removeEventListener("loadeddata", onLoaded);
      video.removeEventListener("timeupdate", onTime);
      video.removeEventListener("ended", onEnded);
    };
  }, []);

  return (
    <video
      ref={videoRef}
      src={src}
      autoPlay
      muted
      playsInline
      preload="auto"
      className={className}
      style={{ opacity: 0, ...style }}
    />
  );
}

/* ===== BlurText ===== */
function BlurText({ text, className, style }: { text: string; className?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  const words = text.split(" ");
  return (
    <p
      ref={ref}
      className={className}
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        rowGap: "0.1em",
        ...style,
      }}
    >
      {words.map((w, i) => (
        <motion.span
          key={i}
          initial={{ filter: "blur(10px)", opacity: 0, y: 50 }}
          animate={
            visible
              ? {
                  filter: ["blur(10px)", "blur(5px)", "blur(0px)"],
                  opacity: [0, 0.5, 1],
                  y: [50, -5, 0],
                }
              : {}
          }
          transition={{
            duration: 0.7,
            times: [0, 0.5, 1],
            ease: "easeOut",
            delay: (i * 100) / 1000,
          }}
          style={{ display: "inline-block", marginRight: "0.28em" }}
        >
          {w}
        </motion.span>
      ))}
    </p>
  );
}

/* ===== Icons ===== */
const ArrowUpRight = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 17L17 7" />
    <path d="M7 7h10v10" />
  </svg>
);
const PlayIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <polygon points="6 4 20 12 6 20 6 4" />
  </svg>
);
const ClockIcon = () => (
  <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);
const GlobeIcon = () => (
  <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18" />
    <path d="M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0-18" />
  </svg>
);

/* ===== Page ===== */
export default function AeonVoyagePage() {
  return (
    <div className="aeon-root bg-black text-white min-h-screen w-full overflow-x-hidden">
      <style>{GLOBAL_CSS}</style>

      {/* HERO */}
      <section className="relative w-full h-screen overflow-hidden bg-black">
        <FadingVideo
          src={HERO_VIDEO}
          className="absolute left-1/2 top-0 -translate-x-1/2 object-cover object-top z-0"
          style={{ width: "120%", height: "120%" }}
        />

        <div className="relative z-10 h-full flex flex-col">
          {/* Navbar */}
          <div className="fixed top-4 left-0 right-0 px-8 lg:px-16 z-50 flex items-center justify-between">
            <div className="aeon-glass w-12 h-12 rounded-full flex items-center justify-center">
              <span style={{ fontFamily: FONT_HEAD, fontStyle: "italic" }} className="text-2xl text-white lowercase">
                a
              </span>
            </div>
            <div className="aeon-glass hidden md:flex rounded-full px-1.5 py-1.5 items-center gap-1">
              {["Home", "Voyages", "Worlds", "Innovation", "Plan Launch"].map((l) => (
                <a
                  key={l}
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="px-3 py-2 text-sm font-medium text-white/90"
                  style={{ fontFamily: FONT_BODY }}
                >
                  {l}
                </a>
              ))}
              <button
                className="ml-1 inline-flex items-center gap-1.5 bg-white text-black rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap"
              >
                Claim a Spot
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
            <div className="w-12 h-12" aria-hidden />
          </div>

          {/* Hero content */}
          <div className="flex-1 flex flex-col items-center justify-center text-center pt-24 px-4">
            <motion.div
              initial={{ filter: "blur(10px)", opacity: 0, y: 20 }}
              animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: "easeOut", delay: 0.4 }}
              className="aeon-glass rounded-full inline-flex items-center gap-2 pr-3 p-1"
            >
              <span className="bg-white text-black rounded-full px-3 py-1 text-xs font-semibold">New</span>
              <span className="text-sm text-white/90">Maiden Crewed Voyage to Mars Arrives 2026</span>
            </motion.div>

            <div className="mt-6 max-w-2xl">
              <BlurText
                text="Venture Past Our Sky Across the Universe"
                className="text-6xl md:text-7xl lg:text-[5.5rem] text-white"
                style={{
                  fontFamily: FONT_HEAD,
                  fontStyle: "italic",
                  lineHeight: 0.8,
                  letterSpacing: "-4px",
                }}
              />
            </div>

            <motion.p
              initial={{ filter: "blur(10px)", opacity: 0, y: 20 }}
              animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: "easeOut", delay: 0.8 }}
              className="mt-4 text-sm md:text-base text-white max-w-2xl font-light leading-tight"
              style={{ fontFamily: FONT_BODY }}
            >
              Discover the universe in ways once unimaginable. Our pioneering vessels and breakthrough engineering bring deep-space exploration within reach—secure and extraordinary.
            </motion.p>

            <motion.div
              initial={{ filter: "blur(10px)", opacity: 0, y: 20 }}
              animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: "easeOut", delay: 1.1 }}
              className="flex items-center gap-6 mt-6"
            >
              <button className="aeon-glass-strong rounded-full px-5 py-2.5 text-sm font-medium text-white inline-flex items-center gap-2">
                Start Your Voyage
                <ArrowUpRight className="h-5 w-5" />
              </button>
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                className="inline-flex items-center gap-2 text-sm font-medium text-white"
              >
                View Liftoff
                <PlayIcon className="h-4 w-4" />
              </a>
            </motion.div>

            <motion.div
              initial={{ filter: "blur(10px)", opacity: 0, y: 20 }}
              animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: "easeOut", delay: 1.3 }}
              className="flex items-stretch gap-4 mt-8"
            >
              {[
                { icon: <ClockIcon />, value: "34.5 Min", label: "Average Videos Watch Time" },
                { icon: <GlobeIcon />, value: "2.8B+", label: "Users Across the Globe" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="aeon-glass p-5 w-[220px] flex flex-col items-start text-left"
                  style={{ borderRadius: "1.25rem" }}
                >
                  <div className="text-white">{s.icon}</div>
                  <div
                    className="text-4xl text-white mt-3"
                    style={{
                      fontFamily: FONT_HEAD,
                      fontStyle: "italic",
                      letterSpacing: "-1px",
                      lineHeight: 1,
                    }}
                  >
                    {s.value}
                  </div>
                  <div className="text-xs text-white font-light mt-2" style={{ fontFamily: FONT_BODY }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Partners */}
          <motion.div
            initial={{ filter: "blur(10px)", opacity: 0, y: 20 }}
            animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 1.4 }}
            className="flex flex-col items-center gap-4 pb-8"
          >
            <span className="aeon-glass rounded-full px-3.5 py-1 text-xs font-medium text-white">
              Collaborating with top aerospace pioneers globally
            </span>
            <div className="flex items-center gap-12 md:gap-16 flex-wrap justify-center">
              {["Aeon", "Vela", "Apex", "Orbit", "Zeno"].map((n) => (
                <span
                  key={n}
                  className="text-2xl md:text-3xl text-white"
                  style={{ fontFamily: FONT_HEAD, fontStyle: "italic", letterSpacing: "-0.01em" }}
                >
                  {n}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CAPABILITIES */}
      <section className="relative w-full min-h-screen overflow-hidden bg-black">
        <FadingVideo src={CAP_VIDEO} className="absolute inset-0 w-full h-full object-cover z-0" />
        <div className="relative z-10 px-8 md:px-16 lg:px-20 pt-24 pb-10 flex flex-col min-h-screen">
          <div className="mb-auto">
            <p className="text-sm text-white/80 mb-6" style={{ fontFamily: FONT_BODY }}>
              // Capabilities
            </p>
            <h2
              className="text-white text-6xl md:text-7xl lg:text-[6rem]"
              style={{
                fontFamily: FONT_HEAD,
                fontStyle: "italic",
                lineHeight: 0.9,
                letterSpacing: "-3px",
              }}
            >
              Production
              <br />
              evolved
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
            {[
              {
                tags: ["Natural Context", "Photo Realism", "Infinite Settings", "Eco-Vibe"],
                title: "AI Scenery",
                body:
                  "AI analyzes your product to create indistinguishable natural environments — from Icelandic cliffs to misty forests.",
                icon: (
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M5 21q-.825 0-1.412-.587T3 19V5q0-.825.588-1.412T5 3h14q.825 0 1.413.588T21 5v14q0 .825-.587 1.413T19 21H5Zm1-4h12l-3.75-5-3 4L9 13l-3 4Z" />
                  </svg>
                ),
              },
              {
                tags: ["Scale Fast", "Visual Consistency", "Time Saver", "Ready to Post"],
                title: "Batch Production",
                body:
                  "Style your entire product line in minutes. Create a unified visual identity for catalogues and social media without weeks of retouching.",
                icon: (
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M4 6.47 5.76 10H20v8H4V6.47M22 4h-4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.89-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4Z" />
                  </svg>
                ),
              },
              {
                tags: ["Ray Tracing", "Physical Shadows", "Studio Quality", "Sunlight Sync"],
                title: "Smart Lighting",
                body:
                  "Automatic lighting and material adjustment. Achieve flawless integration with realistic shadows and sunlight.",
                icon: (
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1Zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7Z" />
                  </svg>
                ),
              },
            ].map((card) => (
              <div
                key={card.title}
                className="aeon-glass p-6 min-h-[360px] flex flex-col"
                style={{ borderRadius: "1.25rem" }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div
                    className="aeon-glass w-11 h-11 flex items-center justify-center text-white"
                    style={{ borderRadius: "0.75rem" }}
                  >
                    {card.icon}
                  </div>
                  <div className="flex flex-wrap justify-end gap-1.5 max-w-[70%]">
                    {card.tags.map((t) => (
                      <span
                        key={t}
                        className="aeon-glass rounded-full px-3 py-1 text-[11px] text-white/90 whitespace-nowrap"
                        style={{ fontFamily: FONT_BODY }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex-1" />
                <div className="mt-6">
                  <h3
                    className="text-white text-3xl md:text-4xl"
                    style={{
                      fontFamily: FONT_HEAD,
                      fontStyle: "italic",
                      letterSpacing: "-1px",
                      lineHeight: 1,
                    }}
                  >
                    {card.title}
                  </h3>
                  <p
                    className="mt-3 text-sm text-white/90 font-light leading-snug max-w-[32ch]"
                    style={{ fontFamily: FONT_BODY }}
                  >
                    {card.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
