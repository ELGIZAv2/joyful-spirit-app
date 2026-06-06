import { useState, useRef } from "react";
import { useToolSeo } from "@/hooks/useToolSeo";
import MediaToolLanding from "@/components/media/MediaToolLanding";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Sparkles, Check, Download, Share2, RefreshCw, Upload, Loader2, Wand2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import cartoonHero from "@/assets/cartoon-hero.webp";
import { toast } from "sonner";
import { useCredits } from "@/hooks/useCredits";
import { useToolTemplates } from "@/hooks/useToolTemplates";
import { useIsMobile } from "@/hooks/use-mobile";
import type { ToolTemplate } from "@/components/layout/ToolPageLayout";

type Stage = "landing" | "browse" | "generating" | "result";

const GRADIENT_BORDER =
  "rounded-[26px] p-[1.5px] bg-gradient-to-br from-primary/80 via-fuchsia-500/60 to-orange-400/70 shadow-[0_0_30px_-10px_hsl(var(--primary)/0.6)]";

const CartoonPage = () => {
  useToolSeo("cartoon");
  const navigate = useNavigate();
  const { hasEnoughCredits } = useCredits();
  const { templates } = useToolTemplates("cartoon");
  const isMobile = useIsMobile();

  const [stage, setStage] = useState<Stage>("landing");
  const [selectedTemplate, setSelectedTemplate] = useState<ToolTemplate | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const desktopReuploadRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImage(e.target?.result as string);
      setStage("browse");
    };
    reader.readAsDataURL(file);
  };

  const generateCartoon = async () => {
    if (!uploadedImage) return;
    if (!selectedTemplate && !customPrompt.trim()) {
      toast.error("Pick a style or write a prompt");
      return;
    }
    if (!hasEnoughCredits(1)) {
      toast.error("Insufficient MC");
      navigate("/pricing");
      return;
    }
    setStage("generating");
    try {
      const basePrompt = selectedTemplate?.prompt ?? "";
      const extra = customPrompt.trim();
      const merged = [basePrompt, extra].filter(Boolean).join(". ");
      const fullPrompt = `${merged}. Keep the exact facial features, identity and expression from the uploaded photo.`;
      const { data, error } = await supabase.functions.invoke("image-tools", {
        body: { tool: "cartoon", image: uploadedImage, prompt: fullPrompt },
      });
      if (error) throw error;
      const url = data?.url;
      if (!url) throw new Error(data?.error || "No image generated");
      setResultUrl(url);
      setStage("result");
      toast.success("Cartoon generated!");
    } catch (e: any) {
      toast.error(e.message || "Generation failed");
      setStage("browse");
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
      title="Cartoon"
      headline="Cartoon"
      accent="me."
      description={`Upload one selfie, pick a style, become a cartoon.`}
      heroImage={cartoonHero}
      cost={1}
      accept="image/*"
      resultType="image"
      onFileSelected={handleFileUpload}
    />

    );

  }

  // ─────────── DESKTOP STUDIO (browse / generating / result) ───────────
  if (!isMobile) {
    const displayImage = resultUrl || uploadedImage;
    const canGenerate =
      !!uploadedImage && (!!selectedTemplate || !!customPrompt.trim()) && stage !== "generating";

    return (
      <div className="h-[100dvh] w-full flex flex-col bg-[#faf8f3] text-ink overflow-hidden">
        {/* Top bar */}
        <header className="h-16 shrink-0 flex items-center justify-between px-8 border-b border-ink/10">
          <div className="flex items-center gap-5">
            <button
              onClick={() => navigate("/images")}
              className="w-9 h-9 rounded-full border border-ink/15 flex items-center justify-center hover:bg-ink hover:text-paper transition"
              aria-label="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="font-display text-2xl tracking-tight text-ink">Cartoon</span>
          </div>
          <div className="flex items-center gap-3">
            {resultUrl && (
              <>
                <button
                  onClick={handleShare}
                  className="h-10 px-4 rounded-full border border-ink/15 hover:border-ink/40 text-sm font-manrope text-ink/70 flex items-center gap-2 transition"
                >
                  <Share2 className="w-3.5 h-3.5" /> Copy link
                </button>
                <a
                  href={resultUrl}
                  download="cartoon.png"
                  target="_blank"
                  rel="noreferrer"
                  className="h-10 px-5 rounded-full bg-ink text-paper text-sm font-sora font-semibold flex items-center gap-2 hover:bg-ink/90 transition"
                >
                  <Download className="w-4 h-4" /> Download
                </a>
              </>
            )}
          </div>
        </header>

        <div className="flex-1 min-h-0 grid grid-cols-[1fr_400px]">
          {/* LEFT: gallery / preview canvas */}
          <main className="relative overflow-hidden border-r border-ink/10">
            <AnimatePresence mode="wait">
              {stage === "browse" && (
                <motion.div
                  key="d-browse"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 overflow-y-auto"
                >
                  <div className="px-10 pt-8 pb-4 flex items-end justify-between">
                    <div>
                      <h2 className="font-display text-4xl tracking-tight text-ink leading-none">
                        Pick a vibe.
                      </h2>
                      <p className="mt-2 font-manrope text-sm text-ink/50">
                        Tap a style, or skip and write your own prompt on the right.
                      </p>
                    </div>
                  </div>

                  {templates.length === 0 ? (
                    <div className="h-64 flex items-center justify-center text-ink/40 text-sm">
                      Loading styles…
                    </div>
                  ) : (
                    <div className="px-10 pb-12 grid grid-cols-3 xl:grid-cols-4 gap-5">
                      {templates.map((t) => {
                        const isSelected = selectedTemplate?.id === t.id;
                        return (
                          <motion.button
                            key={t.id}
                            whileHover={{ y: -3 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => setSelectedTemplate(isSelected ? null : t)}
                            className={`group relative rounded-3xl overflow-hidden text-left aspect-[4/5] transition shadow-sm ${
                              isSelected
                                ? "ring-2 ring-ink ring-offset-4 ring-offset-[#faf8f3]"
                                : "ring-1 ring-ink/10 hover:ring-ink/30"
                            }`}
                          >
                            {t.preview_url ? (
                              <img
                                src={t.preview_url}
                                alt={t.name}
                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center bg-ink/5">
                                <Sparkles className="w-11 h-11 text-ink/20" />
                              </div>
                            )}
                            <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 via-black/30 to-transparent">
                              <p className="font-sora text-sm font-semibold text-white">{t.name}</p>
                            </div>
                            {isSelected && (
                              <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-ink text-paper flex items-center justify-center shadow-xl">
                                <Check className="w-4 h-4" strokeWidth={3} />
                              </div>
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}

              {stage === "generating" && (
                <motion.div
                  key="d-gen"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center gap-8 bg-[radial-gradient(ellipse_at_center,_hsl(0_0%_0%/0.05),_transparent_60%)]"
                >
                  {displayImage && (
                    <div className="relative w-[22rem] aspect-[4/5] rounded-3xl overflow-hidden ring-1 ring-ink/10 shadow-2xl">
                      <img src={displayImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
                      <motion.div
                        initial={{ y: "-100%" }}
                        animate={{ y: "260%" }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-x-0 h-1/2 pointer-events-none bg-gradient-to-b from-transparent via-white/70 to-transparent blur-md"
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-ink/60 font-manrope text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" /> Cartoonifying your photo…
                  </div>
                </motion.div>
              )}

              {stage === "result" && resultUrl && (
                <motion.div
                  key="d-result"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center p-10 bg-[radial-gradient(ellipse_at_center,_hsl(0_0%_0%/0.05),_transparent_60%)]"
                >
                  <div
                    className="relative aspect-[4/5] rounded-3xl overflow-hidden ring-1 ring-ink/10 shadow-[0_40px_80px_-25px_rgba(0,0,0,0.3)] bg-ink/5"
                    style={{ height: "min(82vh, 760px)" }}
                  >
                    <img src={resultUrl} alt="Result" className="absolute inset-0 w-full h-full object-cover" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </main>

          {/* RIGHT: control panel */}
          <aside className="flex flex-col overflow-y-auto bg-paper">
            <div className="p-7 space-y-6 flex-1">
              {/* Source */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.35em] text-ink/40">
                    Your photo
                  </span>
                  <button
                    onClick={() => desktopReuploadRef.current?.click()}
                    className="text-[11px] font-manrope text-ink/60 hover:text-ink underline underline-offset-4 flex items-center gap-1"
                  >
                    <Upload className="w-3 h-3" /> Change
                  </button>
                </div>
                <input
                  ref={desktopReuploadRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                />
                <div className="flex gap-3 items-center">
                  <div className="w-20 h-24 rounded-2xl overflow-hidden bg-ink/5 ring-1 ring-ink/10 shrink-0 relative">
                    {uploadedImage ? (
                      <img src={uploadedImage} alt="Source" className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-ink/30 text-[10px]">
                        none
                      </div>
                    )}
                  </div>
                  <div className="text-xs font-manrope text-ink/50 leading-relaxed">
                    Identity is preserved.<br />Style transforms the rest.
                  </div>
                </div>
              </div>

              {/* Selected style */}
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.35em] text-ink/40 mb-3">
                  Selected style
                </div>
                {selectedTemplate ? (
                  <div className="rounded-2xl bg-ink/[0.03] ring-1 ring-ink/10 p-3 flex gap-3 items-center">
                    {selectedTemplate.preview_url && (
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-ink/10 shrink-0">
                        <img
                          src={selectedTemplate.preview_url}
                          alt={selectedTemplate.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <button
                        onClick={() => setSelectedTemplate(null)}
                        className="text-[11px] font-manrope text-ink/50 hover:text-ink underline underline-offset-4"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-ink/15 p-4 text-center font-manrope text-xs text-ink/40">
                    None — pick from the gallery <span className="text-ink/25">​</span>
                  </div>
                )}
              </div>

              {/* Custom prompt */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.35em] text-ink/40">
                    Custom prompt
                  </span>
                  <span className="font-mono text-[10px] text-ink/30">
                    {customPrompt.length}/300
                  </span>
                </div>
                <div className="relative">
                  <textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value.slice(0, 300))}
                    placeholder="e.g. Studio Ghibli watercolor, soft pastel light, dreamy meadow background…"
                    rows={5}
                    className="w-full resize-none rounded-2xl bg-ink/[0.03] ring-1 ring-ink/10 focus:ring-ink/40 focus:bg-paper transition p-4 pr-10 font-manrope text-sm text-ink placeholder:text-ink/30 outline-none"
                  />
                  
                </div>
                <p className="mt-2 font-manrope text-[11px] text-ink/40 leading-relaxed">
                  Write your own direction, or combine with a style above for a remix.
                </p>
              </div>
            </div>

            {/* Footer actions */}
            <div className="p-7 pt-4 border-t border-ink/10 space-y-3 bg-paper">
              <button
                disabled={!canGenerate}
                onClick={generateCartoon}
                className="w-full h-14 rounded-2xl bg-ink text-paper font-sora font-semibold text-sm flex items-center justify-between px-6 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-ink/90 transition group"
              >
                <span className="flex items-center gap-2.5">
                  {stage === "generating" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Wand2 className="w-4 h-4 group-hover:rotate-12 transition" />
                  )}
                  {stage === "generating" ? "Generating…" : "Generate cartoon"}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-paper/15 text-paper text-[10px] font-mono tracking-wider">
                  1 MC
                </span>
              </button>
              {resultUrl && (
                <button
                  onClick={() => {
                    setStage("browse");
                    setResultUrl(null);
                  }}
                  className="w-full h-11 rounded-2xl border border-ink/15 hover:border-ink/40 hover:bg-ink/[0.04] transition flex items-center justify-center gap-2 font-manrope text-sm text-ink/70"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Try another
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
      {/* Floating back button */}
      <button
        onClick={() => {
          if ((stage as string) === "landing") navigate("/images");
          else if (stage === "result") setStage("browse");
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
              {/* Hero card */}
              <motion.div
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 24, delay: 0.05 }}
                className={`${GRADIENT_BORDER} flex-1 max-h-[55vh]`}
              >
                <div className="relative w-full h-full rounded-[24px] overflow-hidden bg-muted">
                  <img
                    src={cartoonHero}
                    alt="Cartoon avatar"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent" />
                </div>
              </motion.div>

              {/* Title */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.5 }}
                className="mt-6 text-center"
              >
                <h2 className="font-display text-[10vw] sm:text-[6vw] uppercase leading-[0.95] tracking-tight text-foreground">
                  Cartoon <span className="text-primary">me.</span>
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Upload one selfie, pick a style, become a cartoon.
                </p>
              </motion.div>

              {/* Upload button */}
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
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
                  }}
                />
                <div className={GRADIENT_BORDER}>
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    transition={{ type: "spring", stiffness: 400, damping: 22 }}
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full bg-background rounded-[24px] py-4 flex items-center justify-center text-foreground font-semibold text-sm"
                  >
                    Upload Photo
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* ─── BROWSE ─── */}
          {stage === "browse" && (
            <motion.div
              key="browse"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 flex flex-col"
            >
              <div className="flex-1 overflow-y-auto px-4 pt-[calc(env(safe-area-inset-top)+4rem)] pb-[140px]">
                {uploadedImage && (
                  <div className={`${GRADIENT_BORDER} mx-auto w-full max-w-sm mb-5`}>
                    <div className="relative rounded-[24px] overflow-hidden aspect-[4/5] bg-muted">
                      <img
                        src={uploadedImage}
                        alt="Your photo"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}

                {/* Templates */}
                <div className="max-w-sm mx-auto">
                  <h3 className="mb-2 text-[11px] font-bold tracking-[0.18em] text-muted-foreground uppercase">
                    Styles
                  </h3>
                  {templates.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground text-sm">
                      Loading styles…
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {templates.map((t) => {
                        const isSelected = selectedTemplate?.id === t.id;
                        return (
                          <motion.button
                            key={t.id}
                            whileTap={{ scale: 0.96 }}
                            onClick={() => setSelectedTemplate(isSelected ? null : t)}
                            className={`group relative rounded-2xl overflow-hidden border text-left aspect-[3/4] transition ${
                              isSelected
                                ? "border-primary ring-2 ring-primary/60 shadow-[0_0_24px_-6px_hsl(var(--primary)/0.6)]"
                                : "border-border/30 bg-card"
                            }`}
                          >
                            {t.preview_url ? (
                              <img
                                src={t.preview_url}
                                alt={t.name}
                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                            ) : (
                              <div className="absolute inset-0 bg-gradient-to-br from-primary/15 to-fuchsia-500/15 flex items-center justify-center">
                                <Sparkles className="w-11 h-11 text-muted-foreground/30" />
                              </div>
                            )}
                            <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-black/80 via-black/30 to-transparent">
                              <p className="text-xs font-semibold text-white">{t.name}</p>
                            </div>
                            {isSelected && (
                              <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#34C759] text-white flex items-center justify-center shadow-lg ring-2 ring-white/90">
                                <Check className="w-4 h-4" strokeWidth={3} />
                              </div>
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Generate bar */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
                className="absolute bottom-0 inset-x-0 z-20 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+1rem)]"
              >
                {selectedTemplate ? (
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={generateCartoon}
                    className="w-full rounded-[26px] py-4 flex items-center justify-center text-white font-semibold text-sm bg-primary/35 backdrop-blur-2xl backdrop-saturate-200 border border-primary/40 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25),0_10px_30px_-8px_hsl(var(--primary)/0.55)]"
                  >
                    Generate · 1 MC
                  </motion.button>
                ) : (
                  <motion.button
                    disabled
                    className="w-full rounded-[26px] py-4 flex items-center justify-center text-foreground/70 font-semibold text-sm bg-white/10 dark:bg-white/[0.06] backdrop-blur-2xl backdrop-saturate-150 border border-white/15 dark:border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15),0_8px_24px_-8px_rgba(0,0,0,0.4)]"
                  >
                    Pick a style
                  </motion.button>
                )}
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
              {uploadedImage && (
                <div className={`${GRADIENT_BORDER} w-full max-w-xs`}>
                  <div className="relative rounded-[24px] overflow-hidden aspect-[4/5]">
                    <img
                      src={uploadedImage}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <motion.div
                      initial={{ y: "-100%" }}
                      animate={{ y: "260%" }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-x-0 h-1/2 pointer-events-none bg-gradient-to-b from-transparent via-primary/50 to-transparent blur-md"
                    />
                  </div>
                </div>
              )}
              <div className="text-sm text-muted-foreground">
                Cartoonifying your photo…
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
                  <img
                    src={resultUrl}
                    alt="Result"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="mt-4 max-w-sm mx-auto w-full flex gap-3">
                <button
                  onClick={() => {
                    const a = document.createElement("a");
                    a.href = resultUrl;
                    a.download = "cartoon.png";
                    a.target = "_blank";
                    a.click();
                  }}
                  className="flex-1 flex items-center justify-center py-3 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm"
                >
                  Download
                </button>
                <button
                  onClick={handleShare}
                  className="flex-1 flex items-center justify-center py-3 rounded-2xl bg-foreground/5 border border-border/40 text-foreground font-semibold text-sm"
                >
                  Share
                </button>
              </div>
              <button
                onClick={() => {
                  setStage("browse");
                  setResultUrl(null);
                  setSelectedTemplate(null);
                }}
                className="mt-3 max-w-sm mx-auto w-full py-3 rounded-2xl bg-foreground/5 border border-border/30 text-foreground text-sm font-medium"
              >
                Try Another Style
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CartoonPage;
