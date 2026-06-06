import { useState, useEffect, useRef } from "react";
import { useToolSeo } from "@/hooks/useToolSeo";
import MediaToolLanding from "@/components/media/MediaToolLanding";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, UserRound, Check, Upload, Download, Share2, RefreshCw, Loader2, Wand2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import faceMagicHero from "@/assets/face-magic-hero.webp";
import { toast } from "sonner";
import { useCredits } from "@/hooks/useCredits";
import { useIsMobile } from "@/hooks/use-mobile";

interface FaceTemplate {
  id: string;
  name: string;
  gender: string;
  preview_url: string | null;
}

type Stage = "landing" | "browse" | "generating" | "result";

const GRADIENT_BORDER =
  "rounded-[26px] p-[1.5px] bg-gradient-to-br from-primary/80 via-fuchsia-500/60 to-orange-400/70 shadow-[0_0_30px_-10px_hsl(var(--primary)/0.6)]";

const FaceSwapPage = () => {
  useToolSeo("portrait-studio");
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { hasEnoughCredits } = useCredits();
  const [stage, setStage] = useState<Stage>("landing");
  const [gender, setGender] = useState<"female" | "male">("female");
  const [templates, setTemplates] = useState<FaceTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<FaceTemplate | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase
      .from("tool_templates")
      .select("id,name,gender,preview_url")
      .eq("tool_id", "face-swap")
      .eq("is_active", true)
      .order("display_order")
      .then(({ data }) => {
        if (data && data.length > 0) setTemplates(data as FaceTemplate[]);
      });
  }, []);

  const filteredTemplates = templates.filter(
    (t) => t.gender === "both" || t.gender === gender || t.gender === "skip"
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

  const generate = async () => {
    if (!uploadedImage || !selectedTemplate?.preview_url) return;
    if (!hasEnoughCredits(0.5)) {
      toast.error("Insufficient MC");
      navigate("/pricing");
      return;
    }
    setStage("generating");
    try {
      const { data, error } = await supabase.functions.invoke("image-tools", {
        body: {
          tool: "face-swap",
          image: uploadedImage,
          target: selectedTemplate.preview_url,
          gender,
        },
      });
      if (error) throw error;
      const url = data?.url;
      if (!url) throw new Error(data?.error || "No image generated");
      setResultUrl(url);
      setStage("result");
      toast.success("Done!");
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
      title="Face Swap"
      headline="Face"
      accent="magic."
      description={`Upload one selfie, pick a scene, become anyone.`}
      heroImage={faceMagicHero}
      cost={0.5}
      accept="image/*"
      resultType="image"
      onFileSelected={handleFileUpload}
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
              onClick={() => navigate("/images")}
              className="flex items-center gap-2 font-manrope text-sm font-medium text-ink/70 hover:text-ink transition"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <div className="h-5 w-px bg-ink/15" />
            <div>
              <div className="font-sora text-sm font-semibold text-ink leading-tight">Face Studio</div>
            </div>
          </div>
          {resultUrl && (
            <a
              href={resultUrl}
              download="face-magic.png"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-ink text-paper text-sm font-sora font-semibold hover:bg-ink/90 transition"
            >
              <Download className="w-4 h-4" /> Download
            </a>
          )}
        </header>

        <div className="flex-1 min-h-0 grid grid-cols-[280px_1fr_360px]">
          {/* LEFT — selfie */}
          <aside className="border-r border-ink/10 bg-ink/[0.02] flex flex-col p-5 gap-4 overflow-y-auto">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
            />
            <div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-[4/5] rounded-2xl bg-white border border-ink/10 hover:border-ink/30 transition overflow-hidden relative group"
              >
                {uploadedImage ? (
                  <img src={uploadedImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-ink/40 group-hover:text-ink/70 transition">
                    <Upload className="w-5 h-5" />
                    <span className="font-manrope text-xs">Upload selfie</span>
                  </div>
                )}
              </button>
              {uploadedImage && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full mt-2 py-2 rounded-lg border border-ink/15 hover:border-ink/40 hover:bg-ink/[0.04] transition flex items-center justify-center gap-1.5 font-manrope text-xs text-ink/60"
                >
                  <RefreshCw className="w-3 h-3" /> Replace
                </button>
              )}
            </div>

            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink/40 mb-2">Gender hint</div>
              <div className="grid grid-cols-2 gap-2">
                {(["female", "male"] as const).map((g) => {
                  const active = gender === g;
                  return (
                    <button
                      key={g}
                      onClick={() => setGender(g)}
                      className={`px-2 py-2 rounded-xl text-xs font-sora font-semibold border transition capitalize ${
                        active
                          ? "border-ink bg-ink text-paper"
                          : "border-ink/10 bg-paper hover:border-ink/30 text-ink"
                      }`}
                    >
                      {g}
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* CENTER — preview */}
          <main className="relative overflow-hidden bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary)/0.06),_transparent_60%)] flex items-center justify-center p-10">
            <div className="relative w-full max-w-[520px] aspect-[4/5] rounded-3xl bg-white border border-ink/10 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.25)] overflow-hidden">
              <AnimatePresence mode="wait">
                {stage === "generating" && (
                  <motion.div key="d-gen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0">
                    {selectedTemplate?.preview_url && (
                      <img src={selectedTemplate.preview_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                    )}
                    <motion.div
                      initial={{ y: "-100%" }}
                      animate={{ y: "260%" }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-x-0 h-1/2 pointer-events-none bg-gradient-to-b from-transparent via-primary/30 to-transparent blur-md"
                    />
                    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2 text-ink/70 font-manrope text-xs bg-paper/95 backdrop-blur px-4 py-2 rounded-full border border-ink/10 shadow-sm">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Working the magic…
                    </div>
                  </motion.div>
                )}
                {stage === "result" && resultUrl && (
                  <motion.img key="d-result" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} src={resultUrl} alt="Result" className="absolute inset-0 w-full h-full object-cover" />
                )}
                {stage !== "generating" && !resultUrl && selectedTemplate?.preview_url && (
                  <motion.img key="d-scene" initial={{ opacity: 0 }} animate={{ opacity: 1 }} src={selectedTemplate.preview_url} alt="Scene" className="absolute inset-0 w-full h-full object-cover" />
                )}
                {stage !== "generating" && !resultUrl && !selectedTemplate && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-ink/40 p-8 text-center">
                    <UserRound className="w-11 h-11" />
                    <div className="font-sora font-semibold text-sm text-ink/70">Pick a scene</div>
                    <div className="font-manrope text-xs text-ink/40">Your selfie will land in the selected scene</div>
                  </div>
                )}
              </AnimatePresence>

              {resultUrl && stage === "result" && (
                <button
                  onClick={() => { setStage("browse"); setResultUrl(null); }}
                  className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-paper/95 backdrop-blur border border-ink/10 text-xs font-manrope text-ink/70 hover:text-ink hover:border-ink/30 transition shadow-sm"
                >
                  <RefreshCw className="w-3 h-3" /> Try another
                </button>
              )}
            </div>
          </main>

          {/* RIGHT — scene library */}
          <aside className="border-l border-ink/10 bg-ink/[0.02] flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink/40">Scenes</div>
              <div className="grid grid-cols-2 gap-2">
                {filteredTemplates.map((t) => {
                  const selected = selectedTemplate?.id === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTemplate(selected ? null : t)}
                      className={`relative aspect-[3/4] rounded-xl overflow-hidden border-2 transition ${
                        selected ? "border-ink ring-2 ring-ink/20" : "border-ink/10 hover:border-ink/30"
                      }`}
                    >
                      {t.preview_url ? (
                        <img src={t.preview_url} alt={t.name} className="absolute inset-0 w-full h-full object-cover" />
                      ) : (
                        <div className="absolute inset-0 bg-ink/5 flex items-center justify-center">
                          <UserRound className="w-8 h-8 text-ink/30" />
                        </div>
                      )}
                      {selected && (
                        <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-ink text-paper flex items-center justify-center shadow">
                          <Check className="w-3 h-3" strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-6 pt-3 border-t border-ink/10 bg-paper/60 backdrop-blur space-y-2">
              <button
                disabled={!uploadedImage || !selectedTemplate || stage === "generating"}
                onClick={generate}
                className="w-full py-3.5 rounded-full bg-ink text-paper font-sora font-semibold text-sm flex items-center justify-between px-5 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-ink/90 transition"
              >
                <span className="flex items-center gap-2">
                  {stage === "generating" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                  {stage === "generating" ? "Generating…" : "Generate"}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-paper/15 text-paper text-[10px] font-mono tracking-wider">
                  0.5 MC
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
              <motion.div
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 24, delay: 0.05 }}
                className={`${GRADIENT_BORDER} flex-1 max-h-[55vh]`}
              >
                <div className="relative w-full h-full rounded-[24px] overflow-hidden bg-muted">
                  <img
                    src={faceMagicHero}
                    alt="Face Magic"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
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
                  Face <span className="text-primary">magic.</span>
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Upload one selfie, pick a scene, become anyone.
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
                    Scenes
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
                              <UserRound className="w-11 h-11 text-muted-foreground/30" />
                            </div>
                          )}
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
                    onClick={generate}
                    className="w-full rounded-[26px] py-4 flex items-center justify-center text-white font-semibold text-sm bg-primary/35 backdrop-blur-2xl backdrop-saturate-200 border border-primary/40 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25),0_10px_30px_-8px_hsl(var(--primary)/0.55)]"
                  >
                    Generate · 0.5 MC
                  </motion.button>
                ) : (
                  <motion.button
                    disabled
                    className="w-full rounded-[26px] py-4 flex items-center justify-center text-foreground/70 font-semibold text-sm bg-white/10 dark:bg-white/[0.06] backdrop-blur-2xl backdrop-saturate-150 border border-white/15 dark:border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15),0_8px_24px_-8px_rgba(0,0,0,0.4)]"
                  >
                    Pick a scene
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
              <div className="text-sm text-muted-foreground">Working the magic…</div>
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
                    a.download = "face-magic.png";
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
                Try Another Scene
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default FaceSwapPage;
