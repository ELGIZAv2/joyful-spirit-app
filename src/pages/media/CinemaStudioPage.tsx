// Cinema Studio — "Sinema Fakhm" redesign.
// User-facing: 6 cinematic vocabulary rows (Style, Shot, Movement, Light, Grade, Mood)
// plus 3 quality tiers (Draft / Cinema / Master). Model names are hidden — quality
// tier silently maps to a backend model. No technical jargon exposed.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useCredits } from "@/hooks/useCredits";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/layouts/AppLayout";

// ─── Vocabulary ─────────────────────────────────────────────────────────────

type Row = { key: string; label: string; chips: { id: string; label: string; prompt: string }[] };

const VOCAB: Row[] = [
  {
    key: "style", label: "Style",
    chips: [
      { id: "noir", label: "Noir", prompt: "film noir, deep shadows, high contrast monochrome" },
      { id: "cyber", label: "Cyber", prompt: "cyberpunk, neon-soaked night, futuristic city" },
      { id: "realism", label: "Realism", prompt: "photoreal, natural skin tones, documentary realism" },
      { id: "retro", label: "Retro", prompt: "70s analog film grain, faded color, vintage cinematography" },
      { id: "epic", label: "Epic", prompt: "epic cinematic blockbuster, grand scale, IMAX look" },
      { id: "dream", label: "Dream", prompt: "dreamlike, soft focus, ethereal hazy atmosphere" },
    ],
  },
  {
    key: "shot", label: "Shot",
    chips: [
      { id: "wide", label: "Wide", prompt: "wide establishing shot, expansive composition" },
      { id: "close", label: "Close Up", prompt: "intimate close-up, shallow depth of field" },
      { id: "pov", label: "POV", prompt: "first person POV shot" },
      { id: "low", label: "Low Angle", prompt: "dramatic low angle hero shot" },
      { id: "aerial", label: "Aerial", prompt: "aerial drone shot from above" },
      { id: "medium", label: "Medium", prompt: "medium two-shot, balanced framing" },
    ],
  },
  {
    key: "movement", label: "Movement",
    chips: [
      { id: "static", label: "Static", prompt: "locked tripod, no camera movement" },
      { id: "pan", label: "Pan", prompt: "smooth pan across the scene" },
      { id: "dolly", label: "Dolly In", prompt: "slow dolly push-in toward subject" },
      { id: "tracking", label: "Tracking", prompt: "tracking shot following the subject" },
      { id: "handheld", label: "Handheld", prompt: "handheld, subtle natural shake" },
      { id: "crane", label: "Crane", prompt: "sweeping crane reveal" },
    ],
  },
  {
    key: "light", label: "Light",
    chips: [
      { id: "golden", label: "Golden Hour", prompt: "warm golden hour sunlight, long shadows" },
      { id: "moon", label: "Moonlight", prompt: "cool blue moonlight, soft ambient night" },
      { id: "neon", label: "Neon", prompt: "vibrant neon practical lights, magenta and cyan" },
      { id: "studio", label: "Studio", prompt: "controlled studio key light, soft fill" },
      { id: "window", label: "Window Light", prompt: "soft natural window light, gentle falloff" },
      { id: "candle", label: "Candle", prompt: "warm flickering candlelight, intimate mood" },
    ],
  },
  {
    key: "grade", label: "Grade",
    chips: [
      { id: "teal-orange", label: "Teal & Orange", prompt: "teal and orange color grade, blockbuster look" },
      { id: "vintage", label: "Vintage", prompt: "faded vintage color grade, lifted blacks" },
      { id: "bw", label: "Black & White", prompt: "rich black and white, deep contrast" },
      { id: "pastel", label: "Pastel", prompt: "soft pastel grade, dreamy desaturation" },
      { id: "moody", label: "Moody", prompt: "moody desaturated grade, crushed shadows" },
      { id: "bleach", label: "Bleach", prompt: "bleach bypass, harsh contrast, silvery highlights" },
    ],
  },
  {
    key: "mood", label: "Mood",
    chips: [
      { id: "tense", label: "Tense", prompt: "tense suspenseful atmosphere" },
      { id: "dreamy", label: "Dreamy", prompt: "dreamy poetic mood" },
      { id: "hopeful", label: "Hopeful", prompt: "uplifting hopeful tone" },
      { id: "melancholic", label: "Melancholic", prompt: "melancholic somber mood" },
      { id: "playful", label: "Playful", prompt: "playful energetic vibe" },
      { id: "mysterious", label: "Mysterious", prompt: "mysterious enigmatic atmosphere" },
    ],
  },
];

