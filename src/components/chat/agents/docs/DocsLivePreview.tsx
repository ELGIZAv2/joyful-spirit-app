// Live HTML preview rendered in a sandboxed iframe sized like A4 paper.
// Scales to fit the parent container while preserving the 794×1123 (A4 @ 96dpi) aspect.
import { useEffect, useMemo, useRef, useState } from "react";
import { patchDocHtml } from "@/lib/agent/docs/patchHtml";

interface Props {
  html: string;
  /** Visible width in pixels of the wrapper. Height is derived from A4 ratio. */
  width?: number;
  className?: string;
  /** Fired with the iframe element once it's ready so parent can capture, print etc. */
  onReady?: (iframe: HTMLIFrameElement) => void;
}

const A4_W = 794;
const A4_H = 1123;

export default function DocsLivePreview({ html, width = 320, className, onReady }: Props) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [scale, setScale] = useState(1);

  const patched = useMemo(() => patchDocHtml(html), [html]);

  useEffect(() => {
    const update = () => {
      const w = wrapperRef.current?.clientWidth ?? width;
      setScale(Math.max(0.1, Math.min(1.5, w / A4_W)));
    };
    update();
    const ro = new ResizeObserver(update);
    if (wrapperRef.current) ro.observe(wrapperRef.current);
    return () => ro.disconnect();
  }, [width]);

  useEffect(() => {
    if (!iframeRef.current) return;
    onReady?.(iframeRef.current);
  }, [html, onReady]);

  return (
    <div
      ref={wrapperRef}
      className={"relative overflow-hidden rounded-lg bg-white border border-border/50 " + (className ?? "")}
      style={{ width, height: A4_H * scale, direction: "ltr" }}
    >
      <iframe
        ref={iframeRef}
        title="document-preview"
        sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        srcDoc={patched}
        style={{
          width: A4_W,
          height: A4_H,
          border: 0,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          pointerEvents: "none",
          background: "white",
        }}
      />
    </div>
  );
}
