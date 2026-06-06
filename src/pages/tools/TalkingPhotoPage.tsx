import { useState, useRef } from "react";
import { useToolSeo } from "@/hooks/useToolSeo";
import MediaToolLanding from "@/components/media/MediaToolLanding";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Upload, Sparkles, Download, Share2, RefreshCw, Mic, Image as ImageIcon, Loader2, Wand2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCredits } from "@/hooks/useCredits";
import { useIsMobile } from "@/hooks/use-mobile";
import heroImg from "@/assets/tool-landing/talking-photo-v8.webp";
import samplePhoto from "@/assets/talking-photo-sample-boy-v2.webp";

type Stage = "landing" | "compose" | "generating" | "result";

// iOS 26 frosted glass tokens
const GLASS =
  "bg-white/[0.06] backdrop-blur-3xl backdrop-saturate-200 border border-white/15 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.18),inset_0_-1px_0_0_rgba(255,255,255,0.04),0_20px_60px_-20px_rgba(0,0,0,0.7)]";
const GLASS_PILL =
  "bg-white/10 backdrop-blur-2xl backdrop-saturate-200 border border-white/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.3),0_8px_24px_-8px_rgba(0,0,0,0.6)]";

// Fal model dedicated to talking-photo (lip-sync from photo + audio/script)
const FAL_MODEL = "fal-ai/sadtalker";

