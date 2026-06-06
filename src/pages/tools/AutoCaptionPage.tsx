import { useState, useRef } from "react";
import { useToolSeo } from "@/hooks/useToolSeo";
import MediaToolLanding from "@/components/media/MediaToolLanding";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Upload, Download, Share2, RefreshCw, Film, Loader2, Wand2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCredits } from "@/hooks/useCredits";
import { useIsMobile } from "@/hooks/use-mobile";
import heroImg from "@/assets/tool-landing/auto-caption-v8.webp";
import samplePoster from "@/assets/auto-caption-sample-boy-v2.webp";

type Stage = "landing" | "compose" | "generating" | "result";
type CaptionStyle = "minimal" | "bold" | "neon" | "classic";
type Position = "top" | "middle" | "bottom";

// iOS 26 frosted glass tokens
const GLASS =
  "bg-white/[0.06] backdrop-blur-3xl backdrop-saturate-200 border border-white/15 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.18),inset_0_-1px_0_0_rgba(255,255,255,0.04),0_20px_60px_-20px_rgba(0,0,0,0.7)]";
const GLASS_PILL =
  "bg-white/10 backdrop-blur-2xl backdrop-saturate-200 border border-white/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.3),0_8px_24px_-8px_rgba(0,0,0,0.6)]";

// Fal model dedicated to auto captioning / transcription with burn-in
const FAL_MODEL = "fal-ai/auto-caption";

const STYLES: { id: CaptionStyle; label: string }[] = [
  { id: "minimal", label: "Minimal" },
  { id: "bold", label: "Bold" },
  { id: "neon", label: "Neon" },
  { id: "classic", label: "Classic" },
];

const POSITIONS: { id: Position; label: string }[] = [
  { id: "top", label: "Top" },
  { id: "middle", label: "Middle" },
  { id: "bottom", label: "Bottom" },
];

