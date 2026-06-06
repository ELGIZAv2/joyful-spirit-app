import { useState, useRef } from "react";
import { useToolSeo } from "@/hooks/useToolSeo";
import MediaToolLanding from "@/components/media/MediaToolLanding";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Upload, Sparkles, Download, Share2, RefreshCw, Film, Video as VideoIcon, Wand2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCredits } from "@/hooks/useCredits";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToolTemplates } from "@/hooks/useToolTemplates";
import heroImg from "@/assets/tool-landing/video-swap-v8.webp";
import sampleFace from "@/assets/character-ref-boy-clean-boy-v2.webp";

type Stage = "landing" | "compose" | "generating" | "result";
type Resolution = "720p" | "1080p";

// iOS 26 frosted glass utility
const GLASS =
  "bg-white/[0.06] backdrop-blur-3xl backdrop-saturate-200 border border-white/15 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.18),inset_0_-1px_0_0_rgba(255,255,255,0.04),0_20px_60px_-20px_rgba(0,0,0,0.7)]";
const GLASS_PILL =
  "bg-white/10 backdrop-blur-2xl backdrop-saturate-200 border border-white/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.3),0_8px_24px_-8px_rgba(0,0,0,0.6)]";

// Fal model dedicated to video face/character swap
const FAL_MODEL = "fal-ai/face-swap-video";

