import { useEffect, useRef, useState } from "react";
import { LogIn, UserPlus, Play, Sparkles, Menu, X } from "lucide-react";

const BG_VIDEO =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260511_131941_d136af49-e243-493a-be14-6ff3f24e09e6.mp4";

function BoomerangVideoBg({ src, className }: { src: string; className?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement>(null);
  const [framesReady, setFramesReady] = useState(false);
  const framesRef = useRef<HTMLCanvasElement[]>([]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const frames: HTMLCanvasElement[] = [];
    let capturing = true;
    let lastTime = -1;
    const MAX_WIDTH = 960;

    const captureFrame = () => {
      if (!capturing || video.readyState < 2) return;
      if (video.currentTime === lastTime) return;
      lastTime = video.currentTime;
      const vw = video.videoWidth, vh = video.videoHeight;
      if (!vw || !vh) return;
      const scale = Math.min(1, MAX_WIDTH / vw);
      const w = Math.round(vw * scale), h = Math.round(vh * scale);
      const c = document.createElement("canvas");
      c.width = w; c.height = h;
      const ctx = c.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, w, h);
      frames.push(c);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const v: any = video;
    const hasVFC = typeof v.requestVideoFrameCallback === "function";
    let rafId = 0;
    const rafLoop = () => { captureFrame(); if (capturing) rafId = requestAnimationFrame(rafLoop); };
    const vfcLoop = () => { captureFrame(); if (capturing && v.requestVideoFrameCallback) v.requestVideoFrameCallback(vfcLoop); };

    const onEnded = () => {
      capturing = false;
      if (frames.length > 0) { framesRef.current = frames; setFramesReady(true); }
    };
    const onLoaded = () => {
      video.play().catch(() => {});
      if (hasVFC) v.requestVideoFrameCallback(vfcLoop);
      else rafId = requestAnimationFrame(rafLoop);
    };

    video.addEventListener("loadedmetadata", onLoaded);
    video.addEventListener("ended", onEnded);
    if (video.readyState >= 1) onLoaded();
    return () => {
      capturing = false;
      cancelAnimationFrame(rafId);
      video.removeEventListener("loadedmetadata", onLoaded);
      video.removeEventListener("ended", onEnded);
    };
  }, [src]);

  useEffect(() => {
    if (!framesReady) return;
    const canvas = displayCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const frames = framesRef.current;
    if (frames.length === 0) return;
    canvas.width = frames[0].width; canvas.height = frames[0].height;
    let index = 0, direction = 1, last = performance.now();
    const interval = 1000 / 30;
    let rafId = 0;
    const render = (now: number) => {
      if (now - last >= interval) {
        last = now;
        ctx.drawImage(frames[index], 0, 0);
        index += direction;
        if (index >= frames.length - 1) { index = frames.length - 1; direction = -1; }
        else if (index <= 0) { index = 0; direction = 1; }
      }
      rafId = requestAnimationFrame(render);
    };
    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, [framesReady]);

  return (
    <div className={className}>
      <video
        ref={videoRef}
        src={src}
        muted
        playsInline
        preload="auto"
        crossOrigin="anonymous"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ display: framesReady ? "none" : "block" }}
      />
      <canvas
        ref={displayCanvasRef}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ display: framesReady ? "block" : "none" }}
      />
    </div>
  );
}