const ASPECT_RATIOS = ["16:9", "9:16", "1:1"] as const;
const DURATIONS = [5, 10] as const;

// Quality tiers map silently to a backend model. The user never sees this.
const QUALITY = {
  Draft:  { slug: "seedance-2-0-fast", credits: "~5",  blurb: "Fastest for quick tests" },
  Cinema: { slug: "kling-3-0",         credits: "~10", blurb: "Balanced cinematic quality" },
  Master: { slug: "veo-3-1",           credits: "~40", blurb: "Best quality (start image required)" },
} as const;
type QualityTier = keyof typeof QUALITY;

interface Selections {
  prompt: string;
  aspect: typeof ASPECT_RATIOS[number];
  duration: typeof DURATIONS[number];
  tier: QualityTier;
  chips: Record<string, string | null>; // row.key -> chip.id
}

interface HistoryEntry {
  url: string;
  timestamp: number;
  prompt: string;
  aspect: string;
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

function buildPrompt(sel: Selections): string {
  const parts: string[] = [sel.prompt.trim()];
  for (const row of VOCAB) {
    const id = sel.chips[row.key];
    if (!id) continue;
    const chip = row.chips.find((c) => c.id === id);
    if (chip) parts.push(chip.prompt);
  }
  parts.push("cinematic, smooth motion, high dynamic range");
  return parts.filter(Boolean).join(", ");
}

const PERSIST_KEY = "hg_cinema_studio_v2";

export default function CinemaStudioPage() {
  const navigate = useNavigate();
  const { userId, hasEnoughCredits, refreshCredits } = useCredits();

  const initialChips: Record<string, string | null> = Object.fromEntries(
    VOCAB.map((r) => [r.key, null]),
  );

  const [sel, setSel] = useState<Selections>({
    prompt: "",
    aspect: "16:9",
    duration: 5,
    tier: "Cinema",
    chips: initialChips,
  });
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [fullscreenUrl, setFullscreenUrl] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  // Persistence
  useEffect(() => {
    try {
      const raw = localStorage.getItem(PERSIST_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d.sel) setSel({ ...d.sel, chips: { ...initialChips, ...(d.sel.chips || {}) } });
        if (d.history) setHistory(d.history);
      }
    } catch { /* noop */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      try { localStorage.setItem(PERSIST_KEY, JSON.stringify({ sel, history })); } catch { /* noop */ }
    }, 400);
    return () => clearTimeout(t);
  }, [sel, history]);

  const toggleChip = (rowKey: string, chipId: string) => {
    setSel((p) => ({
      ...p,
      chips: { ...p.chips, [rowKey]: p.chips[rowKey] === chipId ? null : chipId },
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      setUploadedImage(dataUrl);
    } catch {
      toast.error("Image upload failed");
    } finally {
      setIsUploading(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  const handleGenerate = useCallback(async () => {
    if (!sel.prompt.trim() || isGenerating) return;
    const tier = QUALITY[sel.tier];
    const COST_GUESS = sel.tier === "Master" ? 40 : sel.tier === "Cinema" ? 10 : 5;
    if (userId && !hasEnoughCredits(COST_GUESS)) {
      toast.error("Insufficient credits");
      return;
    }
    // Master tier (Veo) requires a starting image
    if (sel.tier === "Master" && !uploadedImage) {
      toast.error("Master quality requires a start image");
      return;
    }
    setIsGenerating(true);
    const finalPrompt = buildPrompt(sel);
    try {
      const body: any = {
        prompt: finalPrompt,
        model_slug: tier.slug,
        aspect_ratio: sel.aspect,
        duration: sel.duration,
      };
      if (uploadedImage) {
        body.start_frame = uploadedImage;
        body.images = [uploadedImage];
      }
      const { data, error } = await supabase.functions.invoke("media-video", { body });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const url: string | undefined = data?.video_url;
      if (!url) throw new Error("No video returned");
      setHistory((prev) => [{
        url, timestamp: Date.now(), prompt: sel.prompt, aspect: sel.aspect,
      }, ...prev].slice(0, 50));
      refreshCredits();
      toast.success("Your shot is ready 🎬");
    } catch (e: any) {
      console.error(e);
      toast.error("Generation failed: " + (e?.message || "unknown"));
    } finally {
      setIsGenerating(false);
    }
  }, [sel, uploadedImage, isGenerating, userId, hasEnoughCredits, refreshCredits]);

  const canGenerate = !!sel.prompt.trim() && !isGenerating;

  return (
    <AppLayout>
      <div
        className="h-full w-full flex flex-col bg-background text-foreground font-sans overflow-hidden"
      >
        {/* Header */}
        <header className="pt-4 pb-3 px-5 flex justify-between items-center shrink-0">
          <button
            onClick={() => navigate("/media")}
            className="text-muted-foreground hover:text-foreground transition-colors text-xs uppercase tracking-[0.2em]"
            aria-label="Back"
          >
            Back
          </button>
          <span className="text-[11px] tracking-[0.25em] uppercase font-semibold text-foreground">
            Cinema
          </span>
          <span className="w-10" />
        </header>

        {/* Center stage — preview + history */}
        <div className="flex-1 overflow-y-auto px-5 py-6 flex flex-col items-center gap-6 no-scrollbar">
          {!uploadedImage && !history[0] && (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
              <h1 className="text-3xl font-bold tracking-tight">Cinema</h1>
              <p className="text-sm text-muted-foreground mt-2">Describe the scene you imagine, and optionally upload a starting image</p>
            </div>
          )}

          {(uploadedImage || history[0]) && (
            <div className="aspect-[2.39/1] w-full max-w-md bg-accent/40 rounded-2xl overflow-hidden relative border border-border">
              {uploadedImage ? (
                <img src={uploadedImage} alt="reference" className="w-full h-full object-cover" />
              ) : history[0] ? (
                <video src={history[0].url} muted loop playsInline autoPlay className="w-full h-full object-cover" />
              ) : null}
            </div>
          )}

          {history.length > 0 && (
            <div className="w-full max-w-md">
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 justify-center">
                {history.map((entry) => (
                  <button
                    key={entry.timestamp}
                    onClick={() => setFullscreenUrl(entry.url)}
                    className="w-24 aspect-video bg-black rounded-lg overflow-hidden border border-border shrink-0"
                  >
                    <video src={entry.url} muted loop playsInline autoPlay className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Unified bottom input — matches Image Studio */}
        <div className="relative z-10 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-background/80 backdrop-blur-xl shrink-0">
          <div className="rounded-2xl bg-accent/40 backdrop-blur-sm">
            {uploadedImage && (
              <div className="px-4 pt-4 relative inline-block">
                <img src={uploadedImage} alt="" className="h-16 w-16 object-cover rounded-xl" />
                <button
                  onClick={() => setUploadedImage(null)}
                  className="absolute -right-1 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[12px] leading-none"
                  aria-label="Remove"
                >
                  ×
                </button>
              </div>
            )}

            <div className="px-4 pt-4 pb-2">
              <textarea
                value={sel.prompt}
                onChange={(e) => setSel((p) => ({ ...p, prompt: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && (typeof window === 'undefined' || window.innerWidth >= 768)) {
                    e.preventDefault();
                    handleGenerate();
                  }
                }}
                placeholder="Describe the scene you imagine…"
                rows={2}
                className="min-h-[64px] w-full bg-transparent text-sm text-foreground outline-none resize-none placeholder:text-muted-foreground/40"
              />
            </div>

            <div className="flex items-center gap-2 px-4 pb-4 flex-wrap">
              <input
                ref={imageInputRef} type="file" accept="image/*"
                className="hidden" onChange={handleImageUpload}
              />
              <button
                onClick={() => imageInputRef.current?.click()}
                disabled={isUploading}
                className="flex shrink-0 items-center gap-1.5 rounded-full bg-accent/60 px-3 py-2 hover:bg-accent text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                {isUploading ? "Uploading…" : "Attach"}
              </button>

              <button
                onClick={() => setAdvancedOpen(true)}
                className="flex shrink-0 items-center gap-1.5 rounded-full bg-accent/60 px-3 py-2 hover:bg-accent text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                <span>{sel.tier} · {sel.aspect} · {sel.duration}s</span>
              </button>

              <div className="flex-1" />
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleGenerate}
                disabled={!canGenerate}
                className="shrink-0 rounded-xl bg-foreground px-6 py-2.5 text-xs font-semibold text-background transition-all disabled:opacity-30"
              >
                {isGenerating ? "Generating…" : "Send"}
              </motion.button>
            </div>
          </div>
        </div>

        {/* Advanced Options Sheet */}
        <AnimatePresence>
          {advancedOpen && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[90] bg-background/70 backdrop-blur-sm flex items-end sm:items-center justify-center"
              onClick={() => setAdvancedOpen(false)}
            >
              <motion.div
                initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
                className="w-full sm:max-w-md max-h-[85vh] bg-background border-t sm:border border-border sm:rounded-2xl rounded-t-2xl overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-border shrink-0">
                  <span className="text-xs uppercase tracking-[0.2em] font-bold text-foreground">Advanced options</span>
                  <button
                    onClick={() => setAdvancedOpen(false)}
                    className="text-muted-foreground hover:text-foreground text-xs"
                  >
                    Done
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5 no-scrollbar">
                  {/* Quality tier */}
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Quality</label>
                    <div className="flex bg-accent/40 p-1 rounded-full border border-border">
                      {(Object.keys(QUALITY) as QualityTier[]).map((t) => {
                        const active = sel.tier === t;
                        return (
                          <button
                            key={t}
                            onClick={() => setSel((p) => ({ ...p, tier: t }))}
                            className={`flex-1 py-1.5 text-[10px] uppercase tracking-wider font-bold transition-all rounded-full ${
                              active ? "bg-foreground text-background" : "text-muted-foreground"
                            }`}
                          >
                            {t}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-[10px] text-muted-foreground">{QUALITY[sel.tier].blurb} · {QUALITY[sel.tier].credits} credits</p>
                  </div>

                  {/* Format */}
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Aspect</label>
                    <div className="flex gap-2">
                      {ASPECT_RATIOS.map((ar) => (
                        <button
                          key={ar}
                          onClick={() => setSel((p) => ({ ...p, aspect: ar }))}
                          className={`flex-1 py-2 rounded-full text-xs font-semibold border ${
                            sel.aspect === ar ? "bg-foreground text-background border-foreground" : "bg-accent/40 border-border text-muted-foreground"
                          }`}
                        >
                          {ar}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Duration</label>
                    <div className="flex gap-2">
                      {DURATIONS.map((d) => (
                        <button
                          key={d}
                          onClick={() => setSel((p) => ({ ...p, duration: d }))}
                          className={`flex-1 py-2 rounded-full text-xs font-semibold border ${
                            sel.duration === d ? "bg-foreground text-background border-foreground" : "bg-accent/40 border-border text-muted-foreground"
                          }`}
                        >
                          {d}s
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Vocabulary rows */}
                  {VOCAB.map((row) => (
                    <div key={row.key} className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{row.label}</label>
                      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                        {row.chips.map((chip) => {
                          const active = sel.chips[row.key] === chip.id;
                          return (
                            <button
                              key={chip.id}
                              onClick={() => toggleChip(row.key, chip.id)}
                              className={`flex-shrink-0 px-4 py-2 rounded-full text-xs transition-all border ${
                                active
                                  ? "bg-foreground text-background font-medium border-foreground"
                                  : "bg-accent/40 border-border text-muted-foreground"
                              }`}
                            >
                              {chip.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Fullscreen preview */}
        <AnimatePresence>
          {fullscreenUrl && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-md p-4"
              onClick={() => setFullscreenUrl(null)}
            >
              <button
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-accent text-foreground flex items-center justify-center border border-border"
                onClick={(e) => { e.stopPropagation(); setFullscreenUrl(null); }}
              >
                ✕
              </button>
              <video
                src={fullscreenUrl} controls autoPlay loop playsInline
                className="max-w-full max-h-full rounded-2xl bg-black object-contain shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <style>{`
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>
      </div>
    </AppLayout>
  );
}