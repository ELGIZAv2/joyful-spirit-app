// @ts-nocheck — imported design from external repo; backend wiring deferred.
import { useEffect, useRef, useState } from "react";
import { Monitor, RefreshCw, ExternalLink } from "lucide-react";

interface Props {
  src: string;
  title?: string;
}

/**
 * ComputerPreview — wraps an iframe to look like a real desktop browser.
 * Renders content at 1440x900 and scales to fit the available container.
 */
export default function ComputerPreview({ src, title = "Megsy Computer" }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      setScale(Math.min(w / 1440, h / 900, 1));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="w-full h-full flex flex-col bg-black/60 rounded-2xl border border-white/10 overflow-hidden">
      {/* Browser chrome */}
      <div className="h-10 flex items-center gap-2 px-4 bg-white/5 border-b border-white/10">
        <span className="w-3 h-3 rounded-full bg-red-400/80" />
        <span className="w-3 h-3 rounded-full bg-yellow-400/80" />
        <span className="w-3 h-3 rounded-full bg-green-400/80" />
        <div className="flex-1 mx-4 h-6 rounded-md bg-black/40 border border-white/10 grid place-items-center text-xs text-white/60 truncate px-3">
          <Monitor className="w-3 h-3 inline mr-2 opacity-60" />
          {title}
        </div>
        <button
          onClick={() => setReloadKey(k => k + 1)}
          className="p-1.5 rounded-md hover:bg-white/10 text-white/70"
          title="Reload"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
        <a
          href={src}
          target="_blank"
          rel="noreferrer"
          className="p-1.5 rounded-md hover:bg-white/10 text-white/70"
          title="Open in new tab"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Scaled iframe viewport */}
      <div ref={wrapRef} className="flex-1 relative overflow-hidden grid place-items-center bg-[#0a0a0c]">
        <div
          style={{
            width: 1440, height: 900,
            transform: `scale(${scale})`,
            transformOrigin: "center center",
          }}
        >
          <iframe
            key={reloadKey}
            src={src}
            title={title}
            className="w-full h-full bg-white"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        </div>
      </div>
    </div>
  );
}
