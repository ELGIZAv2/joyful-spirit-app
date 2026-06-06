import { useState, useRef } from "react";
import { useToolSeo } from "@/hooks/useToolSeo";
import MediaToolLanding from "@/components/media/MediaToolLanding";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Upload, Sparkles, Download, Share2, Sun, Loader2, Wand2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCredits } from "@/hooks/useCredits";
import { useIsMobile } from "@/hooks/use-mobile";
import relightHero from "@/assets/relight-hero.webp";

type Stage = "landing" | "compose" | "generating" | "result";

const GRADIENT_BORDER =
  "rounded-[26px] p-[1.5px] bg-gradient-to-br from-primary/80 via-fuchsia-500/60 to-orange-400/70 shadow-[0_0_30px_-10px_hsl(var(--primary)/0.6)]";

const LIGHT_PRESETS: { id: string; name: string; direction: string; prompt: string; swatch: string }[] = [
  { id: "studio",   name: "Studio Soft",  direction: "Left Light",   prompt: "soft studio key light, clean professional headshot lighting, neutral white",        swatch: "linear-gradient(135deg,#ffffff,#d6d6d6)" },
  { id: "golden",   name: "Golden Hour",  direction: "Right Light",  prompt: "warm golden hour sunlight from the side, soft amber rim, cinematic glow",          swatch: "linear-gradient(135deg,#ffb347,#ff7e5f)" },
  { id: "neon",     name: "Neon Night",   direction: "Left Light",   prompt: "vibrant magenta and teal neon lighting, cyberpunk mood, dramatic split light",     swatch: "linear-gradient(135deg,#ff3df0,#16e0bd)" },
  { id: "sunset",   name: "Sunset",       direction: "Right Light",  prompt: "warm orange sunset light, soft pink sky reflections, dreamy atmosphere",            swatch: "linear-gradient(135deg,#ff6a3d,#ff2d75)" },
  { id: "moon",     name: "Cool Moon",    direction: "Top Light",    prompt: "cool blue moonlight from above, soft cyan rim, calm cinematic mood",                swatch: "linear-gradient(135deg,#5b8dff,#0a2540)" },
  { id: "fire",     name: "Firelight",    direction: "Bottom Light", prompt: "warm orange firelight from below, flickering candle glow, intimate cozy mood",     swatch: "linear-gradient(135deg,#ff5e3a,#ffb02e)" },
];

