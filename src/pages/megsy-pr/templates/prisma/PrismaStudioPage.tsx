import { useRef } from "react";
import { motion, useInView, useScroll, useTransform, MotionValue } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";

const PRIMARY = "#E1E0CC";
const ACCENT = "#DEDBC8";

const NOISE_OVERLAY =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(#n)' opacity='0.55'/></svg>`
  );
const NOISE_BG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(#n)' opacity='0.5'/></svg>`
  );

const FONT_BODY = "'Almarai', system-ui, sans-serif";
const FONT_SERIF = "'Instrument Serif', serif";

/* ============ Animation helpers ============ */

function WordsPullUp({
  text,
  className = "",
  showAsterisk = false,
  delayBase = 0,
  style,
}: {
  text: string;
  className?: string;
  showAsterisk?: boolean;
  delayBase?: number;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const words = text.split(" ");
  return (
    <div ref={ref} className={className} style={style}>
      {words.map((w, i) => {
        const isLast = i === words.length - 1;
        return (
          <span key={i} className="inline-block overflow-hidden align-bottom">
            <motion.span
              className="inline-block relative"
              initial={{ y: 20, opacity: 0 }}
              animate={inView ? { y: 0, opacity: 1 } : {}}
              transition={{
                duration: 0.7,
                delay: delayBase + i * 0.08,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              {w}
              {showAsterisk && isLast && (
                <span
                  className="absolute"
                  style={{
                    top: "0.65em",
                    right: "-0.3em",
                    fontSize: "0.31em",
                  }}
                >
                  *
                </span>
              )}
              {i < words.length - 1 && "\u00A0"}
            </motion.span>
          </span>
        );
      })}
    </div>
  );
}

function WordsPullUpMultiStyle({
  segments,
  className = "",
  style,
}: {
  segments: { text: string; className?: string; style?: React.CSSProperties }[];
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const all: { word: string; className?: string; style?: React.CSSProperties }[] = [];
  segments.forEach((seg) => {
    seg.text.split(" ").forEach((w) => all.push({ word: w, className: seg.className, style: seg.style }));
  });
  return (
    <div ref={ref} className={className} style={style}>
      <span className="inline-flex flex-wrap justify-center">
        {all.map((item, i) => (
          <span key={i} className="inline-block overflow-hidden align-bottom mr-[0.25em]">
            <motion.span
              className={`inline-block ${item.className ?? ""}`}
              style={item.style}
              initial={{ y: 20, opacity: 0 }}
              animate={inView ? { y: 0, opacity: 1 } : {}}
              transition={{ duration: 0.7, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
            >
              {item.word}
            </motion.span>
          </span>
        ))}
      </span>
    </div>
  );
}

function AnimatedLetter({
  char,
  progress,
  index,
  total,
}: {
  char: string;
  progress: MotionValue<number>;
  index: number;
  total: number;
}) {
  const charProgress = index / total;
  const opacity = useTransform(progress, [charProgress - 0.1, charProgress + 0.05], [0.2, 1]);
  return <motion.span style={{ opacity }}>{char}</motion.span>;
}

function ScrollRevealText({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.8", "end 0.2"],
  });
  const chars = text.split("");
  return (
    <p ref={ref} className={className} style={{ color: ACCENT }}>
      {chars.map((c, i) => (
        <AnimatedLetter key={i} char={c} index={i} total={chars.length} progress={scrollYProgress} />
      ))}
    </p>
  );
}

/* ============ Cards ============ */

function FeatureCard({
  children,
  delay,
  className = "",
}: {
  children: React.ReactNode;
  delay: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={inView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={`relative overflow-hidden rounded-2xl ${className}`}
    >
      {children}
    </motion.div>
  );
}

function ChecklistItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-gray-400 text-xs sm:text-sm">
      <Check size={16} style={{ color: ACCENT }} className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </li>
  );
}

function LearnMore() {
  return (
    <a
      href="#"
      onClick={(e) => e.preventDefault()}
      className="inline-flex items-center gap-2 text-xs sm:text-sm mt-4"
      style={{ color: ACCENT }}
    >
      Learn more
      <ArrowRight size={14} style={{ transform: "rotate(-45deg)" }} />
    </a>
  );
}

/* ============ Page ============ */

export default function PrismaStudioPage() {
  return (
    <div style={{ fontFamily: FONT_BODY, background: "#000", color: PRIMARY }} className="min-h-screen">
      {/* HERO */}
      <section className="h-screen p-4 md:p-6">
        <div className="relative w-full h-full rounded-2xl md:rounded-[2rem] overflow-hidden">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260405_170732_8a9ccda6-5cff-4628-b164-059c500a2b41.mp4"
          />
          <div
            className="absolute inset-0 opacity-[0.7] mix-blend-overlay pointer-events-none"
            style={{ backgroundImage: `url("${NOISE_OVERLAY}")` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />

          {/* Navbar */}
          <nav className="absolute top-0 left-1/2 -translate-x-1/2 bg-black rounded-b-2xl md:rounded-b-3xl px-4 py-2 md:px-8 z-20">
            <ul className="flex items-center gap-3 sm:gap-6 md:gap-12 lg:gap-14 text-[10px] sm:text-xs md:text-sm">
              {["Our story", "Collective", "Workshops", "Programs", "Inquiries"].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    style={{ color: "rgba(225,224,204,0.8)", transition: "color 200ms" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = PRIMARY)}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(225,224,204,0.8)")}
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Hero content */}
          <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8">
            <div className="grid grid-cols-12 gap-4 items-end">
              <div className="col-span-12 lg:col-span-8">
                <WordsPullUp
                  text="Prisma"
                  showAsterisk
                  className="text-[26vw] sm:text-[24vw] md:text-[22vw] lg:text-[20vw] xl:text-[19vw] 2xl:text-[20vw] font-medium leading-[0.85] tracking-[-0.07em]"
                  style={{ color: PRIMARY }}
                />
              </div>
              <div className="col-span-12 lg:col-span-4 flex flex-col gap-4 pb-4">
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="text-primary/70 text-xs sm:text-sm md:text-base"
                  style={{ color: "rgba(222,219,200,0.7)", lineHeight: 1.2 }}
                >
                  Prisma is a worldwide network of visual artists, filmmakers and storytellers bound not by
                  place, status or labels but by passion and hunger to unlock potential through our unique
                  perspectives.
                </motion.p>
                <motion.button
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  className="group inline-flex items-center gap-2 hover:gap-3 transition-all rounded-full pl-5 pr-1.5 py-1.5 self-start font-medium text-sm sm:text-base"
                  style={{ background: ACCENT, color: "#000" }}
                >
                  Join the lab
                  <span
                    className="bg-black rounded-full w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center transition-transform group-hover:scale-110"
                  >
                    <ArrowRight size={18} style={{ color: PRIMARY }} />
                  </span>
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section className="bg-black px-4 md:px-6 py-20 md:py-32">
        <div
          className="rounded-2xl md:rounded-[2rem] max-w-6xl mx-auto px-6 py-16 md:py-24 text-center"
          style={{ background: "#101010" }}
        >
          <p className="text-[10px] sm:text-xs mb-6" style={{ color: ACCENT }}>
            Visual arts
          </p>
          <WordsPullUpMultiStyle
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl max-w-3xl mx-auto leading-[0.95] sm:leading-[0.9]"
            style={{ color: PRIMARY }}
            segments={[
              { text: "I am Marcus Chen,", className: "font-normal" },
              {
                text: "a self-taught director.",
                className: "italic",
                style: { fontFamily: FONT_SERIF },
              },
              {
                text: "I have skills in color grading, visual effects, and narrative design.",
                className: "font-normal",
              },
            ]}
          />
          <div className="mt-10 max-w-2xl mx-auto">
            <ScrollRevealText
              className="text-xs sm:text-sm md:text-base"
              text="Over the last seven years, I have worked with Parallax, a Berlin-based production house that crafts cinema, series, and Noir Studio in Paris. Together, we have created work that has earned international acclaim at several major festivals."
            />
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="relative min-h-screen bg-black px-4 md:px-6 py-20 md:py-32">
        <div
          className="absolute inset-0 opacity-[0.15] pointer-events-none"
          style={{ backgroundImage: `url("${NOISE_BG}")` }}
        />
        <div className="relative max-w-7xl mx-auto">
          <WordsPullUpMultiStyle
            className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-normal text-center max-w-4xl mx-auto mb-16"
            segments={[
              { text: "Studio-grade workflows for visionary creators.", style: { color: PRIMARY } },
              { text: "Built for pure vision. Powered by art.", className: "text-gray-500" },
            ]}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-2 md:gap-1 lg:h-[480px]">
            {/* Card 1 */}
            <FeatureCard delay={0} className="min-h-[300px] lg:min-h-0">
              <video
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
                src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260406_133058_0504132a-0cf3-4450-a370-8ea3b05c95d4.mp4"
              />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <p className="text-lg sm:text-xl font-medium" style={{ color: PRIMARY }}>
                  Your creative canvas.
                </p>
              </div>
            </FeatureCard>

            {/* Card 2 */}
            <FeatureCard delay={0.15} className="p-5 sm:p-6 min-h-[300px] lg:min-h-0" >
              <div style={{ background: "#212121" }} className="absolute inset-0" />
              <div className="relative h-full flex flex-col">
                <img
                  src="https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260405_171918_4a5edc79-d78f-4637-ac8b-53c43c220606.png&w=1280&q=85"
                  alt=""
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover mb-4"
                />
                <h3 className="text-base sm:text-lg font-medium mb-3" style={{ color: PRIMARY }}>
                  Project Storyboard. <span className="text-gray-500">01</span>
                </h3>
                <ul className="space-y-2 flex-1">
                  <ChecklistItem>Scene-by-scene shot planning</ChecklistItem>
                  <ChecklistItem>Visual mood references and pacing</ChecklistItem>
                  <ChecklistItem>Collaborative review threads</ChecklistItem>
                  <ChecklistItem>Export to PDF and treatment decks</ChecklistItem>
                </ul>
                <LearnMore />
              </div>
            </FeatureCard>

            {/* Card 3 */}
            <FeatureCard delay={0.3} className="p-5 sm:p-6 min-h-[300px] lg:min-h-0">
              <div style={{ background: "#212121" }} className="absolute inset-0" />
              <div className="relative h-full flex flex-col">
                <img
                  src="https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260405_171741_ed9845ab-f5b2-4018-8ce7-07cc01823522.png&w=1280&q=85"
                  alt=""
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover mb-4"
                />
                <h3 className="text-base sm:text-lg font-medium mb-3" style={{ color: PRIMARY }}>
                  Smart Critiques. <span className="text-gray-500">02</span>
                </h3>
                <ul className="space-y-2 flex-1">
                  <ChecklistItem>AI scene analysis with cinematic context</ChecklistItem>
                  <ChecklistItem>Creative notes tuned to your style</ChecklistItem>
                  <ChecklistItem>Direct integrations with your tools</ChecklistItem>
                </ul>
                <LearnMore />
              </div>
            </FeatureCard>

            {/* Card 4 */}
            <FeatureCard delay={0.45} className="p-5 sm:p-6 min-h-[300px] lg:min-h-0">
              <div style={{ background: "#212121" }} className="absolute inset-0" />
              <div className="relative h-full flex flex-col">
                <img
                  src="https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260405_171809_f56666dc-c099-4778-ad82-9ad4f209567b.png&w=1280&q=85"
                  alt=""
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover mb-4"
                />
                <h3 className="text-base sm:text-lg font-medium mb-3" style={{ color: PRIMARY }}>
                  Immersion Capsule. <span className="text-gray-500">03</span>
                </h3>
                <ul className="space-y-2 flex-1">
                  <ChecklistItem>Silence notifications during deep work</ChecklistItem>
                  <ChecklistItem>Ambient soundscapes tuned to your scene</ChecklistItem>
                  <ChecklistItem>Auto-sync focus blocks to your schedule</ChecklistItem>
                </ul>
                <LearnMore />
              </div>
            </FeatureCard>
          </div>
        </div>
      </section>
    </div>
  );
}
