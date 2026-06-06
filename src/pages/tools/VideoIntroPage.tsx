import { useState, useRef } from "react";
import { useToolSeo } from "@/hooks/useToolSeo";
import MediaToolLanding from "@/components/media/MediaToolLanding";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Upload, Download, Share2, RefreshCw, Film } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCredits } from "@/hooks/useCredits";
import heroImg from "@/assets/tool-landing/video-intro-v8.webp";
import samplePoster from "@/assets/video-intro-sample-boy-v2.webp";

type Stage = "landing" | "compose" | "generating" | "result";

// iOS 26 frosted glass tokens
const GLASS =
  "bg-white/[0.06] backdrop-blur-3xl backdrop-saturate-200 border border-white/15 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.18),inset_0_-1px_0_0_rgba(255,255,255,0.04),0_20px_60px_-20px_rgba(0,0,0,0.7)]";
const GLASS_PILL =
  "bg-white/10 backdrop-blur-2xl backdrop-saturate-200 border border-white/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.3),0_8px_24px_-8px_rgba(0,0,0,0.6)]";

// Fal model dedicated to short brand intro / text-to-video
const FAL_MODEL = "fal-ai/veo3/fast";

const INTRO_STYLES = [
  { id: "cinematic", label: "Cinematic", prompt: "A cinematic logo reveal intro with epic lighting, lens flares, dark smoky atmosphere" },
  { id: "minimal", label: "Minimal", prompt: "A clean minimal logo animation on white background with elegant typography reveal" },
  { id: "tech", label: "Tech", prompt: "A futuristic tech intro with glitch effects, neon circuits, digital particles" },
  { id: "nature", label: "Nature", prompt: "An organic intro with flowing water, particles of light transforming into text" },
  { id: "fire", label: "Fire", prompt: "An explosive fire and energy intro with dramatic sparks and flames revealing text" },
  { id: "glass", label: "Glass", prompt: "A premium glass morphism intro with transparent 3D glass text, refractions and bokeh" },
];

