import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, ArrowRight, Check } from "lucide-react";
import Hls from "hls.js";

const VIDEO_URL =
  "https://stream.mux.com/kimF2ha9zLrX64H00UgLGPflCzNtl1T0215MlAmeOztv8.m3u8";

const GLASS_CSS = `
.asme-liquid-glass {
  background: rgba(255,255,255,0.01);
  background-blend-mode: luminosity;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  border: none;
  box-shadow: inset 0 1px 1px rgba(255,255,255,0.1);
  position: relative;
  overflow: hidden;
}
.asme-liquid-glass::before {
  content: '';
  position: absolute;
  inset: 0;
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
.asme-root ::selection { background: #fff; color: #000; }
`;

function BackgroundVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = VIDEO_URL;
      return;
    }
    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(VIDEO_URL);
      hls.attachMedia(video);
      return () => hls.destroy();
    }
  }, []);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        className="w-full h-full object-cover opacity-100"
      />
    </div>
  );
}

function Navbar() {
  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="relative z-20 px-6 py-6 w-full"
    >
      <div className="asme-liquid-glass rounded-full px-6 py-3 flex items-center justify-between max-w-5xl mx-auto">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <Globe className="w-6 h-6 text-white" />
            <span className="text-white font-semibold text-lg">Asme</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-white/80 text-sm font-medium">
            {["Features", "Pricing", "About"].map((l) => (
              <a
                key={l}
                href="#"
                onClick={(e) => e.preventDefault()}
                className="hover:text-white transition-colors duration-300"
              >
                {l}
              </a>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-white hover:text-white/80 transition-colors text-sm font-medium cursor-pointer">
            Sign Up
          </button>
          <button className="asme-liquid-glass rounded-full px-6 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity cursor-pointer">
            Login
          </button>
        </div>
      </div>
    </motion.nav>
  );
}

function useTypewriter(target: string, active: boolean) {
  const [text, setText] = useState("");
  useEffect(() => {
    if (!active) {
      setText("");
      return;
    }
    setText("");
    let i = 0;
    const id = window.setInterval(() => {
      i++;
      setText(target.slice(0, i));
      if (i >= target.length) window.clearInterval(id);
    }, 60);
    return () => window.clearInterval(id);
  }, [target, active]);
  return text;
}

type CtaState = "button" | "form" | "submitted";

function Hero() {
  const [cta, setCta] = useState<CtaState>("button");
  const [email, setEmail] = useState("");

  const placeholder = useTypewriter(
    cta === "submitted"
      ? "You Will Receive Notifications By Email"
      : "Enter Your Email Here For Early Access",
    cta !== "button"
  );

  useEffect(() => {
    if (cta !== "submitted") return;
    const t = window.setTimeout(() => {
      setCta("button");
      setEmail("");
    }, 4000);
    return () => window.clearTimeout(t);
  }, [cta]);

  return (
    <section className="relative flex-1 flex flex-col items-center justify-center px-6">
      <div className="relative z-10 text-center max-w-5xl mx-auto flex flex-col items-center justify-center w-full gap-12">
        <div>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-white/80 text-[10px] md:text-[11px] font-medium tracking-[0.2em] uppercase mb-4"
          >
            BUILD A NO-CODE AI APP IN MINUTES
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            style={{ fontFamily: "'Instrument Serif', serif" }}
            className="text-4xl md:text-[64px] font-medium tracking-[-0.01em] leading-[1.1] mb-6 bg-gradient-to-b from-white via-white/95 to-white/70 bg-clip-text text-transparent max-w-4xl"
          >
            A new way to think and create
            <br />
            with computers
          </motion.h1>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="min-h-[50px] mt-2 flex items-center justify-center"
        >
          <AnimatePresence mode="wait">
            {cta === "button" && (
              <motion.button
                key="btn"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setCta("form")}
                className="px-10 py-3 text-[14px] font-medium border border-white/10 rounded-full hover:border-white/30 hover:bg-white/[0.02] transition-all duration-300 text-white/90 backdrop-blur-sm cursor-pointer"
              >
                Get early access
              </motion.button>
            )}
            {cta !== "button" && (
              <motion.form
                key="form"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.2 }}
                onSubmit={(e) => {
                  e.preventDefault();
                  setCta("submitted");
                }}
                className="flex items-center gap-2 pl-5 pr-1.5 py-1.5 text-[14px] font-medium border border-white/20 rounded-full bg-white/[0.02] backdrop-blur-sm w-full max-w-[320px] focus-within:border-white/40 transition-colors duration-300"
              >
                <input
                  type="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={placeholder}
                  disabled={cta === "submitted"}
                  className="flex-1 bg-transparent text-white placeholder-white/45 outline-none"
                />
                <button
                  type="submit"
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                >
                  {cta === "submitted" ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <ArrowRight className="w-4 h-4" />
                  )}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="text-white/80 hover:text-white/40 transition-colors duration-300 text-[13px] font-medium tracking-wide"
          >
            Play Video Demo
          </a>
        </motion.div>
      </div>
    </section>
  );
}

export default function AsmeHeroPage() {
  return (
    <div
      className="asme-root relative bg-black h-screen w-screen flex flex-col overflow-hidden shrink-0"
      style={{ fontFamily: "'Inter', sans-serif", letterSpacing: "-0.01em" }}
    >
      <style>{GLASS_CSS}</style>
      <BackgroundVideo />
      <Navbar />
      <Hero />
    </div>
  );
}
