import { useState, useRef } from "react";
import { useToolSeo } from "@/hooks/useToolSeo";
import MediaToolLanding from "@/components/media/MediaToolLanding";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Upload, Sparkles, Download, Share2, Pencil, Loader2, Wand2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCredits } from "@/hooks/useCredits";
import { useIsMobile } from "@/hooks/use-mobile";
import sketchHero from "@/assets/sketch-hero.webp";

type Stage = "landing" | "compose" | "generating" | "result";

const GRADIENT_BORDER =
  "rounded-[26px] p-[1.5px] bg-gradient-to-br from-primary/80 via-fuchsia-500/60 to-orange-400/70 shadow-[0_0_30px_-10px_hsl(var(--primary)/0.6)]";

const STYLE_PRESETS: { id: string; name: string; prompt: string }[] = [
  { id: "photo", name: "Realistic Photo", prompt: "ultra-realistic photograph, cinematic lighting, sharp focus, 8k detail" },
  { id: "anime", name: "Anime", prompt: "anime illustration, vibrant colors, clean line art, studio ghibli inspired" },
  { id: "watercolor", name: "Watercolor", prompt: "soft watercolor painting, pastel tones, paper texture, hand-painted" },
  { id: "3d", name: "3D Render", prompt: "stylized 3d render, octane, soft global illumination, polished materials" },
  { id: "cyber", name: "Cyberpunk", prompt: "cyberpunk concept art, neon lights, rainy night city, futuristic mood" },
  { id: "oil", name: "Oil Painting", prompt: "rich oil painting, classical brush strokes, dramatic chiaroscuro" },
];