const VideoIntroPage = () => {
  useToolSeo("video-intro");
  const navigate = useNavigate();
  const { hasEnoughCredits } = useCredits();
  const [stage, setStage] = useState<Stage>("landing");
  const [brandImage, setBrandImage] = useState<string | null>(null);
  const [brandName, setBrandName] = useState("");
  const [style, setStyle] = useState(INTRO_STYLES[0]);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const cost = 5;

  const readImage = (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Please upload an image"); return; }
    const reader = new FileReader();
    reader.onload = (e) => { setBrandImage(e.target?.result as string); setStage("compose"); };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!brandName.trim()) { toast.error("Enter your brand name"); return; }
    if (!hasEnoughCredits(cost)) { toast.error("Insufficient MC"); navigate("/pricing"); return; }
    setStage("generating");
    try {
      const { data, error } = await supabase.functions.invoke("video-tools", {
        body: {
          tool: "video-intro",
          model: FAL_MODEL,
          image: brandImage,
          prompt: `${style.prompt}. The text "${brandName}" appears dramatically. 5 seconds, professional quality.`,
          duration: 5,
        },
      });
      if (error) throw error;
      const url = data?.url;
      if (!url) throw new Error(data?.error || "No video generated");
      setResultUrl(url);
      setStage("result");
      toast.success("Your intro is ready!");
    } catch (e: any) {
      toast.error(e.message || "Generation failed");
      setStage("compose");
    }
  };

  const handleShare = () => {
    if (!resultUrl) return;
    if (navigator.share) navigator.share({ url: resultUrl, title: "Video intro" }).catch(() => {});
    else { navigator.clipboard.writeText(resultUrl); toast.success("Link copied"); }
  };

  if ((stage as string) === "landing") {

    return (

      <MediaToolLanding
      title="Video Intro"
      headline="Brand"
      accent="intro."
      description={`Upload your logo or photo — we'll build a cinematic 5-second intro.`}
      heroImage={heroImg}
      cost={5}
      accept="video/*"
      resultType="video"
      onFileSelected={readImage}
    />

    );

  }


  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden relative bg-gradient-to-b from-zinc-950 via-black to-zinc-950">
      {/* Ambient blobs for the glass to refract */}
      <div className="pointer-events-none absolute -top-40 -left-32 w-[480px] h-[480px] rounded-full bg-amber-500/25 blur-[120px]" />
      <div className="pointer-events-none absolute top-1/2 -right-40 w-[520px] h-[520px] rounded-full bg-fuchsia-600/20 blur-[140px]" />
      <div className="pointer-events-none absolute bottom-0 left-1/4 w-[420px] h-[420px] rounded-full bg-sky-500/15 blur-[120px]" />

      {/* Back */}
      <button
        onClick={() => {
          if ((stage as string) === "landing") navigate("/videos");
          else if (stage === "result") setStage("compose");
          else setStage("landing");
        }}
        className={`fixed top-[calc(env(safe-area-inset-top)+1rem)] left-3 z-30 w-11 h-11 flex items-center justify-center rounded-full text-white ${GLASS_PILL}`}
        aria-label="Back"
      >
        <ArrowLeft className="w-4 h-4" />
      </button>

      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {/* ─── LANDING ─── */}
          {(stage as string) === "landing" && (
            <motion.div
              key="landing"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 flex flex-col px-5 pt-[calc(env(safe-area-inset-top)+4rem)] pb-8 overflow-y-auto"
            >
              <motion.div
                initial={{ scale: 0.93, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 24, delay: 0.05 }}
                className={`relative rounded-[32px] overflow-hidden flex-1 max-h-[55vh] ${GLASS}`}
              >
                <img src={heroImg} alt="AI Video Intro" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.5 }}
                className="mt-6 text-center"
              >
                <h2 className="font-display text-[10vw] sm:text-[6vw] uppercase leading-[0.95] tracking-tight text-white">
                  Brand <span className="bg-gradient-to-r from-amber-300 via-fuchsia-400 to-sky-300 bg-clip-text text-transparent">intro.</span>
                </h2>
                <p className="mt-2 text-sm text-white/65">
                  Upload your logo or photo — we'll build a cinematic 5-second intro.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.5 }}
                className="mt-6"
              >
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => { if (e.target.files?.[0]) readImage(e.target.files[0]); }}
                />
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => imageInputRef.current?.click()}
                  className={`w-full rounded-full py-4 flex items-center justify-center gap-2 text-white font-semibold text-sm ${GLASS_PILL}`}
                >
                  <Upload className="w-4 h-4" /> Upload Your Image
                </motion.button>
                <button
                  onClick={() => setStage("compose")}
                  className={`w-full mt-3 rounded-full py-3 text-white/80 text-xs font-medium ${GLASS_PILL}`}
                >
                  Skip — text only
                </button>
              </motion.div>
            </motion.div>
          )}

          {/* ─── COMPOSE ─── */}
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
                  {/* Image tile (sample fallback when none uploaded) */}
                  <div className={`relative rounded-[28px] overflow-hidden aspect-[4/5] ${GLASS}`}>
                    <img
                      src={brandImage || samplePoster}
                      alt="Brand"
                      className={`absolute inset-0 w-full h-full object-cover ${brandImage ? "" : "opacity-60"}`}
                    />
                    <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold text-white ${GLASS_PILL}`}>
                      {brandImage ? "BRAND" : "SAMPLE"}
                    </div>
                    <button
                      onClick={() => imageInputRef.current?.click()}
                      className={`absolute bottom-2 right-2 w-8 h-8 flex items-center justify-center rounded-full text-white ${GLASS_PILL}`}
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => { if (e.target.files?.[0]) readImage(e.target.files[0]); e.target.value = ""; }}
                    />
                  </div>
                </div>

                <div className="max-w-sm mx-auto">
                  <h3 className="mb-2 text-[11px] font-bold tracking-[0.18em] text-white/60 uppercase">Brand name</h3>
                  <div className={`rounded-2xl p-1 mb-5 ${GLASS}`}>
                    <input
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      placeholder="Your brand or channel…"
                      className="w-full bg-transparent rounded-xl px-3 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none"
                    />
                  </div>

                  <h3 className="mb-2 text-[11px] font-bold tracking-[0.18em] text-white/60 uppercase">Style</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {INTRO_STYLES.map((s) => {
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
                  disabled={!brandName.trim()}
                  className={`w-full rounded-full py-4 flex items-center justify-center text-white font-semibold text-sm disabled:opacity-50 ${GLASS_PILL}`}
                >
                  Generate · {cost} MC
                </motion.button>
              </motion.div>
            </motion.div>
          )}

          {/* ─── GENERATING ─── */}
          {stage === "generating" && (
            <motion.div
              key="gen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-6 px-6"
            >
              <div className="relative w-full max-w-xs">
                <div className={`relative rounded-[28px] overflow-hidden aspect-[4/5] ${GLASS}`}>
                  <img src={brandImage || samplePoster} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  <motion.div
                    initial={{ y: "-100%" }}
                    animate={{ y: "260%" }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-x-0 h-1/2 pointer-events-none bg-gradient-to-b from-transparent via-white/40 to-transparent blur-md"
                  />
                </div>
              </div>
              <div className={`flex items-center gap-2 text-sm text-white/80 px-4 py-2 rounded-full ${GLASS_PILL}`}>
                Crafting your intro…
              </div>
            </motion.div>
          )}

          {/* ─── RESULT ─── */}
          {stage === "result" && resultUrl && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col px-5 pt-[calc(env(safe-area-inset-top)+4rem)] pb-[calc(env(safe-area-inset-bottom)+1rem)]"
            >
              <div className={`relative rounded-[28px] overflow-hidden mx-auto w-full max-w-sm flex-1 max-h-[65vh] ${GLASS}`}>
                <video src={resultUrl} controls autoPlay className="absolute inset-0 w-full h-full object-contain bg-black" />
              </div>
              <div className="mt-4 max-w-sm mx-auto w-full flex gap-3">
                <a
                  href={resultUrl}
                  download="video-intro.mp4"
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
                className={`mt-3 max-w-sm mx-auto w-full py-3 rounded-full text-white text-sm font-medium flex items-center justify-center gap-1.5 ${GLASS_PILL}`}
              >
                <Film className="w-4 h-4" /> Try another
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default VideoIntroPage;
