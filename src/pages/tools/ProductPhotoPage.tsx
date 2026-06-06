import { useState, useRef } from "react";
import { useToolSeo } from "@/hooks/useToolSeo";
import MediaToolLanding from "@/components/media/MediaToolLanding";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Upload, Sparkles, Download, Share2, Package, Loader2, Wand2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCredits } from "@/hooks/useCredits";
import { useIsMobile } from "@/hooks/use-mobile";
import productHero from "@/assets/product-photo-hero.webp";

type Stage = "landing" | "compose" | "generating" | "result";

const GRADIENT_BORDER =
  "rounded-[26px] p-[1.5px] bg-gradient-to-br from-primary/80 via-fuchsia-500/60 to-orange-400/70 shadow-[0_0_30px_-10px_hsl(var(--primary)/0.6)]";

const SCENES: { id: string; name: string; prompt: string; swatch: string }[] = [
  { id: "studio",    name: "Studio White", prompt: "on a seamless pure white studio backdrop with soft professional key light and subtle shadow, e-commerce hero shot",                  swatch: "linear-gradient(135deg,#ffffff,#dcdcdc)" },
  { id: "marble",    name: "Dark Marble",  prompt: "floating above a glossy black marble podium, dramatic rim lighting, luxury reflection, premium brand aesthetic",                       swatch: "linear-gradient(135deg,#2c2c2c,#0a0a0a)" },
  { id: "gradient",  name: "Gradient Pop", prompt: "centered on a vibrant pink-to-orange gradient backdrop, soft floor reflection, bold modern advertising look",                          swatch: "linear-gradient(135deg,#ff6a3d,#ff2d75)" },
  { id: "nature",    name: "Botanical",    prompt: "surrounded by fresh green leaves and soft dappled sunlight, organic natural product photography, earthy tones",                        swatch: "linear-gradient(135deg,#34d399,#065f46)" },
  { id: "lifestyle", name: "Lifestyle",    prompt: "in a cozy modern interior, soft window daylight, beige tones, lifestyle product placement, hand-held feel",                            swatch: "linear-gradient(135deg,#e7d3b6,#b08968)" },
  { id: "smoke",     name: "Smoke & Neon", prompt: "with cinematic teal and magenta neon rim lighting, soft drifting smoke, glossy reflective floor, hero ad composition",                 swatch: "linear-gradient(135deg,#16e0bd,#ff3df0)" },
];

