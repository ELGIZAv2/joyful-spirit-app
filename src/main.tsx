import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";
import "./styles/slides-typography.css";
import "@fontsource/instrument-serif/400.css";
import "@fontsource/work-sans/300.css";
import "@fontsource/work-sans/400.css";
import "@fontsource/work-sans/500.css";
import "@fontsource/work-sans/600.css";

import { reportError } from "@/lib/errors";


// Prevent right-click context menu
// Prevent right-click context menu, except inside editable fields so users can copy/paste normally
document.addEventListener("contextmenu", (e) => {
  const t = e.target as HTMLElement | null;
  if (t && t.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"]')) return;
  e.preventDefault();
});

// Report any unhandled error or promise rejection to the admin (best-effort).
let __lastReport = 0;
const __reportThrottled = (err: unknown, source: string) => {
  const now = Date.now();
  if (now - __lastReport < 2000) return; // throttle bursts
  __lastReport = now;
  void reportError(err, { source });
};
window.addEventListener("error", (e) => __reportThrottled(e.error ?? e.message, "window.onerror"));
window.addEventListener("unhandledrejection", (e) => __reportThrottled(e.reason, "unhandledrejection"));

// Apply saved user bubble color
const savedBubble = localStorage.getItem("userBubbleColor");
if (savedBubble) document.documentElement.style.setProperty("--user-bubble", savedBubble);

// Keep `position: fixed` elements pinned to the visual viewport on mobile
// (iOS Safari shifts fixed elements when the URL bar / keyboard show or hide).
// Components can read `--kb-offset` to translate themselves above the keyboard.
(() => {
  const vv = window.visualViewport;
  if (!vv) return;
  const update = () => {
    // Only the on-screen keyboard should lift the fixed input. The address bar
    // showing/hiding (and overscroll) also shrinks the visual viewport slightly,
    // so ignore small deltas to avoid the input jumping up while scrolling.
    const delta = window.innerHeight - vv.height;
    const offset = delta > 120 ? delta : 0;
    document.documentElement.style.setProperty("--kb-offset", `${offset}px`);
  };
  update();
  // React to keyboard open/close only — NOT to scroll, which causes the bar to drift.
  vv.addEventListener("resize", update);
})();

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
