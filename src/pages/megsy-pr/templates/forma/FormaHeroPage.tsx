import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

const NAV_LINKS = ["Gallery", "Styles", "API", "Pricing", "Blog"];
const VIDEO_SRC =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260511_080827_a9e5ad52-b6ee-4e79-b393-d936f179cfd7.mp4";

const FORMA_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Barlow:wght@300;400;500;600&display=swap');
.forma-root, .forma-root * { font-family: 'Barlow', sans-serif; }
.forma-root { background: #000; }

.forma-liquid-glass {
  background: rgba(255,255,255,0.01);
  background-blend-mode: luminosity;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  border: none;
  box-shadow: inset 0 1px 1px rgba(255,255,255,0.1);
  position: relative;
  overflow: hidden;
}
.forma-liquid-glass::before {
  content: "";
  position: absolute; inset: 0;
  border-radius: inherit;
  padding: 1.4px;
  background: linear-gradient(180deg,
    rgba(255,255,255,0.45) 0%,
    rgba(255,255,255,0.15) 20%,
    rgba(255,255,255,0) 40%,
    rgba(255,255,255,0) 60%,
    rgba(255,255,255,0.15) 80%,
    rgba(255,255,255,0.45) 100%);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
          mask-composite: exclude;
  pointer-events: none;
}
.forma-liquid-glass-strong {
  background: rgba(255,255,255,0.01);
  background-blend-mode: luminosity;
  backdrop-filter: blur(50px);
  -webkit-backdrop-filter: blur(50px);
  border: none;
  box-shadow: 4px 4px 4px rgba(0,0,0,0.05), inset 0 1px 1px rgba(255,255,255,0.15);
  position: relative;
  overflow: hidden;
}
.forma-liquid-glass-strong::before {
  content: "";
  position: absolute; inset: 0;
  border-radius: inherit;
  padding: 1.4px;
  background: linear-gradient(180deg,
    rgba(255,255,255,0.5) 0%,
    rgba(255,255,255,0.2) 20%,
    rgba(255,255,255,0) 40%,
    rgba(255,255,255,0) 60%,
    rgba(255,255,255,0.2) 80%,
    rgba(255,255,255,0.5) 100%);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
          mask-composite: exclude;
  pointer-events: none;
}
.forma-hero-title {
  font-family: 'Instrument Serif', serif;
  font-style: italic;
  font-size: clamp(96px, 18vw, 280px);
  line-height: 0.92;
  letter-spacing: -0.02em;
  color: white;
  text-align: center;
}
`;

function LogoMark() {
  return (
    <svg width="44" height="26" viewBox="0 0 44 26" fill="none">
      <rect x="0" y="3" width="14" height="20" rx="3" fill="white" />
      <rect x="16" y="3" width="12" height="20" rx="3" fill="white" />
      <rect x="30" y="3" width="14" height="20" rx="3" fill="white" />
    </svg>
  );
}

export default function FormaHeroPage() {
  const [mounted, setMounted] = useState(false);
  const [framesReady, setFramesReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoBgRef = useRef<HTMLDivElement>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement>(null);
  const framesRef = useRef<HTMLCanvasElement[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Frame capture
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let capturing = true;
    let lastTime = -1;
    const MAX_WIDTH = 960;
    const frames: HTMLCanvasElement[] = [];
    let rafId = 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let vfcId: any = 0;

    const captureFrame = () => {
      if (!capturing) return;
      if (video.readyState < 2 || video.currentTime === lastTime) return;
      lastTime = video.currentTime;
      const scale = Math.min(1, MAX_WIDTH / (video.videoWidth || MAX_WIDTH));
      const w = Math.max(1, Math.floor((video.videoWidth || MAX_WIDTH) * scale));
      const h = Math.max(1, Math.floor((video.videoHeight || 540) * scale));
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      const ctx = c.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, w, h);
      frames.push(c);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const v: any = video;
    const loop = () => {
      captureFrame();
      if (!capturing) return;
      if (typeof v.requestVideoFrameCallback === "function") {
        vfcId = v.requestVideoFrameCallback(loop);
      } else {
        rafId = requestAnimationFrame(loop);
      }
    };

    const onLoaded = () => {
      video.play().catch(() => {});
      loop();
    };
    const onEnded = () => {
      capturing = false;
      framesRef.current = frames;
      if (frames.length > 0) setFramesReady(true);
    };

    video.addEventListener("loadedmetadata", onLoaded);
    video.addEventListener("ended", onEnded);
    if (video.readyState >= 1) onLoaded();

    return () => {
      capturing = false;
      cancelAnimationFrame(rafId);
      if (typeof v.cancelVideoFrameCallback === "function" && vfcId) {
        v.cancelVideoFrameCallback(vfcId);
      }
      video.removeEventListener("loadedmetadata", onLoaded);
      video.removeEventListener("ended", onEnded);
    };
  }, []);

  // Boomerang render
  useEffect(() => {
    if (!framesReady) return;
    const canvas = displayCanvasRef.current;
    const frames = framesRef.current;
    if (!canvas || frames.length === 0) return;
    canvas.width = frames[0].width;
    canvas.height = frames[0].height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let index = 0;
    let direction = 1;
    let last = performance.now();
    const interval = 1000 / 30;
    let rafId = 0;
    const render = (now: number) => {
      if (now - last >= interval) {
        last = now;
        ctx.drawImage(frames[index], 0, 0, canvas.width, canvas.height);
        index += direction;
        if (index >= frames.length - 1) {
          index = frames.length - 1;
          direction = -1;
        } else if (index <= 0) {
          index = 0;
          direction = 1;
        }
      }
      rafId = requestAnimationFrame(render);
    };
    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, [framesReady]);

  // Parallax
  useEffect(() => {
    const strength = 20;
    let targetX = 0,
      targetY = 0,
      currentX = 0,
      currentY = 0;
    let rafId = 0;
    const onMove = (e: MouseEvent) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      targetX = ((e.clientX - cx) / cx) * strength;
      targetY = ((e.clientY - cy) / cy) * strength;
    };
    const tick = () => {
      currentX += (targetX - currentX) * 0.06;
      currentY += (targetY - currentY) * 0.06;
      if (videoBgRef.current) {
        gsap.set(videoBgRef.current, { x: currentX, y: currentY });
      }
      rafId = requestAnimationFrame(tick);
    };
    window.addEventListener("mousemove", onMove);
    rafId = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div className="forma-root relative w-screen h-screen overflow-hidden bg-black">
      <style>{FORMA_CSS}</style>

      {/* Video background */}
      <div ref={videoBgRef} className="absolute inset-0 z-0 will-change-transform" style={{ scale: "1.08" }}>
        <video
          ref={videoRef}
          src={VIDEO_SRC}
          muted
          playsInline
          preload="auto"
          crossOrigin="anonymous"
          className="w-full h-full object-cover"
          style={{ display: framesReady ? "none" : "block" }}
        />
        <canvas
          ref={displayCanvasRef}
          className="w-full h-full object-cover absolute inset-0"
          style={{ display: framesReady ? "block" : "none" }}
        />
      </div>

      {/* Hero title */}
      <div
        className={`fixed left-0 right-0 z-20 w-full px-4 transition-all duration-1000 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        }`}
        style={{ top: "126px" }}
      >
        <h1 className="forma-hero-title">MicroVisuals</h1>
      </div>

      {/* Nav */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-30">
        <div className="forma-liquid-glass flex items-center gap-6 rounded-full px-4 py-2.5">
          <LogoMark />
          <ul className="flex items-center gap-5">
            {NAV_LINKS.map((l) => (
              <li key={l}>
                <a
                  href="#"
                  className="text-sm font-light text-white/70 hover:text-white transition-colors duration-200"
                >
                  {l}
                </a>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-3 ml-4">
            <a
              href="#"
              className="text-sm font-light text-white/70 hover:text-white transition-colors duration-200"
            >
              Sign in
            </a>
            <a
              href="#"
              className="forma-liquid-glass-strong text-sm font-medium text-white rounded-full px-4 py-1.5 transition-all duration-200 hover:scale-[1.04] hover:shadow-[0_0_16px_2px_rgba(255,255,255,0.12)] active:scale-[0.97]"
            >
              Try it free
            </a>
          </div>
        </div>
      </nav>

      {/* Bottom row */}
      <div
        className={`fixed bottom-12 left-0 right-0 px-10 flex items-end justify-between z-20 transition-all duration-1000 delay-300 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        }`}
      >
        <p className="text-sm font-light text-white/75 max-w-[220px] leading-relaxed">
          Forma's AI understands context, composition, and style like a creative director would.
        </p>

        <div className="absolute left-1/2 -translate-x-1/2 bottom-0 flex items-center gap-3">
          <button className="group relative bg-white text-black text-sm font-medium rounded-full px-6 py-3 overflow-hidden active:scale-[0.97] transition-all duration-200 shadow-[0_0_0_0_rgba(255,255,255,0)] hover:shadow-[0_0_24px_4px_rgba(255,255,255,0.25)] hover:scale-[1.03]">
            <span className="relative z-10">Start generating</span>
          </button>
          <button className="forma-liquid-glass group text-white text-sm font-medium rounded-full px-6 py-3 active:scale-[0.97] transition-all duration-200 hover:scale-[1.03] hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_0_20px_2px_rgba(255,255,255,0.07)]">
            See templates
          </button>
        </div>

        <p className="text-sm font-light text-white/75 max-w-[220px] leading-relaxed text-right">
          Describe what you see in your head — get images that actually match.
        </p>
      </div>
    </div>
  );
}