const SketchToImagePage = () => {
  useToolSeo("sketch-to-image");
  const navigate = useNavigate();
  const { hasEnoughCredits } = useCredits();
  const isMobile = useIsMobile();
  const [stage, setStage] = useState<Stage>("landing");
  const [sketch, setSketch] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [styleId, setStyleId] = useState<string>(STYLE_PRESETS[0].id);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const desktopReuploadRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a sketch image");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setSketch(e.target?.result as string);
      setStage("compose");
      setResultUrl(null);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!sketch) {
      toast.error("Upload a sketch first");
      return;
    }
    if (!hasEnoughCredits(1)) {
      toast.error("Insufficient MC");
      navigate("/pricing");
      return;
    }
    const style = STYLE_PRESETS.find((s) => s.id === styleId);
    const fullPrompt = [prompt.trim(), style?.prompt].filter(Boolean).join(", ") ||
      "A detailed photorealistic image based on the sketch, professional lighting";
    setStage("generating");
    try {
      const { data, error } = await supabase.functions.invoke("image-tools", {
        body: { tool: "sketch-to-image", image: sketch, prompt: fullPrompt },
      });
      if (error) throw error;
      const url = data?.url;
      if (!url) throw new Error(data?.error || "No image generated");
      setResultUrl(url);
      setStage("result");
      toast.success("Sketch transformed!");
    } catch (e: any) {
      toast.error(e.message || "Generation failed");
      setStage("compose");
    }
  };

  const handleShare = () => {
    if (resultUrl) {
      navigator.clipboard.writeText(resultUrl);
      toast.success("Link copied!");
    }
  };

  if ((stage as string) === "landing") {

    return (

      <MediaToolLanding
      title="Sketch To Image"
      headline="Sketch to"
      accent="image."
      description={`Upload a doodle, choose a style, get a finished artwork.`}
      heroImage={sketchHero}
      cost={1}
      accept="image/*"
      resultType="image"
      onFileSelected={handleFileUpload}
    />

    );

  }


  // ─────────── DESKTOP STUDIO ───────────
  if (!isMobile) {
    const activeStyle = STYLE_PRESETS.find((s) => s.id === styleId)!;
    return (
      <div className="h-[100dvh] w-full flex flex-col bg-paper text-ink overflow-hidden">
        <header className="h-14 shrink-0 flex items-center justify-between px-6 border-b border-ink/10 bg-paper/90 backdrop-blur">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/images")}
              className="flex items-center gap-2 font-manrope text-sm font-medium text-ink/70 hover:text-ink transition"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <div className="h-5 w-px bg-ink/15" />
            <div>
              <div className="font-sora text-sm font-semibold text-ink leading-tight">Sketch Studio</div>
              
            </div>
          </div>
          {resultUrl && (
            <a
              href={resultUrl}
              download="sketch-image.png"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-ink text-paper text-sm font-sora font-semibold hover:bg-ink/90 transition"
            >
              <Download className="w-4 h-4" /> Download
            </a>
          )}
        </header>

        <div className="flex-1 min-h-0 grid grid-cols-[1fr_360px]">
          {/* CENTER — single hero canvas */}
          <main className="relative overflow-hidden bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary)/0.06),_transparent_60%)] flex items-center justify-center p-10">
            <div className="relative w-full max-w-[680px] aspect-square rounded-3xl bg-white border border-ink/10 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.25)] overflow-hidden">
              <AnimatePresence mode="wait">
                {stage === "generating" && (
                  <motion.div
                    key="d-gen"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0"
                  >
                    {sketch && (
                      <img src={sketch} alt="" className="absolute inset-0 w-full h-full object-contain p-10 opacity-50" />
                    )}
                    <motion.div
                      initial={{ y: "-100%" }}
                      animate={{ y: "260%" }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-x-0 h-1/2 pointer-events-none bg-gradient-to-b from-transparent via-primary/30 to-transparent blur-md"
                    />
                    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2 text-ink/70 font-manrope text-xs bg-paper/95 backdrop-blur px-4 py-2 rounded-full border border-ink/10 shadow-sm">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Bringing your sketch to life…
                    </div>
                  </motion.div>
                )}
                {stage === "result" && resultUrl && (
                  <motion.img
                    key="d-result"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    src={resultUrl}
                    alt="Result"
                    className="absolute inset-0 w-full h-full object-contain"
                  />
                )}
                {stage !== "generating" && !resultUrl && sketch && (
                  <motion.img
                    key="d-sketch"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    src={sketch}
                    alt="Sketch"
                    className="absolute inset-0 w-full h-full object-contain p-10"
                  />
                )}
                {stage !== "generating" && !resultUrl && !sketch && (
                  <button
                    onClick={() => desktopReuploadRef.current?.click()}
                    className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-ink/40 hover:text-ink/70 transition group"
                  >
                    <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-ink/20 group-hover:border-ink/40 flex items-center justify-center transition">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div className="text-center">
                      <div className="font-sora font-semibold text-sm text-ink/70">Upload your sketch</div>
                      <div className="font-manrope text-xs text-ink/40 mt-0.5">PNG, JPG up to 10 MB</div>
                    </div>
                  </button>
                )}
              </AnimatePresence>

              <input
                ref={desktopReuploadRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
              />

              {/* Floating sketch thumbnail when showing result */}
              {sketch && stage === "result" && resultUrl && (
                <div className="absolute bottom-4 left-4 w-24 h-24 rounded-xl bg-white border border-ink/15 shadow-lg overflow-hidden">
                  <img src={sketch} alt="" className="w-full h-full object-contain p-1.5" />
                  <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-ink/80 text-paper text-[8px] font-mono uppercase tracking-wider">
                    Source
                  </div>
                </div>
              )}

              {/* Top-right actions when there's a result */}
              {resultUrl && stage === "result" && (
                <button
                  onClick={() => { setStage("compose"); setResultUrl(null); }}
                  className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-paper/95 backdrop-blur border border-ink/10 text-xs font-manrope text-ink/70 hover:text-ink hover:border-ink/30 transition shadow-sm"
                >
                  <RefreshCw className="w-3 h-3" /> Retry
                </button>
              )}
            </div>
          </main>

          {/* RIGHT — controls */}
          <aside className="border-l border-ink/10 bg-ink/[0.02] flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Source block */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink/40">Source</div>
                  {sketch && (
                    <button
                      onClick={() => desktopReuploadRef.current?.click()}
                      className="text-[11px] font-manrope text-ink/50 hover:text-ink flex items-center gap-1"
                    >
                      <Upload className="w-3 h-3" /> Replace
                    </button>
                  )}
                </div>
                <button
                  onClick={() => desktopReuploadRef.current?.click()}
                  className="w-full h-20 rounded-xl border border-ink/10 bg-white hover:border-ink/30 transition overflow-hidden relative flex items-center justify-center group"
                >
                  {sketch ? (
                    <img src={sketch} alt="" className="w-full h-full object-contain p-2" />
                  ) : (
                    <div className="flex items-center gap-2 text-ink/40 group-hover:text-ink/70 transition">
                      <Upload className="w-4 h-4" />
                      <span className="font-manrope text-xs">Upload sketch</span>
                    </div>
                  )}
                </button>
              </div>

              {/* Style */}
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink/40 mb-2">Style · {activeStyle.name}</div>
                <div className="grid grid-cols-2 gap-2">
                  {STYLE_PRESETS.map((s) => {
                    const active = styleId === s.id;
                    return (
                      <button
                        key={s.id}
                        onClick={() => setStyleId(s.id)}
                        className={`px-3 py-2.5 rounded-xl text-xs font-sora font-semibold border transition text-left ${
                          active
                            ? "border-ink bg-ink text-paper"
                            : "border-ink/10 bg-paper hover:border-ink/30 text-ink"
                        }`}
                      >
                        {s.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Prompt */}
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink/40 mb-2">Describe ​</div>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="A red sports car on a desert road at sunset…"
                  rows={4}
                  className="w-full resize-none px-3 py-2.5 rounded-xl bg-paper border border-ink/15 text-sm text-ink placeholder:text-ink/30 focus:outline-none focus:border-ink/40 transition font-manrope"
                />
              </div>
            </div>

            {/* Sticky footer */}
            <div className="p-6 pt-3 border-t border-ink/10 bg-paper/60 backdrop-blur space-y-2">
              <button
                disabled={!sketch || stage === "generating"}
                onClick={handleGenerate}
                className="w-full py-3.5 rounded-full bg-ink text-paper font-sora font-semibold text-sm flex items-center justify-between px-5 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-ink/90 transition"
              >
                <span className="flex items-center gap-2">
                  {stage === "generating" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                  {stage === "generating" ? "Generating…" : "Generate"}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-paper/15 text-paper text-[10px] font-mono tracking-wider">
                  1 MC
                </span>
              </button>
              {resultUrl && (
                <button
                  onClick={handleShare}
                  className="w-full py-2.5 rounded-full border border-ink/15 hover:border-ink/40 hover:bg-ink/[0.04] transition flex items-center justify-center gap-2 font-manrope text-sm text-ink/70"
                >
                  <Share2 className="w-3.5 h-3.5" /> Copy link
                </button>
              )}
            </div>
          </aside>
        </div>
      </div>
    );
  }

  // ─────────── MOBILE (unchanged) ───────────
  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden bg-background">
      <button
        onClick={() => {
          if ((stage as string) === "landing") navigate("/images");
          else if (stage === "result") setStage("compose");
          else setStage("landing");
        }}
        className="fixed top-[calc(env(safe-area-inset-top)+1rem)] left-3 z-30 w-9 h-9 flex items-center justify-center rounded-full bg-background/40 backdrop-blur-xl border border-border/40 text-foreground hover:bg-background/60 transition"
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
              className="absolute inset-0 flex flex-col px-5 pt-[calc(env(safe-area-inset-top)+4rem)] pb-8"
            >
              <motion.div
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 24, delay: 0.05 }}
                className={`${GRADIENT_BORDER} flex-1 max-h-[55vh]`}
              >
                <div className="relative w-full h-full rounded-[24px] overflow-hidden bg-muted">
                  <img src={sketchHero} alt="Sketch to Image" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent" />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.5 }}
                className="mt-6 text-center"
              >
                <h2 className="font-display text-[10vw] sm:text-[6vw] uppercase leading-[0.95] tracking-tight text-foreground">
                  Sketch to <span className="text-primary">image.</span>
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Upload a doodle, choose a style, get a finished artwork.
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
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0]); }}
                />
                <div className={GRADIENT_BORDER}>
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    transition={{ type: "spring", stiffness: 400, damping: 22 }}
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full bg-background rounded-[24px] py-4 flex items-center justify-center gap-2 text-foreground font-semibold text-sm"
                  >
                    <Upload className="w-4 h-4" /> Upload Sketch
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* ─── COMPOSE ─── */}
          {stage === "compose" && sketch && (
            <motion.div
              key="compose"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 flex flex-col"
            >
              <div className="flex-1 overflow-y-auto px-4 pt-[calc(env(safe-area-inset-top)+4rem)] pb-[180px]">
                <div className={`${GRADIENT_BORDER} mx-auto w-full max-w-sm mb-5`}>
                  <div className="relative rounded-[24px] overflow-hidden aspect-[4/5] bg-muted">
                    <img src={sketch} alt="Your sketch" className="absolute inset-0 w-full h-full object-contain bg-white" />
                    
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0]); }}
                    />
                  </div>
                </div>

                <div className="max-w-sm mx-auto rounded-[28px] p-4 bg-white/5 backdrop-blur-2xl backdrop-saturate-200 border border-white/15 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.18),0_20px_60px_-20px_rgba(0,0,0,0.55)]">
                  <h3 className="mb-2 text-[11px] font-bold tracking-[0.18em] text-muted-foreground uppercase">Style</h3>
                  <div className="grid grid-cols-3 gap-2 mb-5">
                    {STYLE_PRESETS.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setStyleId(s.id)}
                        className={`px-2 py-3 rounded-2xl text-xs font-semibold backdrop-blur-xl backdrop-saturate-200 border transition shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15)] ${
                          styleId === s.id
                            ? "border-primary/60 bg-primary/25 text-foreground ring-1 ring-primary/40"
                            : "border-white/15 bg-white/5 text-muted-foreground hover:bg-white/10"
                        }`}
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>

                  <h3 className="mb-2 text-[11px] font-bold tracking-[0.18em] text-muted-foreground uppercase">Describe ​</h3>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="A red sports car on a desert road at sunset..."
                    rows={3}
                    className="w-full resize-none px-4 py-3 rounded-2xl bg-white/5 backdrop-blur-xl backdrop-saturate-200 border border-white/15 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/50 focus:bg-white/10 transition shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)]"
                  />
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
                  className="w-full rounded-[26px] py-4 flex items-center justify-center gap-2 text-foreground font-semibold text-sm bg-white/10 backdrop-blur-3xl backdrop-saturate-200 border border-white/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.35),inset_0_-1px_0_0_rgba(255,255,255,0.08),0_20px_50px_-15px_rgba(0,0,0,0.55)]"
                >
                  Generate · 1 MC
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
              className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-6"
            >
              {sketch && (
                <div className={`${GRADIENT_BORDER} w-full max-w-xs`}>
                  <div className="relative rounded-[24px] overflow-hidden aspect-[4/5] bg-white">
                    <img src={sketch} alt="" className="absolute inset-0 w-full h-full object-contain" />
                    <motion.div
                      initial={{ y: "-100%" }}
                      animate={{ y: "260%" }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-x-0 h-1/2 pointer-events-none bg-gradient-to-b from-transparent via-primary/50 to-transparent blur-md"
                    />
                  </div>
                </div>
              )}
              <div className="text-sm text-muted-foreground">Bringing your sketch to life…</div>
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
              <div className={`${GRADIENT_BORDER} mx-auto w-full max-w-sm flex-1 max-h-[65vh]`}>
                <div className="relative w-full h-full rounded-[24px] overflow-hidden bg-muted">
                  <img src={resultUrl} alt="Result" className="absolute inset-0 w-full h-full object-cover" />
                </div>
              </div>
              <div className="mt-4 max-w-sm mx-auto w-full flex gap-3">
                <button
                  onClick={() => {
                    const a = document.createElement("a");
                    a.href = resultUrl;
                    a.download = "sketch-image.png";
                    a.target = "_blank";
                    a.click();
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm"
                >
                  <Download className="w-4 h-4" /> Download
                </button>
                <button
                  onClick={handleShare}
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-foreground/5 border border-border/40 text-foreground font-semibold text-sm"
                >
                  <Share2 className="w-4 h-4" /> Share
                </button>
              </div>
              <button
                onClick={() => { setStage("compose"); setResultUrl(null); }}
                className="mt-3 max-w-sm mx-auto w-full py-3 rounded-2xl bg-foreground/5 border border-border/30 text-foreground text-sm font-medium flex items-center justify-center gap-1.5"
              >
                <Pencil className="w-4 h-4" /> Try Another Style
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SketchToImagePage;
