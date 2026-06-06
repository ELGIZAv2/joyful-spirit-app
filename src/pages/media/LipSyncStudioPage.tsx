import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Upload, Download, Image as ImageIcon, Film, Music2, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCredits } from "@/hooks/useCredits";
import {
  lipsyncModels,
  imageLipSyncModels,
  videoLipSyncModels,
  getLipSyncModelById,
  type LipSyncModel,
} from "@/lib/openGenAI/lipsyncModels";

type Mode = "image" | "video";
type Stage = "compose" | "generating" | "result";

const GLASS =
  "bg-white/[0.06] backdrop-blur-3xl border border-white/15 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.18),0_20px_60px_-20px_rgba(0,0,0,0.7)]";

export default function LipSyncStudioPage() {
  const navigate = useNavigate();
  const { hasEnoughCredits } = useCredits();
  const [mode, setMode] = useState<Mode>("image");
  const [modelId, setModelId] = useState<string>(imageLipSyncModels[0].id);
  const [resolution, setResolution] = useState<string>("");
  const [prompt, setPrompt] = useState("");
  const [media, setMedia] = useState<string | null>(null); // data url
  const [mediaName, setMediaName] = useState<string | null>(null);
  const [audio, setAudio] = useState<string | null>(null);
  const [audioName, setAudioName] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>("compose");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const mediaRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLInputElement>(null);

  const model = useMemo<LipSyncModel>(() => getLipSyncModelById(modelId)!, [modelId]);
  const availableModels = mode === "image" ? imageLipSyncModels : videoLipSyncModels;

  // Ensure selected model belongs to current mode
  if (model.category !== mode) {
    setModelId(availableModels[0].id);
    setResolution(availableModels[0].defaultResolution ?? "");
  }

  const readFile = (file: File, kind: "media" | "audio") => {
    const r = new FileReader();
    r.onload = (e) => {
      const data = e.target?.result as string;
      if (kind === "media") {
        setMedia(data);
        setMediaName(file.name);
      } else {
        setAudio(data);
        setAudioName(file.name);
      }
    };
    r.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!media) return toast.error(mode === "image" ? "Upload a portrait image" : "Upload a video");
    if (!audio) return toast.error("Upload an audio file");
    if (!hasEnoughCredits(model.cost)) {
      toast.error(`Need ${model.cost} credits`);
      return navigate("/pricing");
    }
    setStage("generating");
    try {
      const { data, error } = await supabase.functions.invoke("video-tools", {
        body: {
          tool: mode === "image" ? "talking-photo" : "lip-sync",
          model: model.endpoint,
          video: mode === "video" ? media : undefined,
          image: mode === "image" ? media : undefined,
          audio,
          prompt: model.hasPrompt ? prompt : undefined,
          resolution: resolution || model.defaultResolution,
          quality: model.badge === "quality" ? "pro" : "standard",
        },
      });
      if (error) throw error;
      const url = data?.url;
      if (!url) throw new Error(data?.error || "Generation failed");
      setResultUrl(url);
      setStage("result");
      toast.success("Lip-sync ready");
    } catch (e) {
      toast.error((e as Error).message || "Generation failed");
      setStage("compose");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-background/70 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <h1 className="font-display text-base font-semibold tracking-tight">Voice Sync Studio</h1>
          <div className="w-12" />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Mode tabs */}
        <div className="flex gap-2">
          {([
            { id: "image", label: "Image + Audio", icon: ImageIcon },
            { id: "video", label: "Video + Audio", icon: Film },
          ] as const).map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setMode(t.id);
                const first = (t.id === "image" ? imageLipSyncModels : videoLipSyncModels)[0];
                setModelId(first.id);
                setResolution(first.defaultResolution ?? "");
                setMedia(null);
                setMediaName(null);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition ${
                mode === t.id
                  ? "bg-foreground text-background border-foreground"
                  : "bg-card text-muted-foreground border-border/60 hover:text-foreground"
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Model grid */}
        <section>
          <h2 className="text-xs uppercase tracking-[0.16em] text-muted-foreground mb-3">Choose a model</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {availableModels.map((m) => {
              const active = m.id === modelId;
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    setModelId(m.id);
                    setResolution(m.defaultResolution ?? "");
                  }}
                  className={`text-left rounded-2xl p-4 border transition ${
                    active
                      ? "border-primary/60 bg-primary/5 ring-1 ring-primary/30"
                      : "border-border/60 bg-card hover:border-foreground/30"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-sm">{m.name}</span>
                    {m.badge && (
                      <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-foreground/10 text-foreground">
                        {m.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] text-muted-foreground line-clamp-2">{m.description}</p>
                  <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
                    <Sparkles className="w-3 h-3" /> {m.cost} credits
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Inputs */}
        <section className={`rounded-3xl p-6 ${GLASS}`}>
          <div className="grid md:grid-cols-2 gap-4">
            {/* Media upload */}
            <button
              onClick={() => mediaRef.current?.click()}
              className="aspect-video rounded-2xl border-2 border-dashed border-border/60 hover:border-foreground/40 transition flex flex-col items-center justify-center gap-2 bg-background/40 overflow-hidden"
            >
              {media ? (
                mode === "image" ? (
                  <img src={media} alt="" className="w-full h-full object-cover" />
                ) : (
                  <video src={media} className="w-full h-full object-cover" muted />
                )
              ) : (
                <>
                  {mode === "image" ? <ImageIcon className="w-8 h-8 text-muted-foreground" /> : <Film className="w-8 h-8 text-muted-foreground" />}
                  <span className="text-sm text-muted-foreground">Upload {mode === "image" ? "portrait image" : "video"}</span>
                </>
              )}
              <input
                ref={mediaRef}
                type="file"
                accept={mode === "image" ? "image/*" : "video/*"}
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) readFile(f, "media");
                }}
              />
            </button>

            {/* Audio upload */}
            <button
              onClick={() => audioRef.current?.click()}
              className="aspect-video rounded-2xl border-2 border-dashed border-border/60 hover:border-foreground/40 transition flex flex-col items-center justify-center gap-2 bg-background/40"
            >
              {audio ? (
                <>
                  <Music2 className="w-8 h-8 text-primary" />
                  <span className="text-sm font-medium">{audioName}</span>
                  <audio src={audio} controls className="mt-2 w-3/4" />
                </>
              ) : (
                <>
                  <Music2 className="w-8 h-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Upload audio (mp3/wav)</span>
                </>
              )}
              <input
                ref={audioRef}
                type="file"
                accept="audio/*"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) readFile(f, "audio");
                }}
              />
            </button>
          </div>

          {/* Optional prompt */}
          {model.hasPrompt && (
            <div className="mt-4">
              <label className="text-xs text-muted-foreground">Scene direction ​</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={2}
                placeholder="e.g. friendly tone, slight smile, natural head movement"
                className="mt-1 w-full rounded-xl bg-background/60 border border-border/60 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary/40"
              />
            </div>
          )}

          {/* Resolution */}
          {model.resolutions && model.resolutions.length > 0 && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-xs text-muted-foreground mr-1">Resolution</span>
              {model.resolutions.map((r) => (
                <button
                  key={r}
                  onClick={() => setResolution(r)}
                  className={`px-3 py-1 rounded-full text-xs border transition ${
                    (resolution || model.defaultResolution) === r
                      ? "bg-foreground text-background border-foreground"
                      : "border-border/60 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          )}

          <div className="mt-6 flex items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              {model.name} · {model.cost} credits
            </p>
            <button
              onClick={handleGenerate}
              disabled={stage === "generating"}
              className="px-6 py-2.5 rounded-full bg-foreground text-background text-sm font-semibold flex items-center gap-2 disabled:opacity-60"
            >
              {stage === "generating" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {stage === "generating" ? "Generating…" : "Generate Lipsync"}
            </button>
          </div>
        </section>

        {/* Result */}
        {stage === "result" && resultUrl && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-3xl p-6 ${GLASS}`}
          >
            <h3 className="text-sm font-semibold mb-3">Your lip-sync video</h3>
            <video src={resultUrl} controls className="w-full rounded-2xl" />
            <div className="mt-3 flex justify-end">
              <a
                href={resultUrl}
                download
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-foreground text-background text-sm font-medium"
              >
                <Download className="w-4 h-4" /> Download
              </a>
            </div>
          </motion.section>
        )}
      </main>
    </div>
  );
}
