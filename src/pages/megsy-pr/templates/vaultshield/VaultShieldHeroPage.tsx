import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRightCircle, Zap, LockKeyhole, Fingerprint, Menu, X } from "lucide-react";

const VIDEO_SRC =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260518_003132_8b7edcb6-c64d-4a52-a9ca-879942e122ad.mp4";

const NAV_LINKS = ["Vault", "Plans", "Install", "News", "Help"];

const VAULT_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
@font-face {
  font-family: 'Helvetica Now Display Bold';
  src: url('https://db.onlinewebfonts.com/c/04e6981992c0e2e7642af2074ebe3901?family=Helvetica+Now+Display+Bold') format('woff2');
  font-display: swap;
}
.vault-root { --font-heading: 'Helvetica Now Display Bold', 'Inter', sans-serif; --font-body: 'Inter', sans-serif; }
`;

function Logo() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="none" viewBox="0 0 256 256">
      <path
        d="M 64 128 L 64.5 128 L 32 95 L 0 64 L 0 0 L 64 0 L 128 64 L 128 64.5 L 161 32 L 192 0 L 256 0 L 256 64 L 192 128 L 128 128 L 128 192 L 96 223 L 63.5 256 L 0 256 L 0 192 Z M 256 192 L 224 223 L 191.5 256 L 128 256 L 128 192 L 192 128 L 256 128 Z"
        fill="#192837"
      />
    </svg>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export default function VaultShieldHeroPage() {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="vault-root relative w-full min-h-screen overflow-hidden"
      style={{ fontFamily: "var(--font-body)", color: "#192837" }}
    >
      <style>{VAULT_CSS}</style>

      <video
        src={VIDEO_SRC}
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Navbar */}
      <header className="relative z-10 max-w-[1280px] mx-auto px-5 sm:px-8 py-4 sm:py-5 flex items-center justify-between">
        <Logo />
        <nav className="hidden md:flex items-center gap-7">
          {NAV_LINKS.map((l) => (
            <a key={l} href="#" className="text-sm font-medium transition-opacity hover:opacity-60">
              {l}
            </a>
          ))}
        </nav>
        <div className="hidden md:flex items-center gap-2">
          <button
            className="rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.03]"
            style={{ background: "#7342E2" }}
          >
            Start For Free
          </button>
          <button
            className="rounded-full px-5 py-2.5 text-sm font-semibold transition-transform hover:scale-[1.03]"
            style={{ background: "#F2F2EE", color: "#192837" }}
          >
            Sign In
          </button>
        </div>
        <button
          className="md:hidden w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: "#F2F2EE" }}
          onClick={() => setOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
      </header>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="bd"
              className="fixed inset-0 z-40 md:hidden"
              style={{ background: "rgba(25,40,55,0.35)", backdropFilter: "blur(4px)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.aside
              key="sh"
              className="fixed right-0 top-0 z-50 md:hidden p-6 flex flex-col"
              style={{
                width: "min(88vw, 360px)",
                height: "100dvh",
                background: "#CFC8C5",
                boxShadow: "-12px 0 48px rgba(25,40,55,0.18)",
              }}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex items-center justify-between mb-5">
                <Logo />
                <button
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-white/50"
                  onClick={() => setOpen(false)}
                  aria-label="Close menu"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="h-px w-full bg-[#192837]/15 mb-6" />
              <nav className="flex flex-col gap-4 flex-1">
                {NAV_LINKS.map((l, i) => (
                  <motion.a
                    key={l}
                    href="#"
                    className="text-lg font-medium"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.18 + i * 0.07, duration: 0.4 }}
                  >
                    {l}
                  </motion.a>
                ))}
              </nav>
              <div className="flex flex-col gap-2">
                <button
                  className="rounded-full px-5 py-3 text-sm font-semibold text-white"
                  style={{ background: "#7342E2" }}
                >
                  Start For Free
                </button>
                <button
                  className="rounded-full px-5 py-3 text-sm font-semibold"
                  style={{ background: "#F2F2EE", color: "#192837" }}
                >
                  Sign In
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Hero */}
      <main
        className="relative z-10 max-w-[1280px] mx-auto px-5 sm:px-8"
        style={{ paddingTop: "clamp(40px, 8vw, 72px)" }}
      >
        <div style={{ maxWidth: 560 }}>
          <motion.h1
            custom={0}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(1.65rem, 5vw, 3rem)",
              lineHeight: 1.05,
              letterSpacing: "-0.01em",
              color: "#192837",
              marginBottom: 24,
            }}
          >
            <Zap size={24} className="inline-block align-middle mr-2" style={{ position: "relative", top: -2 }} />
            Lock Down Your Passwords{" "}
            <LockKeyhole size={24} className="inline-block align-middle mx-1" style={{ position: "relative", top: -2 }} />{" "}
            with Ironclad Security
            <Fingerprint size={24} className="inline-block align-middle ml-2" style={{ position: "relative", top: -2 }} />
          </motion.h1>

          <motion.p
            custom={1}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "clamp(0.9rem, 2.5vw, 1.1rem)",
              lineHeight: 1.65,
              opacity: 0.8,
              maxWidth: 560,
              marginBottom: 32,
            }}
          >
            Zero stress, total control. VaultShield keeps you covered with unbreakable storage, one-tap access, and
            pro-grade tools for your non-stop world.
          </motion.p>

          <motion.button
            custom={2}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            whileHover={{ scale: 1.04, filter: "brightness(1.1)" }}
            whileTap={{ scale: 0.96 }}
            className="flex items-center justify-between"
            style={{
              background: "#7342E2",
              color: "white",
              borderRadius: 50,
              padding: "17px 24px",
              fontFamily: "var(--font-body)",
              fontWeight: 600,
              fontSize: "clamp(0.9rem, 2vw, 1rem)",
              boxShadow: "0 4px 24px rgba(115,66,226,0.28)",
              minWidth: 210,
              gap: 32,
            }}
          >
            Get It Free
            <ArrowRightCircle size={20} />
          </motion.button>
        </div>
      </main>
    </div>
  );
}
