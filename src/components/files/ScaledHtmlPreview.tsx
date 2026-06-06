import { useEffect, useRef, useState } from "react";
import { Smartphone, Monitor } from "lucide-react";

/**
 * Renders generated HTML inside an iframe at a fixed device width
 * (mobile or desktop) and scales it to fit the container while
 * allowing vertical scrolling of the full document.
 */
const DESKTOP_W = 1280;
const MOBILE_W = 414;

interface Props {
  html: string;
}

const ScaledHtmlPreview = ({ html }: Props) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const contentObserverRef = useRef<ResizeObserver | null>(null);
  const rafRef = useRef<number | null>(null);
  const [scale, setScale] = useState(1);
  const [contentH, setContentH] = useState(800);
  // Default to mobile when the host viewport is narrow so the preview
  // matches what the user sees on their device.
  const [device, setDevice] = useState<"mobile" | "desktop">(() =>
    typeof window !== "undefined" && window.innerWidth < 768 ? "mobile" : "desktop",
  );

  const baseW = device === "mobile" ? MOBILE_W : DESKTOP_W;

  // Scale to container width (always allow up-scaling for mobile so the slide is comfortably readable).
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      if (!w) return;
      const padding = 24;
      const available = Math.max(200, w - padding);
      const next = device === "mobile"
        ? Math.min(available / baseW, 1.4)
        : Math.min(available / baseW, 1);
      setScale((current) => Math.abs(current - next) > 0.001 ? next : current);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [device, baseW]);

  // Re-measure when device changes
  useEffect(() => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;
    const h = Math.max(doc.documentElement.scrollHeight, doc.body?.scrollHeight || 0, 800);
    setContentH(h);
  }, [device]);

  const handleLoad = () => {
    try {
      contentObserverRef.current?.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      const doc = iframeRef.current?.contentDocument;
      if (!doc) return;
      const measure = () => {
        rafRef.current = null;
        const h = Math.max(
          doc.documentElement.scrollHeight,
          doc.body?.scrollHeight || 0,
          800,
        );
        setContentH((current) => Math.abs(current - h) > 2 ? h : current);
      };
      measure();
      const ro = new ResizeObserver(() => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(measure);
      });
      if (doc.body) ro.observe(doc.body);
      contentObserverRef.current = ro;
    } catch {}
  };

  useEffect(() => () => {
    contentObserverRef.current?.disconnect();
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  const wrappedHtml = html?.includes("<head>")
    ? html.replace(
        "<head>",
        `<head><meta name="viewport" content="width=${baseW}, initial-scale=1"><style>html,body{margin:0;padding:0;background:#fff;overflow-x:hidden;} *{box-sizing:border-box;}</style>`,
      )
    : `<!doctype html><html><head><meta name="viewport" content="width=${baseW}"><style>html,body{margin:0;background:#fff;}</style></head><body>${html || ""}</body></html>`;

  return (
    <div
      ref={wrapRef}
      className="relative flex-1 w-full bg-neutral-100 dark:bg-neutral-900 overflow-y-auto overflow-x-hidden overscroll-contain"
    >
      {/* Device toggle */}
      <div className="sticky top-2 z-10 flex justify-center pointer-events-none">
        <div className="pointer-events-auto inline-flex items-center gap-1 p-1 rounded-full bg-background/80 backdrop-blur border border-border/60 shadow-lg">
          <button
            onClick={() => setDevice("mobile")}
            className={`h-8 w-8 rounded-full flex items-center justify-center transition ${
              device === "mobile" ? "bg-foreground text-background" : "text-muted-foreground"
            }`}
            aria-label="Mobile preview"
          >
            <Smartphone className="h-4 w-4" />
          </button>
          <button
            onClick={() => setDevice("desktop")}
            className={`h-8 w-8 rounded-full flex items-center justify-center transition ${
              device === "desktop" ? "bg-foreground text-background" : "text-muted-foreground"
            }`}
            aria-label="Desktop preview"
          >
            <Monitor className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        className="mx-auto bg-white shadow-2xl mt-3 mb-6 rounded-lg overflow-hidden"
        style={{
          width: baseW * scale,
          height: contentH * scale,
        }}
      >
        <div
          style={{
            width: baseW,
            height: contentH,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          <iframe
            key={device}
            ref={iframeRef}
            onLoad={handleLoad}
            srcDoc={wrappedHtml}
            title="Document preview"
            className="bg-white border-0 block"
            style={{ width: baseW, height: contentH }}
            sandbox="allow-same-origin allow-scripts"
            scrolling="no"
          />
        </div>
      </div>
    </div>
  );
};

export default ScaledHtmlPreview;
