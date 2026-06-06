import SEOHead from "@/components/common/SEOHead";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, ThumbsUp, Share2, ArrowLeft, Loader2, Plus, RefreshCw, Sliders } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCredits } from "@/hooks/useCredits";
import AppLayout from "@/layouts/AppLayout";
import { useFalVideoModels, type FalVideoModel, videoModelCreditsFor } from "@/hooks/useFalModels";
import { FalModelPickerSheet } from "@/components/fal-models/FalModelPickerSheet";
import { MultiImageAttach } from "@/components/fal-models/MultiImageAttach";
import { StartEndFrameAttach } from "@/components/fal-models/StartEndFrameAttach";
import { VideoModelBadges } from "@/components/fal-models/ModelBadges";
import studioHero from "@/assets/studio-videos-hero.webp";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  videos?: string[];
  attachedImages?: string[];
}

const STUDIO_PLACEHOLDERS = [
  "A cinematic drone shot over mountains...",
  "Slow motion water splash in 4K...",
  "Anime action scene with effects...",
  "Describe your video idea...",
];
const HERO_TEXTS = [
  { main: "Stories", accent: "in motion" },
  { main: "Create", accent: "cinematic magic" },
  { main: "Your vision", accent: "animated" },
];
const LOADING_TEXTS = [
  { text: "Creating", accent: "magic" },
  { text: "Rendering", accent: "frames" },
  { text: "Almost", accent: "there" },
  { text: "Bringing ideas", accent: "to life" },
];

const StudioThinkingLoader = () => {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % LOADING_TEXTS.length), 2400);
    return () => clearInterval(t);
  }, []);
  const current = LOADING_TEXTS[idx];
  return (
    <div className="flex items-center gap-2.5 py-2">
      <motion.svg width="18" height="18" viewBox="0 0 100 100" className="shrink-0 text-blue-400"
        animate={{ y: [0, -6, 0], rotate: [0, 180, 360], scale: [1, 1.15, 1] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}>
        <path d="M50 5 L60 40 L95 50 L60 60 L50 95 L40 60 L5 50 L40 40 Z" fill="currentColor" />
      </motion.svg>
      <AnimatePresence mode="wait">
        <motion.span key={idx} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="text-xs">
          <span className="text-foreground">{current.text} </span>
          <span className="text-blue-400">{current.accent}</span>
        </motion.span>
      </AnimatePresence>
    </div>
  );
};

const VideoStudioPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userId, hasEnoughCredits, refreshCredits } = useCredits();

  const { models } = useFalVideoModels();
  const [selectedModel, setSelectedModel] = useState<FalVideoModel | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [aspect, setAspect] = useState("16:9");
  const [resolution, setResolution] = useState("720p");
  const [duration, setDuration] = useState(5);

  useEffect(() => {
    if (!selectedModel && models.length) {
      const state = (location.state as any) || {};
      const fromHub = state.modelSlug ? models.find(m => m.slug === state.modelSlug) : null;
      const def = fromHub ?? models.find(m => m.is_featured) ?? models[0];
      setSelectedModel(def);
      setAspect(def.default_aspect);
      setResolution(def.default_resolution);
      setDuration(def.default_duration);
    }
  }, [models, selectedModel, location.state]);

  useEffect(() => {
    if (!selectedModel) return;
    if (!selectedModel.supported_durations.includes(duration)) {
      setDuration(selectedModel.default_duration);
    }
  }, [selectedModel, duration]);

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const [startFrame, setStartFrame] = useState<string | null>(null);
  const [endFrame, setEndFrame] = useState<string | null>(null);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [displayedPlaceholder, setDisplayedPlaceholder] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const [heroIdx, setHeroIdx] = useState(0);
  const [lastPrompt, setLastPrompt] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const target = STUDIO_PLACEHOLDERS[placeholderIdx];
    let charIdx = 0;
    setIsTyping(true);
    setDisplayedPlaceholder("");
    const typeInterval = setInterval(() => {
      charIdx++;
      setDisplayedPlaceholder(target.slice(0, charIdx));
      if (charIdx >= target.length) {
        clearInterval(typeInterval);
        setIsTyping(false);
        setTimeout(() => setPlaceholderIdx(i => (i + 1) % STUDIO_PLACEHOLDERS.length), 2000);
      }
    }, 40);
    return () => clearInterval(typeInterval);
  }, [placeholderIdx]);

  useEffect(() => {
    const interval = setInterval(() => setHeroIdx(i => (i + 1) % HERO_TEXTS.length), 4000);
    return () => clearInterval(interval);
  }, []);

  // Consume handoff state from MediaHub
  const [pendingAutoSubmit, setPendingAutoSubmit] = useState<{
    prompt: string;
    images: string[];
  } | null>(null);
  useEffect(() => {
    const s = (location.state as any) || {};
    if (s.prompt) setInput(s.prompt);
    const imgs: string[] = Array.isArray(s.attachedImages)
      ? s.attachedImages
      : s.attachedImage
        ? [s.attachedImage]
        : [];
    if (imgs.length) setAttachedImages(imgs);
    if (s.aspect) setAspect(s.aspect);
    if (typeof s.duration === "number") setDuration(s.duration);
    if (s.autoSubmit && (s.prompt || imgs.length)) {
      setPendingAutoSubmit({ prompt: s.prompt || "", images: imgs });
    }
    if (s.prompt || imgs.length || s.modelSlug || s.aspect || s.duration) {
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fire the auto-submit once the model is ready
  useEffect(() => {
    if (!pendingAutoSubmit || !selectedModel || isGenerating) return;
    const { prompt, images } = pendingAutoSubmit;
    if (images.length) setAttachedImages(images);
    setPendingAutoSubmit(null);
    setTimeout(() => handleSend(prompt), 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingAutoSubmit, selectedModel]);


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    Promise.all(
      files.map(
        (f) =>
          new Promise<string>((resolve) => {
            const r = new FileReader();
            r.onload = () => resolve(r.result as string);
            r.readAsDataURL(f);
          }),
      ),
    ).then((urls) => {
      const allowMulti = (selectedModel as any)?.supports_multi_image;
      setAttachedImages((prev) =>
        allowMulti ? [...prev, ...urls] : [urls[urls.length - 1]],
      );
    });
    e.target.value = "";
  };

  const handleSend = async (promptOverride?: string) => {
    const prompt = promptOverride || input.trim();
    if (!prompt || isGenerating || !selectedModel) return;

    const safeDuration = selectedModel.supported_durations.includes(duration)
      ? duration
      : selectedModel.default_duration;
    const cost = videoModelCreditsFor(selectedModel, safeDuration);
    if (userId && !hasEnoughCredits(cost)) { toast.error("Insufficient credits"); return; }

    setLastPrompt(prompt);
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: prompt,
      attachedImages: attachedImages.length ? [...attachedImages] : (startFrame && endFrame ? [startFrame, endFrame] : undefined),
    };
    const assistantMsg: ChatMessage = { id: crypto.randomUUID(), role: "assistant", content: "" };
    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setInput("");
    const sentImages = [...attachedImages];
    const sentStart = startFrame;
    const sentEnd = endFrame;
    setAttachedImages([]);
    setStartFrame(null);
    setEndFrame(null);
    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke("media-video", {
        body: {
          prompt,
          model_slug: selectedModel.slug,
          provider: (selectedModel as any).provider,
          images: sentImages,
          start_frame: sentStart,
          end_frame: sentEnd,
          aspect_ratio: aspect,
          resolution,
          duration: safeDuration,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const url = data?.video_url;
      if (!url) throw new Error("No video returned");
      setMessages(prev => prev.map(m => m.id === assistantMsg.id ? { ...m, videos: [url] } : m));
      const { triggerAha } = await import("@/lib/ahaTracker");
      triggerAha("video");
    } catch (err: any) {
      const msg = err?.message || "Generation failed";
      setMessages(prev => prev.map(m => m.id === assistantMsg.id ? { ...m, content: msg } : m));
      toast.error(msg);
    }

    setIsGenerating(false);
    refreshCredits();
  };

  const handleRegenerate = () => { if (lastPrompt) handleSend(lastPrompt); };
  const handleDownload = (url: string) => {
    const a = document.createElement("a"); a.href = url; a.download = "generated.mp4"; a.target = "_blank"; a.click();
  };

  const supportsStartEnd = !!selectedModel?.supports_start_end_frame;
  const showMulti = !!selectedModel?.supports_multi_image;
  const currentCost = selectedModel
    ? videoModelCreditsFor(
        selectedModel,
        selectedModel.supported_durations.includes(duration) ? duration : selectedModel.default_duration,
      )
    : 0;

  return (
    <>
    <SEOHead title="AI Video Studio — Veo 3.1, Kling 3 Pro, Runway Gen-4" description="Create cinematic AI videos with Veo 3.1, Kling 3 Pro, Runway Gen-4 and more. Text-to-video, image-to-video and full shot control." path="/videos/studio" />
    <AppLayout>
      <div className="h-full flex flex-col bg-background relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/20 via-background to-background pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3 px-4 py-3 bg-background/50 backdrop-blur-xl">
          <button onClick={() => navigate("/videos")} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-accent transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <AnimatePresence mode="wait">
              <motion.p key={heroIdx} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.3 }} className="text-sm font-bold">
                <span className="text-foreground">{HERO_TEXTS[heroIdx].main} </span>
                <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">{HERO_TEXTS[heroIdx].accent}</span>
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        <div ref={scrollRef} className="relative z-10 flex-1 overflow-y-auto px-4 py-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-6">
              <div className="w-full max-w-[280px] rounded-3xl overflow-hidden shadow-2xl shadow-primary/10">
                <img src={studioHero} alt="" className="w-full h-auto" />
              </div>
              <div>
                <AnimatePresence mode="wait">
                  <motion.div key={heroIdx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <p className="text-xl font-bold text-foreground">{HERO_TEXTS[heroIdx].main}</p>
                    <p className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">{HERO_TEXTS[heroIdx].accent}</p>
                  </motion.div>
                </AnimatePresence>
                <p className="text-sm text-muted-foreground mt-2">Describe your video or attach images</p>
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`mb-4 ${msg.role === "user" ? "flex justify-end" : "flex justify-start"}`}>
              <div className={`max-w-[85%] ${msg.role === "user" ? "bg-accent/30 rounded-2xl rounded-br-md p-3" : "p-1"}`}>
                {msg.attachedImages && msg.attachedImages.length > 0 && (
                  <div className="flex gap-1 mb-2 flex-wrap">
                    {msg.attachedImages.map((src, i) => (
                      <img key={i} src={src} alt="" className="w-20 h-20 object-cover rounded-xl" />
                    ))}
                  </div>
                )}
                {msg.content && msg.role === "user" && <div className="text-sm text-foreground">{msg.content}</div>}
                {msg.content && msg.role === "assistant" && <div className="text-sm text-destructive px-2 py-1">{msg.content}</div>}
                <AnimatePresence>
                  {msg.role === "assistant" && !msg.content && !msg.videos?.length && isGenerating && (
                    <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
                      <StudioThinkingLoader />
                    </motion.div>
                  )}
                </AnimatePresence>
                {msg.videos && msg.videos.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {msg.videos.map((url, i) => (
                      <div key={i}>
                        <video src={url} controls className="w-full rounded-2xl" />
                        <div className="flex items-center gap-1.5 mt-2 px-1">
                          <button onClick={() => handleDownload(url)} className="p-2 rounded-xl bg-accent/50 hover:bg-accent"><Download className="w-4 h-4 text-foreground" /></button>
                          <button className="p-2 rounded-xl bg-accent/50 hover:bg-accent"><ThumbsUp className="w-4 h-4 text-foreground" /></button>
                          <button className="p-2 rounded-xl bg-accent/50 hover:bg-accent"><Share2 className="w-4 h-4 text-foreground" /></button>
                          <button onClick={handleRegenerate} className="p-2 rounded-xl bg-accent/50 hover:bg-accent"><RefreshCw className="w-4 h-4 text-foreground" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Input */}
        <div className="relative z-10 p-3 bg-background/80 backdrop-blur-xl">
          <div className="rounded-2xl bg-accent/40 backdrop-blur-sm">
            {supportsStartEnd ? (
              <StartEndFrameAttach
                startFrame={startFrame}
                endFrame={endFrame}
                onChange={({ startFrame, endFrame }) => { setStartFrame(startFrame); setEndFrame(endFrame); }}
              />
            ) : showMulti && attachedImages.length > 0 ? (
              <MultiImageAttach
                images={attachedImages}
                onChange={setAttachedImages}
                maxImages={selectedModel!.max_input_images}
                label="References"
              />
            ) : attachedImages.length > 0 ? (
              <div className="px-4 pt-4 relative inline-block">
                <img src={attachedImages[0]} alt="" className="h-16 w-16 object-cover rounded-xl" />
                <button onClick={() => setAttachedImages([])} className="absolute -right-1 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground"><Plus className="w-3 h-3 rotate-45" /></button>
              </div>
            ) : null}

            <div className="px-4 pt-4 pb-2">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && (typeof window === 'undefined' || window.innerWidth >= 768)) { e.preventDefault(); handleSend(); } }}
                placeholder={displayedPlaceholder + (isTyping ? "|" : "")}
                rows={2}
                className="min-h-[64px] w-full bg-transparent text-sm text-foreground outline-none resize-none placeholder:text-muted-foreground/40"
              />
            </div>

            <div className="flex items-center gap-2 px-4 pb-4 flex-wrap">
              {!supportsStartEnd && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex shrink-0 items-center gap-1.5 rounded-full bg-accent/60 px-3 py-2 hover:bg-accent text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Media</span>
                </button>
              )}
              <button
                onClick={() => setPickerOpen(true)}
                className="flex shrink-0 items-center gap-1.5 rounded-full bg-accent/60 px-3 py-2 hover:bg-accent text-xs font-medium text-muted-foreground hover:text-foreground max-w-[55%]"
              >
                <span className="truncate">{selectedModel?.display_name ?? "Model"}</span>
                {selectedModel && <span className="text-[10px] text-primary font-semibold">{currentCost} MC</span>}
              </button>
              <button
                onClick={() => setSettingsOpen(o => !o)}
                className="flex shrink-0 items-center gap-1.5 rounded-full bg-accent/60 px-3 py-2 hover:bg-accent text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>{aspect} · {resolution} · {duration}s</span>
              </button>
              <div className="flex-1" />
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSend()}
                disabled={(!input.trim() && !attachedImages.length && !startFrame && !endFrame) || isGenerating || !selectedModel}
                className="shrink-0 rounded-xl bg-foreground px-6 py-2.5 text-xs font-semibold text-background transition-all disabled:opacity-30"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Generate"}
              </motion.button>
            </div>

            {settingsOpen && selectedModel && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="mx-3 mb-3 rounded-2xl border border-border/40 bg-background/40 backdrop-blur-xl p-4 space-y-5"
              >
                {/* Aspect */}
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-2.5 ml-0.5">Aspect</div>
                  <div className="flex gap-2">
                    {selectedModel.supported_aspects.map(a => {
                      const active = aspect === a;
                      const [w, h] = a.split(":").map(Number);
                      const maxDim = 18;
                      const iw = w >= h ? maxDim : Math.round((w / h) * maxDim);
                      const ih = h >= w ? maxDim : Math.round((h / w) * maxDim);
                      return (
                        <button
                          key={a}
                          onClick={() => setAspect(a)}
                          className={`flex-1 flex flex-col items-center justify-center py-2.5 rounded-xl border transition-all ${
                            active
                              ? "border-foreground/30 bg-foreground text-background shadow-[0_0_18px_-6px_rgba(255,255,255,0.35)]"
                              : "border-border/30 bg-muted/30 text-muted-foreground hover:bg-muted/50"
                          }`}
                        >
                          <div
                            className="border-[1.5px] rounded-[2px] mb-1.5"
                            style={{ width: iw, height: ih, borderColor: "currentColor" }}
                          />
                          <span className="text-[11px] font-medium">{a}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Resolution */}
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-2.5 ml-0.5">Resolution</div>
                  <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${Math.max(2, selectedModel.supported_resolutions.length)}, minmax(0, 1fr))` }}>
                    {selectedModel.supported_resolutions.map(r => {
                      const active = resolution === r;
                      return (
                        <button
                          key={r}
                          onClick={() => setResolution(r)}
                          className={`py-2 rounded-xl border text-[12px] transition-all ${
                            active
                              ? "border-foreground/30 bg-foreground/10 text-foreground font-semibold shadow-inner"
                              : "border-border/30 bg-muted/30 text-muted-foreground hover:bg-muted/50 font-medium"
                          }`}
                        >
                          {r}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Duration */}
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-2.5 ml-0.5">Duration</div>
                  <div className="flex bg-muted/30 p-1 rounded-xl border border-border/30">
                    {selectedModel.supported_durations.map(d => {
                      const active = duration === d;
                      return (
                        <button
                          key={d}
                          onClick={() => setDuration(d)}
                          className={`flex-1 py-1.5 rounded-lg text-[11px] transition-all ${
                            active
                              ? "bg-background text-foreground font-semibold shadow-sm"
                              : "text-muted-foreground font-medium"
                          }`}
                        >
                          {d}s
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Capabilities */}
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-2.5 ml-0.5">Capabilities</div>
                  <VideoModelBadges m={selectedModel} />
                </div>
              </motion.div>
            )}
          </div>
        </div>

        <input ref={fileInputRef} type="file" multiple className="hidden" accept="image/*" onChange={handleFileChange} />

        <FalModelPickerSheet
          kind="video"
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          selectedSlug={selectedModel?.slug ?? null}
          onSelect={(m) => {
            setSelectedModel(m);
            setAspect(m.default_aspect);
            setResolution(m.default_resolution);
            setDuration(m.default_duration);
            if (!m.supports_start_end_frame) { setStartFrame(null); setEndFrame(null); }
            if (!m.supports_multi_image && attachedImages.length > 1) setAttachedImages(attachedImages.slice(0, 1));
          }}
        />
      </div>
    </AppLayout>
    </>
  );
};

export default VideoStudioPage;
