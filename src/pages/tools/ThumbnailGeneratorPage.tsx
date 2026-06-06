import { useState, useRef } from "react";
import { useToolSeo } from "@/hooks/useToolSeo";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Download, Share2, RefreshCw, ImagePlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCredits } from "@/hooks/useCredits";
import heroImg from "@/assets/tool-landing/thumbnail-generator-v8.webp";
import samplePoster from "@/assets/thumbnail-sample-boy-v2.webp";

type Stage = "compose" | "generating" | "result";

const GLASS =
  "bg-white/[0.06] backdrop-blur-3xl backdrop-saturate-200 border border-white/15 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.18),inset_0_-1px_0_0_rgba(255,255,255,0.04),0_20px_60px_-20px_rgba(0,0,0,0.7)]";
const GLASS_PILL =
  "bg-white/10 backdrop-blur-2xl backdrop-saturate-200 border border-white/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.3),0_8px_24px_-8px_rgba(0,0,0,0.6)]";

// Fal model dedicated to high-quality thumbnail/image generation
const FAL_MODEL = "fal-ai/flux-pro/v1.1-ultra";

const STYLES = [
  { id: "youtube", label: "YouTube", prompt: "YouTube thumbnail, bold text overlay, dramatic expression, bright saturated colors, high contrast" },
  { id: "gaming", label: "Gaming", prompt: "Gaming thumbnail, neon glow, action-packed, dark background with vibrant highlights" },
  { id: "podcast", label: "Podcast", prompt: "Podcast episode thumbnail, clean layout, speaker photo with title text, professional microphone" },
  { id: "tutorial", label: "Tutorial", prompt: "Tutorial thumbnail, split-screen before/after, clean modern design, step indicators" },
  { id: "vlog", label: "Vlog", prompt: "Vlog thumbnail, casual lifestyle photo, warm colors, candid expression" },
  { id: "news", label: "News", prompt: "News thumbnail, breaking news style, red accent bar, bold headline typography" },
];

