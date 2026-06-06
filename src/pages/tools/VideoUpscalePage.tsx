import { useState, useRef } from "react";
import { useToolSeo } from "@/hooks/useToolSeo";
import MediaToolLanding from "@/components/media/MediaToolLanding";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Upload, Download, Share2, RefreshCw, Film } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCredits } from "@/hooks/useCredits";
import heroImg from "@/assets/tool-landing/video-upscale-v8.webp";
import samplePoster from "@/assets/video-upscale-sample-boy-v2.webp";

type Stage = "landing" | "compose" | "generating" | "result";
type Tier = "standard" | "pro";
type Resolution = "1080p" | "2K" | "4K";

// iOS 26 frosted glass tokens
const GLASS =
  "bg-white/[0.06] backdrop-blur-3xl backdrop-saturate-200 border border-white/15 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.18),inset_0_-1px_0_0_rgba(255,255,255,0.04),0_20px_60px_-20px_rgba(0,0,0,0.7)]";
const GLASS_PILL =
  "bg-white/10 backdrop-blur-2xl backdrop-saturate-200 border border-white/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.3),0_8px_24px_-8px_rgba(0,0,0,0.6)]";

// Fal model dedicated to video upscaling
const FAL_MODEL = "fal-ai/topaz/upscale/video";

const PRICING: Record<Tier, Record<Resolution, number>> = {
  standard: { "1080p": 1, "2K": 1, "4K": 1 },
  pro: { "1080p": 1, "2K": 2, "4K": 3 },
};

