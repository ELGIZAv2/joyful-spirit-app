import { useEffect, useState } from "react";

const VIDEO =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260403_050628_c4e32401-fab4-4a27-b7a8-6e9291cd5959.mp4";

const GLASS_CSS = `
.vex-glass {
  background: rgba(0, 0, 0, 0.4);
  background-blend-mode: luminosity;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  border: none;
  box-shadow: inset 0 1px 1px rgba(255,255,255,0.1);
  position: relative;
  overflow: hidden;
}
.vex-glass::before {
  content: '';
  position: absolute; inset: 0;
  border-radius: inherit;
  padding: 1.4px;
  background: linear-gradient(180deg,
    rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 20%,
    rgba(255,255,255,0) 40%, rgba(255,255,255,0) 60%,
    rgba(255,255,255,0.1) 80%, rgba(255,255,255,0.3) 100%);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
          mask-composite: exclude;
  pointer-events: none;
}
`;

function FadeIn({
  delay = 0,
  duration = 1000,
  children,
  className = "",
}: {
  delay?: number;
  duration?: number;
  children: React.ReactNode;
  className?: string;
}) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setShow(true), delay);
    return () => window.clearTimeout(t);
  }, [delay]);
  return (
    <div
      className={`transition-opacity ${className}`}
      style={{ opacity: show ? 1 : 0, transitionDuration: `${duration}ms` }}
    >
      {children}
    </div>
  );
}

function AnimatedHeading({
  text,
  className,
  style,
  initialDelay = 200,
  charDelay = 30,
}: {
  text: string;
  className?: string;
  style?: React.CSSProperties;
  initialDelay?: number;
  charDelay?: number;
}) {
  const [go, setGo] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setGo(true), initialDelay);
    return () => window.clearTimeout(t);
  }, [initialDelay]);
  const lines = text.split("\n");
  return (
    <h1 className={className} style={style}>
      {lines.map((line, li) => (
        <span key={li} className="block">
          {Array.from(line).map((c, ci) => {
            const delay = li * line.length * charDelay + ci * charDelay;
            return (
              <span
                key={ci}
                className="inline-block"
                style={{
                  opacity: go ? 1 : 0,
                  transform: go ? "translateX(0)" : "translateX(-18px)",
                  transition: `opacity 500ms ease ${delay}ms, transform 500ms ease ${delay}ms`,
                }}
              >
                {c === " " ? "\u00A0" : c}
              </span>
            );
          })}
        </span>
      ))}
    </h1>
  );
}

export default function VexHeroPage() {
  return (
    <div
      className="relative w-full min-h-screen bg-black text-white overflow-hidden"
      style={{ fontFamily: "'Inter', sans-serif", WebkitFontSmoothing: "antialiased" }}
    >
      <style>{GLASS_CSS}</style>

      {/* Video bg */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        src={VIDEO}
      />

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Navbar */}
        <div className="px-6 md:px-12 lg:px-16 pt-6">
          <nav className="vex-glass rounded-xl px-4 py-2 flex items-center justify-between">
            <div className="text-2xl font-semibold tracking-tight text-white">VEX</div>
            <div className="hidden md:flex items-center gap-8 text-sm">
              {["Story", "Investing", "Building", "Advisory"].map((l) => (
                <a
                  key={l}
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="text-white hover:text-gray-300 transition-colors"
                >
                  {l}
                </a>
              ))}
            </div>
            <button className="bg-white text-black px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors">
              Start a Chat
            </button>
          </nav>
        </div>

        {/* Hero content */}
        <div className="px-6 md:px-12 lg:px-16 flex-1 flex flex-col justify-end pb-12 lg:pb-16">
          <div className="lg:grid lg:grid-cols-2 lg:items-end gap-8">
            <div>
              <AnimatedHeading
                text={"Shaping tomorrow\nwith vision and action."}
                className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-normal mb-4 text-white"
                style={{ letterSpacing: "-0.04em" }}
              />
              <FadeIn delay={800} duration={1000}>
                <p className="text-base md:text-lg text-gray-300 mb-5 max-w-xl">
                  We back visionaries and craft ventures that define what comes next.
                </p>
              </FadeIn>
              <FadeIn delay={1200} duration={1000}>
                <div className="flex flex-wrap gap-4">
                  <button className="bg-white text-black px-8 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors">
                    Start a Chat
                  </button>
                  <button className="vex-glass border border-white/20 text-white px-8 py-3 rounded-lg font-medium hover:bg-white hover:text-black transition-colors">
                    Explore Now
                  </button>
                </div>
              </FadeIn>
            </div>

            <FadeIn delay={1400} duration={1000} className="flex items-end justify-start lg:justify-end mt-8 lg:mt-0">
              <div className="vex-glass border border-white/20 px-6 py-3 rounded-xl">
                <span className="text-lg md:text-xl lg:text-2xl font-light text-white">
                  Investing. Building. Advisory.
                </span>
              </div>
            </FadeIn>
          </div>
        </div>
      </div>
    </div>
  );
}
