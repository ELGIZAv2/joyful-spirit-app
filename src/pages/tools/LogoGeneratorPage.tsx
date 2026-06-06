import { useState } from "react";
import { useToolSeo } from "@/hooks/useToolSeo";
import MediaToolLanding from "@/components/media/MediaToolLanding";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Download, RotateCcw, Share2, Loader2, Wand2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCredits } from "@/hooks/useCredits";
import { useIsMobile } from "@/hooks/use-mobile";
import logoHero from "@/assets/logo-generator-hero.webp";

type Stage = "landing" | "compose" | "generating" | "result";

const GRADIENT_BORDER =
  "rounded-[26px] p-[1.5px] bg-gradient-to-br from-primary/80 via-fuchsia-500/60 to-orange-400/70 shadow-[0_0_30px_-10px_hsl(var(--primary)/0.6)]";

const STYLES: { id: string; label: string; desc: string; prompt: string }[] = [
  { id: "minimal", label: "Minimal", desc: "Clean & simple", prompt: "Clean lines, minimal elements, modern sans-serif typography" },
  { id: "bold", label: "Bold", desc: "Strong & impactful", prompt: "Strong typography, bold shapes, high contrast colors" },
  { id: "vintage", label: "Vintage", desc: "Retro & classic", prompt: "Retro typography, worn textures, classic color palette" },
  { id: "tech", label: "Tech", desc: "Modern & digital", prompt: "Geometric shapes, gradient colors, modern futuristic font" },
  { id: "playful", label: "Playful", desc: "Fun & creative", prompt: "Rounded shapes, vibrant colors, fun typography" },
  { id: "luxury", label: "Luxury", desc: "Premium & elegant", prompt: "Gold accents, serif font, premium sophisticated aesthetic" },
  { id: "monogram", label: "Monogram", desc: "Initials mark", prompt: "Elegant monogram emblem, intertwined letterforms, balanced symmetry" },
  { id: "mascot", label: "Mascot", desc: "Character logo", prompt: "Friendly mascot character, illustrative style, expressive features" },
  { id: "abstract", label: "Abstract", desc: "Symbolic mark", prompt: "Abstract geometric mark, conceptual symbol, balanced negative space" },
];

