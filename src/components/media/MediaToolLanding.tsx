import { useRef, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Upload } from "lucide-react";
import { toast } from "sonner";

interface MediaToolLandingProps {
  title: string;
  headline: string;
  accent: string;
  description: string;
  heroImage: string;
  cost?: number;
  costLabel?: string;
  accept?: string;
  uploadLabel?: string;
  resultType?: "image" | "video";
  backTo?: string;
  hudExtras?: ReactNode;
  /** When provided, replaces the default file-upload action. */
  primaryAction?: { label: string; onClick: () => void };
  onFileSelected?: (file: File) => void;
}

/**
 * MediaToolLanding — shared landing screen used by every tool.
 * Visual parity with MediaToolShell (Paper & Ink, Sora + Manrope).
 * Desktop: editorial split-screen. Mobile: hero backdrop + floating sheet.
 */
export default function MediaToolLanding({
  title,
  headline,
  accent,
  description,
  heroImage,
  cost = 1,
  costLabel,
  accept = "image/*",
  uploadLabel = "Upload Photo",
  resultType = "image",
  backTo,
  hudExtras,
  primaryAction,
  onFileSelected,
}: MediaToolLandingProps) {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBack = () => navigate(backTo || (resultType === "video" ? "/videos" : "/images"));

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 20 * 1024 * 1024) {
      toast.error("File too large (max 20MB).");
      e.target.value = "";
      return;
    }
    onFileSelected?.(f);
    e.target.value = "";
  };

  const triggerPrimary = () => {
    if (primaryAction) primaryAction.onClick();
    else fileInputRef.current?.click();
  };

  const Hud = (
    <div className="flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-ink text-paper flex items-center justify-center">
          <Upload className="w-4 h-4" />
        </div>
        <div>
          <div className="font-sora text-ink text-sm font-semibold leading-tight">
            {primaryAction ? "Ready when you are" : "Drop a file to begin"}
          </div>
          <div className="font-manrope text-ink/50 text-xs">
            {resultType === "video" ? "MP4, MOV, WebM" : "PNG, JPG, WebP — up to 20MB"}
          </div>
        </div>
      </div>

      {hudExtras && <div className="mb-6">{hudExtras}</div>}

      {!primaryAction && (
        <input ref={fileInputRef} type="file" accept={accept} className="hidden" onChange={handleFileInput} />
      )}

      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        onClick={triggerPrimary}
        className="w-full py-4 px-5 bg-ink text-paper rounded-full flex items-center justify-between gap-3 font-sora font-semibold text-sm hover:bg-ink/90 transition"
      >
        <span>{primaryAction?.label || uploadLabel}</span>
        <span className="px-2.5 py-1 rounded-full bg-paper/15 text-paper text-[10px] font-mono tracking-wider">
          {costLabel || `${cost} MC`}
        </span>
      </motion.button>

      {!primaryAction && (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="mt-3 w-full py-3.5 rounded-full border border-ink/15 hover:border-ink/40 hover:bg-ink/[0.03] transition font-manrope text-ink/60 text-sm"
        >
          or drag &amp; drop anywhere
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-[100dvh] w-full bg-paper text-ink selection:bg-ink/15">
      {/* DESKTOP / TABLET */}
      <div className="hidden lg:block">
        <div className="absolute top-0 inset-x-0 z-10 flex items-center justify-between px-6 lg:px-10 py-5">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 font-manrope text-sm font-medium text-ink bg-paper border border-ink/20 rounded-full px-4 py-2 hover:bg-ink hover:text-paper hover:border-ink transition shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[100dvh]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="relative bg-ink/5 overflow-hidden order-2 lg:order-1 min-h-[55vh] lg:min-h-[100dvh]"
          >
            <img src={heroImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-tr from-ink/30 via-transparent to-transparent" />
          </motion.div>

          <div className="relative order-1 lg:order-2 flex items-center px-6 lg:px-16 py-24 lg:py-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-md mx-auto"
            >
              <h1 className="font-sora text-ink text-4xl lg:text-5xl xl:text-6xl font-bold leading-[1.02] tracking-tight mb-5">
                {headline} <span className="italic font-light text-ink/70">{accent}</span>
              </h1>
              <p className="font-manrope text-ink/60 text-base leading-relaxed mb-10 max-w-sm">{description}</p>
              <div className="h-px w-full bg-ink/10 mb-8" />
              {Hud}
            </motion.div>
          </div>
        </div>
      </div>

      {/* MOBILE */}
      <div className="lg:hidden relative min-h-[100dvh] flex flex-col">
        <motion.div
          initial={{ scale: 1.05, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-x-0 top-0 h-[58dvh] overflow-hidden"
        >
          <img src={heroImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-ink/20 via-ink/5 to-paper" />
        </motion.div>

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

        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
          className="relative z-10 mt-auto mx-3 mb-3 rounded-[28px] bg-paper border border-ink/10 shadow-[0_-8px_40px_-12px_rgba(0,0,0,0.18)] px-6 pt-6 pb-7"
        >
          <h1 className="font-sora text-ink text-[2rem] leading-[1.05] font-bold tracking-tight mb-3">
            {headline} <span className="italic font-light text-ink/60">{accent}</span>
          </h1>
          <p className="font-manrope text-ink/60 text-[0.9rem] leading-relaxed mb-6">{description}</p>
          <div className="h-px w-full bg-ink/10 mb-6" />
          {Hud}
        </motion.div>
      </div>
    </div>
  );
}
