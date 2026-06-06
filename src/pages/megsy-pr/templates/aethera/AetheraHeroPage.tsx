import { useEffect, useRef } from "react";

const FONT_DISPLAY = "'Instrument Serif', serif";
const FONT_BODY = "'Inter', sans-serif";

const BLACK = "#000000";
const GRAY = "#6F6F6F";

export default function AetheraHeroPage() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let raf = 0;
    const FADE = 0.5;

    const tick = () => {
      const d = video.duration;
      const t = video.currentTime;
      if (d && !isNaN(d)) {
        if (t < FADE) {
          video.style.opacity = String(t / FADE);
        } else if (t > d - FADE) {
          video.style.opacity = String(Math.max(0, (d - t) / FADE));
        } else {
          video.style.opacity = "1";
        }
      }
      raf = requestAnimationFrame(tick);
    };

    const onEnded = () => {
      video.style.opacity = "0";
      setTimeout(() => {
        video.currentTime = 0;
        video.play().catch(() => {});
      }, 100);
    };

    video.addEventListener("ended", onEnded);
    raf = requestAnimationFrame(tick);
    video.play().catch(() => {});

    return () => {
      cancelAnimationFrame(raf);
      video.removeEventListener("ended", onEnded);
    };
  }, []);

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden"
      style={{ background: "#FFFFFF", fontFamily: FONT_BODY }}
    >
      <style>{`
        @keyframes aethera-fade-rise {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .aethera-fade { animation: aethera-fade-rise 0.8s ease-out both; }
        .aethera-fade-d1 { animation: aethera-fade-rise 0.8s ease-out 0.2s both; }
        .aethera-fade-d2 { animation: aethera-fade-rise 0.8s ease-out 0.4s both; }
      `}</style>

      {/* Video background */}
      <div className="absolute z-0" style={{ top: "300px", inset: "auto 0 0 0" }}>
        <video
          ref={videoRef}
          muted
          playsInline
          autoPlay
          preload="auto"
          className="w-full h-auto"
          style={{ opacity: 0, transition: "opacity 100ms linear" }}
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_083109_283f3553-e28f-428b-a723-d639c617eb2b.mp4"
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(to bottom, #FFFFFF 0%, transparent 25%, transparent 75%, #FFFFFF 100%)",
          }}
        />
      </div>

      {/* Nav */}
      <nav className="relative z-10">
        <div className="max-w-7xl mx-auto px-8 py-6 flex justify-between items-center">
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="text-3xl tracking-tight"
            style={{ fontFamily: FONT_DISPLAY, color: BLACK }}
          >
            Aethera<sup className="text-xs">®</sup>
          </a>
          <ul className="hidden md:flex items-center gap-8 text-sm">
            {[
              { label: "Home", active: true },
              { label: "Studio" },
              { label: "About" },
              { label: "Journal" },
              { label: "Reach Us" },
            ].map((item) => (
              <li key={item.label}>
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="transition-colors"
                  style={{ color: item.active ? BLACK : GRAY }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = BLACK)}
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = item.active ? BLACK : GRAY)
                  }
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
          <button
            className="rounded-full px-6 py-2.5 text-sm transition-transform"
            style={{ background: BLACK, color: "#FFFFFF" }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            Begin Journey
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section
        className="relative z-10 flex flex-col items-center justify-center text-center px-6 pb-40"
        style={{ paddingTop: "calc(8rem - 75px)" }}
      >
        <h1
          className="aethera-fade text-5xl sm:text-7xl md:text-8xl max-w-7xl font-normal"
          style={{
            fontFamily: FONT_DISPLAY,
            color: BLACK,
            lineHeight: 0.95,
            letterSpacing: "-2.46px",
          }}
        >
          Beyond <em style={{ color: GRAY, fontStyle: "italic" }}>silence,</em> we build{" "}
          <em style={{ color: GRAY, fontStyle: "italic" }}>the eternal.</em>
        </h1>

        <p
          className="aethera-fade-d1 text-base sm:text-lg max-w-2xl mt-8 leading-relaxed"
          style={{ color: GRAY }}
        >
          Building platforms for brilliant minds, fearless makers, and thoughtful souls.
          Through the noise, we craft digital havens for deep work and pure flows.
        </p>

        <button
          className="aethera-fade-d2 rounded-full px-14 py-5 text-base mt-12 transition-transform"
          style={{ background: BLACK, color: "#FFFFFF" }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          Begin Journey
        </button>
      </section>
    </div>
  );
}
