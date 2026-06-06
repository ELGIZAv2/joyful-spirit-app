import { useState } from "react";
import { Menu, X } from "lucide-react";

const FONT_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
.skyelite-root, .skyelite-root * { font-family: 'Inter', sans-serif; }
`;

export default function SkyEliteHeroPage() {
  const [open, setOpen] = useState(false);
  const links = ["Start", "Story", "Rates", "Benefits", "FAQ"];

  return (
    <div className="skyelite-root min-h-screen bg-gray-50">
      <style>{FONT_CSS}</style>
      <section className="relative h-screen overflow-hidden">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_091828_e240eb17-6edc-4129-ad9d-98678e3fd238.mp4"
        />

        <div className="relative h-full flex flex-col">
          <nav className="relative z-20 max-w-7xl mx-auto w-full px-8 py-6 flex items-center justify-between">
            <div className="text-2xl font-semibold text-gray-900">SkyElite</div>
            <div className="hidden md:flex items-center gap-8">
              {links.map((l) => (
                <a key={l} href="#" className="text-gray-900 hover:text-gray-700 transition-colors font-medium">
                  {l}
                </a>
              ))}
            </div>
            <button
              className="md:hidden text-gray-900"
              onClick={() => setOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {open ? <X size={24} /> : <Menu size={24} />}
            </button>

            {open && (
              <div className="md:hidden absolute top-full right-8 mt-2 bg-white/95 backdrop-blur rounded-xl shadow-lg py-3 px-5 flex flex-col gap-2 min-w-[160px]">
                {links.map((l) => (
                  <a key={l} href="#" className="text-gray-900 hover:text-gray-700 transition-colors py-1">
                    {l}
                  </a>
                ))}
              </div>
            )}
          </nav>

          <div className="flex-1 flex items-center justify-center">
            <div className="relative z-10 text-center px-6 -mt-80">
              <p className="text-sm font-semibold text-gray-600 tracking-wider mb-4 uppercase">
                Private Jets
              </p>
              <h1 className="text-6xl md:text-7xl lg:text-8xl font-normal text-gray-500 leading-none tracking-tighter">
                Premium.
              </h1>
              <h1
                className="text-6xl md:text-7xl lg:text-8xl font-normal leading-none tracking-tighter"
                style={{ color: "#202A36", marginTop: "-12px" }}
              >
                Accessible.
              </h1>
              <p className="text-lg md:text-xl text-gray-600 mb-6 max-w-2xl mx-auto mt-6">
                Your dedication deserves recognition.
              </p>
              <div className="flex items-center justify-center gap-4">
                <button className="px-4 py-2 rounded-full bg-gray-300 text-gray-800 font-medium hover:bg-gray-400 transition-colors">
                  Discover
                </button>
                <button
                  className="px-4 py-2 rounded-full text-white font-medium transition-colors"
                  style={{ backgroundColor: "#202A36" }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1a2229")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#202A36")}
                >
                  Book Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
