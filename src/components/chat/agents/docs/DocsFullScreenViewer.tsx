// Full-screen viewer for a generated document. Visual language mirrors
// SlidesDeckCard's fullscreen presenter: dark backdrop, header chrome,
// side chevrons, and a bottom filmstrip — but rendering A4 pages instead.
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowRight, Download, Share2 } from "lucide-react";
import { patchDocHtml } from "@/lib/agent/docs/patchHtml";

interface Props {
  open: boolean;
  onClose: () => void;
  html: string;
  title: string;
  onDownloadPdf?: () => void;
  onPrint?: () => void;
}

const A4_W = 794;
const A4_H = 1123;

/** Best-effort split into pages by counting `.page` blocks in the source HTML. */
function countPages(html: string): number {
  if (!html) return 1;
  const matches = html.match(/class\s*=\s*["'][^"']*\bpage\b[^"']*["']/g);
  return Math.max(1, matches?.length ?? 1);
}

/** Derive a short two-word label from the document title. */
function shortName(title: string): string {
  if (!title) return "New document";
  const stop = new Set([
    "ال", "في", "من", "على", "عن", "إلى", "الى", "هذا", "هذه", "the", "a", "an",
    "of", "for", "to", "and", "or", "in", "on", "my", "our",
    "–", "-", "—", "|", ":", "·",
  ]);
  const cleaned = title
    .replace(/[\u061F?!.,،؛;:()«»"'`]+/g, " ")
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w && !stop.has(w.toLowerCase()));
  const picked = cleaned.slice(0, 2);
  if (picked.length === 0) return title.slice(0, 18);
  if (picked.length === 1) return picked[0];
  return picked.join(" ");
}

export default function DocsFullScreenViewer({
  open,
  onClose,
  html,
  title,
  onDownloadPdf,
}: Props) {
  const total = useMemo(() => countPages(html), [html]);
  const label = useMemo(() => shortName(title), [title]);
  const [idx, setIdx] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const stripIframeRefs = useRef<(HTMLIFrameElement | null)[]>([]);

  useEffect(() => {
    if (!open) return;
    setIdx(0);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") setIdx((i) => Math.min(total - 1, i + 1));
      else if (e.key === "ArrowLeft") setIdx((i) => Math.max(0, i - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, total]);

  // Scroll the main iframe to the active page when idx changes
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const scrollToPage = () => {
      try {
        const doc = iframe.contentDocument;
        if (!doc) return;
        const pages = doc.querySelectorAll(".page");
        const el = pages[idx] as HTMLElement | undefined;
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        else if (idx === 0) iframe.contentWindow?.scrollTo({ top: 0, behavior: "smooth" });
      } catch {
        /* cross-origin guard */
      }
    };
    // tiny delay so srcDoc paint completes
    const t = setTimeout(scrollToPage, 60);
    return () => clearTimeout(t);
  }, [idx, html, open]);

  if (!open) return null;

  const patched = patchDocHtml(html);

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title, text: title });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(title);
      }
    } catch {
      /* user cancelled */
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[200] bg-black/95 backdrop-blur flex flex-col"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Header — minimal: back button + short AI-derived name */}
        <header className="flex items-center gap-3 px-4 py-3 shrink-0">
          <button
            onClick={onClose}
            className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
            aria-label="Back"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold text-white truncate">{label}</span>
        </header>

        {/* Stage */}
        <div className="flex-1 flex items-center justify-center px-3 sm:px-10 pb-4 relative min-h-0">
          {total > 1 && (
            <button
              onClick={() => setIdx((i) => Math.max(0, i - 1))}
              disabled={idx === 0}
              className="absolute left-2 sm:left-4 z-10 h-11 w-11 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white flex items-center justify-center"
              aria-label="Previous page"
            >
              <ChevronLeft />
            </button>
          )}

          {/* Paper — keeps A4 proportions, fits available space */}
          <div
            className="relative bg-white rounded-lg overflow-hidden"
            style={{
              aspectRatio: `${A4_W} / ${A4_H}`,
              height: "100%",
              maxHeight: "100%",
              maxWidth: "100%",
            }}
          >
            <iframe
              ref={iframeRef}
              title="document-full"
              sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-modals"
              srcDoc={patched}
              className="w-full h-full border-0 bg-white"
            />
          </div>

          {total > 1 && (
            <button
              onClick={() => setIdx((i) => Math.min(total - 1, i + 1))}
              disabled={idx === total - 1}
              className="absolute right-2 sm:right-4 z-10 h-11 w-11 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white flex items-center justify-center"
              aria-label="Next page"
            >
              <ChevronRight />
            </button>
          )}
        </div>

        {/* Filmstrip — only when document has multiple pages */}
        {total > 1 && (
          <div className="shrink-0 border-t border-white/10 bg-black/40 backdrop-blur px-3 py-2.5 overflow-x-auto">
            <div className="flex items-center gap-2 min-w-min mx-auto w-fit">
              {Array.from({ length: total }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIdx(i)}
                  aria-label={`Page ${i + 1}`}
                  className={`relative shrink-0 w-24 rounded-md overflow-hidden transition ring-2 bg-white ${
                    i === idx ? "ring-white" : "ring-transparent opacity-60 hover:opacity-100"
                  }`}
                  style={{ aspectRatio: `${A4_W} / ${A4_H}` }}
                >
                  <div className="absolute inset-0 overflow-hidden">
                    <iframe
                      ref={(el) => { stripIframeRefs.current[i] = el; }}
                      title={`thumb-${i}`}
                      sandbox="allow-same-origin"
                      srcDoc={patched}
                      style={{
                        width: A4_W,
                        height: A4_H,
                        border: 0,
                        background: "white",
                        transform: `translateY(${-i * A4_H * (96 / A4_W)}px) scale(${96 / A4_W})`,
                        transformOrigin: "top left",
                        pointerEvents: "none",
                      }}
                    />
                  </div>
                  <span className="absolute bottom-0.5 right-1 text-[9px] font-mono text-white bg-black/60 rounded px-1">
                    {i + 1}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Bottom action bar — download + share */}
        <div className="shrink-0 border-t border-white/10 bg-black/40 backdrop-blur px-4 py-3 flex items-center justify-center gap-2">
          {onDownloadPdf && (
            <button
              onClick={onDownloadPdf}
              className="h-10 px-4 rounded-full bg-white text-black inline-flex items-center gap-2 text-[13px] font-semibold hover:opacity-90"
              aria-label="Download"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>
          )}
          <button
            onClick={handleShare}
            className="h-10 px-4 rounded-full bg-white/10 hover:bg-white/20 text-white inline-flex items-center gap-2 text-[13px] font-medium"
            aria-label="Share"
          >
            <Share2 className="w-4 h-4" />
            <span>Share</span>
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
