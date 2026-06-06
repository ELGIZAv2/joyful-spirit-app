import { useEffect } from "react";
import { motion, useMotionValue, useSpring, animate } from "framer-motion";

/**
 * Megsy star — natural primary color, 8-point.
 *
 * Behavior:
 * - Stays in the first viewport only.
 * - Starts near the highlighted hero word, then makes one smooth move into
 *   the upper header/logo area as the user begins scrolling.
 * - Stops updating after the first viewport, so it does not fight smooth scroll.
 */

const HERO_SIZE_DESKTOP = 78;
const HERO_SIZE_MOBILE = 46;
const HEADER_SIZE_DESKTOP = 34;
const HEADER_SIZE_MOBILE = 28;

const SPRING = { stiffness: 120, damping: 24, mass: 0.65 } as const;

const FlyingMegsyStar = () => {
  // Raw targets — updated cheaply on scroll.
  const targetX = useMotionValue(0);
  const targetY = useMotionValue(0);
  const targetSize = useMotionValue(HERO_SIZE_DESKTOP);

  // Springs the DOM actually reads — produce smooth motion.
  const x = useSpring(targetX, SPRING);
  const y = useSpring(targetY, SPRING);
  const size = useSpring(targetSize, { stiffness: 200, damping: 26 });

  const introRotate = useMotionValue(0);

  useEffect(() => {
    const ctrl = animate(introRotate, 360, { duration: 1.2, ease: [0.22, 1, 0.36, 1] });
    return ctrl.stop;
  }, [introRotate]);

  useEffect(() => {
    const isMobile = () => window.innerWidth < 768;
    const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);

    const getTargets = () => {
      const hero = document.getElementById("anchor-hero-now")?.getBoundingClientRect();
      const logo = document.getElementById("nav-logo")?.getBoundingClientRect();
      const heroSize = isMobile() ? HERO_SIZE_MOBILE : HERO_SIZE_DESKTOP;
      const headerSize = isMobile() ? HEADER_SIZE_MOBILE : HEADER_SIZE_DESKTOP;
      const gap = isMobile() ? 8 : 12;
      const placeHeaderStarBeforeLogo = logo ? logo.left + logo.width / 2 > window.innerWidth / 2 : false;

      const start = hero
        ? {
            cx: clamp(hero.right + gap + heroSize / 2, heroSize / 2 + 10, window.innerWidth - heroSize / 2 - 10),
            cy: hero.top + hero.height / 2,
            s: heroSize,
          }
        : { cx: window.innerWidth / 2, cy: window.innerHeight * 0.28, s: heroSize };

      const end = logo
        ? {
            cx: clamp(
              placeHeaderStarBeforeLogo
                ? logo.left - gap - headerSize / 2
                : logo.right + gap + headerSize / 2,
              headerSize / 2 + 10,
              window.innerWidth - headerSize / 2 - 10,
            ),
            cy: logo.top + logo.height / 2,
            s: headerSize,
          }
        : { cx: isMobile() ? 98 : 150, cy: 32, s: headerSize };

      return { start, end };
    };

    let initialized = false;
    let lockedInHeader = false;
    let rafId = 0;
    let pending = false;

    const update = () => {
      pending = false;
      const { start, end } = getTargets();
      const progress = ease(clamp(window.scrollY / (window.innerHeight * 0.32), 0, 1));
      const cx = start.cx + (end.cx - start.cx) * progress;
      const cy = start.cy + (end.cy - start.cy) * progress;
      const s = start.s + (end.s - start.s) * progress;

      if (!initialized) {
        targetX.jump(cx);
        targetY.jump(cy);
        targetSize.jump(s);
        x.jump(cx);
        y.jump(cy);
        size.jump(s);
        initialized = true;
        return;
      }

      targetX.set(cx);
      targetY.set(cy);
      targetSize.set(s);

      if (progress >= 1) {
        lockedInHeader = true;
      }
    };

    const schedule = () => {
      if (lockedInHeader && window.scrollY > window.innerHeight * 0.32) return;
      if (lockedInHeader && window.scrollY <= window.innerHeight * 0.32) lockedInHeader = false;
      if (pending) return;
      pending = true;
      rafId = requestAnimationFrame(update);
    };

    const t = setTimeout(update, 200);

    const lenis = (window as unknown as { __lenis?: { on: (e: string, cb: () => void) => void; off: (e: string, cb: () => void) => void } }).__lenis;
    if (lenis) lenis.on("scroll", schedule);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      clearTimeout(t);
      cancelAnimationFrame(rafId);
      if (lenis) lenis.off("scroll", schedule);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [targetX, targetY, targetSize, x, y, size]);

  return (
    <motion.div
      aria-hidden="true"
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        x,
        y,
        translateX: "-50%",
        translateY: "-50%",
        width: size,
        height: size,
        zIndex: 60,
        pointerEvents: "none",
        willChange: "transform",
      }}
    >
      <motion.svg
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        className="text-primary"
        style={{ width: "100%", height: "100%", rotate: introRotate }}
      >
        <path
          d="M50 5 L60 40 L95 50 L60 60 L50 95 L40 60 L5 50 L40 40 Z"
          fill="currentColor"
        />
      </motion.svg>
    </motion.div>
  );
};

export default FlyingMegsyStar;
