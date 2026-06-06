import { useState, useRef } from "react";
import { useToolSeo } from "@/hooks/useToolSeo";
import MediaToolLanding from "@/components/media/MediaToolLanding";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Sparkles, Download, Share2, Film, Wand2, Upload, RefreshCw, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCredits } from "@/hooks/useCredits";
import { useIsMobile } from "@/hooks/use-mobile";
import storyboardHero from "@/assets/storyboard-hero.webp";

type Stage = "landing" | "compose" | "generating" | "result";

const GRADIENT_BORDER =
  "rounded-[26px] p-[1.5px] bg-gradient-to-br from-primary/80 via-fuchsia-500/60 to-orange-400/70 shadow-[0_0_30px_-10px_hsl(var(--primary)/0.6)]";

const STYLE_PRESETS: { id: string; name: string; prompt: string }[] = [
  { id: "pencil",    name: "Pencil Sketch",  prompt: "rough black-and-white pencil storyboard sketch on cream paper, hatched shading, hand-drawn film panel" },
  { id: "ink",       name: "Inked Comic",    prompt: "bold black ink storyboard panel, thick line art, dramatic shadows, comic-book style" },
  { id: "noir",      name: "Film Noir",      prompt: "monochrome film noir storyboard, high contrast lighting, dramatic mood, cinematic shot" },
  { id: "anime",     name: "Anime",          prompt: "anime storyboard panel, clean line art, expressive composition, studio production sketch" },
  { id: "color",     name: "Color Concept",  prompt: "painted concept-art storyboard panel, soft cinematic colors, atmospheric lighting" },
  { id: "marker",    name: "Marker Render",  prompt: "professional marker-rendered storyboard panel, soft greys with warm highlights, production design feel" },
];

const SHOTS: { id: string; name: string; prompt: string }[] = [
  { id: "wide",   name: "Wide",     prompt: "wide establishing shot" },
  { id: "med",    name: "Medium",   prompt: "medium shot framing the character" },
  { id: "close",  name: "Close-up", prompt: "tight close-up portrait shot" },
  { id: "low",    name: "Low Angle",prompt: "dramatic low-angle shot looking up" },
  { id: "over",   name: "OTS",      prompt: "over-the-shoulder shot" },
];