const AutoCaptionPage = () => {
  useToolSeo("auto-caption");
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { hasEnoughCredits } = useCredits();
  const [stage, setStage] = useState<Stage>("landing");
  const [video, setVideo] = useState<string | null>(null);
  const [style, setStyle] = useState<CaptionStyle>("bold");
  const [position, setPosition] = useState<Position>("bottom");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const cost = 2;

  const readVideo = (file: File) => {
    if (!file.type.startsWith("video/")) { toast.error("Please upload a video"); return; }
    const reader = new FileReader();
    reader.onload = (e) => { setVideo(e.target?.result as string); setStage("compose"); };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!video) { toast.error("Upload a video"); return; }
    if (!hasEnoughCredits(cost)) { toast.error("Insufficient MC"); navigate("/pricing"); return; }
    setStage("generating");
    try {
      const { data, error } = await supabase.functions.invoke("video-tools", {
        body: { tool: "auto-caption", model: FAL_MODEL, video, style, position },
      });
      if (error) throw error;
      const url = data?.url;
      if (!url) throw new Error(data?.error || "No video generated");
      setResultUrl(url);
      setStage("result");
      toast.success("Captions added!");
    } catch (e: any) {
      toast.error(e.message || "Generation failed");
      setStage("compose");
    }
  };

  const handleShare = () => {
    if (!resultUrl) return;
    if (navigator.share) navigator.share({ url: resultUrl, title: "Captioned video" }).catch(() => {});
    else { navigator.clipboard.writeText(resultUrl); toast.success("Link copied"); }
  };

  if ((stage as string) === "landing") {

    return (

      <MediaToolLanding
      title="Auto Caption"
      headline="Caption"
      accent="anything."
      description={`Upload a clip — we'll transcribe and burn captions in instantly.`}
      heroImage={heroImg}
      cost={2}
      accept="video/*"
      resultType="video"
      onFileSelected={readVideo}
    />

    );

  }


  // Caption preview styles for inline rendering
  const captionClass =
    style === "minimal"
      ? "bg-black/40 text-white font-medium"
      : style === "bold"
      ? "bg-white text-black font-extrabold uppercase"
      : style === "neon"
      ? "bg-black text-emerald-300 font-bold drop-shadow-[0_0_6px_rgba(110,231,183,0.8)]"
      : "bg-yellow-300 text-black font-semibold";

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
              <div className="font-sora text-sm font-semibold text-ink leading-tight">Auto Caption Studio</div>
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink/40">Caption anything</div>
            </div>
          </div>
          {resultUrl && (
            <a
              href={resultUrl}
              download="captioned-video.mp4"
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-ink text-paper text-sm font-sora font-semibold hover:bg-ink/90 transition"
            >
              <Download className="w-4 h-4" /> Download
            </a>
          )}
        </header>

        <div className="flex-1 min-h-0 grid grid-cols-[280px_1fr_340px]">
          {/* LEFT — source */}
          <aside className="border-r border-ink/10 bg-ink/[0.02] flex flex-col p-5 gap-4 overflow-y-auto">
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && readVideo(e.target.files[0])}
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
                    <Upload className="w-5 h-5" />
                    <span className="font-manrope text-xs">Upload video</span>
                  </div>
                )}
              </button>
            </div>
            {video && (
              <button
                onClick={() => videoInputRef.current?.click()}
                className="w-full py-2 rounded-xl border border-ink/15 text-ink/70 font-manrope text-xs hover:bg-ink/5 transition flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-3 h-3" /> Replace clip
              </button>
            )}
          </aside>

          {/* CENTER — preview */}
          <main className="relative overflow-hidden bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary)/0.06),_transparent_60%)] flex items-center justify-center p-10">
            <div className="relative w-full max-w-[480px] aspect-[9/16] rounded-3xl bg-black border border-ink/10 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.25)] overflow-hidden">
              <AnimatePresence mode="wait">
                {stage === "generating" && video && (
                  <motion.div key="gen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0">
                    <video src={video} className="absolute inset-0 w-full h-full object-contain" muted playsInline loop autoPlay />
                    <motion.div
                      initial={{ y: "-100%" }}
                      animate={{ y: "260%" }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-x-0 h-1/2 pointer-events-none bg-gradient-to-b from-transparent via-emerald-300/40 to-transparent blur-md"
                    />
                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-center gap-2 bg-paper/95 backdrop-blur border border-ink/10 rounded-2xl py-2 text-ink text-xs font-sora font-semibold">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Transcribing & burning captions…
                    </div>
                  </motion.div>
                )}
                {stage === "result" && resultUrl && (
                  <motion.video key="res" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    src={resultUrl} controls autoPlay className="absolute inset-0 w-full h-full object-contain" />
                )}
                {stage === "compose" && (
                  <motion.div key="c" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0">
                    {video ? (
                      <video src={video} className="absolute inset-0 w-full h-full object-contain" muted playsInline loop autoPlay />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/60 p-8 text-center">
                        <Film className="w-8 h-8" />
                        <div className="font-sora font-semibold text-sm text-white/80">Upload a clip to begin</div>
                      </div>
                    )}
                    {/* Live caption preview */}
                    <div
                      className={`absolute inset-x-4 ${
                        position === "top" ? "top-8" : position === "middle" ? "top-1/2 -translate-y-1/2" : "bottom-10"
                      } flex justify-center pointer-events-none`}
                    >
                      <span className={`px-3 py-1.5 rounded-md text-sm tracking-wide ${captionClass}`}>
                        Sample caption preview
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </main>

          {/* RIGHT — style + position */}
          <aside className="border-l border-ink/10 bg-ink/[0.02] flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink/40 mb-2">Style</div>
                <div className="grid grid-cols-2 gap-2">
                  {STYLES.map((s) => {
                    const active = style === s.id;
                    return (
                      <button
                        key={s.id}
                        onClick={() => setStyle(s.id)}
                        className={`px-3 py-3 rounded-xl text-xs font-sora font-semibold border-2 transition ${
                          active ? "border-ink bg-ink text-paper" : "border-ink/10 text-ink/70 hover:border-ink/30 bg-paper"
                        }`}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink/40 mb-2">Position</div>
                <div className="grid grid-cols-3 gap-2">
                  {POSITIONS.map((p) => {
                    const active = position === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => setPosition(p.id)}
                        className={`px-2 py-3 rounded-xl text-xs font-sora font-semibold border-2 transition ${
                          active ? "border-ink bg-ink text-paper" : "border-ink/10 text-ink/70 hover:border-ink/30 bg-paper"
                        }`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="text-[11px] font-manrope text-ink/40 leading-relaxed">
                Preview is approximate — final captions will follow audio timing automatically.
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
                disabled={!video || stage === "generating"}
                onClick={handleGenerate}
                className="w-full py-3.5 rounded-full bg-ink text-paper font-sora font-semibold text-sm flex items-center justify-between px-5 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-ink/90 transition"
              >
                <span className="flex items-center gap-2">
                  {stage === "generating" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                  {stage === "generating" ? "Captioning…" : "Add captions"}
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
      <div className="pointer-events-none absolute -top-40 -left-32 w-[480px] h-[480px] rounded-full bg-emerald-500/25 blur-[120px]" />
      <div className="pointer-events-none absolute top-1/2 -right-40 w-[520px] h-[520px] rounded-full bg-sky-500/20 blur-[140px]" />
      <div className="pointer-events-none absolute bottom-0 left-1/4 w-[420px] h-[420px] rounded-full bg-yellow-400/15 blur-[120px]" />

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
                <img src={heroImg} alt="Auto Caption" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.5 }}
                className="mt-6 text-center"
              >
                <h2 className="font-display text-[10vw] sm:text-[6vw] uppercase leading-[0.95] tracking-tight text-white">
                  Caption <span className="bg-gradient-to-r from-emerald-300 via-sky-300 to-yellow-200 bg-clip-text text-transparent">anything.</span>
                </h2>
                <p className="mt-2 text-sm text-white/65">
                  Upload a clip — we'll transcribe and burn captions in instantly.
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
                  {/* Video tile (sample fallback) */}
                  <div className={`relative rounded-[28px] overflow-hidden aspect-[4/5] ${GLASS}`}>
                    {video ? (
                      <video src={video} className="absolute inset-0 w-full h-full object-cover" muted playsInline loop autoPlay />
                    ) : (
                      <img src={samplePoster} alt="Sample" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                    )}
                    <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold text-white ${GLASS_PILL}`}>
                      {video ? "VIDEO" : "SAMPLE"}
                    </div>
                    {/* Live caption preview */}
                    <div
                      className={`absolute inset-x-3 ${
                        position === "top" ? "top-10" : position === "middle" ? "top-1/2 -translate-y-1/2" : "bottom-12"
                      } flex justify-center pointer-events-none`}
                    >
                      <span
                        className={`px-2.5 py-1 rounded-md text-[11px] tracking-wide ${
                          style === "minimal"
                            ? "bg-black/40 text-white font-medium"
                            : style === "bold"
                            ? "bg-white text-black font-extrabold uppercase"
                            : style === "neon"
                            ? "bg-black text-emerald-300 font-bold drop-shadow-[0_0_6px_rgba(110,231,183,0.8)]"
                            : "bg-yellow-300 text-black font-semibold"
                        }`}
                      >
                        Sample caption
                      </span>
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
                  <h3 className="mb-2 text-[11px] font-bold tracking-[0.18em] text-white/60 uppercase">Style</h3>
                  <div className="grid grid-cols-4 gap-2 mb-5">
                    {STYLES.map((s) => {
                      const active = style === s.id;
                      return (
                        <button
                          key={s.id}
                          onClick={() => setStyle(s.id)}
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

                  <h3 className="mb-2 text-[11px] font-bold tracking-[0.18em] text-white/60 uppercase">Position</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {POSITIONS.map((p) => {
                      const active = position === p.id;
                      return (
                        <button
                          key={p.id}
                          onClick={() => setPosition(p.id)}
                          className={`px-2 py-2.5 rounded-2xl text-xs font-semibold text-white transition ${
                            active
                              ? "bg-white/20 backdrop-blur-2xl border border-white/30 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)]"
                              : "bg-white/5 backdrop-blur-2xl border border-white/10"
                          }`}
                        >
                          {p.label}
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
                  Caption · {cost} MC
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
                Transcribing & burning captions…
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
                  download="captioned-video.mp4"
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

export default AutoCaptionPage;