const LogoGeneratorPage = () => {
  useToolSeo("logo-generator");
  const navigate = useNavigate();
  const { hasEnoughCredits } = useCredits();
  const isMobile = useIsMobile();
  const [stage, setStage] = useState<Stage>("landing");
  const [brandName, setBrandName] = useState("");
  const [styleId, setStyleId] = useState(STYLES[0].id);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!brandName.trim()) {
      toast.error("Enter your brand name");
      return;
    }
    if (!hasEnoughCredits(2)) {
      toast.error("Insufficient MC");
      navigate("/pricing");
      return;
    }
    const style = STYLES.find((s) => s.id === styleId)!;
    const prompt = `Design a professional logo for a brand called "${brandName.trim()}". Style direction: ${style.prompt}. White background, vector-style, scalable. Do NOT write the style name or any label text below or around the logo. The logo should contain ONLY the brand name "${brandName.trim()}" stylized as a logo.`;

    setStage("generating");
    try {
      const { data, error } = await supabase.functions.invoke("image-tools", {
        body: { tool: "logo-generator", prompt },
      });
      if (error) throw error;
      const url = data?.url;
      if (!url) throw new Error(data?.error || "No image generated");
      setResultUrl(url);
      setStage("result");
      toast.success("Logo created!");
    } catch (e: any) {
      toast.error(e.message || "Generation failed");
      setStage("compose");
    }
  };

  const reset = () => {
    setResultUrl(null);
    setStage("compose");
  };

  const download = () => {
    if (!resultUrl) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = `logo-${Date.now()}.png`;
    a.target = "_blank";
    a.click();
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
      title="Logo Generator"
      headline="Brand it"
      accent="in seconds."
      description={`Type a name, pick a vibe, ship a logo.`}
      heroImage={logoHero}
      cost={2}
      accept="image/*"
      resultType="image"
      primaryAction={{ label: "Start", onClick: () => setStage("compose") }}
    />

    );

  }


  // ─────────── DESKTOP STUDIO ───────────
  if (!isMobile) {
    const activeStyle = STYLES.find((s) => s.id === styleId)!;
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
              <div className="font-sora text-sm font-semibold text-ink leading-tight">Logo Studio</div>
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink/40">Brand mark</div>
            </div>
          </div>
          {resultUrl && (
            <button
              onClick={download}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-ink text-paper text-sm font-sora font-semibold hover:bg-ink/90 transition"
            >
              <Download className="w-4 h-4" /> Download
            </button>
          )}
        </header>

        <div className="flex-1 min-h-0 grid grid-cols-[1fr_360px]">
          {/* CENTER — single hero canvas */}
          <main className="relative overflow-hidden bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary)/0.06),_transparent_60%)] flex items-center justify-center p-10">
            <div className="relative w-full max-w-[680px] aspect-square rounded-3xl bg-white border border-ink/10 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.25)] overflow-hidden">
              <AnimatePresence mode="wait">
                {(stage === "compose" || (stage as string) === "landing") && !resultUrl && (
                  <motion.div
                    key="d-canvas"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center p-16"
                  >
                    <div className="font-display text-6xl xl:text-7xl text-ink/85 tracking-tight text-center break-words leading-[0.95]">
                      {brandName || "Your Brand"}
                    </div>
                  </motion.div>
                )}
                {stage === "generating" && (
                  <motion.div
                    key="d-gen"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <div className="font-display text-6xl xl:text-7xl text-ink/30 tracking-tight text-center px-16 break-words leading-[0.95]">
                      {brandName || "Your Brand"}
                    </div>
                    <motion.div
                      initial={{ y: "-100%" }}
                      animate={{ y: "260%" }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-x-0 h-1/2 pointer-events-none bg-gradient-to-b from-transparent via-primary/30 to-transparent blur-md"
                    />
                    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2 text-ink/70 font-manrope text-xs bg-paper/95 backdrop-blur px-4 py-2 rounded-full border border-ink/10 shadow-sm">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Crafting your brand mark…
                    </div>
                  </motion.div>
                )}
                {stage === "result" && resultUrl && (
                  <motion.img
                    key="d-result"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    src={resultUrl}
                    alt="Logo"
                    className="absolute inset-0 w-full h-full object-contain p-8"
                  />
                )}
              </AnimatePresence>

              {/* Style label tag */}
              <div className="absolute bottom-4 right-4 px-2.5 py-1 rounded-full bg-ink/5 border border-ink/10 text-[10px] font-mono uppercase tracking-[0.25em] text-ink/50">
                {activeStyle.label}
              </div>

              {/* Top-right reset when result */}
              {resultUrl && stage === "result" && (
                <button
                  onClick={reset}
                  className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-paper/95 backdrop-blur border border-ink/10 text-xs font-manrope text-ink/70 hover:text-ink hover:border-ink/30 transition shadow-sm"
                >
                  <RotateCcw className="w-3 h-3" /> Try again
                </button>
              )}
            </div>
          </main>

          {/* RIGHT — controls */}
          <aside className="border-l border-ink/10 bg-ink/[0.02] flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink/40 mb-2">Brand name</div>
                <input
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="e.g. Lumen, Northwave…"
                  className="w-full px-4 py-3 rounded-xl bg-paper border border-ink/15 text-base font-sora text-ink placeholder:text-ink/30 focus:outline-none focus:border-ink/40 transition"
                />
              </div>

              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink/40 mb-2">Style · {activeStyle.label}</div>
                <div className="grid grid-cols-2 gap-2">
                  {STYLES.map((s) => {
                    const active = styleId === s.id;
                    return (
                      <button
                        key={s.id}
                        onClick={() => setStyleId(s.id)}
                        className={`px-3 py-3 rounded-xl text-left border transition ${
                          active
                            ? "border-ink bg-ink text-paper"
                            : "border-ink/10 bg-paper hover:border-ink/30 text-ink"
                        }`}
                      >
                        <div className="font-sora text-sm font-semibold">{s.label}</div>
                        <div className={`text-[10px] mt-0.5 font-manrope ${active ? "text-paper/60" : "text-ink/40"}`}>
                          {s.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Sticky footer */}
            <div className="p-6 pt-3 border-t border-ink/10 bg-paper/60 backdrop-blur space-y-2">
              <button
                disabled={!brandName.trim() || stage === "generating"}
                onClick={handleGenerate}
                className="w-full py-3.5 rounded-full bg-ink text-paper font-sora font-semibold text-sm flex items-center justify-between px-5 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-ink/90 transition"
              >
                <span className="flex items-center gap-2">
                  {stage === "generating" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                  {stage === "generating" ? "Generating…" : "Generate Logo"}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-paper/15 text-paper text-[10px] font-mono tracking-wider">
                  2 MC
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
          else if (stage === "compose") setStage("landing");
          else reset();
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
                  <img src={logoHero} alt="AI Logo Generator" className="absolute inset-0 w-full h-full object-cover" />
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
                  Brand it <span className="text-primary">in seconds.</span>
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Type a name, pick a vibe, ship a logo.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.5 }}
                className="mt-6"
              >
                <div className={GRADIENT_BORDER}>
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    transition={{ type: "spring", stiffness: 400, damping: 22 }}
                    onClick={() => setStage("compose")}
                    className="w-full bg-background rounded-[24px] py-4 flex items-center justify-center text-foreground font-semibold text-sm"
                  >
                    Start Designing
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* ─── COMPOSE ─── */}
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
                <div className={`${GRADIENT_BORDER} mx-auto w-full max-w-sm mb-5`}>
                  <div className="relative rounded-[24px] overflow-hidden aspect-[4/5] bg-muted">
                    <img src={logoHero} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/10 to-transparent" />
                  </div>
                </div>

                <div className="max-w-sm mx-auto rounded-[28px] p-4 bg-white/5 backdrop-blur-2xl backdrop-saturate-200 border border-white/15 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.18),0_20px_60px_-20px_rgba(0,0,0,0.55)]">
                  <h3 className="mb-2 text-[11px] font-bold tracking-[0.18em] text-muted-foreground uppercase">Brand Name</h3>
                  <input
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="e.g. Lumen, Northwave…"
                    className="w-full mb-5 px-4 py-3 rounded-2xl bg-white/5 backdrop-blur-xl backdrop-saturate-200 border border-white/15 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/50 focus:bg-white/10 transition shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)]"
                  />

                  <h3 className="mb-2 text-[11px] font-bold tracking-[0.18em] text-muted-foreground uppercase">Style</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {STYLES.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setStyleId(s.id)}
                        className={`px-2 py-3 rounded-2xl text-xs font-semibold backdrop-blur-xl backdrop-saturate-200 border transition shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15)] ${
                          styleId === s.id
                            ? "border-primary/60 bg-primary/25 text-foreground ring-1 ring-primary/40"
                            : "border-white/15 bg-white/5 text-muted-foreground hover:bg-white/10"
                        }`}
                      >
                        <div>{s.label}</div>
                        <div className="text-[9px] opacity-60 font-normal mt-0.5">{s.desc}</div>
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
                  className="w-full rounded-[26px] py-4 flex items-center justify-center text-white font-semibold text-sm bg-primary/35 backdrop-blur-2xl backdrop-saturate-200 border border-primary/40 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25),0_10px_30px_-8px_hsl(var(--primary)/0.55)]"
                >
                  Generate Logo · 2 MC
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
              <div className={`${GRADIENT_BORDER} w-full max-w-xs`}>
                <div className="relative rounded-[24px] overflow-hidden aspect-square bg-white flex items-center justify-center">
                  <div className="font-display text-3xl text-foreground/70 tracking-tight px-4 text-center">
                    {brandName || "Your Brand"}
                  </div>
                  <motion.div
                    initial={{ y: "-100%" }}
                    animate={{ y: "260%" }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-x-0 h-1/2 pointer-events-none bg-gradient-to-b from-transparent via-primary/50 to-transparent blur-md"
                  />
                </div>
              </div>
              <div className="text-sm text-muted-foreground">Crafting your brand mark…</div>
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
                <div className="relative w-full h-full rounded-[24px] overflow-hidden bg-white">
                  <img src={resultUrl} alt="Logo" className="absolute inset-0 w-full h-full object-contain" />
                </div>
              </div>
              <div className="mt-4 max-w-sm mx-auto w-full flex gap-3">
                <button
                  onClick={download}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm"
                >
                  <Download className="w-4 h-4" /> Download
                </button>
                <button
                  onClick={handleShare}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-foreground/5 border border-border/40 text-foreground font-semibold text-sm"
                >
                  <Share2 className="w-4 h-4" /> Share
                </button>
              </div>
              <button
                onClick={reset}
                className="mt-3 max-w-sm mx-auto w-full py-3 rounded-2xl bg-foreground/5 border border-border/30 text-foreground text-sm font-medium flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" /> Try Another Style
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default LogoGeneratorPage;