const StoryboardPage = () => {
  useToolSeo("storyboard");
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { hasEnoughCredits } = useCredits();
  const [stage, setStage] = useState<Stage>("landing");
  const [scene, setScene] = useState("");
  const [styleId, setStyleId] = useState<string>(STYLE_PRESETS[0].id);
  const [shotId, setShotId] = useState<string>(SHOTS[0].id);
  const [refImage, setRefImage] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const refInputRef = useRef<HTMLInputElement>(null);

  const handleRefUpload = (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Please upload an image"); return; }
    const reader = new FileReader();
    reader.onload = (e) => setRefImage(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!scene.trim()) {
      toast.error("Describe the scene first");
      return;
    }
    if (!hasEnoughCredits(1)) {
      toast.error("Insufficient MC");
      navigate("/pricing");
      return;
    }
    const style = STYLE_PRESETS.find((s) => s.id === styleId)!;
    const shot = SHOTS.find((s) => s.id === shotId)!;
    const fullPrompt = `Storyboard panel: ${shot.prompt}. ${scene.trim()}. ${style.prompt}. Strong composition, frame border, scene number in corner.`;
    setStage("generating");
    try {
      const { data, error } = await supabase.functions.invoke("image-tools", {
        body: { tool: "storyboard", prompt: fullPrompt, image: refImage ?? undefined },
      });
      if (error) throw error;
      const url = data?.url;
      if (!url) throw new Error(data?.error || "No image generated");
      setResultUrl(url);
      setStage("result");
      toast.success("Storyboard ready!");
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
        title="Storyboard"
        headline="Frame your"
        accent="story."
        description={`Describe a scene, pick a style and shot, get a director's storyboard panel.`}
        heroImage={storyboardHero}
        cost={1}
        accept="image/*"
        resultType="image"
        primaryAction={{ label: "Start", onClick: () => setStage("compose") }}
      />
    );
  }

  // ─────────── DESKTOP STUDIO ───────────
  if (!isMobile) {
    const selectedStyle = STYLE_PRESETS.find((s) => s.id === styleId)!;
    const selectedShot = SHOTS.find((s) => s.id === shotId)!;
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
              <div className="font-sora text-sm font-semibold text-ink leading-tight">Storyboard Studio</div>
              
            </div>
          </div>
          {resultUrl && (
            <a
              href={resultUrl}
              download="storyboard.png"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-ink text-paper text-sm font-sora font-semibold hover:bg-ink/90 transition"
            >
              <Download className="w-4 h-4" /> Download
            </a>
          )}
        </header>

        <div className="flex-1 min-h-0 grid grid-cols-[1fr_420px]">
          <input
            ref={refInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleRefUpload(f);
              e.target.value = "";
            }}
          />

          {/* LEFT — stage */}
          <main className="relative overflow-y-auto p-8 bg-[radial-gradient(circle_at_top,hsl(var(--ink)/0.03),transparent_60%)]">
            {stage === "compose" && (
              <div className="h-full flex flex-col">
                <div className="mb-5">
                  <h2 className="font-sora text-2xl font-semibold text-ink leading-tight">
                    Pick the visual language of your panel
                  </h2>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-6">
                  {STYLE_PRESETS.map((s) => {
                    const selected = styleId === s.id;
                    return (
                      <button
                        key={s.id}
                        onClick={() => setStyleId(s.id)}
                        className={`group relative aspect-[4/3] rounded-2xl overflow-hidden border-2 p-4 text-left transition ${
                          selected
                            ? "border-ink ring-2 ring-ink/20 bg-ink text-paper shadow-[0_20px_40px_-20px_rgba(0,0,0,0.4)]"
                            : "border-ink/10 hover:border-ink/40 hover:-translate-y-0.5 bg-paper text-ink"
                        }`}
                      >
                        <div className={`absolute inset-0 opacity-10 bg-[repeating-linear-gradient(45deg,currentColor_0_1px,transparent_1px_8px)]`} />
                        <div className="relative h-full flex flex-col justify-between">
                          <Film className="w-5 h-5 opacity-60" />
                          <div>
                            <div className="font-sora text-sm font-semibold">{s.name}</div>
                            <div className={`font-mono text-[10px] uppercase tracking-[0.2em] mt-1 ${selected ? "text-paper/60" : "text-ink/40"}`}>
                              Style preset
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.3em] text-ink/40">
                  Step 03 · Shot type
                </div>
                <div className="flex gap-2 flex-wrap">
                  {SHOTS.map((s) => {
                    const active = shotId === s.id;
                    return (
                      <button
                        key={s.id}
                        onClick={() => setShotId(s.id)}
                        className={`px-4 py-2 rounded-full text-xs font-sora font-semibold border transition ${
                          active
                            ? "border-ink bg-ink text-paper"
                            : "border-ink/15 bg-paper text-ink/70 hover:border-ink/40"
                        }`}
                      >
                        {s.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {stage === "generating" && (
              <div className="h-full flex items-center justify-center">
                <div className="relative w-full max-w-[480px] aspect-[4/5] rounded-3xl bg-[#f5efe2] border border-ink/10 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.25)] overflow-hidden">
                  <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-3 p-5">
                    {[0, 1, 2, 3].map((i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0.1 }}
                        animate={{ opacity: [0.15, 0.55, 0.15] }}
                        transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.25 }}
                        className="rounded-xl border border-stone-700/40 bg-stone-700/10"
                      />
                    ))}
                  </div>
                  <motion.div
                    initial={{ y: "-100%" }}
                    animate={{ y: "260%" }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-x-0 h-1/2 pointer-events-none bg-gradient-to-b from-transparent via-primary/50 to-transparent blur-md"
                  />
                  <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2 text-ink/70 font-manrope text-xs bg-paper/95 backdrop-blur px-4 py-2 rounded-full border border-ink/10 shadow-sm">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Sketching the scene…
                  </div>
                </div>
              </div>
            )}

            {stage === "result" && resultUrl && (
              <div className="h-full flex flex-col items-center justify-center gap-5">
                <motion.img
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  src={resultUrl}
                  alt="Storyboard panel"
                  className="max-h-[75vh] w-auto rounded-3xl shadow-[0_40px_80px_-30px_rgba(0,0,0,0.4)] border border-ink/10"
                />
                <button
                  onClick={() => { setStage("compose"); setResultUrl(null); }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-paper border border-ink/15 text-xs font-manrope text-ink/70 hover:text-ink hover:border-ink/40 transition shadow-sm"
                >
                  <RefreshCw className="w-3 h-3" /> New panel
                </button>
              </div>
            )}
          </main>

          {/* RIGHT — controls */}
          <aside className="border-l border-ink/10 bg-ink/[0.02] flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Prompt */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div />

                  <Sparkles className="w-3 h-3 text-ink/30" />
                </div>
                <textarea
                  value={scene}
                  onChange={(e) => setScene(e.target.value.slice(0, 600))}
                  placeholder="A detective walks into a dimly lit warehouse, rain falling outside the open door…"
                  rows={6}
                  className="w-full px-3 py-2.5 rounded-xl bg-paper border border-ink/10 focus:border-ink/40 focus:outline-none font-manrope text-sm text-ink placeholder:text-ink/30 resize-none transition"
                />
              </div>

              {/* Reference image */}
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink/40 mb-2">
                  Reference image <span className="text-ink/25">​</span>
                </div>
                {refImage ? (
                  <div className="flex items-center gap-3 p-2 rounded-xl bg-paper border border-ink/10">
                    <img src={refImage} alt="reference" className="w-14 h-14 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <div className="font-sora text-sm font-semibold text-ink truncate">Reference attached</div>
                      <div className="font-manrope text-[11px] text-ink/40">Will guide composition</div>
                    </div>
                    <button
                      onClick={() => setRefImage(null)}
                      className="w-7 h-7 rounded-full text-ink/40 hover:text-ink hover:bg-ink/5 transition flex items-center justify-center"
                      aria-label="Remove reference"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => refInputRef.current?.click()}
                    className="w-full py-3 rounded-xl border border-dashed border-ink/20 hover:border-ink/40 hover:bg-ink/[0.03] transition flex items-center justify-center gap-2 text-ink/60 font-manrope text-xs"
                  >
                    <Upload className="w-3.5 h-3.5" /> Attach reference image
                  </button>
                )}
              </div>

              {/* Summary */}
              <div className="rounded-2xl bg-paper border border-ink/10 p-4 space-y-2">
                <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink/40">Panel recipe</div>
                <div className="flex items-center justify-between text-xs font-manrope">
                  <span className="text-ink/50">Style</span>
                  <span className="text-ink font-sora font-semibold">{selectedStyle.name}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-manrope">
                  <span className="text-ink/50">Shot</span>
                  <span className="text-ink font-sora font-semibold">{selectedShot.name}</span>
                </div>
              </div>
            </div>

            {/* Sticky footer */}
            <div className="p-6 pt-3 border-t border-ink/10 bg-paper/60 backdrop-blur space-y-2">
              <button
                disabled={!scene.trim() || stage === "generating"}
                onClick={handleGenerate}
                className="w-full py-3.5 rounded-full bg-ink text-paper font-sora font-semibold text-sm flex items-center justify-between px-5 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-ink/90 transition"
              >
                <span className="flex items-center gap-2">
                  {stage === "generating" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                  {stage === "generating" ? "Sketching…" : "Generate panel"}
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


  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden bg-background">
      <button
        onClick={() => {
          if (stage === "result") setStage("compose");
          else setStage("landing");
        }}
        className="fixed top-[calc(env(safe-area-inset-top)+1rem)] left-3 z-30 w-9 h-9 flex items-center justify-center rounded-full bg-background/40 backdrop-blur-xl border border-border/40 text-foreground hover:bg-background/60 transition"
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
                <div className="max-w-sm mx-auto">
                  <h3 className="mb-2 text-[11px] font-bold tracking-[0.18em] text-muted-foreground uppercase">Scene description</h3>
                  <textarea
                    value={scene}
                    onChange={(e) => setScene(e.target.value)}
                    placeholder="A detective walks into a dimly lit warehouse, rain falling outside the open door…"
                    rows={5}
                    className="w-full resize-none px-4 py-3 rounded-2xl bg-foreground/5 border border-border/40 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/60 focus:bg-foreground/10 transition mb-5"
                  />

                  <h3 className="mb-2 text-[11px] font-bold tracking-[0.18em] text-muted-foreground uppercase">Style</h3>
                  <div className="grid grid-cols-3 gap-2 mb-5">
                    {STYLE_PRESETS.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setStyleId(s.id)}
                        className={`px-2 py-3 rounded-2xl text-xs font-semibold border transition ${
                          styleId === s.id
                            ? "border-primary bg-primary/15 text-foreground ring-2 ring-primary/40"
                            : "border-border/40 bg-card text-muted-foreground"
                        }`}
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>

                  <h3 className="mb-2 text-[11px] font-bold tracking-[0.18em] text-muted-foreground uppercase">Shot type</h3>
                  <div className="flex gap-2 flex-wrap">
                    {SHOTS.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setShotId(s.id)}
                        className={`px-3 py-2 rounded-full text-xs font-semibold border transition ${
                          shotId === s.id
                            ? "border-primary bg-primary/15 text-foreground"
                            : "border-border/40 bg-card text-muted-foreground"
                        }`}
                      >
                        {s.name}
                      </button>
                    ))}
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
                  className="w-full rounded-[26px] py-4 flex items-center justify-center gap-2 text-white font-semibold text-sm bg-primary/35 backdrop-blur-2xl backdrop-saturate-200 border border-primary/40 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25),0_10px_30px_-8px_hsl(var(--primary)/0.55)]"
                >
                  <Sparkles className="w-4 h-4" /> Generate Panel · 1 MC
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
              className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-6"
            >
              <div className={`${GRADIENT_BORDER} w-full max-w-xs`}>
                <div className="relative rounded-[24px] overflow-hidden aspect-[4/5] bg-[#f5efe2]">
                  <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-2 p-3">
                    {[0, 1, 2, 3].map((i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0.1 }}
                        animate={{ opacity: [0.15, 0.55, 0.15] }}
                        transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.25 }}
                        className="rounded-md border border-stone-700/40 bg-stone-700/10"
                      />
                    ))}
                  </div>
                  <motion.div
                    initial={{ y: "-100%" }}
                    animate={{ y: "260%" }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-x-0 h-1/2 pointer-events-none bg-gradient-to-b from-transparent via-primary/50 to-transparent blur-md"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Film className="w-4 h-4" /> Sketching the scene…
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
              <div className={`${GRADIENT_BORDER} mx-auto w-full max-w-sm flex-1 max-h-[65vh]`}>
                <div className="relative w-full h-full rounded-[24px] overflow-hidden bg-muted">
                  <img src={resultUrl} alt="Storyboard panel" className="absolute inset-0 w-full h-full object-cover" />
                </div>
              </div>
              <div className="mt-4 max-w-sm mx-auto w-full flex gap-3">
                <button
                  onClick={() => {
                    const a = document.createElement("a");
                    a.href = resultUrl;
                    a.download = "storyboard.png";
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
                <Film className="w-4 h-4" /> New Panel
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default StoryboardPage;
