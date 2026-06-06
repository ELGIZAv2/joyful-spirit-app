import { useState, useEffect, useRef } from "react";
import { useToolSeo } from "@/hooks/useToolSeo";
import MediaToolLanding from "@/components/media/MediaToolLanding";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, User, UserRound, Sparkles, Download, Share2, Upload, Check, Loader2, Wand2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import headshotHero from "@/assets/headshot-hero.webp";
import { toast } from "sonner";
import { useCredits } from "@/hooks/useCredits";
import { useIsMobile } from "@/hooks/use-mobile";

interface HeadshotTemplate {
  id: string;
  name: string;
  gender: string;
  prompt: string;
  preview_url: string | null;
}

type Stage = "landing" | "browse" | "generating" | "result";

const GRADIENT_BORDER =
  "rounded-[26px] p-[1.5px] bg-gradient-to-br from-primary/80 via-fuchsia-500/60 to-orange-400/70 shadow-[0_0_30px_-10px_hsl(var(--primary)/0.6)]";

const HEADSHOT_FALLBACK_HERO = headshotHero;

const HeadshotPage = () => {
  useToolSeo("headshot");
  const navigate = useNavigate();
  const { hasEnoughCredits } = useCredits();
  const isMobile = useIsMobile();
  const [stage, setStage] = useState<Stage>("landing");
  const [gender, setGender] = useState<"female" | "male">("female");
  const [templates, setTemplates] = useState<HeadshotTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<HeadshotTemplate | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const landingImage = HEADSHOT_FALLBACK_HERO;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const desktopReuploadRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase
      .from("headshot_templates")
      .select("*")
      .eq("is_active", true)
      .order("display_order")
      .then(({ data }) => {
        if (data && data.length > 0) setTemplates(data as HeadshotTemplate[]);
      });
  }, []);

  const filteredTemplates = templates.filter(
    (t) => t.gender === "both" || t.gender === gender
  );

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

  const generateHeadshot = async () => {
    if (!uploadedImage || !selectedTemplate) return;
    if (!hasEnoughCredits(1)) {
      toast.error("Insufficient MC");
      navigate("/pricing");
      return;
    }
    setStage("generating");
    try {
      const genderPrefix = gender === "male" ? "A handsome man" : "A beautiful woman";
      const fullPrompt = `${genderPrefix}, ${selectedTemplate.prompt}. Keep the exact facial features from the uploaded photo.`;
      const { data, error } = await supabase.functions.invoke("image-tools", {
        body: {
          tool: "headshot",
          image: uploadedImage,
          prompt: fullPrompt,
        },
      });
      if (error) throw error;
      const url = data?.url;
      if (!url) throw new Error(data?.error || "No image generated");
      setResultUrl(url);
      setStage("result");
      toast.success("Headshot generated!");
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
      title="Headshot"
      headline="Studio"
      accent="headshot."
      description={`Upload one selfie, pick a style, get a pro shot.`}
      heroImage={landingImage}
      cost={1}
      accept="image/*"
      resultType="image"
      onFileSelected={handleFileUpload}
    />

    );

  }


  // ─────────── DESKTOP STUDIO ───────────
  if (!isMobile) {
    const displayImage = resultUrl || uploadedImage;
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
              <div className="font-sora text-sm font-semibold text-ink leading-tight">Headshot Studio</div>
            </div>
          </div>
          {resultUrl && (
            <a
              href={resultUrl}
              download="headshot.png"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-ink text-paper text-sm font-sora font-semibold hover:bg-ink/90 transition"
            >
              <Download className="w-4 h-4" /> Download
            </a>
          )}
        </header>

        <div className="flex-1 min-h-0 grid grid-cols-[280px_1fr_340px]">
          {/* LEFT */}
          <aside className="border-r border-ink/10 bg-ink/[0.02] flex flex-col p-5 gap-4 overflow-y-auto">
            <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-ink/5 border border-ink/10 relative">
              {uploadedImage ? (
                <img src={uploadedImage} alt="Source" className="absolute inset-0 w-full h-full object-cover" />
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

            <div className="mt-2">
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink/40 mb-2">Gender</div>
              <div className="flex gap-1 p-1 rounded-full border border-ink/10 bg-paper">
                {(["female", "male"] as const).map((g) => (
                  <button
                    key={g}
                    onClick={() => setGender(g)}
                    className={`flex-1 py-2 rounded-full text-xs font-sora font-semibold capitalize transition ${
                      gender === g ? "bg-ink text-paper" : "text-ink/60 hover:text-ink"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {resultUrl && (
              <button
                onClick={() => {
                  setStage("browse");
                  setResultUrl(null);
                  setSelectedTemplate(null);
                }}
                className="w-full py-2.5 rounded-full border border-ink/15 hover:border-ink/40 hover:bg-ink/[0.04] transition flex items-center justify-center gap-2 font-manrope text-sm text-ink/70"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Try another style
              </button>
            )}
          </aside>

          {/* CENTER */}
          <main className="relative overflow-hidden bg-[radial-gradient(ellipse_at_center,_hsl(0_0%_0%/0.04),_transparent_60%)]">
            <AnimatePresence mode="wait">
              {stage === "browse" && (
                <motion.div
                  key="d-browse"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 overflow-y-auto p-8"
                >
                  <div className="flex items-baseline justify-between mb-5">
                    <h2 className="font-sora text-2xl font-bold text-ink">Styles</h2>
                  </div>
                  {filteredTemplates.length === 0 ? (
                    <div className="h-64 flex items-center justify-center text-ink/40 text-sm">Loading styles…</div>
                  ) : (
                    <div className="grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                      {filteredTemplates.map((t) => {
                        const isSelected = selectedTemplate?.id === t.id;
                        return (
                          <motion.button
                            key={t.id}
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setSelectedTemplate(isSelected ? null : t)}
                            className={`group relative rounded-2xl overflow-hidden border text-left aspect-[3/4] transition ${
                              isSelected
                                ? "border-ink ring-2 ring-ink/30"
                                : "border-ink/10 hover:border-ink/30 bg-ink/[0.03]"
                            }`}
                          >
                            {t.preview_url ? (
                              <img
                                src={t.preview_url}
                                alt={t.name}
                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <UserRound className="w-10 h-10 text-ink/20" />
                              </div>
                            )}
                            <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/70 via-black/20 to-transparent">
                              <p className="text-xs font-sora font-semibold text-white">{t.name}</p>
                            </div>
                            {isSelected && (
                              <div className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-ink text-paper flex items-center justify-center shadow-lg">
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
                  className="absolute inset-0 flex flex-col items-center justify-center gap-6"
                >
                  {displayImage && (
                    <div className="relative w-80 aspect-[4/5] rounded-2xl overflow-hidden border border-ink/10 bg-ink/5">
                      <img src={displayImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
                      <motion.div
                        initial={{ y: "-100%" }}
                        animate={{ y: "260%" }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-x-0 h-1/2 pointer-events-none bg-gradient-to-b from-transparent via-white/60 to-transparent blur-md"
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-ink/60 font-manrope text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" /> Crafting your headshot…
                  </div>
                </motion.div>
              )}

              {stage === "result" && resultUrl && (
                <motion.div
                  key="d-result"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center p-8"
                >
                  <div
                    className="relative max-h-full max-w-full aspect-[4/5] rounded-2xl overflow-hidden border border-ink/10 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.25)] bg-ink/5"
                    style={{ height: "min(80vh, 720px)" }}
                  >
                    <img src={resultUrl} alt="Result" className="absolute inset-0 w-full h-full object-cover" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </main>

          {/* RIGHT */}
          <aside className="border-l border-ink/10 bg-ink/[0.02] flex flex-col p-5 gap-5 overflow-y-auto">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink/40 mb-2">Selected style</div>
              {selectedTemplate ? (
                <div className="rounded-xl border border-ink/10 overflow-hidden bg-paper">
                  {selectedTemplate.preview_url && (
                    <div className="aspect-[4/3] bg-ink/5 relative">
                      <img
                        src={selectedTemplate.preview_url}
                        alt={selectedTemplate.name}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-3">
                    <p className="font-sora text-sm font-semibold text-ink">{selectedTemplate.name}</p>
                    {selectedTemplate.prompt && (
                      <p className="mt-1 font-manrope text-xs text-ink/50 line-clamp-3">{selectedTemplate.prompt}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-ink/15 p-6 text-center font-manrope text-xs text-ink/40">
                  Pick a style from the gallery
                </div>
              )}
            </div>

            <div className="mt-auto space-y-3">
              <button
                disabled={!selectedTemplate || !uploadedImage || stage === "generating"}
                onClick={generateHeadshot}
                className="w-full py-3.5 rounded-full bg-ink text-paper font-sora font-semibold text-sm flex items-center justify-between px-5 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-ink/90 transition"
              >
                <span className="flex items-center gap-2">
                  {stage === "generating" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Wand2 className="w-4 h-4" />
                  )}
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
                    src={landingImage}
                    alt="Headshot"
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
                  Studio <span className="text-primary">headshot.</span>
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Upload one selfie, pick a style, get a pro shot.
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

                {/* Gender toggle */}
                <div className="max-w-sm mx-auto flex gap-2 mb-5 p-1 bg-foreground/5 backdrop-blur-2xl border border-border/40 rounded-full">
                  <button
                    onClick={() => setGender("female")}
                    className={`flex-1 flex items-center justify-center py-2.5 rounded-full text-xs font-semibold transition-all ${
                      gender === "female"
                        ? "bg-primary text-primary-foreground shadow-lg"
                        : "text-muted-foreground"
                    }`}
                  >
                    Female
                  </button>
                  <button
                    onClick={() => setGender("male")}
                    className={`flex-1 flex items-center justify-center py-2.5 rounded-full text-xs font-semibold transition-all ${
                      gender === "male"
                        ? "bg-primary text-primary-foreground shadow-lg"
                        : "text-muted-foreground"
                    }`}
                  >
                    Male
                  </button>
                </div>

                {/* Templates */}
                <div className="max-w-sm mx-auto">
                  <h3 className="mb-2 text-[11px] font-bold tracking-[0.18em] text-muted-foreground uppercase">
                    Styles
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {filteredTemplates.map((t) => {
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
                              <UserRound className="w-10 h-10 text-muted-foreground/30" />
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
                    onClick={generateHeadshot}
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
                Crafting your headshot…
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
                    a.download = "headshot.png";
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

export default HeadshotPage;
