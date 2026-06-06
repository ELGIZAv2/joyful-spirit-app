import { useRef, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Download,
  RotateCcw,
  Share2,
  Upload,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

export type ToolStage = "landing" | "processing" | "result";

interface MediaToolShellProps {
  toolId: string;
  title: string;
  headline: string;
  accent: string;
  description: string;
  heroImage: string;
  cost?: number;
  costLabel?: string;
  accept?: string;
  uploadLabel?: string;
  resultLabel?: string;
  resultType?: "image" | "video";
  backTo?: string;
  stage: ToolStage;
  sourceImage?: string | null;
  resultUrl?: string | null;
  processingLabel?: string;
  hudExtras?: ReactNode;
  onFileSelected: (file: File) => void;
  onReset: () => void;
}

/**
 * MediaToolShell — Editorial split-screen. Paper & Ink palette, Sora + Manrope.
 * Left: full-bleed hero image. Right: editorial copy + action panel.
 */
export default function MediaToolShell({
  toolId,
  title,
  headline,
  accent,
  description,
  heroImage,
  cost = 1,
  costLabel,
  accept = "image/*",
  uploadLabel = "Upload Photo",
  resultLabel = "Try Another",
  resultType = "image",
  backTo,
  stage,
  sourceImage,
  resultUrl,
  processingLabel = "Working…",
  hudExtras,
  onFileSelected,
  onReset,
}: MediaToolShellProps) {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const defaultBackForVideos = [
    "swap-characters","talking-photo","upscale","video-upscale","auto-caption",
    "lip-sync","video-extender","video-to-text","green-screen","video-colorizer",
    "video-watermark","video-bg-replacer","video-intro","video-denoise","thumbnail-generator",
  ].includes(toolId);
  const back = backTo || (defaultBackForVideos ? "/videos" : "/images");

  const handleBack = () => {
    if (stage === "landing") navigate(back);
    else onReset();
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 20 * 1024 * 1024) {
      toast.error("File too large (max 20MB).");
      e.target.value = "";
      return;
    }
    onFileSelected(f);
    e.target.value = "";
  };

  const handleDownload = () => {
    if (!resultUrl) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = `${toolId}-${Date.now()}.${resultType === "video" ? "mp4" : "png"}`;
    a.target = "_blank";
    a.click();
  };

  const handleShare = async () => {
    if (!resultUrl) return;
    await navigator.clipboard.writeText(resultUrl);
    toast.success("Link copied!");
  };

  // ============== HUD stages ==============
  const HudLanding = (
    <div className="flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-ink text-paper flex items-center justify-center">
          <Upload className="w-4 h-4" />
        </div>
        <div>
          <div className="font-sora text-ink text-sm font-semibold leading-tight">Drop a file to begin</div>
          <div className="font-manrope text-ink/50 text-xs">
            {resultType === "video" ? "MP4, MOV, WebM" : "PNG, JPG, WebP — up to 20MB"}
          </div>
        </div>
      </div>

      {hudExtras && <div className="mb-6">{hudExtras}</div>}

      <input ref={fileInputRef} type="file" accept={accept} className="hidden" onChange={handleFileInput} />

      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => fileInputRef.current?.click()}
        className="w-full py-4 px-5 bg-ink text-paper rounded-full flex items-center justify-between gap-3 font-sora font-semibold text-sm hover:bg-ink/90 transition"
      >
        <span>{uploadLabel}</span>
        <span className="px-2.5 py-1 rounded-full bg-paper/15 text-paper text-[10px] font-mono tracking-wider">
          {costLabel || `${cost} MC`}
        </span>
      </motion.button>

      <button
        onClick={() => fileInputRef.current?.click()}
        className="mt-3 w-full py-3.5 rounded-full border border-ink/15 hover:border-ink/40 hover:bg-ink/[0.03] transition font-manrope text-ink/60 text-sm"
      >
        or drag &amp; drop anywhere
      </button>
    </div>
  );

  const HudProcessing = (
    <div className="flex flex-col items-center text-center py-4">
      {sourceImage && (
        <div className="relative w-40 h-40 mb-6 rounded-2xl overflow-hidden border border-ink/10 shadow-lg">
          {resultType === "video" ? (
            <video src={sourceImage} className="w-full h-full object-cover" muted />
          ) : (
            <img src={sourceImage} alt="" className="w-full h-full object-cover" />
          )}
          <motion.div
            initial={{ y: "-100%" }}
            animate={{ y: "260%" }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute inset-x-0 h-1/2 pointer-events-none bg-gradient-to-b from-transparent via-ink/30 to-transparent blur-md"
          />
        </div>
      )}
      <div className="flex items-center gap-2 text-ink text-sm font-sora font-medium">
        <Loader2 className="w-4 h-4 animate-spin" />
        {processingLabel}
      </div>
      <p className="mt-2 text-xs text-ink/50 font-manrope">Neural engine composing your result…</p>
    </div>
  );

  const HudResult = resultUrl && (
    <div className="flex flex-col">
      <div className="w-full rounded-2xl overflow-hidden border border-ink/10 shadow-lg bg-ink/5 mb-5">
        {resultType === "video" ? (
          <video src={resultUrl} controls autoPlay className="w-full max-h-[38vh] object-contain" />
        ) : (
          <img src={resultUrl} alt="Result" className="w-full max-h-[38vh] object-contain" />
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleDownload}
          className="py-3.5 rounded-full bg-ink text-paper font-sora font-semibold text-sm flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4" /> Download
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleShare}
          className="py-3.5 rounded-full border border-ink/15 text-ink font-sora font-semibold text-sm flex items-center justify-center gap-2 hover:bg-ink/[0.04] transition"
        >
          <Share2 className="w-4 h-4" /> Share
        </motion.button>
      </div>
      <button
        onClick={onReset}
        className="mt-3 w-full py-3 rounded-full font-manrope text-ink/60 text-sm flex items-center justify-center gap-2 hover:text-ink transition"
      >
        <RotateCcw className="w-3.5 h-3.5" /> {resultLabel}
      </button>
    </div>
  );

  // ============== Layout ==============
  return (
    <div className="min-h-[100dvh] w-full bg-paper text-ink selection:bg-ink/15">
      {/* ============================================================ */}
      {/* DESKTOP / TABLET (lg+) — original split-screen, untouched     */}
      {/* ============================================================ */}
      <div className="hidden lg:block">
        {/* Top bar */}
        <div className="absolute top-0 inset-x-0 z-10 flex items-center justify-between px-6 lg:px-10 py-5">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 font-manrope text-sm font-medium text-ink bg-paper border border-ink/20 rounded-full px-4 py-2 hover:bg-ink hover:text-paper hover:border-ink transition shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        </div>

        {/* Split screen */}
        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[100dvh]">
          {/* LEFT — hero image, full-bleed */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="relative bg-ink/5 overflow-hidden order-2 lg:order-1 min-h-[55vh] lg:min-h-[100dvh]"
          >
            <img
              src={heroImage}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-ink/30 via-transparent to-transparent" />
          </motion.div>

          {/* RIGHT — editorial copy + action */}
          <div className="relative order-1 lg:order-2 flex items-center px-6 lg:px-16 py-24 lg:py-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-md mx-auto"
            >
              <h1 className="font-sora text-ink text-4xl lg:text-5xl xl:text-6xl font-bold leading-[1.02] tracking-tight mb-5">
                {headline}{" "}
                <span className="italic font-light text-ink/70">{accent}</span>
              </h1>

              <p className="font-manrope text-ink/60 text-base leading-relaxed mb-10 max-w-sm">
                {description}
              </p>

              <div className="h-px w-full bg-ink/10 mb-8" />

              <AnimatePresence mode="wait">
                {stage === "landing" && (
                  <motion.div key="land" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    {HudLanding}
                  </motion.div>
                )}
                {stage === "processing" && (
                  <motion.div key="proc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    {HudProcessing}
                  </motion.div>
                )}
                {stage === "result" && (
                  <motion.div key="res" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    {HudResult}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* MOBILE (<lg) — dedicated immersive design                     */}
      {/* Full-screen hero backdrop + editorial floating sheet          */}
      {/* ============================================================ */}
      <div className="lg:hidden relative min-h-[100dvh] flex flex-col">
        {/* Hero backdrop */}
        <motion.div
          initial={{ scale: 1.05, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-x-0 top-0 h-[58dvh] overflow-hidden"
        >
          <img
            src={heroImage}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Paper fade to bottom so the sheet blends in */}
          <div className="absolute inset-0 bg-gradient-to-b from-ink/20 via-ink/5 to-paper" />
        </motion.div>

        {/* Top bar (over hero) */}
        <div className="relative z-20 flex items-center justify-between px-5 pt-5">
          <button
            onClick={handleBack}
            aria-label="Back"
            className="flex items-center justify-center w-10 h-10 rounded-full bg-paper/90 backdrop-blur border border-ink/15 text-ink shadow-sm active:scale-95 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="w-10 h-10" aria-hidden />
        </div>

        {/* Editorial floating sheet */}
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
          className="relative z-10 mt-auto mx-3 mb-3 rounded-[28px] bg-paper border border-ink/10 shadow-[0_-8px_40px_-12px_rgba(0,0,0,0.18)] px-6 pt-6 pb-7"
        >


          <h1 className="font-sora text-ink text-[2rem] leading-[1.05] font-bold tracking-tight mb-3">
            {headline}{" "}
            <span className="italic font-light text-ink/60">{accent}</span>
          </h1>

          <p className="font-manrope text-ink/60 text-[0.9rem] leading-relaxed mb-6">
            {description}
          </p>

          <div className="h-px w-full bg-ink/10 mb-6" />

          <AnimatePresence mode="wait">
            {stage === "landing" && (
              <motion.div key="m-land" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {HudLanding}
              </motion.div>
            )}
            {stage === "processing" && (
              <motion.div key="m-proc" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {HudProcessing}
              </motion.div>
            )}
            {stage === "result" && (
              <motion.div key="m-res" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {HudResult}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
