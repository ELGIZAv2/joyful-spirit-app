import { useEffect, useRef } from "react";
import { Globe, ArrowRight, Instagram, Twitter } from "lucide-react";

const VIDEO =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_115001_bcdaa3b4-03de-47e7-ad63-ae3e392c32d4.mp4";

const GLASS_CSS = `
.curious-glass {
  background: rgba(255,255,255,0.01);
  background-blend-mode: luminosity;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  border: none;
  box-shadow: inset 0 1px 1px rgba(255,255,255,0.1);
  position: relative;
  overflow: hidden;
}
.curious-glass::before {
  content: '';
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
`;

function FadingVideo() {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const FADE = 500;
    const LEAD = 0.55;
    let raf: number | null = null;
    let fadingOut = false;

    const fadeTo = (target: number) => {
      if (raf) cancelAnimationFrame(raf);
      const start = parseFloat(v.style.opacity || "0") || 0;
      const t0 = performance.now();
      const step = (now: number) => {
        const p = Math.min(1, (now - t0) / FADE);
        v.style.opacity = String(start + (target - start) * p);
        if (p < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };

    const onLoaded = () => {
      v.style.opacity = "0";
      v.play().catch(() => {});
      fadeTo(1);
    };
    const onTime = () => {
      if (!fadingOut && v.duration - v.currentTime <= LEAD && v.duration - v.currentTime > 0) {
        fadingOut = true;
        fadeTo(0);
      }
    };
    const onEnded = () => {
      v.style.opacity = "0";
      setTimeout(() => {
        v.currentTime = 0;
        v.play().catch(() => {});
        fadingOut = false;
        fadeTo(1);
      }, 100);
    };

    v.addEventListener("loadeddata", onLoaded);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("ended", onEnded);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      v.removeEventListener("loadeddata", onLoaded);
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("ended", onEnded);
    };
  }, []);
  return (
    <video
      ref={ref}
      src={VIDEO}
      autoPlay
      muted
      playsInline
      preload="auto"
      className="absolute inset-0 w-full h-full object-cover translate-y-[17%]"
      style={{ opacity: 0 }}
    />
  );
}

export default function CuriousHeroPage() {
  return (
    <div className="relative min-h-screen w-full bg-black text-white overflow-hidden">
      <style>{GLASS_CSS}</style>
      <FadingVideo />

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Navbar */}
        <nav className="relative z-20 pl-6 pr-6 py-6">
          <div className="curious-glass rounded-full px-6 py-3 flex items-center justify-between max-w-5xl mx-auto">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <Globe size={24} className="text-white" />
                <span className="text-white font-semibold text-lg">Asme</span>
              </div>
              <div className="hidden md:flex items-center gap-8">
                {["Features", "Pricing", "About"].map((l) => (
                  <a
                    key={l}
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    className="text-white/80 hover:text-white transition-colors text-sm font-medium"
                  >
                    {l}
                  </a>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="text-white text-sm font-medium">Sign Up</button>
              <button className="curious-glass rounded-full px-6 py-2 text-white text-sm font-medium">
                Login
              </button>
            </div>
          </div>
        </nav>

        {/* Hero */}
        <section className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12 text-center -translate-y-[20%]">
          <h1
            className="text-5xl md:text-6xl lg:text-7xl text-white mb-8 tracking-tight whitespace-nowrap"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            Built for the curious
          </h1>

          <div className="max-w-xl w-full space-y-4">
            <form
              onSubmit={(e) => e.preventDefault()}
              className="curious-glass rounded-full pl-6 pr-2 py-2 flex items-center gap-3"
            >
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 bg-transparent text-white placeholder:text-white/40 text-base outline-none"
              />
              <button
                type="submit"
                className="bg-white rounded-full p-3 text-black"
                aria-label="Submit"
              >
                <ArrowRight size={20} />
              </button>
            </form>

            <p className="text-white text-sm leading-relaxed px-4">
              Stay updated with the latest news and insights. Subscribe to our newsletter today and
              never miss out on exciting updates.
            </p>

            <div className="flex justify-center">
              <button className="curious-glass rounded-full px-8 py-3 text-white text-sm font-medium hover:bg-white/5 transition-colors">
                Manifesto
              </button>
            </div>
          </div>
        </section>

        {/* Social footer */}
        <div className="relative z-10 flex justify-center gap-4 pb-12">
          {[
            { Icon: Instagram, label: "Instagram" },
            { Icon: Twitter, label: "Twitter" },
            { Icon: Globe, label: "Website" },
          ].map(({ Icon, label }) => (
            <button
              key={label}
              aria-label={label}
              className="curious-glass rounded-full p-4 text-white/80 hover:text-white hover:bg-white/5 transition-all"
            >
              <Icon size={20} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
