import { lazy, Suspense, useEffect, useState } from "react";

const UnicornScene = lazy(() => import("unicornstudio-react"));

/**
 * Animated Unicorn Studio scene with graceful fallbacks:
 * - Reduced motion → static gradient (no JS, no canvas)
 * - Slow / saver connection (2g, save-data) → static gradient
 * - Otherwise lazy-loads the heavy SDK after first paint
 */
const UnicornBackground = () => {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const conn = (navigator as any).connection;
    const slow =
      conn && (conn.saveData || ["slow-2g", "2g", "3g"].includes(conn.effectiveType));
    if (prefersReducedMotion || slow) return;

    // Defer to idle so it never blocks first paint
    const idle = (window as any).requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 600));
    const handle = idle(() => setEnabled(true));
    return () => {
      const cancel = (window as any).cancelIdleCallback ?? clearTimeout;
      cancel(handle);
    };
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      style={{
        background:
          "radial-gradient(60% 60% at 50% 30%, hsl(var(--primary) / 0.35), transparent 65%), " +
          "radial-gradient(40% 40% at 50% 80%, hsl(var(--primary) / 0.18), transparent 70%), #000",
      }}
    >
      {enabled && (
        <Suspense fallback={null}>
          <div
            className="absolute inset-0 w-full h-full
                       [&>div]:!w-full [&>div]:!h-full
                       [&_canvas]:!w-full [&_canvas]:!h-full [&_canvas]:!object-cover"
          >
            <UnicornScene
              projectId="Rt6piBD4uW2VSFUbWNHE"
              width="100%"
              height="100%"
              scale={1}
              dpi={1.5}
              production
              sdkUrl="https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@2.1.12/dist/unicornStudio.umd.js"
            />
          </div>
        </Suspense>
      )}

      <style>{`
        a[href^="https://unicorn.studio"],
        a[href*="unicorn.studio?utm_source"] {
          display: none !important;
        }
      `}</style>
    </div>
  );
};

export default UnicornBackground;
