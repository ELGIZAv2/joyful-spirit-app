import { useState, useRef } from "react";
import { useToolSeo } from "@/hooks/useToolSeo";
import MediaToolLanding from "@/components/media/MediaToolLanding";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Upload, Copy, RefreshCw, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCredits } from "@/hooks/useCredits";
import heroImg from "@/assets/tool-landing/video-to-text-v8.webp";
import samplePoster from "@/assets/video-to-text-sample-boy-v2.webp";

type Stage = "landing" | "compose" | "generating" | "result";
type Mode = "file" | "url";

const GLASS =
  "bg-white/[0.06] backdrop-blur-3xl backdrop-saturate-200 border border-white/15 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.18),inset_0_-1px_0_0_rgba(255,255,255,0.04),0_20px_60px_-20px_rgba(0,0,0,0.7)]";
const GLASS_PILL =
  "bg-white/10 backdrop-blur-2xl backdrop-saturate-200 border border-white/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.3),0_8px_24px_-8px_rgba(0,0,0,0.6)]";

// Fal model dedicated to transcription
const FAL_MODEL = "fal-ai/whisper";

const MODES: { id: Mode; label: string }[] = [
  { id: "file", label: "Upload File" },
  { id: "url", label: "Paste URL" },
];

const VideoToTextPage = () => {
  useToolSeo("video-to-text");
  const navigate = useNavigate();
  const { hasEnoughCredits } = useCredits();
  const [stage, setStage] = useState<Stage>("landing");
  const [video, setVideo] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [url, setUrl] = useState("");
  const [mode, setMode] = useState<Mode>("file");
  const [transcription, setTranscription] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const cost = 1;

  const readFile = (file: File) => {
    if (!file.type.startsWith("video/") && !file.type.startsWith("audio/")) {
      toast.error("Please upload a video or audio file");
      return;
    }
    setFileName(file.name);
    const r = new FileReader();
    r.onload = (e) => { setVideo(e.target?.result as string); setStage("compose"); };
    r.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (mode === "file" && !video) { toast.error("Upload a file"); return; }
    if (mode === "url" && !url.trim()) { toast.error("Paste a URL"); return; }
    if (!hasEnoughCredits(cost)) { toast.error("Insufficient MC"); navigate("/pricing"); return; }
    setStage("generating");
    try {
      let inputUrl = url.trim();
      if (mode === "file" && video) {
        // Upload to storage to get a public URL for the model
        const blob = await (await fetch(video)).blob();
        const path = `transcribe/${Date.now()}-${fileName || "input"}`;
        const { error: uploadErr } = await supabase.storage
          .from("model-media")
          .upload(path, blob);
        if (uploadErr) throw uploadErr;
        const { data: urlData } = supabase.storage
          .from("model-media")
          .getPublicUrl(path);
        inputUrl = urlData.publicUrl;
      }
      const { data, error } = await supabase.functions.invoke("video-tools", {
        body: { tool: "video-to-text", action: "transcribe", model: FAL_MODEL, url: inputUrl },
      });
      if (error) throw error;
      const text = data?.text || data?.transcription || "";
      if (!text) throw new Error(data?.error || "No transcription returned");
      setTranscription(text);
      setStage("result");
      toast.success("Transcribed!");
    } catch (e: any) {
      toast.error(e.message || "Transcription failed");
      setStage("compose");
    }
  };

  const handleCopy = () => {
    if (!transcription) return;
    navigator.clipboard.writeText(transcription);
    toast.success("Copied");
  };

  if ((stage as string) === "landing") {

    return (

      <MediaToolLanding
      title="Video To Text"
      headline="Words to"
      accent="text."
      description={`Drop a clip or a link — get clean transcription in 99 languages.`}
      heroImage={heroImg}
      cost={1}
      accept="video/*"
      resultType="video"
      onFileSelected={readFile}
    />

    );

  }


  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden relative bg-gradient-to-b from-zinc-950 via-black to-zinc-950">
      <div className="pointer-events-none absolute -top-40 -left-32 w-[480px] h-[480px] rounded-full bg-fuchsia-500/25 blur-[120px]" />
      <div className="pointer-events-none absolute top-1/2 -right-40 w-[520px] h-[520px] rounded-full bg-violet-500/20 blur-[140px]" />
      <div className="pointer-events-none absolute bottom-0 left-1/4 w-[420px] h-[420px] rounded-full bg-rose-400/15 blur-[120px]" />

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
                <img src={heroImg} alt="Video to Text" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.5 }}
                className="mt-6 text-center"
              >
                <h2 className="font-display text-[10vw] sm:text-[6vw] uppercase leading-[0.95] tracking-tight text-white">
                  Words to <span className="bg-gradient-to-r from-fuchsia-300 via-rose-300 to-violet-300 bg-clip-text text-transparent">text.</span>
                </h2>
                <p className="mt-2 text-sm text-white/65">
                  Drop a clip or a link — get clean transcription in 99 languages.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.5 }}
                className="mt-6"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*,audio/*"
                  className="hidden"
                  onChange={(e) => { if (e.target.files?.[0]) readFile(e.target.files[0]); }}
                />
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => { setMode("file"); fileInputRef.current?.click(); }}
                  className={`w-full rounded-full py-4 flex items-center justify-center gap-2 text-white font-semibold text-sm ${GLASS_PILL}`}
                >
                  <Upload className="w-4 h-4" /> Upload Your Media
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => { setMode("url"); setStage("compose"); }}
                  className={`w-full mt-3 rounded-full py-3 text-white/80 text-xs font-medium ${GLASS_PILL}`}
                >
                  Or paste a video URL
                </motion.button>
              </motion.div>
            </motion.div>
          )}

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
                  <div className={`relative rounded-[28px] overflow-hidden aspect-[4/5] ${GLASS}`}>
                    {video && mode === "file" ? (
                      <video src={video} className="absolute inset-0 w-full h-full object-cover" muted playsInline loop autoPlay />
                    ) : (
                      <img src={samplePoster} alt="Sample" className="absolute inset-0 w-full h-full object-cover opacity-70" />
                    )}
                    <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold text-white ${GLASS_PILL}`}>
                      {video && mode === "file" ? "MEDIA" : "SAMPLE"}
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className={`absolute bottom-2 right-2 w-8 h-8 flex items-center justify-center rounded-full text-white ${GLASS_PILL}`}
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="video/*,audio/*"
                      className="hidden"
                      onChange={(e) => { if (e.target.files?.[0]) readFile(e.target.files[0]); e.target.value = ""; }}
                    />
                  </div>
                </div>

                <div className="max-w-sm mx-auto">
                  <h3 className="mb-2 text-[11px] font-bold tracking-[0.18em] text-white/60 uppercase">Source</h3>
                  <div className="grid grid-cols-2 gap-2 mb-5">
                    {MODES.map((m) => {
                      const active = mode === m.id;
                      return (
                        <button
                          key={m.id}
                          onClick={() => setMode(m.id)}
                          className={`px-2 py-2.5 rounded-2xl text-xs font-semibold text-white transition ${
                            active
                              ? "bg-white/20 backdrop-blur-2xl border border-white/30 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)]"
                              : "bg-white/5 backdrop-blur-2xl border border-white/10"
                          }`}
                        >
                          {m.label}
                        </button>
                      );
                    })}
                  </div>

                  {mode === "url" && (
                    <input
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://youtube.com/..."
                      className={`w-full mb-5 px-4 py-3 rounded-2xl text-sm text-white placeholder:text-white/40 focus:outline-none ${GLASS_PILL}`}
                    />
                  )}

                  <div className={`px-3 py-3 rounded-2xl text-[11px] text-white/65 ${GLASS_PILL}`}>
                    Auto-detects language across 99 supported tongues. Works with YouTube, TikTok, X & direct files.
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
                  disabled={mode === "file" ? !video : !url.trim()}
                  className={`w-full rounded-full py-4 flex items-center justify-center text-white font-semibold text-sm disabled:opacity-50 ${GLASS_PILL}`}
                >
                  Transcribe · {cost} MC/min
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
              <div className="relative w-full max-w-xs">
                <div className={`relative rounded-[28px] overflow-hidden aspect-[4/5] ${GLASS}`}>
                  {video && mode === "file" ? (
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
                Listening & transcribing…
              </div>
            </motion.div>
          )}

          {stage === "result" && transcription && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col px-5 pt-[calc(env(safe-area-inset-top)+4rem)] pb-[calc(env(safe-area-inset-bottom)+1rem)]"
            >
              <div className={`relative rounded-[28px] overflow-hidden mx-auto w-full max-w-sm flex-1 max-h-[65vh] p-5 ${GLASS}`}>
                <div className="h-full overflow-y-auto text-[13px] leading-relaxed text-white/90 whitespace-pre-wrap">
                  {transcription}
                </div>
              </div>
              <div className="mt-4 max-w-sm mx-auto w-full flex gap-3">
                <button
                  onClick={handleCopy}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-full text-white font-semibold text-sm ${GLASS_PILL}`}
                >
                  <Copy className="w-4 h-4" /> Copy
                </button>
                <a
                  href={`data:text/plain;charset=utf-8,${encodeURIComponent(transcription)}`}
                  download="transcription.txt"
                  className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-full text-white font-semibold text-sm ${GLASS_PILL}`}
                >
                  <FileText className="w-4 h-4" /> .txt
                </a>
              </div>
              <button
                onClick={() => { setStage("compose"); setTranscription(""); }}
                className={`mt-3 max-w-sm mx-auto w-full py-3 rounded-full text-white text-sm font-medium flex items-center justify-center gap-1.5 ${GLASS_PILL}`}
              >
                <RefreshCw className="w-4 h-4" /> Try another
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default VideoToTextPage;