const VideoSwapPage = () => {
  useToolSeo("video-character-studio");
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { hasEnoughCredits } = useCredits();
  const { templates } = useToolTemplates("swap-characters");
  const [stage, setStage] = useState<Stage>("landing");
  const [video, setVideo] = useState<string | null>(null);
  const [faceImage, setFaceImage] = useState<string | null>(null);
  const [resolution, setResolution] = useState<Resolution>("720p");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const faceInputRef = useRef<HTMLInputElement>(null);

  const cost = resolution === "720p" ? 4 : 5.5;

  const readFile = (file: File, cb: (dataUrl: string) => void, kind: "image" | "video") => {
    if (!file.type.startsWith(kind === "image" ? "image/" : "video/")) {
      toast.error(`Please upload a ${kind}`);
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => cb(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleVideoFile = (file: File) =>
    readFile(file, (url) => { setVideo(url); setStage("compose"); }, "video");

  const handleFaceFile = (file: File) => readFile(file, setFaceImage, "image");

  const handleGenerate = async () => {
    if (!video || !faceImage) { toast.error("Upload a video and a face image"); return; }
    if (!hasEnoughCredits(cost)) { toast.error("Insufficient MC"); navigate("/pricing"); return; }
    setStage("generating");
    try {
      const { data, error } = await supabase.functions.invoke("video-tools", {
        body: { tool: "swap-characters", model: FAL_MODEL, video, image: faceImage, resolution },
      });
      if (error) throw error;
      const url = data?.url;
      if (!url) throw new Error(data?.error || "No video generated");
      setResultUrl(url);
      setStage("result");
      toast.success("Characters swapped!");
    } catch (e: any) {
      toast.error(e.message || "Generation failed");
      setStage("compose");
    }
  };

  const handleShare = () => {
    if (!resultUrl) return;
    if (navigator.share) navigator.share({ url: resultUrl, title: "Character swap" }).catch(() => {});
    else { navigator.clipboard.writeText(resultUrl); toast.success("Link copied"); }
  };

  if ((stage as string) === "landing") {

    return (

      <MediaToolLanding
      title="Video Swap"
      headline="Swap any"
      accent="character."
      description={`Upload a video and a face — we'll swap the character cinematically.`}
      heroImage={heroImg}
      cost={1}
      accept="video/*"
      resultType="video"
      onFileSelected={handleVideoFile}
    />

    );

  }


  // ─────────── DESKTOP STUDIO ───────────
  if (!isMobile) {
    return (
      <div className="h-[100dvh] w-full flex flex-col bg-paper text-ink overflow-hidden">
        <header className="h-14 shrink-0 flex items-center justify-between px-6 border-b border-ink/10 bg-paper/90 backdrop-blur">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/videos")}
              className="flex items-center gap-2 font-manrope text-sm font-medium text-ink/70 hover:text-ink transition"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <div className="h-5 w-px bg-ink/15" />
            <div>
              <div className="font-sora text-sm font-semibold text-ink leading-tight">Video Swap Studio</div>
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink/40">Swap any character</div>
            </div>
          </div>
          {resultUrl && (
            <a
              href={resultUrl}
              download="character-swap.mp4"
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-ink text-paper text-sm font-sora font-semibold hover:bg-ink/90 transition"
            >
              <Download className="w-4 h-4" /> Download
            </a>
          )}
        </header>

        <div className="flex-1 min-h-0 grid grid-cols-[300px_1fr_340px]">
          {/* LEFT — sources */}
          <aside className="border-r border-ink/10 bg-ink/[0.02] flex flex-col p-5 gap-4 overflow-y-auto">
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleVideoFile(e.target.files[0])}
            />
            <input
              ref={faceInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFaceFile(e.target.files[0])}
            />

            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink/40 mb-2">Source clip</div>
              <button
                onClick={() => videoInputRef.current?.click()}
                className="w-full aspect-[4/5] rounded-2xl bg-white border border-ink/10 hover:border-ink/30 transition overflow-hidden relative group"
              >
                {video ? (
                  <video src={video} className="absolute inset-0 w-full h-full object-cover" muted playsInline loop autoPlay />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-ink/40 group-hover:text-ink/70 transition">
                    <VideoIcon className="w-5 h-5" />
                    <span className="font-manrope text-xs">Upload video</span>
                  </div>
                )}
              </button>
            </div>

            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink/40 mb-2">Face reference</div>
              <button
                onClick={() => faceInputRef.current?.click()}
                className="w-full aspect-square rounded-2xl bg-white border border-ink/10 hover:border-ink/30 transition overflow-hidden relative group"
              >
                {faceImage ? (
                  <img src={faceImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-ink/40 group-hover:text-ink/70 transition">
                    <Upload className="w-5 h-5" />
                    <span className="font-manrope text-xs">Upload face</span>
                  </div>
                )}
              </button>
            </div>
          </aside>

          {/* CENTER — preview */}
          <main className="relative overflow-hidden bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary)/0.06),_transparent_60%)] flex items-center justify-center p-10">
            <div className="relative w-full max-w-[640px] aspect-video rounded-3xl bg-black border border-ink/10 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.25)] overflow-hidden">
              <AnimatePresence mode="wait">
                {stage === "generating" && video && (
                  <motion.div key="gen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0">
                    <video src={video} className="absolute inset-0 w-full h-full object-contain" muted playsInline loop autoPlay />
                    <motion.div
                      initial={{ y: "-100%" }}
                      animate={{ y: "260%" }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-x-0 h-1/2 pointer-events-none bg-gradient-to-b from-transparent via-fuchsia-400/40 to-transparent blur-md"
                    />
                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-center gap-2 bg-paper/95 backdrop-blur border border-ink/10 rounded-2xl py-2 text-ink text-xs font-sora font-semibold">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Swapping characters…
                    </div>
                  </motion.div>
                )}
                {stage === "result" && resultUrl && (
                  <motion.video key="res" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    src={resultUrl} controls autoPlay className="absolute inset-0 w-full h-full object-contain" />
                )}
                {stage === "compose" && (
                  video ? (
                    <motion.video key="v" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      src={video} className="absolute inset-0 w-full h-full object-contain" muted playsInline loop autoPlay />
                  ) : (
                    <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/60 p-8 text-center">
                      <Film className="w-8 h-8" />
                      <div className="font-sora font-semibold text-sm text-white/80">Upload a video to begin</div>
                      <div className="font-manrope text-xs text-white/40">Then add a face reference</div>
                    </motion.div>
                  )
                )}
              </AnimatePresence>
            </div>
          </main>

          {/* RIGHT — resolution + templates */}
          <aside className="border-l border-ink/10 bg-ink/[0.02] flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink/40 mb-2">Resolution</div>
                <div className="grid grid-cols-2 gap-2">
                  {(["720p", "1080p"] as const).map((r) => {
                    const active = resolution === r;
                    return (
                      <button
                        key={r}
                        onClick={() => setResolution(r)}
                        className={`px-3 py-3 rounded-xl text-xs font-sora font-semibold border-2 transition ${
                          active ? "border-ink bg-ink text-paper" : "border-ink/10 text-ink/70 hover:border-ink/30 bg-paper"
                        }`}
                      >
                        {r}
                      </button>
                    );
                  })}
                </div>
              </div>

              {templates.length > 0 && (
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink/40 mb-2">Face templates</div>
                  <div className="grid grid-cols-3 gap-2">
                    {templates.map((t) => {
                      const url = t.preview_url;
                      if (!url) return null;
                      const selected = faceImage === url;
                      return (
                        <button
                          key={t.id}
                          onClick={() => setFaceImage(url)}
                          className={`relative aspect-[4/5] rounded-xl overflow-hidden border-2 transition ${
                            selected ? "border-ink ring-2 ring-ink/20" : "border-ink/10 hover:border-ink/30"
                          }`}
                        >
                          <img src={url} alt={t.name ?? ""} className="absolute inset-0 w-full h-full object-cover" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {stage === "result" && resultUrl && (
                <button
                  onClick={handleShare}
                  className="w-full py-2.5 rounded-full border border-ink/15 hover:border-ink/40 hover:bg-ink/[0.04] transition flex items-center justify-center gap-2 font-manrope text-sm text-ink/70"
                >
                  <Share2 className="w-3.5 h-3.5" /> Copy link
                </button>
              )}
            </div>

            <div className="p-6 pt-3 border-t border-ink/10 bg-paper/60 backdrop-blur">
              <button
                disabled={!video || !faceImage || stage === "generating"}
                onClick={handleGenerate}
                className="w-full py-3.5 rounded-full bg-ink text-paper font-sora font-semibold text-sm flex items-center justify-between px-5 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-ink/90 transition"
              >
                <span className="flex items-center gap-2">
                  {stage === "generating" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                  {stage === "generating" ? "Swapping…" : "Swap character"}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-paper/15 text-paper text-[10px] font-mono tracking-wider">
                  {cost} MC
                </span>
              </button>
            </div>
          </aside>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden relative bg-gradient-to-b from-zinc-950 via-black to-zinc-950">

      {/* Ambient blobs for the glass to refract */}
      <div className="pointer-events-none absolute -top-40 -left-32 w-[480px] h-[480px] rounded-full bg-fuchsia-600/25 blur-[120px]" />
      <div className="pointer-events-none absolute top-1/2 -right-40 w-[520px] h-[520px] rounded-full bg-violet-600/25 blur-[140px]" />
      <div className="pointer-events-none absolute bottom-0 left-1/4 w-[420px] h-[420px] rounded-full bg-orange-500/15 blur-[120px]" />

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
                <img src={heroImg} alt="Swap Characters" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.5 }}
                className="mt-6 text-center"
              >
                <h2 className="font-display text-[10vw] sm:text-[6vw] uppercase leading-[0.95] tracking-tight text-white">
                  Swap any <span className="bg-gradient-to-r from-fuchsia-400 via-violet-400 to-orange-300 bg-clip-text text-transparent">character.</span>
                </h2>
                <p className="mt-2 text-sm text-white/65">
                  Upload a video and a face — we'll swap the character cinematically.
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
                  onChange={(e) => { if (e.target.files?.[0]) handleVideoFile(e.target.files[0]); }}
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
          {stage === "compose" && video && (
            <motion.div
              key="compose"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 flex flex-col"
            >
              <div className="flex-1 overflow-y-auto px-4 pt-[calc(env(safe-area-inset-top)+4rem)] pb-[180px]">
                <div className="max-w-sm mx-auto grid grid-cols-2 gap-3 mb-5">
                  {/* Video */}
                  <div className={`relative rounded-[26px] overflow-hidden aspect-[4/5] ${GLASS}`}>
                    <video src={video} className="absolute inset-0 w-full h-full object-cover" muted playsInline loop autoPlay />
                    <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold text-white ${GLASS_PILL}`}>VIDEO</div>
                    <button
                      onClick={() => videoInputRef.current?.click()}
                      className={`absolute bottom-2 right-2 w-7 h-7 flex items-center justify-center rounded-full text-white ${GLASS_PILL}`}
                    >
                      <RefreshCw className="w-3 h-3" />
                    </button>
                    <input
                      ref={videoInputRef}
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={(e) => { if (e.target.files?.[0]) handleVideoFile(e.target.files[0]); e.target.value = ""; }}
                    />
                  </div>

                  {/* Face image (with sample preview default) */}
                  <div className={`relative rounded-[26px] overflow-hidden aspect-[4/5] ${GLASS}`}>
                    <img
                      src={faceImage || sampleFace}
                      alt="Face"
                      className={`absolute inset-0 w-full h-full object-cover ${faceImage ? "" : "opacity-50"}`}
                    />
                    <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold text-white ${GLASS_PILL}`}>
                      {faceImage ? "FACE" : "SAMPLE"}
                    </div>
                    {!faceImage && (
                      <button
                        onClick={() => faceInputRef.current?.click()}
                        className={`absolute inset-x-3 bottom-3 rounded-full py-2 flex items-center justify-center gap-1.5 text-white text-[11px] font-semibold ${GLASS_PILL}`}
                      >
                        <Upload className="w-3 h-3" /> Upload face
                      </button>
                    )}
                    {faceImage && (
                      <button
                        onClick={() => faceInputRef.current?.click()}
                        className={`absolute bottom-2 right-2 w-7 h-7 flex items-center justify-center rounded-full text-white ${GLASS_PILL}`}
                      >
                        <RefreshCw className="w-3 h-3" />
                      </button>
                    )}
                    <input
                      ref={faceInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => { if (e.target.files?.[0]) handleFaceFile(e.target.files[0]); e.target.value = ""; }}
                    />
                  </div>
                </div>

                <div className="max-w-sm mx-auto">
                  <h3 className="mb-2 text-[11px] font-bold tracking-[0.18em] text-white/60 uppercase">Resolution</h3>
                  <div className="grid grid-cols-2 gap-2 mb-5">
                    {(["720p", "1080p"] as const).map((r) => {
                      const active = resolution === r;
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
                          {r}
                        </button>
                      );
                    })}
                  </div>

                  {templates.length > 0 && (
                    <>
                      <h3 className="mb-2 text-[11px] font-bold tracking-[0.18em] text-white/60 uppercase">Face templates</h3>
                      <div className="grid grid-cols-3 gap-2">
                        {templates.map((t) => {
                          const url = t.preview_url;
                          if (!url) return null;
                          const selected = faceImage === url;
                          return (
                            <button
                              key={t.id}
                              onClick={() => setFaceImage(url)}
                              className={`relative aspect-[4/5] rounded-2xl overflow-hidden transition ${
                                selected
                                  ? "ring-2 ring-white/70 border border-white/40"
                                  : "border border-white/10"
                              }`}
                            >
                              <img src={url} alt={t.name ?? ""} className="absolute inset-0 w-full h-full object-cover" />
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
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
                  disabled={!faceImage}
                  className={`w-full rounded-full py-4 flex items-center justify-center gap-2 text-white font-semibold text-sm disabled:opacity-50 ${GLASS_PILL}`}
                >
                  <Sparkles className="w-4 h-4" /> Swap · {cost} MC
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
              <div className="relative w-full max-w-xs grid grid-cols-2 gap-3">
                {[video, faceImage || sampleFace].map((src, i) => (
                  <div key={i} className={`relative rounded-[24px] overflow-hidden aspect-[4/5] ${GLASS}`}>
                    {i === 0 && src ? (
                      <video src={src} className="absolute inset-0 w-full h-full object-cover" muted playsInline loop autoPlay />
                    ) : src ? (
                      <img src={src} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    ) : null}
                    <motion.div
                      initial={{ y: "-100%" }}
                      animate={{ y: "260%" }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear", delay: i * 0.3 }}
                      className="absolute inset-x-0 h-1/2 pointer-events-none bg-gradient-to-b from-transparent via-white/40 to-transparent blur-md"
                    />
                  </div>
                ))}
              </div>
              <div className={`flex items-center gap-2 text-sm text-white/80 px-4 py-2 rounded-full ${GLASS_PILL}`}>
                <Sparkles className="w-4 h-4" /> Swapping characters…
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
                  download="character-swap.mp4"
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-full bg-white text-black font-semibold text-sm"
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

export default VideoSwapPage;