const VideoUpscalePage = () => {
  useToolSeo("video-upscale");
  const navigate = useNavigate();
  const { hasEnoughCredits } = useCredits();
  const [stage, setStage] = useState<Stage>("landing");
  const [video, setVideo] = useState<string | null>(null);
  const [tier, setTier] = useState<Tier>("standard");
  const [resolution, setResolution] = useState<Resolution>("1080p");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const costPerSec = PRICING[tier][resolution];

  const readVideo = (file: File) => {
    if (!file.type.startsWith("video/")) { toast.error("Please upload a video"); return; }
    const reader = new FileReader();
    reader.onload = (e) => { setVideo(e.target?.result as string); setStage("compose"); };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!video) { toast.error("Upload a video"); return; }
    if (!hasEnoughCredits(costPerSec)) { toast.error("Insufficient MC"); navigate("/pricing"); return; }
    setStage("generating");
    try {
      const { data, error } = await supabase.functions.invoke("video-tools", {
        body: { tool: "upscale", model: FAL_MODEL, video, tier, resolution },
      });
      if (error) throw error;
      const url = data?.url;
      if (!url) throw new Error(data?.error || "No video generated");
      setResultUrl(url);
      setStage("result");
      toast.success("Your video has been upscaled!");
    } catch (e: any) {
      toast.error(e.message || "Generation failed");
      setStage("compose");
    }
  };

  const handleShare = () => {
    if (!resultUrl) return;
    if (navigator.share) navigator.share({ url: resultUrl, title: "Upscaled video" }).catch(() => {});
    else { navigator.clipboard.writeText(resultUrl); toast.success("Link copied"); }
  };

  if ((stage as string) === "landing") {

    return (

      <MediaToolLanding
      title="Video Upscale"
      headline="Upscale to"
      accent="4K."
      description={`Restore detail, sharpen edges, and bring old footage to life.`}
      heroImage={heroImg}
      cost={1}
      accept="video/*"
      resultType="video"
      onFileSelected={readVideo}
    />

    );

  }


  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden relative bg-gradient-to-b from-zinc-950 via-black to-zinc-950">
      {/* Ambient blobs for the glass to refract */}
      <div className="pointer-events-none absolute -top-40 -left-32 w-[480px] h-[480px] rounded-full bg-sky-500/25 blur-[120px]" />
      <div className="pointer-events-none absolute top-1/2 -right-40 w-[520px] h-[520px] rounded-full bg-violet-600/20 blur-[140px]" />
      <div className="pointer-events-none absolute bottom-0 left-1/4 w-[420px] h-[420px] rounded-full bg-emerald-500/15 blur-[120px]" />

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
                <img src={heroImg} alt="Video Upscale" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.5 }}
                className="mt-6 text-center"
              >
                <h2 className="font-display text-[10vw] sm:text-[6vw] uppercase leading-[0.95] tracking-tight text-white">
                  Upscale to <span className="bg-gradient-to-r from-sky-300 via-violet-400 to-emerald-300 bg-clip-text text-transparent">4K.</span>
                </h2>
                <p className="mt-2 text-sm text-white/65">
                  Restore detail, sharpen edges, and bring old footage to life.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.5 }}
                className="mt-6"
              >
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => { if (e.target.files?.[0]) readVideo(e.target.files[0]); }}
                />
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => videoInputRef.current?.click()}
                  className={`w-full rounded-full py-4 flex items-center justify-center gap-2 text-white font-semibold text-sm ${GLASS_PILL}`}
                >
                  <Upload className="w-4 h-4" /> Upload Your Video
                </motion.button>
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
                  {/* Video tile (sample fallback when none uploaded) */}
                  <div className={`relative rounded-[28px] overflow-hidden aspect-[4/5] ${GLASS}`}>
                    {video ? (
                      <video src={video} className="absolute inset-0 w-full h-full object-cover" muted playsInline loop autoPlay />
                    ) : (
                      <img src={samplePoster} alt="Sample" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                    )}
                    <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold text-white ${GLASS_PILL}`}>
                      {video ? "VIDEO" : "SAMPLE"}
                    </div>
                    <button
                      onClick={() => videoInputRef.current?.click()}
                      className={`absolute bottom-2 right-2 w-8 h-8 flex items-center justify-center rounded-full text-white ${GLASS_PILL}`}
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                    <input
                      ref={videoInputRef}
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={(e) => { if (e.target.files?.[0]) readVideo(e.target.files[0]); e.target.value = ""; }}
                    />
                  </div>
                </div>

                <div className="max-w-sm mx-auto">
                  <h3 className="mb-2 text-[11px] font-bold tracking-[0.18em] text-white/60 uppercase">Quality tier</h3>
                  <div className="grid grid-cols-2 gap-2 mb-5">
                    {(["standard", "pro"] as const).map((t) => {
                      const active = tier === t;
                      return (
                        <button
                          key={t}
                          onClick={() => setTier(t)}
                          className={`px-2 py-2.5 rounded-2xl text-xs font-semibold capitalize text-white transition ${
                            active
                              ? "bg-white/20 backdrop-blur-2xl border border-white/30 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)]"
                              : "bg-white/5 backdrop-blur-2xl border border-white/10"
                          }`}
                        >
                          {t}
                        </button>
                      );
                    })}
                  </div>

                  <h3 className="mb-2 text-[11px] font-bold tracking-[0.18em] text-white/60 uppercase">Resolution</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {(["1080p", "2K", "4K"] as const).map((r) => {
                      const active = resolution === r;
                      const price = PRICING[tier][r];
                      return (
                        <button
                          key={r}
                          onClick={() => setResolution(r)}
                          className={`px-2 py-2.5 rounded-2xl text-xs font-semibold text-white transition ${
                            active
                              ? "bg-white/20 backdrop-blur-2xl border border-white/30 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)]"
                              : "bg-white/5 backdrop-blur-2xl border border-white/10"
                          }`}
                        >
                          <div>{r}</div>
                          <div className="text-[10px] font-normal text-white/60 mt-0.5">{price} MC/s</div>
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
                  disabled={!video}
                  className={`w-full rounded-full py-4 flex items-center justify-center text-white font-semibold text-sm disabled:opacity-50 ${GLASS_PILL}`}
                >
                  Upscale · {costPerSec} MC/s
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
                  {video ? (
                    <video src={video} className="absolute inset-0 w-full h-full object-cover" muted playsInline loop autoPlay />
                  ) : (
                    <img src={samplePoster} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  )}
                  <motion.div
                    initial={{ y: "-100%" }}
                    animate={{ y: "260%" }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-x-0 h-1/2 pointer-events-none bg-gradient-to-b from-transparent via-white/40 to-transparent blur-md"
                  />
                </div>
              </div>
              <div className={`flex items-center gap-2 text-sm text-white/80 px-4 py-2 rounded-full ${GLASS_PILL}`}>
                Upscaling to {resolution}…
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
                  download="upscaled-video.mp4"
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

export default VideoUpscalePage;