const RelightPage = () => {
  useToolSeo("relight");
  const navigate = useNavigate();
  const { hasEnoughCredits } = useCredits();
  const isMobile = useIsMobile();
  const [stage, setStage] = useState<Stage>("landing");
  const [image, setImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [presetId, setPresetId] = useState<string>(LIGHT_PRESETS[0].id);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const desktopReuploadRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a portrait image");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setImage(e.target?.result as string);
      setStage("compose");
      setResultUrl(null);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!image) { toast.error("Upload an image first"); return; }
    if (!hasEnoughCredits(1)) {
      toast.error("Insufficient MC");
      navigate("/pricing");
      return;
    }
    const preset = LIGHT_PRESETS.find((p) => p.id === presetId)!;
    const fullPrompt = [prompt.trim(), preset.prompt].filter(Boolean).join(", ");
    setStage("generating");
    try {
      const directionMap: Record<string, string> = {
        "Left Light": "left", "Right Light": "right", "Top Light": "top", "Bottom Light": "bottom", "Ambient": "center",
      };
      const { data, error } = await supabase.functions.invoke("image-tools", {
        body: { tool: "relight", image, prompt: fullPrompt, direction: directionMap[preset.direction] },
      });
      if (error) throw error;
      const url = data?.url;
      if (!url) throw new Error(data?.error || "No image generated");
      setResultUrl(url);
      setStage("result");
      toast.success("Relit!");
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
      title="Relight"
      headline="Relight any"
      accent="portrait."
      description={`Drop a photo, pick a lighting mood, get a cinematic re-lit shot.`}
      heroImage={relightHero}
      cost={1}
      accept="image/*"
      resultType="image"
      onFileSelected={handleFileUpload}
    />

    );

  }


  // ─────────── DESKTOP STUDIO ───────────
  if (!isMobile) {
    const displayImage = resultUrl || image;
    const activePreset = LIGHT_PRESETS.find((p) => p.id === presetId)!;
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
              <div className="font-sora text-sm font-semibold text-ink leading-tight">Relight Studio</div>
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink/40">Lighting & mood</div>
            </div>
          </div>
          {resultUrl && (
            <a
              href={resultUrl}
              download="relight.png"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-ink text-paper text-sm font-sora font-semibold hover:bg-ink/90 transition"
            >
              <Download className="w-4 h-4" /> Download
            </a>
          )}
        </header>

        <div className="flex-1 min-h-0 grid grid-cols-[280px_1fr_340px]">
          {/* LEFT — source */}
          <aside className="border-r border-ink/10 bg-ink/[0.02] flex flex-col p-5 gap-4 overflow-y-auto">
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink/40">Source</div>
            <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-ink/5 border border-ink/10 relative">
              {image ? (
                <img src={image} alt="Source" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-ink/30 text-xs font-manrope">
                  No photo
                </div>
              )}
            </div>
            <input
              ref={desktopReuploadRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
            />
            <button
              onClick={() => desktopReuploadRef.current?.click()}
              className="w-full py-2.5 rounded-full border border-ink/15 hover:border-ink/40 hover:bg-ink/[0.04] transition flex items-center justify-center gap-2 font-manrope text-sm text-ink/70"
            >
              <Upload className="w-3.5 h-3.5" /> Change photo
            </button>
            {resultUrl && (
              <button
                onClick={() => { setStage("compose"); setResultUrl(null); }}
                className="w-full py-2.5 rounded-full border border-ink/15 hover:border-ink/40 hover:bg-ink/[0.04] transition flex items-center justify-center gap-2 font-manrope text-sm text-ink/70"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Try another light
              </button>
            )}
          </aside>

          {/* CENTER — preview */}
          <main className="relative overflow-hidden bg-[radial-gradient(ellipse_at_center,_hsl(0_0%_0%/0.04),_transparent_60%)] flex items-center justify-center p-8">
            {stage === "generating" && displayImage && (
              <div className="relative aspect-[4/5] rounded-2xl overflow-hidden border border-ink/10 bg-ink/5" style={{ height: "min(80vh, 720px)" }}>
                <img src={displayImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
                <motion.div
                  initial={{ x: "-100%" }}
                  animate={{ x: "100%" }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/60 to-transparent blur-2xl"
                />
              </div>
            )}
            {stage !== "generating" && displayImage && (
              <div className="relative aspect-[4/5] rounded-2xl overflow-hidden border border-ink/10 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.25)] bg-ink/5" style={{ height: "min(80vh, 720px)" }}>
                <img src={displayImage} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
              </div>
            )}
            {!displayImage && (
              <div className="text-ink/40 font-manrope text-sm">Upload a photo to start</div>
            )}
            {stage === "generating" && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 text-ink/70 font-manrope text-sm bg-paper/90 backdrop-blur px-4 py-2 rounded-full border border-ink/10">
                <Loader2 className="w-4 h-4 animate-spin" /> Relighting…
              </div>
            )}
          </main>

          {/* RIGHT — lighting controls */}
          <aside className="border-l border-ink/10 bg-ink/[0.02] flex flex-col p-5 gap-5 overflow-y-auto">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink/40 mb-2">Lighting mood</div>
              <div className="grid grid-cols-2 gap-2">
                {LIGHT_PRESETS.map((p) => {
                  const active = presetId === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setPresetId(p.id)}
                      className={`relative h-20 rounded-xl overflow-hidden border text-left transition ${
                        active ? "border-ink ring-2 ring-ink/20" : "border-ink/10 hover:border-ink/30"
                      }`}
                    >
                      <span className="absolute inset-0" style={{ background: p.swatch }} />
                      <span className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                      <span className="absolute inset-x-0 bottom-0 p-2 text-[11px] font-sora font-semibold text-white drop-shadow">
                        {p.name}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 font-manrope text-[11px] text-ink/40">Direction: {activePreset.direction}</p>
            </div>

            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink/40 mb-2">Describe ​</div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Soft window light from the left, slight blue rim..."
                rows={4}
                className="w-full resize-none px-3 py-2.5 rounded-xl bg-paper border border-ink/15 text-sm text-ink placeholder:text-ink/30 focus:outline-none focus:border-ink/40 transition font-manrope"
              />
            </div>

            <div className="mt-auto space-y-3">
              <button
                disabled={!image || stage === "generating"}
                onClick={handleGenerate}
                className="w-full py-3.5 rounded-full bg-ink text-paper font-sora font-semibold text-sm flex items-center justify-between px-5 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-ink/90 transition"
              >
                <span className="flex items-center gap-2">
                  {stage === "generating" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                  {stage === "generating" ? "Generating…" : "Relight"}
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
                  <img src={relightHero} alt="Relight" className="absolute inset-0 w-full h-full object-cover" />
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
                  Relight any <span className="text-primary">portrait.</span>
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Drop a photo, pick a lighting mood, get a cinematic re-lit shot.
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
                    <Upload className="w-4 h-4" /> Upload Photo
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* ─── COMPOSE ─── */}
          {stage === "compose" && image && (
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
                    <img src={image} alt="Your photo" className="absolute inset-0 w-full h-full object-cover" />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-2 right-2 px-3 py-1.5 rounded-full text-[11px] font-semibold bg-background/70 backdrop-blur-md border border-border/40 text-foreground"
                    >
                      Replace
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0]); }}
                    />
                  </div>
                </div>

                <div className="max-w-sm mx-auto">
                  <h3 className="mb-2 text-[11px] font-bold tracking-[0.18em] text-muted-foreground uppercase">Lighting Mood</h3>
                  <div className="grid grid-cols-3 gap-2 mb-5">
                    {LIGHT_PRESETS.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setPresetId(p.id)}
                        className={`relative px-2 py-3 rounded-2xl text-xs font-semibold border overflow-hidden transition ${
                          presetId === p.id
                            ? "border-primary text-foreground ring-2 ring-primary/40"
                            : "border-border/40 text-muted-foreground"
                        }`}
                        style={{ background: presetId === p.id ? p.swatch : undefined }}
                      >
                        <span
                          className="absolute inset-0 opacity-30"
                          style={{ background: p.swatch }}
                        />
                        <span className="relative drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]">{p.name}</span>
                      </button>
                    ))}
                  </div>

                  <h3 className="mb-2 text-[11px] font-bold tracking-[0.18em] text-muted-foreground uppercase">Describe ​</h3>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Soft window light from the left, slight blue rim..."
                    rows={3}
                    className="w-full resize-none px-4 py-3 rounded-2xl bg-foreground/5 border border-border/40 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/60 focus:bg-foreground/10 transition"
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
                  className="w-full rounded-[26px] py-4 flex items-center justify-center gap-2 text-white font-semibold text-sm bg-primary/35 backdrop-blur-2xl backdrop-saturate-200 border border-primary/40 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25),0_10px_30px_-8px_hsl(var(--primary)/0.55)]"
                >
                  Relight · 1 MC
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
              {image && (
                <div className={`${GRADIENT_BORDER} w-full max-w-xs`}>
                  <div className="relative rounded-[24px] overflow-hidden aspect-[4/5] bg-muted">
                    <img src={image} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    <motion.div
                      initial={{ x: "-100%", opacity: 0 }}
                      animate={{ x: "100%", opacity: 1 }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-fuchsia-500/40 to-transparent blur-2xl mix-blend-screen"
                    />
                    <motion.div
                      initial={{ x: "100%", opacity: 0 }}
                      animate={{ x: "-100%", opacity: 1 }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
                      className="absolute inset-y-0 w-1/2 bg-gradient-to-l from-transparent via-cyan-400/40 to-transparent blur-2xl mix-blend-screen"
                    />
                  </div>
                </div>
              )}
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
                    a.download = "relight.png";
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
                <Sun className="w-4 h-4" /> Try Another Light
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default RelightPage;