const TalkingPhotoPage = () => {
  useToolSeo("talking-photo");
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { hasEnoughCredits } = useCredits();
  const [stage, setStage] = useState<Stage>("landing");
  const [image, setImage] = useState<string | null>(null);
  const [audioData, setAudioData] = useState<string | null>(null);
  const [audioName, setAudioName] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const cost = 7;

  const readImage = (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Please upload an image"); return; }
    const reader = new FileReader();
    reader.onload = (e) => { setImage(e.target?.result as string); setStage("compose"); };
    reader.readAsDataURL(file);
  };

  const readAudio = (file: File) => {
    if (!file.type.startsWith("audio/")) { toast.error("Please upload an audio file"); return; }
    const reader = new FileReader();
    reader.onload = (e) => { setAudioData(e.target?.result as string); setAudioName(file.name); };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!image) { toast.error("Upload a photo"); return; }
    if (!audioData) { toast.error("Upload an audio file"); return; }
    if (!hasEnoughCredits(cost)) { toast.error("Insufficient MC"); navigate("/pricing"); return; }
    setStage("generating");
    try {
      const { data, error } = await supabase.functions.invoke("video-tools", {
        body: { tool: "talking-photo", model: FAL_MODEL, image, audio: audioData },
      });
      if (error) throw error;
      const url = data?.url;
      if (!url) throw new Error(data?.error || "No video generated");
      setResultUrl(url);
      setStage("result");
      toast.success("Your talking photo is ready!");
    } catch (e: any) {
      toast.error(e.message || "Generation failed");
      setStage("compose");
    }
  };

  const handleShare = () => {
    if (!resultUrl) return;
    if (navigator.share) navigator.share({ url: resultUrl, title: "Talking photo" }).catch(() => {});
    else { navigator.clipboard.writeText(resultUrl); toast.success("Link copied"); }
  };

  if ((stage as string) === "landing") {

    return (

      <MediaToolLanding
      title="Talking Photo"
      headline="Make a photo"
      accent="talk."
      description={`Upload a portrait and a voice or script — we'll bring it to life.`}
      heroImage={heroImg}
      cost={1}
      accept="video/*"
      resultType="video"
      onFileSelected={readImage}
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
              <div className="font-sora text-sm font-semibold text-ink leading-tight">Talking Photo Studio</div>
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink/40">Make a photo talk</div>
            </div>
          </div>
          {resultUrl && (
            <a
              href={resultUrl}
              download="talking-photo.mp4"
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-ink text-paper text-sm font-sora font-semibold hover:bg-ink/90 transition"
            >
              <Download className="w-4 h-4" /> Download
            </a>
          )}
        </header>

        <div className="flex-1 min-h-0 grid grid-cols-[300px_1fr_360px]">
          {/* LEFT — sources */}
          <aside className="border-r border-ink/10 bg-ink/[0.02] flex flex-col p-5 gap-4 overflow-y-auto">
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && readImage(e.target.files[0])}
            />
            <input
              ref={audioInputRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && readAudio(e.target.files[0])}
            />
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink/40 mb-2">Portrait</div>
              <button
                onClick={() => imageInputRef.current?.click()}
                className="w-full aspect-[4/5] rounded-2xl bg-white border border-ink/10 hover:border-ink/30 transition overflow-hidden relative group"
              >
                {image ? (
                  <img src={image} alt="" className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-ink/40 group-hover:text-ink/70 transition">
                    <ImageIcon className="w-5 h-5" />
                    <span className="font-manrope text-xs">Upload photo</span>
                  </div>
                )}
              </button>
            </div>

            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink/40 mb-2">Voice <span className="text-ink/25 normal-case tracking-normal">​</span></div>
              <button
                onClick={() => audioInputRef.current?.click()}
                className="w-full px-3 py-3 rounded-xl bg-white border border-ink/10 hover:border-ink/30 transition flex items-center gap-2 text-ink/70 text-xs font-manrope text-left"
              >
                <Mic className="w-4 h-4 shrink-0" />
                <span className="truncate">{audioName || "Upload audio file"}</span>
              </button>
            </div>
          </aside>

          {/* CENTER — preview */}
          <main className="relative overflow-hidden bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary)/0.06),_transparent_60%)] flex items-center justify-center p-10">
            <div className="relative w-full max-w-[480px] aspect-[4/5] rounded-3xl bg-black border border-ink/10 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.25)] overflow-hidden">
              <AnimatePresence mode="wait">
                {stage === "generating" && (
                  <motion.div key="gen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0">
                    <img src={image || samplePhoto} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    <motion.div
                      initial={{ y: "-100%" }}
                      animate={{ y: "260%" }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-x-0 h-1/2 pointer-events-none bg-gradient-to-b from-transparent via-rose-300/40 to-transparent blur-md"
                    />
                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-center gap-2 bg-paper/95 backdrop-blur border border-ink/10 rounded-2xl py-2 text-ink text-xs font-sora font-semibold">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Bringing your photo to life…
                    </div>
                  </motion.div>
                )}
                {stage === "result" && resultUrl && (
                  <motion.video key="res" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    src={resultUrl} controls autoPlay className="absolute inset-0 w-full h-full object-contain" />
                )}
                {stage === "compose" && (
                  image ? (
                    <motion.img key="i" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      src={image} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/60 p-8 text-center">
                      <ImageIcon className="w-8 h-8" />
                      <div className="font-sora font-semibold text-sm text-white/80">Upload a portrait to begin</div>
                      <div className="font-manrope text-xs text-white/40">Then add a script or voice</div>
                    </motion.div>
                  )
                )}
              </AnimatePresence>
            </div>
          </main>

          {/* RIGHT — script + duration */}
          <aside className="border-l border-ink/10 bg-ink/[0.02] flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink/40 mb-2">Voice file</div>
                <input
                  ref={audioInputRef}
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={(e) => { if (e.target.files?.[0]) readAudio(e.target.files[0]); }}
                />
                <button
                  onClick={() => audioInputRef.current?.click()}
                  className="w-full px-3 py-2.5 rounded-xl bg-paper border border-ink/15 text-sm text-ink/80 hover:border-ink/40 transition flex items-center justify-center gap-2 font-manrope"
                >
                  <Mic className="w-3.5 h-3.5" /> {audioName ?? "Upload audio"}
                </button>
                <p className="mt-2 text-[11px] font-manrope text-ink/50">
                  Required — the photo will lip-sync to this audio.
                </p>
              </div>

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
                disabled={!image || !audioData || stage === "generating"}
                onClick={handleGenerate}
                className="w-full py-3.5 rounded-full bg-ink text-paper font-sora font-semibold text-sm flex items-center justify-between px-5 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-ink/90 transition"
              >
                <span className="flex items-center gap-2">
                  {stage === "generating" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                  {stage === "generating" ? "Animating…" : "Make it talk"}
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
      <div className="pointer-events-none absolute -top-40 -left-32 w-[480px] h-[480px] rounded-full bg-rose-600/25 blur-[120px]" />
      <div className="pointer-events-none absolute top-1/2 -right-40 w-[520px] h-[520px] rounded-full bg-indigo-600/25 blur-[140px]" />
      <div className="pointer-events-none absolute bottom-0 left-1/4 w-[420px] h-[420px] rounded-full bg-amber-500/15 blur-[120px]" />

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
                <img src={heroImg} alt="Animated Portrait" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.5 }}
                className="mt-6 text-center"
              >
                <h2 className="font-display text-[10vw] sm:text-[6vw] uppercase leading-[0.95] tracking-tight text-white">
                  Make a photo <span className="bg-gradient-to-r from-rose-400 via-indigo-400 to-amber-300 bg-clip-text text-transparent">talk.</span>
                </h2>
                <p className="mt-2 text-sm text-white/65">
                  Upload a portrait and a voice or script — we'll bring it to life.
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
                  <Upload className="w-4 h-4" /> Upload Your Photo
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
                <div className="max-w-sm mx-auto grid grid-cols-2 gap-3 mb-5">
                  {/* Photo (with sample preview default) */}
                  <div className={`relative rounded-[26px] overflow-hidden aspect-[4/5] ${GLASS}`}>
                    <img
                      src={image || samplePhoto}
                      alt="Photo"
                      className={`absolute inset-0 w-full h-full object-cover ${image ? "" : "opacity-60"}`}
                    />
                    <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold text-white ${GLASS_PILL}`}>
                      {image ? "PHOTO" : "SAMPLE"}
                    </div>
                    <button
                      onClick={() => imageInputRef.current?.click()}
                      className={`absolute bottom-2 right-2 w-7 h-7 flex items-center justify-center rounded-full text-white ${GLASS_PILL}`}
                    >
                      <RefreshCw className="w-3 h-3" />
                    </button>
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => { if (e.target.files?.[0]) readImage(e.target.files[0]); e.target.value = ""; }}
                    />
                  </div>

                  {/* Audio slot */}
                  <div className={`relative rounded-[26px] overflow-hidden aspect-[4/5] ${GLASS} flex flex-col items-center justify-center text-center px-3`}>
                    <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold text-white ${GLASS_PILL}`}>
                      {audioData ? "AUDIO" : "VOICE"}
                    </div>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${GLASS_PILL}`}>
                      <Mic className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-[11px] text-white/70 line-clamp-2 px-2">
                      {audioName || "​"}
                    </p>
                    <button
                      onClick={() => audioInputRef.current?.click()}
                      className={`mt-2 px-3 py-1.5 rounded-full text-[11px] font-semibold text-white ${GLASS_PILL}`}
                    >
                      {audioData ? "Replace" : "Upload"}
                    </button>
                    <input
                      ref={audioInputRef}
                      type="file"
                      accept="audio/*"
                      className="hidden"
                      onChange={(e) => { if (e.target.files?.[0]) readAudio(e.target.files[0]); e.target.value = ""; }}
                    />
                  </div>
                </div>

                {/* sadtalker syncs the photo to the uploaded audio — no script/duration. */}
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
                  disabled={!image || !audioData}
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
                  <img src={image || samplePhoto} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  <motion.div
                    initial={{ y: "-100%" }}
                    animate={{ y: "260%" }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-x-0 h-1/2 pointer-events-none bg-gradient-to-b from-transparent via-white/40 to-transparent blur-md"
                  />
                </div>
              </div>
              <div className={`flex items-center gap-2 text-sm text-white/80 px-4 py-2 rounded-full ${GLASS_PILL}`}>
                <Sparkles className="w-4 h-4" /> Bringing your photo to life…
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
                  download="talking-photo.mp4"
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
                <ImageIcon className="w-4 h-4" /> Try another
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TalkingPhotoPage;
