import SEOHead from "@/components/common/SEOHead";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, ThumbsUp, Share2, ArrowLeft, Loader2, Plus, RefreshCw, Sliders } from "lucide-react";
import ImagePreviewModal from "@/components/modals/ImagePreviewModal";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCredits } from "@/hooks/useCredits";
import AppLayout from "@/layouts/AppLayout";
import { useFalImageModels, type FalImageModel } from "@/hooks/useFalModels";
import { FalModelPickerSheet } from "@/components/fal-models/FalModelPickerSheet";
import { MultiImageAttach } from "@/components/fal-models/MultiImageAttach";
import { ImageModelBadges } from "@/components/fal-models/ModelBadges";
import studioHero from "@/assets/studio-images-hero.webp";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  images?: string[];
  attachedImages?: string[];
}

const STUDIO_PLACEHOLDERS = [
  "A dreamy landscape at golden hour...",
  "Portrait with cinematic lighting...",
  "Surreal artwork with bold colors...",
  "Describe your next masterpiece...",
];
const HERO_TEXTS = [
  { main: "Create", accent: "masterpieces" },
  { main: "Imagine", accent: "anything" },
  { main: "Your art", accent: "your rules" },
];
const LOADING_TEXTS = [
  { text: "Creating", accent: "magic" },
  { text: "Painting", accent: "pixels" },
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

const ImageStudioPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userId, hasEnoughCredits, refreshCredits } = useCredits();

  const { models } = useFalImageModels();
  const [selectedModel, setSelectedModel] = useState<FalImageModel | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [aspect, setAspect] = useState<string>("1:1");
  const [resolution, setResolution] = useState<string>("1K");

  // Pick the featured model on first load
  useEffect(() => {
    if (!selectedModel && models.length) {
      const state = (location.state as any) || {};
      const fromHub = state.modelSlug ? models.find(m => m.slug === state.modelSlug) : null;
      const def = fromHub ?? models.find(m => m.is_featured) ?? models[0];
      setSelectedModel(def);
      setAspect(def.default_aspect);
      setResolution(def.default_resolution);
    }
  }, [models, selectedModel, location.state]);

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [displayedPlaceholder, setDisplayedPlaceholder] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const [heroIdx, setHeroIdx] = useState(0);
  const [lastPrompt, setLastPrompt] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Load past generations so they persist across sessions
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("media_assets")
        .select("id, prompt, public_url, created_at")
        .eq("user_id", userId)
        .eq("kind", "image")
        .order("created_at", { ascending: true })
        .limit(50);
      if (cancelled || !data?.length) return;
      const history: ChatMessage[] = [];
      for (const a of data) {
        if (a.prompt) history.push({ id: `u-${a.id}`, role: "user", content: a.prompt });
        history.push({ id: `a-${a.id}`, role: "assistant", content: "", images: [a.public_url] });
      }
      setMessages(prev => (prev.length ? prev : history));
    })();
    return () => { cancelled = true; };
  }, [userId]);

  // Typing animation
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
    if (s.autoSubmit && (s.prompt || imgs.length)) {
      setPendingAutoSubmit({ prompt: s.prompt || "", images: imgs });
    }
    if (s.prompt || imgs.length || s.modelSlug || s.aspect) {
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
    // Defer one tick so attached images state is committed before send
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
    ).then((urls) =>
      setAttachedImages((prev) => {
        const allowMulti = (selectedModel as any)?.supports_multi_image;
        const merged = allowMulti ? [...prev, ...urls] : [urls[urls.length - 1]];
        return merged;
      }),
    );
    e.target.value = "";
  };

  const handleSend = async (promptOverride?: string) => {
    const prompt = promptOverride || input.trim();
    if (!prompt || isGenerating || !selectedModel) return;

    const cost = selectedModel.credits;
    if (userId && !hasEnoughCredits(cost)) { toast.error("Insufficient credits"); return; }

    setLastPrompt(prompt);
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: prompt,
      attachedImages: attachedImages.length ? [...attachedImages] : undefined,
    };
    const assistantMsg: ChatMessage = { id: crypto.randomUUID(), role: "assistant", content: "" };
    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setInput("");
    const sentImages = [...attachedImages];
    setAttachedImages([]);
    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke("media-image", {
        body: {
          prompt,
          model_slug: selectedModel.slug,
          provider: (selectedModel as any).provider,
          images: sentImages,
          aspect_ratio: aspect,
          resolution,
          num_images: 1,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const urls: string[] = data?.image_urls ?? (data?.image_url ? [data.image_url] : []);
      setMessages(prev => prev.map(m => m.id === assistantMsg.id ? { ...m, images: urls } : m));
      if (urls.length) {
        const { triggerAha } = await import("@/lib/ahaTracker");
        triggerAha("image");
      }
    } catch (err: any) {
      const msg = err?.message || "Generation failed";
      setMessages(prev => prev.map(m => m.id === assistantMsg.id ? { ...m, content: msg } : m));
      toast.error(msg);
    }

    setIsGenerating(false);
    refreshCredits();
  };

  const handleRegenerate = () => { if (lastPrompt) handleSend(lastPrompt); };
  const handleDownload = async (url: string) => {
    try {
      // Fetch the image as a blob and force a real download via an object URL,
      // so the user gets a proper file save (not a navigation to Supabase storage).
      const res = await fetch(url, { mode: "cors", cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const ext = (blob.type.split("/")[1] || "png").split(";")[0];
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objUrl;
      a.download = `image-${Date.now()}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(objUrl), 2000);
    } catch (e: any) {
      console.error("download failed", e);
      toast.error("Download failed, opening in a new tab");
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const showMulti = !!selectedModel?.supports_multi_image;

  return (
    <>
    <SEOHead title="AI Image Studio — Nano Banana Pro, GPT-Image 2, Gemini 3 Pro Image" description="Generate stunning AI images with Nano Banana Pro, GPT-Image 2, Gemini 3 Pro Image, Recraft V4 and Ideogram 3 — all in one studio." path="/images/studio" />
    <AppLayout>
      <div className="h-full flex flex-col bg-background relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-rose-950/20 via-background to-background pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3 px-4 py-3 bg-background/50 backdrop-blur-xl">
          <button onClick={() => navigate("/images")} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-accent transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <AnimatePresence mode="wait">
              <motion.p key={heroIdx} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.3 }} className="text-sm font-bold">
                <span className="text-foreground">{HERO_TEXTS[heroIdx].main} </span>
                <span className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">{HERO_TEXTS[heroIdx].accent}</span>
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
                    <p className="text-xl font-bold bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">{HERO_TEXTS[heroIdx].accent}</p>
                  </motion.div>
                </AnimatePresence>
                <p className="text-sm text-muted-foreground mt-2">Describe your image or attach a photo to edit</p>
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
                  {msg.role === "assistant" && !msg.content && !msg.images?.length && isGenerating && (
                    <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
                      <StudioThinkingLoader />
                    </motion.div>
                  )}
                </AnimatePresence>
                {msg.images && msg.images.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mt-2 space-y-2">
                    {msg.images.map((url, i) => (
                      <div key={i}>
                        <img src={url} alt="" className="w-full rounded-2xl cursor-pointer hover:opacity-90 transition-opacity" onClick={() => setPreviewUrl(url)} />
                        <div className="flex items-center gap-1.5 mt-2 px-1">
                          <button onClick={() => handleDownload(url)} className="p-2 rounded-xl bg-accent/50 hover:bg-accent"><Download className="w-4 h-4 text-foreground" /></button>
                          <button className="p-2 rounded-xl bg-accent/50 hover:bg-accent"><ThumbsUp className="w-4 h-4 text-foreground" /></button>
                          <button className="p-2 rounded-xl bg-accent/50 hover:bg-accent"><Share2 className="w-4 h-4 text-foreground" /></button>
                          <button onClick={handleRegenerate} className="p-2 rounded-xl bg-accent/50 hover:bg-accent"><RefreshCw className="w-4 h-4 text-foreground" /></button>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Input */}
        <div className="relative z-10 p-3 bg-background/80 backdrop-blur-xl">
          <div className="rounded-2xl bg-accent/40 backdrop-blur-sm">
            {showMulti && attachedImages.length > 0 ? (
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
              <button
                onClick={() => showMulti ? document.getElementById("fal-multi-trigger")?.click() : fileInputRef.current?.click()}
                className="flex shrink-0 items-center gap-1.5 rounded-full bg-accent/60 px-3 py-2 hover:bg-accent text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Media</span>
              </button>

              <button
                onClick={() => setPickerOpen(true)}
                className="flex shrink-0 items-center gap-1.5 rounded-full bg-accent/60 px-3 py-2 hover:bg-accent text-xs font-medium text-muted-foreground hover:text-foreground max-w-[55%]"
              >
                <span className="truncate">{selectedModel?.display_name ?? "Model"}</span>
                {selectedModel && <span className="text-[10px] text-primary font-semibold">{selectedModel.credits} MC</span>}
              </button>

              <button
                onClick={() => setSettingsOpen(o => !o)}
                className="flex shrink-0 items-center gap-1.5 rounded-full bg-accent/60 px-3 py-2 hover:bg-accent text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>{aspect} · {resolution}</span>
              </button>

              <div className="flex-1" />
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSend()}
                disabled={(!input.trim() && !attachedImages.length) || isGenerating || !selectedModel}
                className="shrink-0 rounded-xl bg-foreground px-6 py-2.5 text-xs font-semibold text-background transition-all disabled:opacity-30"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Generate"}
              </motion.button>
            </div>

            {settingsOpen && selectedModel && (
              <div className="px-4 pb-4 -mt-2 space-y-2">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Aspect</div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedModel.supported_aspects.map(a => (
                      <button key={a} onClick={() => setAspect(a)}
                        className={`px-2.5 py-1 rounded-full text-[11px] ${aspect === a ? "bg-foreground text-background" : "bg-muted/40 text-muted-foreground"}`}>
                        {a}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Resolution</div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedModel.supported_resolutions.map(r => (
                      <button key={r} onClick={() => setResolution(r)}
                        className={`px-2.5 py-1 rounded-full text-[11px] ${resolution === r ? "bg-foreground text-background" : "bg-muted/40 text-muted-foreground"}`}>
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="pt-1"><ImageModelBadges m={selectedModel} /></div>
              </div>
            )}
          </div>
        </div>

        {/* Hidden multi trigger for the Media button when in multi mode */}
        <input id="fal-multi-trigger" ref={fileInputRef} type="file" className="hidden" accept="image/*" multiple={showMulti} onChange={handleFileChange} />

        <ImagePreviewModal url={previewUrl} onClose={() => setPreviewUrl(null)} />

        <FalModelPickerSheet
          kind="image"
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          selectedSlug={selectedModel?.slug ?? null}
          onSelect={(m) => {
            setSelectedModel(m);
            setAspect(m.default_aspect);
            setResolution(m.default_resolution);
            // reset extra attached images if the new model doesn't support multi
            if (!m.supports_multi_image && attachedImages.length > 1) setAttachedImages(attachedImages.slice(0, 1));
          }}
        />
      </div>
    </AppLayout>
    </>
  );
};

export default ImageStudioPage;
