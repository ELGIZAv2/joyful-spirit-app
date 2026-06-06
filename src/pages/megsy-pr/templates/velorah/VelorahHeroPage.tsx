export default function VelorahHeroPage() {
  return (
    <div
      className="relative min-h-screen w-full overflow-hidden"
      style={{
        background: "hsl(201 100% 13%)",
        color: "#fff",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <style>{`
        .velorah-glass {
          background: rgba(255, 255, 255, 0.01);
          background-blend-mode: luminosity;
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          border: none;
          box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.1);
          position: relative;
          overflow: hidden;
          color: #fff;
          transition: transform 200ms;
        }
        .velorah-glass:hover { transform: scale(1.03); }
        .velorah-glass::before {
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
        @keyframes velorah-fade-rise {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .velorah-fr   { animation: velorah-fade-rise 0.8s ease-out both; }
        .velorah-fr-1 { animation: velorah-fade-rise 0.8s ease-out 0.2s both; }
        .velorah-fr-2 { animation: velorah-fade-rise 0.8s ease-out 0.4s both; }
      `}</style>

      {/* Video bg */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4"
      />

      {/* Nav */}
      <nav className="relative z-10">
        <div className="max-w-7xl mx-auto px-8 py-6 flex justify-between items-center">
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="text-3xl tracking-tight text-white"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            Velorah<sup className="text-xs">®</sup>
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
                  style={{ color: item.active ? "#fff" : "hsl(240 4% 66%)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = item.active ? "#fff" : "hsl(240 4% 66%)")
                  }
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
          <button className="velorah-glass rounded-full px-6 py-2.5 text-sm">
            Begin Journey
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center text-center px-6 pt-32 pb-40 py-[90px]">
        <h1
          className="velorah-fr text-5xl sm:text-7xl md:text-8xl max-w-7xl font-normal"
          style={{
            fontFamily: "'Instrument Serif', serif",
            lineHeight: 0.95,
            letterSpacing: "-2.46px",
            color: "#fff",
          }}
        >
          Where{" "}
          <em className="not-italic" style={{ color: "hsl(240 4% 66%)" }}>
            dreams
          </em>{" "}
          rise{" "}
          <em className="not-italic" style={{ color: "hsl(240 4% 66%)" }}>
            through the silence.
          </em>
        </h1>

        <p
          className="velorah-fr-1 text-base sm:text-lg max-w-2xl mt-8 leading-relaxed"
          style={{ color: "hsl(240 4% 66%)" }}
        >
          We're designing tools for deep thinkers, bold creators, and quiet rebels. Amid the chaos,
          we build digital spaces for sharp focus and inspired work.
        </p>

        <button className="velorah-fr-2 velorah-glass rounded-full px-14 py-5 text-base mt-12 cursor-pointer">
          Begin Journey
        </button>
      </section>
    </div>
  );
}