const ProductPhotoPage = () => {
  useToolSeo("product-photo");
  const navigate = useNavigate();
  const { hasEnoughCredits } = useCredits();
  const isMobile = useIsMobile();
  const [stage, setStage] = useState<Stage>("landing");
  const [image, setImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [presetId, setPresetId] = useState<string>(SCENES[0].id);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const desktopReuploadRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a product image");
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
    if (!image) { toast.error("Upload a product first"); return; }
    if (!hasEnoughCredits(2)) {
      toast.error("Insufficient MC");
      navigate("/pricing");
      return;
    }
    const preset = SCENES.find((p) => p.id === presetId)!;
    const fullPrompt = [prompt.trim(), preset.prompt].filter(Boolean).join(", ");
    setStage("generating");
    try {
      const { data, error } = await supabase.functions.invoke("image-tools", {
        body: { tool: "product-photo", image, prompt: fullPrompt },
      });
      if (error) throw error;
      const url = data?.url;
      if (!url) throw new Error(data?.error || "No image generated");
      setResultUrl(url);
      setStage("result");
      toast.success("Product shot ready!");
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
      title="Product Photo"
      headline="Sell with"
      accent="light."
      description={`Drop any product photo, pick a scene, get a luxury studio shot.`}
      heroImage={productHero}
      cost={2}
      accept="image/*"
      resultType="image"
      onFileSelected={handleFileUpload}
    />

    );

  }


  // ─────────── DESKTOP STUDIO ───────────
  if (!isMobile) {
    const displayImage = resultUrl || image;
    const activeScene = SCENES.find((p) => p.id === presetId)!;
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
              <div className="font-sora text-sm font-semibold text-ink leading-tight">Product Studio</div>
              
            </div>
          </div>
          {resultUrl && (
            <a
              href={resultUrl}
              download="product-photo.png"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-ink text-paper text-sm font-sora font-semibold hover:bg-ink/90 transition"
            >
              <Download className="w-4 h-4" /> Download
            </a>
          )}
        </header>

        <input
          ref={desktopReuploadRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
        />

        <div className="flex-1 min-h-0 grid grid-cols-[1fr_420px]">
          {/* LEFT — preview + scene strip */}
          <main className="relative overflow-hidden bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary)/0.06),_transparent_60%)] flex flex-col">
            <div className="flex-1 min-h-0 flex items-center justify-center p-8">
              <div className="relative w-full max-w-[460px] aspect-[4/5] rounded-3xl bg-white border border-ink/10 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.25)] overflow-hidden">
                <AnimatePresence mode="wait">
                  {stage === "generating" && displayImage && (
                    <motion.div key="d-gen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0">
                      <img src={displayImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
                      <motion.div
                        initial={{ y: "-100%" }}
                        animate={{ y: "260%" }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-x-0 h-1/2 pointer-events-none bg-gradient-to-b from-transparent via-primary/50 to-transparent blur-md"
                      />
                      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-center gap-2 bg-paper/95 backdrop-blur border border-ink/10 rounded-2xl py-2 text-ink text-xs font-sora font-semibold">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Styling the studio…
                      </div>
                    </motion.div>
                  )}
                  {stage === "result" && resultUrl && (
                    <motion.img key="d-res" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      src={resultUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  )}
                  {stage === "compose" && (
                    image ? (
                      <motion.img key="d-img" initial={{ opacity: 0 }} animate={{ opacity: 1 }} src={image} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <motion.button
                        key="d-empty"
                        onClick={() => desktopReuploadRef.current?.click()}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-ink/40 hover:text-ink/70 transition p-8 text-center"
                      >
                        <div className="w-14 h-14 rounded-full bg-ink/5 flex items-center justify-center">
                          <Upload className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="font-sora font-semibold text-sm text-ink">Drop your product here</div>
                          <div className="font-manrope text-xs text-ink/40 mt-0.5">JPG or PNG, plain background works best</div>
                        </div>
                      </motion.button>
                    )
                  )}
                </AnimatePresence>
                {image && stage !== "generating" && (
                  <button
                    onClick={() => desktopReuploadRef.current?.click()}
                    className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-paper/95 border border-ink/10 text-ink/70 hover:text-ink text-[11px] font-manrope shadow-sm backdrop-blur"
                  >
                    Replace
                  </button>
                )}
                {stage === "result" && resultUrl && (
                  <button
                    onClick={handleShare}
                    className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-paper/95 border border-ink/10 text-ink text-[11px] font-sora font-semibold shadow-sm backdrop-blur"
                  >
                    <Share2 className="w-3 h-3" /> Copy link
                  </button>
                )}
              </div>
            </div>

            {/* Scene strip */}
            <div className="shrink-0 border-t border-ink/10 bg-paper/60 backdrop-blur px-6 py-4">
              <div className="flex items-center justify-between mb-3">
                <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink/40">
                  Scene library 
                </div>
                <div className="font-manrope text-[11px] text-ink/40">
                  Selected: <span className="text-ink font-sora font-semibold">{activeScene.name}</span>
                </div>
              </div>
              <div className="mt-3 flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
                {SCENES.map((p) => {
                  const active = presetId === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setPresetId(p.id)}
                      className={`shrink-0 w-[130px] relative aspect-[4/5] rounded-2xl overflow-hidden border-2 transition group ${
                        active
                          ? "border-ink ring-2 ring-ink/20 -translate-y-0.5 shadow-[0_20px_30px_-15px_rgba(0,0,0,0.35)]"
                          : "border-ink/10 hover:border-ink/30 hover:-translate-y-0.5"
                      }`}
                    >
                      <span className="absolute inset-0" style={{ background: p.swatch }} />
                      <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                      <span className="absolute inset-x-0 bottom-0 p-2 text-[11px] font-sora font-semibold text-white text-left leading-tight">
                        {p.name}
                      </span>
                      {active && (
                        <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-paper text-ink flex items-center justify-center text-[10px] font-bold">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </main>

          {/* RIGHT — controls */}
          <aside className="border-l border-ink/10 bg-ink/[0.02] flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink/40 mb-2">
                  ​
                </div>
                {image ? (
                  <div className="flex items-center gap-3 p-2 rounded-xl bg-paper border border-ink/10">
                    <img src={image} alt="" className="w-14 h-14 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <div className="font-sora text-sm font-semibold text-ink truncate">Product ready</div>
                      <div className="font-manrope text-[11px] text-ink/40">Replace anytime</div>
                    </div>
                    <button
                      onClick={() => desktopReuploadRef.current?.click()}
                      className="text-ink/40 hover:text-ink transition text-xs font-manrope"
                    >
                      Replace
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => desktopReuploadRef.current?.click()}
                    className="w-full py-3 rounded-xl border border-dashed border-ink/20 hover:border-ink/40 hover:bg-ink/[0.03] transition flex items-center justify-center gap-2 text-ink/60 font-manrope text-xs"
                  >
                    <Upload className="w-3.5 h-3.5" /> Upload product
                  </button>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink/40">
                    ​
                  </div>
                  
                </div>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value.slice(0, 300))}
                  placeholder="Floating perfume bottle with golden mist and soft shadow…"
                  rows={5}
                  className="w-full resize-none px-3 py-2.5 rounded-xl bg-paper border border-ink/10 focus:border-ink/40 focus:outline-none font-manrope text-sm text-ink placeholder:text-ink/30 transition"
                />
                <div className="mt-1 flex justify-between text-[10px] font-mono text-ink/30">
                  <span>Blends with the chosen scene</span>
                  <span>{prompt.length}/300</span>
                </div>
              </div>

              <div className="rounded-2xl bg-paper border border-ink/10 p-4 space-y-2">
                <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink/40">Shot recipe</div>
                <div className="flex items-center justify-between text-xs font-manrope">
                  <span className="text-ink/50">Scene</span>
                  <span className="text-ink font-sora font-semibold flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full border border-ink/15" style={{ background: activeScene.swatch }} />
                    {activeScene.name}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs font-manrope">
                  <span className="text-ink/50">Custom note</span>
                  <span className="text-ink font-sora font-semibold">{prompt.trim() ? "Yes" : "—"}</span>
                </div>
              </div>
            </div>

            <div className="p-6 pt-3 border-t border-ink/10 bg-paper/60 backdrop-blur space-y-2">
              <button
                disabled={!image || stage === "generating"}
                onClick={handleGenerate}
                className="w-full py-3.5 rounded-full bg-ink text-paper font-sora font-semibold text-sm flex items-center justify-between px-5 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-ink/90 transition"
              >
                <span className="flex items-center gap-2">
                  {stage === "generating" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Package className="w-4 h-4" />}
                  {stage === "generating" ? "Shooting…" : "Shoot product"}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-paper/15 text-paper text-[10px] font-mono tracking-wider">
                  2 MC
                </span>
              </button>
              {stage === "result" && (
                <button
                  onClick={() => { setStage("compose"); setResultUrl(null); }}
                  className="w-full py-2.5 rounded-full border border-ink/15 hover:border-ink/40 hover:bg-ink/[0.04] transition flex items-center justify-center gap-2 font-manrope text-sm text-ink/70"
                >
                  <Wand2 className="w-3.5 h-3.5" /> Try another scene
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
                  <img src={productHero} alt="Product Photography" className="absolute inset-0 w-full h-full object-cover" />
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
                  Sell with <span className="text-primary">light.</span>
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Drop any product photo, pick a scene, get a luxury studio shot.
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
                    <Upload className="w-4 h-4" /> Upload Product
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
                    <img src={image} alt="Your product" className="absolute inset-0 w-full h-full object-cover" />
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
                  <h3 className="mb-2 text-[11px] font-bold tracking-[0.18em] text-muted-foreground uppercase">Scene</h3>
                  <div className="grid grid-cols-3 gap-2 mb-5">
                    {SCENES.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setPresetId(p.id)}
                        className={`relative px-2 py-3 rounded-2xl text-xs font-semibold border overflow-hidden transition ${
                          presetId === p.id
                            ? "border-primary text-foreground ring-2 ring-primary/40"
                            : "border-border/40 text-muted-foreground"
                        }`}
                      >
                        <span className="absolute inset-0 opacity-30" style={{ background: p.swatch }} />
                        <span className="relative drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]">{p.name}</span>
                      </button>
                    ))}
                  </div>

                  <h3 className="mb-2 text-[11px] font-bold tracking-[0.18em] text-muted-foreground uppercase">Describe ​</h3>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Floating perfume bottle with golden mist and soft shadow..."
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
                  <Sparkles className="w-4 h-4" /> Shoot · 2 MC
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
                      initial={{ y: "-100%" }}
                      animate={{ y: "260%" }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-x-0 h-1/2 pointer-events-none bg-gradient-to-b from-transparent via-primary/50 to-transparent blur-md"
                    />
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Package className="w-4 h-4" /> Styling the studio…
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
                    a.download = "product-photo.png";
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
                <Package className="w-4 h-4" /> New Scene
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ProductPhotoPage;
