import { useState, useRef } from "react";
import { useToolSeo } from "@/hooks/useToolSeo";
import MediaToolLanding from "@/components/media/MediaToolLanding";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Upload, Sparkles, Download, Share2, RefreshCw, Users, Loader2, Wand2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCredits } from "@/hooks/useCredits";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToolTemplates } from "@/hooks/useToolTemplates";
import characterSwapHero from "@/assets/character-swap-hero.webp";

type Stage = "landing" | "compose" | "generating" | "result";
type Gender = "non-binary" | "male" | "female";

const GRADIENT_BORDER =
  "rounded-[26px] p-[1.5px] bg-gradient-to-br from-primary/80 via-fuchsia-500/60 to-orange-400/70 shadow-[0_0_30px_-10px_hsl(var(--primary)/0.6)]";

const GENDERS: { id: Gender; label: string }[] = [
  { id: "non-binary", label: "Auto" },
  { id: "male", label: "Male" },
  { id: "female", label: "Female" },
];

const CharacterSwapPage = () => {
  useToolSeo("character-studio");
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { hasEnoughCredits } = useCredits();
  const { templates } = useToolTemplates("character-swap");
  const [stage, setStage] = useState<Stage>("landing");
  const [faceImage, setFaceImage] = useState<string | null>(null);
  const [targetImage, setTargetImage] = useState<string | null>(null);
  
  const [gender, setGender] = useState<Gender>("non-binary");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const faceInputRef = useRef<HTMLInputElement>(null);
  const targetInputRef = useRef<HTMLInputElement>(null);

  const readFile = (file: File, cb: (dataUrl: string) => void) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => cb(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleFaceUpload = (file: File) => {
    readFile(file, (url) => {
      setFaceImage(url);
      setStage("compose");
      setResultUrl(null);
    });
  };

  const handleGenerate = async () => {
    if (!faceImage) { toast.error("Upload your face first"); return; }
    if (!targetImage) {
      toast.error("Pick a character to swap into");
      return;
    }
    if (!hasEnoughCredits(0.5)) {
      toast.error("Insufficient MC");
      navigate("/pricing");
      return;
    }
    setStage("generating");
    try {
      const { data, error } = await supabase.functions.invoke("image-tools", {
        body: {
          tool: "character-swap",
          image: faceImage,
          target: targetImage,
          gender,
        },
      });
      if (error) throw error;
      const url = data?.url;
      if (!url) throw new Error(data?.error || "No image generated");
      setResultUrl(url);
      setStage("result");
      toast.success("Character swapped!");
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
      title="Character Swap"
      headline="Become any"
      accent="character."
      description={`Upload your face, pick a character, swap identities cinematically.`}
      heroImage={characterSwapHero}
      cost={0.5}
      accept="image/*"
      resultType="image"
      onFileSelected={handleFaceUpload}
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
              <div className="font-sora text-sm font-semibold text-ink leading-tight">Character Studio</div>
              
            </div>
          </div>
          {resultUrl && (
            <a
              href={resultUrl}
              download="character-swap.png"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-ink text-paper text-sm font-sora font-semibold hover:bg-ink/90 transition"
            >
              <Download className="w-4 h-4" /> Download
            </a>
          )}
        </header>

        <div className="flex-1 min-h-0 grid grid-cols-[1fr_420px]">
          {/* hidden inputs */}
          <input
            ref={faceInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFaceUpload(e.target.files[0])}
          />
          <input
            ref={targetInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) readFile(f, setTargetImage);
              e.target.value = "";
            }}
          />

          {/* LEFT — gallery / stage */}
          <main className="relative overflow-y-auto p-8">
            {stage === "compose" && (
              <>
                <div className="flex items-end justify-between mb-5">
                  <div>
                    <h2 className="font-sora text-2xl font-semibold text-ink leading-tight">
                      Choose who you'd like to become
                    </h2>
                  </div>
                  <button
                    onClick={() => targetInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 rounded-full border border-ink/15 hover:border-ink/40 hover:bg-ink/[0.04] transition text-xs font-sora font-semibold text-ink/80"
                  >
                    <Upload className="w-3.5 h-3.5" /> Upload custom
                  </button>
                </div>

                {templates.length > 0 ? (
                  <div className="grid grid-cols-3 xl:grid-cols-4 gap-3">
                    {templates.map((t) => {
                      const url = t.preview_url;
                      if (!url) return null;
                      const selected = targetImage === url;
                      return (
                        <button
                          key={t.id}
                          onClick={() => setTargetImage(url)}
                          className={`group relative aspect-[4/5] rounded-2xl overflow-hidden border-2 transition ${
                            selected
                              ? "border-ink ring-2 ring-ink/20 shadow-[0_20px_40px_-20px_rgba(0,0,0,0.4)]"
                              : "border-ink/10 hover:border-ink/40 hover:-translate-y-0.5"
                          }`}
                        >
                          <img
                            src={url}
                            alt={t.name ?? ""}
                            className="absolute inset-0 w-full h-full object-cover transition group-hover:scale-105"
                          />
                          {t.name && (
                            <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
                              <div className="font-sora text-[11px] font-semibold text-white truncate">
                                {t.name}
                              </div>
                            </div>
                          )}
                          {selected && (
                            <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-ink text-paper flex items-center justify-center text-[10px] font-bold">
                              ✓
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-ink/15 p-12 text-center text-ink/40 font-manrope text-sm">
                    No preset characters — upload your own or describe one in the prompt.
                  </div>
                )}
              </>
            )}

            {stage === "generating" && (
              <div className="h-full flex items-center justify-center">
                <div className="relative w-full max-w-[480px] aspect-[4/5] rounded-3xl bg-white border border-ink/10 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.25)] overflow-hidden">
                  {targetImage ? (
                    <img src={targetImage} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60 blur-sm" />
                  ) : faceImage ? (
                    <img src={faceImage} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60 blur-sm" />
                  ) : null}
                  <motion.div
                    initial={{ y: "-100%" }}
                    animate={{ y: "260%" }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-x-0 h-1/2 pointer-events-none bg-gradient-to-b from-transparent via-primary/40 to-transparent blur-md"
                  />
                  <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2 text-ink/70 font-manrope text-xs bg-paper/95 backdrop-blur px-4 py-2 rounded-full border border-ink/10 shadow-sm">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Swapping identities…
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
                  alt="Result"
                  className="max-h-[75vh] w-auto rounded-3xl shadow-[0_40px_80px_-30px_rgba(0,0,0,0.4)] border border-ink/10"
                />
                <button
                  onClick={() => { setStage("compose"); setResultUrl(null); }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-paper border border-ink/15 text-xs font-manrope text-ink/70 hover:text-ink hover:border-ink/40 transition shadow-sm"
                >
                  <RefreshCw className="w-3 h-3" /> Try another
                </button>
              </div>
            )}
          </main>

          {/* RIGHT — controls */}
          <aside className="border-l border-ink/10 bg-ink/[0.02] flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Source face */}
              <div>
                

                <button
                  onClick={() => faceInputRef.current?.click()}
                  className="w-full aspect-[4/5] rounded-2xl bg-white border border-ink/10 hover:border-ink/30 transition overflow-hidden relative group"
                >
                  {faceImage ? (
                    <>
                      <img src={faceImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition bg-ink/40 flex items-center justify-center">
                        <div className="flex items-center gap-1.5 text-paper font-manrope text-xs">
                          <RefreshCw className="w-3 h-3" /> Change
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-ink/40 group-hover:text-ink/70 transition">
                      <Upload className="w-5 h-5" />
                      <span className="font-manrope text-xs">Upload face</span>
                    </div>
                  )}
                </button>
              </div>

              {/* Selected character */}
              {targetImage && (
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink/40 mb-2">
                    Selected character
                  </div>
                  <div className="flex items-center gap-3 p-2 rounded-xl bg-paper border border-ink/10">
                    <img src={targetImage} alt="" className="w-12 h-14 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <div className="font-sora text-sm font-semibold text-ink truncate">Ready to swap</div>
                      <div className="font-manrope text-[11px] text-ink/40">From gallery / upload</div>
                    </div>
                    <button
                      onClick={() => setTargetImage(null)}
                      className="text-ink/30 hover:text-ink transition text-xs font-manrope"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* Sticky footer */}
            <div className="p-6 pt-3 border-t border-ink/10 bg-paper/60 backdrop-blur space-y-2">
              <button
                disabled={!faceImage || !targetImage || stage === "generating"}

                onClick={handleGenerate}
                className="w-full py-3.5 rounded-full bg-ink text-paper font-sora font-semibold text-sm flex items-center justify-between px-5 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-ink/90 transition"
              >
                <span className="flex items-center gap-2">
                  {stage === "generating" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                  {stage === "generating" ? "Swapping…" : "Swap character"}
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
                  <img src={characterSwapHero} alt="Character Studio" className="absolute inset-0 w-full h-full object-cover" />
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
                  Become any <span className="text-primary">character.</span>
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Upload your face, pick a character, swap identities cinematically.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.5 }}
                className="mt-6"
              >
                <input
                  ref={faceInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => { if (e.target.files?.[0]) handleFaceUpload(e.target.files[0]); }}
                />
                <div className={GRADIENT_BORDER}>
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    transition={{ type: "spring", stiffness: 400, damping: 22 }}
                    onClick={() => faceInputRef.current?.click()}
                    className="w-full bg-background rounded-[24px] py-4 flex items-center justify-center gap-2 text-foreground font-semibold text-sm"
                  >
                    <Upload className="w-4 h-4" /> Upload Your Face
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* ─── COMPOSE ─── */}
          {stage === "compose" && faceImage && (
            <motion.div
              key="compose"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 flex flex-col"
            >
              <div className="flex-1 overflow-y-auto px-4 pt-[calc(env(safe-area-inset-top)+4rem)] pb-[180px]">
                {/* Face + Target preview row */}
                <div className="max-w-sm mx-auto grid grid-cols-2 gap-3 mb-5">
                  {/* Face */}
                  <div className={`${GRADIENT_BORDER}`}>
                    <div className="relative rounded-[24px] overflow-hidden aspect-[4/5] bg-muted">
                      <img src={faceImage} alt="Your face" className="absolute inset-0 w-full h-full object-cover" />
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-background/70 backdrop-blur-md text-foreground">YOU</div>
                      <button
                        onClick={() => faceInputRef.current?.click()}
                        className="absolute bottom-2 right-2 w-7 h-7 flex items-center justify-center rounded-full bg-background/70 backdrop-blur-md border border-border/40 text-foreground"
                      >
                        <RefreshCw className="w-3 h-3" />
                      </button>
                      <input
                        ref={faceInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => { if (e.target.files?.[0]) handleFaceUpload(e.target.files[0]); }}
                      />
                    </div>
                  </div>

                  {/* Target */}
                  <div className={`${GRADIENT_BORDER}`}>
                    <div className="relative rounded-[24px] overflow-hidden aspect-[4/5] bg-muted">
                      {targetImage ? (
                        <>
                          <img src={targetImage} alt="Target character" className="absolute inset-0 w-full h-full object-cover" />
                          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-background/70 backdrop-blur-md text-foreground">CHARACTER</div>
                          <button
                            onClick={() => targetInputRef.current?.click()}
                            className="absolute bottom-2 right-2 w-7 h-7 flex items-center justify-center rounded-full bg-background/70 backdrop-blur-md border border-border/40 text-foreground"
                          >
                            <RefreshCw className="w-3 h-3" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => targetInputRef.current?.click()}
                          className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground"
                        >
                          <Users className="w-7 h-7" />
                          <span className="text-[11px] font-semibold">Pick character</span>
                        </button>
                      )}
                      <input
                        ref={targetInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) readFile(f, setTargetImage);
                          e.target.value = "";
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="max-w-sm mx-auto">
                  <h3 className="mb-2 text-[11px] font-bold tracking-[0.18em] text-muted-foreground uppercase">Gender hint</h3>
                  <div className="grid grid-cols-3 gap-2 mb-5">
                    {GENDERS.map((g) => (
                      <button
                        key={g.id}
                        onClick={() => setGender(g.id)}
                        className={`px-2 py-2.5 rounded-2xl text-xs font-semibold border transition ${
                          gender === g.id
                            ? "border-primary bg-primary/15 text-foreground ring-2 ring-primary/40"
                            : "border-border/40 bg-card text-muted-foreground"
                        }`}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>

                  {templates.length > 0 && (
                    <>
                      <h3 className="mb-2 text-[11px] font-bold tracking-[0.18em] text-muted-foreground uppercase">Character templates</h3>
                      <div className="grid grid-cols-3 gap-2">
                        {templates.map((t) => {
                          const url = t.preview_url;
                          if (!url) return null;
                          const selected = targetImage === url;
                          return (
                            <button
                              key={t.id}
                              onClick={() => setTargetImage(url)}
                              className={`relative aspect-[4/5] rounded-2xl overflow-hidden border transition ${
                                selected ? "border-primary ring-2 ring-primary/40" : "border-border/40"
                              }`}
                            >
                              <img src={url} alt={t.name ?? ""} className="absolute inset-0 w-full h-full object-cover" />
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
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
                  disabled={!targetImage}
                  className="w-full rounded-[26px] py-4 flex items-center justify-center gap-2 text-white font-semibold text-sm bg-primary/35 backdrop-blur-2xl backdrop-saturate-200 border border-primary/40 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25),0_10px_30px_-8px_hsl(var(--primary)/0.55)] disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" /> Swap · 0.5 MC
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
              <div className="relative w-full max-w-xs grid grid-cols-2 gap-3">
                {[faceImage, targetImage].map((src, i) =>
                  src ? (
                    <div key={i} className={`${GRADIENT_BORDER}`}>
                      <div className="relative rounded-[24px] overflow-hidden aspect-[4/5] bg-muted">
                        <img src={src} alt="" className="absolute inset-0 w-full h-full object-cover" />
                        <motion.div
                          initial={{ y: "-100%" }}
                          animate={{ y: "260%" }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear", delay: i * 0.3 }}
                          className="absolute inset-x-0 h-1/2 pointer-events-none bg-gradient-to-b from-transparent via-primary/50 to-transparent blur-md"
                        />
                      </div>
                    </div>
                  ) : null
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="w-4 h-4" /> Swapping identities…
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
                    a.download = "character-swap.png";
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
                <Users className="w-4 h-4" /> Try Another Character
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CharacterSwapPage;