export default function LinkFlowHeroPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navLinks = [
    { href: "#mission", label: "Purpose" },
    { href: "#how", label: "The Process" },
    { href: "#pricing", label: "Tariffs" },
  ];

  return (
    <section
      className="relative w-full min-h-screen sm:h-screen overflow-hidden bg-[#e9efe7]"
      style={{ fontFamily: "'Neue Haas Grotesk Display Pro 55 Roman', 'Helvetica Neue', Helvetica, Arial, sans-serif" }}
    >
      <BoomerangVideoBg src={BG_VIDEO} className="absolute inset-0 w-full h-full" />

      {/* Navbar */}
      <header className="relative z-20 flex items-center justify-between px-4 sm:px-6 md:px-10 py-4 sm:py-6">
        <div className="text-[#1f2a1d] font-semibold text-lg">
          LinkFlow<sup className="text-[10px]">TM</sup>
        </div>

        <nav className="hidden lg:flex items-center gap-1 bg-white/70 backdrop-blur-md rounded-full pl-6 pr-1 py-1 shadow-sm border border-white/60">
          {navLinks.map((l) => (
            <a key={l.href} href={l.href} className="text-sm text-[#1f2a1d] px-4 py-2 transition-opacity hover:opacity-80">
              {l.label}
            </a>
          ))}
          <button className="ml-2 bg-[#1f2a1d] hover:bg-[#2a3827] text-white text-sm font-medium rounded-full px-5 py-2 transition-colors">
            Try it Live
          </button>
        </nav>

        <div className="flex items-center gap-2">
          <button className="hidden sm:inline-flex items-center gap-2 bg-white/70 backdrop-blur-md border border-white/60 text-[#1f2a1d] text-sm font-medium rounded-full px-4 py-2 transition-colors hover:bg-white/90">
            <UserPlus size={16} /> Sign Me Up!
          </button>
          <button className="hidden sm:inline-flex items-center gap-2 bg-[#1f2a1d] hover:bg-[#2a3827] text-white text-sm font-medium rounded-full px-4 py-2 transition-colors">
            <LogIn size={16} /> Enter
          </button>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="lg:hidden relative flex items-center justify-center w-10 h-10 rounded-full bg-white/70 backdrop-blur-md border border-white/60 text-[#1f2a1d] transition-all duration-300 hover:bg-white/90"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            <Menu
              size={18}
              className={`absolute transition-all duration-300 ${
                menuOpen ? "opacity-0 rotate-90 scale-50" : "opacity-100 rotate-0 scale-100"
              }`}
            />
            <X
              size={18}
              className={`absolute transition-all duration-300 ${
                menuOpen ? "opacity-100 rotate-0 scale-100" : "opacity-0 rotate-90 scale-50"
              }`}
            />
          </button>
        </div>
      </header>

      {/* Mobile overlay */}
      <div
        onClick={() => setMenuOpen(false)}
        className={`lg:hidden fixed inset-0 z-30 bg-black/40 transition-opacity duration-300 ${
          menuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Mobile drawer */}
      <aside
        className={`lg:hidden fixed top-0 right-0 bottom-0 w-[85%] max-w-sm bg-[#e9efe7] z-40 p-8 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          menuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full pt-16">
          <div className="flex-1">
            {navLinks.map((link, i) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`block text-2xl font-semibold text-[#1f2a1d] py-4 border-b border-[#1f2a1d]/10 transition-all duration-500 ${
                  menuOpen ? "translate-x-0 opacity-100" : "translate-x-8 opacity-0"
                }`}
                style={{ transitionDelay: menuOpen ? `${150 + i * 70}ms` : "0ms" }}
              >
                {link.label}
              </a>
            ))}
          </div>
          <div
            className={`flex flex-col gap-3 transition-all duration-500 ${
              menuOpen ? "translate-x-0 opacity-100" : "translate-x-8 opacity-0"
            }`}
            style={{ transitionDelay: menuOpen ? "400ms" : "0ms" }}
          >
            <button className="inline-flex items-center justify-center gap-2 bg-white border border-[#1f2a1d]/20 text-[#1f2a1d] text-sm font-medium rounded-full px-5 py-3">
              <UserPlus size={16} /> Sign Me Up!
            </button>
            <button className="inline-flex items-center justify-center gap-2 bg-[#1f2a1d] text-white text-sm font-medium rounded-full px-5 py-3">
              <LogIn size={16} /> Enter
            </button>
            <button className="bg-[#336443] text-white text-sm font-medium rounded-full px-5 py-3">
              Try it Live
            </button>
          </div>
        </div>
      </aside>

      {/* Hero copy */}
      <div className="relative z-10 px-4 sm:px-6 md:px-10 pt-24 sm:pt-28 md:pt-32 max-w-6xl">
        <h1
          className="text-[2rem] sm:text-4xl md:text-5xl lg:text-[4.75rem] xl:text-[5.25rem] font-medium text-[#336443] leading-[0.95]"
          style={{ letterSpacing: "-0.035em" }}
        >
          Close the rift{" "}
          <span className="text-[#85AB8B]">
            linking
            <br />
            signals and action
          </span>
        </h1>
        <p className="mt-6 max-w-xl text-base sm:text-lg text-[#4b5b47]">
          Shape scattered signals into meaningful outcomes via AI-driven workflows.
        </p>
      </div>

      {/* Bottom-left CTA */}
      <div className="absolute left-4 right-4 sm:right-auto sm:left-6 md:left-10 bottom-6 sm:bottom-8 md:bottom-10 max-w-sm z-10">
        <div className="flex items-center gap-2 mb-3 text-[#3d5638] text-sm font-medium">
          <Sparkles size={16} />
          <span>
            FluxEngine<sup className="text-[9px]">TM</sup>
          </span>
        </div>
        <p className="text-[#3d5638] text-sm leading-relaxed mb-4">
          LinkFlow smoothly unites your company systems, streamlining data paths between services
          without having to write custom scripts.
        </p>
        <div className="flex items-center gap-3">
          <button className="bg-[#3d5638] hover:bg-[#2d4228] text-white text-sm font-medium rounded-full px-5 py-2 transition-colors">
            Try it Live
          </button>
          <a href="#" className="text-[#3d5638] text-sm font-medium underline-offset-2 hover:underline">
            Know More.
          </a>
        </div>
      </div>

      {/* Bottom-right video link */}
      <div className="absolute right-6 md:right-10 bottom-8 md:bottom-10 flex items-center gap-3 z-10 text-[#1f2a1d]">
        <div className="w-9 h-9 rounded-full bg-white/80 backdrop-blur-md border border-white/60 flex items-center justify-center">
          <Play size={14} className="fill-[#1f2a1d] text-[#1f2a1d]" />
        </div>
        <span className="text-sm font-medium">How we build?</span>
        <span className="text-xs text-[#4b5b47]">1:35</span>
      </div>
    </section>
  );
}