const ThumbnailGeneratorPage = () => {
  useToolSeo("thumbnail-generator");
  const navigate = useNavigate();
  const { hasEnoughCredits } = useCredits();
  const [stage, setStage] = useState<Stage>("compose");
  const [title, setTitle] = useState("");
  const [style, setStyle] = useState(STYLES[0]);
  const [refImage, setRefImage] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const cost = 2;

  const readImage = (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Please upload an image"); return; }
    const r = new FileReader();
    r.onload = (e) => setRefImage(e.target?.result as string);
    r.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!title.trim()) { toast.error("Enter a title"); return; }
    if (!hasEnoughCredits(cost)) { toast.error("Insufficient MC"); navigate("/pricing"); return; }
    setStage("generating");
    try {
      const prompt = `Create a professional ${style.prompt}. The main text says: "${title}". 16:9 aspect ratio, high resolution, eye-catching design.`;
      const { data, error } = await supabase.functions.invoke("image-tools", {
        body: { tool: "thumbnail-generator", prompt },
      });
      if (error) throw error;
      const url = data?.url;
      if (!url) throw new Error(data?.error || "No image generated");
      setResultUrl(url);
      setStage("result");
      toast.success("Thumbnail ready!");
    } catch (e: any) {
      toast.error(e.message || "Generation failed");
      setStage("compose");
    }
  };

  const handleShare = () => {
    if (!resultUrl) return;
    if (navigator.share) navigator.share({ url: resultUrl, title: "Thumbnail" }).catch(() => {});
    else { navigator.clipboard.writeText(resultUrl); toast.success("Link copied"); }
  };

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden relative bg-gradient-to-b from-zinc-950 via-black to-zinc-950">
      <div className="pointer-events-none absolute -top-40 -left-32 w-[480px] h-[480px] rounded-full bg-red-500/25 blur-[120px]" />
      <div className="pointer-events-none absolute top-1/2 -right-40 w-[520px] h-[520px] rounded-full bg-yellow-500/25 blur-[140px]" />
      <div className="pointer-events-none absolute bottom-0 left-1/4 w-[420px] h-[420px] rounded-full bg-pink-400/20 blur-[120px]" />

      <button
        onClick={() => {
          if (stage === "result") setStage("compose");
          else navigate("/videos");
        }}
        className={`fixed top-[calc(env(safe-area-inset-top)+1rem)] left-3 z-30 w-11 h-11 flex items-center justify-center rounded-full text-white ${GLASS_PILL}`}
        aria-label="Back"
      >
        <ArrowLeft className="w-4 h-4" />
      </button>

      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {stage === "compose" && (
            <motion.div
              key="compose"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 flex flex-col"
            >
              <div className="flex-1 overflow-y-auto px-4 pt-[calc(env(safe-area-inset-top)+4rem)] pb-[180px]">
                <div className="max-w-sm mx-auto mb-5">
                  <div className={`relative rounded-[28px] overflow-hidden aspect-[16/10] ${GLASS}`}>
                    <img
                      src={refImage || heroImg || samplePoster}
                      alt="Thumbnail preview"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold text-white ${GLASS_PILL}`}>
                      {refImage ? "REFERENCE" : "PREVIEW"}
                    </div>
                    {/* Live title overlay */}
                    <div className="absolute inset-x-3 bottom-3">
                      <div
                        className="font-display uppercase text-white leading-[0.95] tracking-tight drop-shadow-[0_3px_12px_rgba(0,0,0,0.8)]"
                        style={{ fontSize: title.length > 20 ? "1.25rem" : "1.75rem" }}
                      >
                        {title || "Your title here"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="max-w-sm mx-auto">
                  <h3 className="mb-2 text-[11px] font-bold tracking-[0.18em] text-white/60 uppercase">Title</h3>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Your video title…"
                    className={`w-full mb-5 px-4 py-3 rounded-2xl text-sm text-white placeholder:text-white/40 focus:outline-none ${GLASS_PILL}`}
                  />




                  <h3 className="mb-2 text-[11px] font-bold tracking-[0.18em] text-white/60 uppercase">Style</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {STYLES.map((s) => {
                      const active = style.id === s.id;
                      return (
                        <button
                          key={s.id}
                          onClick={() => setStyle(s)}
                          className={`px-2 py-2.5 rounded-2xl text-[11px] font-semibold text-white transition ${
                            active
                              ? "bg-white/20 backdrop-blur-2xl border border-white/30 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)]"
                              : "bg-white/5 backdrop-blur-2xl border border-white/10"
                          }`}
                        >
                          {s.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
                className="absolute bottom-0 inset-x-0 z-20 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+1rem)]"
              >
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={handleGenerate}
                  disabled={!title.trim()}
                  className={`w-full rounded-full py-4 flex items-center justify-center text-white font-semibold text-sm disabled:opacity-50 ${GLASS_PILL}`}
                >
                  Generate · {cost} MC
                </motion.button>
              </motion.div>
            </motion.div>
          )}

          {stage === "generating" && (
            <motion.div
              key="gen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-6 px-6"
            >
              <div className="relative w-full max-w-sm">
                <div className={`relative rounded-[28px] overflow-hidden aspect-[16/10] ${GLASS}`}>
                  <img src={refImage || heroImg} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  <motion.div
                    initial={{ y: "-100%" }}
                    animate={{ y: "260%" }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-x-0 h-1/2 pointer-events-none bg-gradient-to-b from-transparent via-white/40 to-transparent blur-md"
                  />
                </div>
              </div>
              <div className={`flex items-center gap-2 text-sm text-white/80 px-4 py-2 rounded-full ${GLASS_PILL}`}>
                Designing your thumbnail…
              </div>
            </motion.div>
          )}

          {stage === "result" && resultUrl && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col px-5 pt-[calc(env(safe-area-inset-top)+4rem)] pb-[calc(env(safe-area-inset-bottom)+1rem)]"
            >
              <div className={`relative rounded-[28px] overflow-hidden mx-auto w-full max-w-md flex-1 max-h-[65vh] ${GLASS}`}>
                <img src={resultUrl} alt="Thumbnail" className="absolute inset-0 w-full h-full object-contain bg-black" />
              </div>
              <div className="mt-4 max-w-md mx-auto w-full flex gap-3">
                <a
                  href={resultUrl}
                  download="thumbnail.png"
                  className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-full text-white font-semibold text-sm ${GLASS_PILL}`}
                >
                  <Download className="w-4 h-4" /> Download
                </a>
                <button
                  onClick={handleShare}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-full text-white font-semibold text-sm ${GLASS_PILL}`}
                >
                  <Share2 className="w-4 h-4" /> Share
                </button>
              </div>
              <button
                onClick={() => { setStage("compose"); setResultUrl(null); }}
                className={`mt-3 max-w-md mx-auto w-full py-3 rounded-full text-white text-sm font-medium ${GLASS_PILL}`}
              >
                Try another
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ThumbnailGeneratorPage;
