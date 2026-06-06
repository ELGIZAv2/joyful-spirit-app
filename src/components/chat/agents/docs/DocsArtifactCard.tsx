// Free-form Docs artifact card. Visual language matches SlidesDeckCard:
// a compact cover thumbnail (small slice of the real A4 preview) that opens
// the full-screen viewer on click — same vibe as the slides preview.
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Maximize2, FileCode2 } from "lucide-react";
import { toast } from "sonner";
import DocsLivePreview from "./DocsLivePreview";
import { loadDocHtml } from "@/lib/agent/docs/htmlCache";
import { patchDocHtml, waitForIframeReady } from "@/lib/agent/docs/patchHtml";

const DocsFullScreenViewer = lazy(() => import("./DocsFullScreenViewer"));

interface Props {
  /** Local cache id — html lives in localStorage under this key. */
  artifactId: string;
  title: string;
  docType: string;
  /** Optional inline html (when message just arrived and cache may not be hydrated yet). */
  html?: string;
}

const A4_W = 794;
const A4_H = 1123;
// Visible width of the doc inside the cover thumbnail. The live preview keeps
// the A4 ratio, so we crop it (overflow:hidden) to show just the top slice.
const COVER_PREVIEW_W = 520;

export default function DocsArtifactCard({ artifactId, title, docType, html: inlineHtml }: Props) {
  const [open, setOpen] = useState(false);
  const [html, setHtml] = useState<string | null>(inlineHtml ?? null);
  const [exportingPdf, setExportingPdf] = useState(false);

  // Keep in sync when parent streams in new html chunks
  useEffect(() => {
    if (inlineHtml) setHtml(inlineHtml);
  }, [inlineHtml]);

  useEffect(() => {
    if (html) return;
    const cached = loadDocHtml(artifactId);
    if (cached) setHtml(cached);
  }, [artifactId, html]);

  // Treat as streaming while content is too small to be a real document.
  const isStreaming = !!html && html.length < 2000 && !/<\/html\s*>/i.test(html);

  const filenameBase = useMemo(() => {
    const safe = (title || "document").replace(/[^\p{L}\p{N}_-]+/gu, "-").slice(0, 60);
    return safe || "document";
  }, [title]);

  const downloadHtml = () => {
    if (!html) return;
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filenameBase}.html`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // NATIVE PRINT-TO-PDF: uses the browser's own print engine, which
  // guarantees perfect Arabic / CJK / Hebrew / Devanagari / RTL shaping
  // (no html2canvas glyph splitting). The user picks "Save as PDF" in the
  // print dialog — same flow Google Docs, Notion, Linear use.
  const downloadPdf = async () => {
    if (!html) { toast.error("No content to download"); return; }
    setExportingPdf(true);
    try {
      toast.loading("Opening Save as PDF dialog…", { id: "pdf-export" });
      const patched = patchDocHtml(html);

      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";
      iframe.style.opacity = "0";
      iframe.style.pointerEvents = "none";
      iframe.setAttribute("aria-hidden", "true");
      iframe.title = filenameBase;
      document.body.appendChild(iframe);
      iframe.srcdoc = patched;

      await waitForIframeReady(iframe, 8000);

      try {
        const idoc = iframe.contentDocument;
        if (idoc) idoc.title = filenameBase;
      } catch {/* ignore */}

      const win = iframe.contentWindow;
      if (!win) throw new Error("iframe contentWindow missing");

      const cleanup = () => {
        setTimeout(() => {
          try { document.body.removeChild(iframe); } catch {/* ignore */}
        }, 1000);
      };
      win.addEventListener("afterprint", cleanup, { once: true });

      win.focus();
      win.print();
      toast.success("Choose \"Save as PDF\" from the print dialog", { id: "pdf-export" });
      setTimeout(cleanup, 60_000);
    } catch (e) {
      console.error("[docs] downloadPdf failed", e);
      toast.error("Could not open PDF dialog — try downloading as HTML", { id: "pdf-export" });
    } finally {
      setExportingPdf(false);
    }
  };

  const print = () => {
    if (!html) { toast.error("No content to print"); return; }
    const w = window.open("", "_blank");
    if (!w) { toast.error("Pop-ups are blocked — enable them to print"); return; }
    const patched = patchDocHtml(html);
    w.document.open();
    w.document.write(patched);
    w.document.close();
    try { w.document.title = filenameBase; } catch {/* ignore */}
    const tryPrint = () => {
      try { w.focus(); w.print(); } catch (e) { console.error(e); }
    };
    w.addEventListener("load", () => {
      const fontsReady = (w.document as Document & { fonts?: FontFaceSet }).fonts?.ready;
      if (fontsReady) fontsReady.then(tryPrint).catch(tryPrint);
      else setTimeout(tryPrint, 600);
    });
  };

  const openFull = () => { if (!isStreaming && html) setOpen(true); };

  return (
    <>
      <div className="mt-3 rounded-2xl overflow-hidden border border-border/40 bg-card max-w-xl">
        {/* COVER — small slice of the real preview, matches SlidesDeckCard look */}
        <button
          onClick={openFull}
          disabled={!html || isStreaming}
          aria-label="Open preview"
          className="relative block w-full aspect-[16/10] overflow-hidden group bg-muted/30 disabled:cursor-default"
        >
          {html ? (
            <>
              {/* Live A4 preview, top-aligned & cropped */}
              <div className="absolute inset-x-0 top-0 flex justify-center">
                <DocsLivePreview html={html} width={COVER_PREVIEW_W} />
              </div>
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/85 to-transparent" />
              {/* Hover "Open" badge */}
              {!isStreaming && (
                <div className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-black/50 backdrop-blur px-2.5 py-1 text-[11px] font-medium text-white opacity-0 group-hover:opacity-100 transition">
                  <Maximize2 className="w-3 h-3" /> Open
                </div>
              )}
              {/* Streaming overlay */}
              {isStreaming && (
                <div className="absolute inset-0 flex items-end justify-center p-4 bg-gradient-to-t from-background/80 to-transparent">
                  <div className="bg-foreground/90 text-background rounded-full h-8 px-3 inline-flex items-center gap-2 text-[11.5px] font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Generating live…</span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-[12px] text-muted-foreground">
              Preview is not available now
            </div>
          )}
        </button>

        {/* FOOTER — same button language as SlidesDeckCard */}
        <div className="flex items-center justify-end px-3 py-2 border-t border-border/40 bg-background/40 gap-2">
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={openFull}
              disabled={!html || isStreaming}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-foreground text-background hover:opacity-90 transition disabled:opacity-40"
            >
              Preview
            </button>
            <button
              onClick={downloadPdf}
              disabled={!html || exportingPdf}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-accent/60 hover:bg-accent border border-border/40 transition disabled:opacity-50"
            >
              Download PDF
            </button>
            <button
              onClick={downloadHtml}
              disabled={!html}
              aria-label="HTML"
              title="Download HTML"
              className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-border/60 hover:bg-muted/40 transition disabled:opacity-50"
            >
              <FileCode2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {open && html && (
        <Suspense fallback={null}>
          <DocsFullScreenViewer
            open={open}
            onClose={() => setOpen(false)}
            html={html}
            title={title}
            onDownloadPdf={downloadPdf}
            onPrint={print}
          />
        </Suspense>
      )}
    </>
  );
}
