import { ReactNode, RefObject } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Download, RefreshCw, Share2, ThumbsUp, Loader2, Plus, ChevronDown, Send, Paperclip, Sparkles, Maximize2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { ModelOption } from "@/components/model-picker/ModelSelector";

export type StudioMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  images?: string[];
  videos?: string[];
  attachedImage?: string;
};

type Props = {
  kind: "image" | "video";
  title: string;
  subtitle?: string;
  messages: StudioMessage[];
  isGenerating: boolean;
  input: string;
  setInput: (v: string) => void;
  attachedImage: string | null;
  setAttachedImage: (v: string | null) => void;
  selectedModel: ModelOption;
  onOpenModelPicker: () => void;
  onAttachClick: () => void;
  fileInputRef: RefObject<HTMLInputElement>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSend: () => void;
  onBack?: () => void;
  onDownload: (url: string) => void;
  onPreview: (url: string) => void;
  onRegenerate: () => void;
  placeholder: string;
  /** Optional slot rendered above the prompt textarea inside the left rail (e.g. attached image preview) */
  promptExtras?: ReactNode;
  /** Optional slot replacing the canvas grid (used by Cinema studio). */
  canvasOverride?: ReactNode;
};

const StudioDesktopLayout = ({
  kind,
  title,
  subtitle,
  messages,
  isGenerating,
  input,
  setInput,
  attachedImage,
  setAttachedImage,
  selectedModel,
  onOpenModelPicker,
  onAttachClick,
  fileInputRef,
  onFileChange,
  onSend,
  onBack,
  onDownload,
  onPreview,
  onRegenerate,
  placeholder,
  promptExtras,
  canvasOverride,
}: Props) => {
  const navigate = useNavigate();
  const goBack = () => (onBack ? onBack() : navigate(kind === "image" ? "/images" : "/videos"));

  // Flatten all generated assets (with their parent prompt) for the canvas
  const assets: { url: string; prompt: string; idx: number }[] = [];
  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    if (m.role !== "assistant") continue;
    const urls = (kind === "image" ? m.images : m.videos) || [];
    const promptMsg = messages[i - 1];
    const promptText = promptMsg?.role === "user" ? promptMsg.content : "";
    urls.forEach((u, k) => assets.push({ url: u, prompt: promptText, idx: assets.length + k }));
  }
  // newest first
  const reversed = [...assets].reverse();

  return (
    <div className="hidden md:flex w-full h-full bg-background text-foreground">
      {/* ─── Left Rail: Conversation + Prompt ─── */}
      <aside className="w-[400px] xl:w-[440px] flex flex-col border-r border-border bg-card/50 backdrop-blur-3xl">
        {/* Header */}
        <div className="p-5 flex items-center gap-3 border-b border-border">
          <button
            onClick={goBack}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-muted/40 border border-border hover:bg-muted/70 transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex flex-col min-w-0">
            <h1 className="text-sm font-semibold tracking-wide uppercase text-foreground truncate">{title}</h1>
            <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {subtitle || (isGenerating ? "Generating…" : "Ready")}
            </p>
          </div>
        </div>

        {/* Chat thread */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-hide">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground text-sm pt-10">
              <Sparkles className="w-8 h-8 mx-auto mb-3 text-muted-foreground/60" />
              <p>{kind === "image" ? "Describe an image to begin." : "Direct your first shot."}</p>
            </div>
          )}
          {messages.map((m) => (
            <div key={m.id} className="space-y-2">
              {m.role === "user" ? (
                <div className="flex justify-end">
                  <div className="max-w-[88%] px-4 py-2.5 rounded-2xl rounded-tr-md bg-muted/60 border border-border text-[13px] leading-relaxed">
                    {m.attachedImage && (
                      <img src={m.attachedImage} alt="" className="w-24 h-24 rounded-lg object-cover mb-2" />
                    )}
                    {m.content}
                  </div>
                </div>
              ) : (
                <div className="flex justify-start items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-violet-500 flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-primary-foreground">
                    {kind === "image" ? "I" : "V"}
                  </div>
                  <div className="max-w-[88%] px-4 py-2.5 rounded-2xl rounded-tl-md bg-muted/30 border border-border text-[13px] leading-relaxed text-foreground">
                    {m.content && <p className="mb-1.5">{m.content}</p>}
                    {!m.content && !(m.images?.length || m.videos?.length) && isGenerating && (
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Creating…
                      </span>
                    )}
                    {(m.images || m.videos)?.length ? (
                      <p className="text-[11px] text-muted-foreground">
                        Delivered {(m.images?.length || m.videos?.length || 0)} asset(s) → see canvas
                      </p>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Prompt Bar */}
        <div className="p-4 border-t border-border">
          {promptExtras}
          {attachedImage && (
            <div className="mb-2 relative inline-block">
              <img src={attachedImage} alt="" className="h-14 w-14 object-cover rounded-xl border border-border" />
              <button
                onClick={() => setAttachedImage(null)}
                className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px]"
              >
                ✕
              </button>
            </div>
          )}
          <div className="rounded-3xl bg-muted/30 border border-border focus-within:border-primary/50 transition-colors p-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && (typeof window === 'undefined' || window.innerWidth >= 768)) {
                  e.preventDefault();
                  onSend();
                }
              }}
              placeholder={placeholder}
              rows={3}
              className="w-full bg-transparent text-sm p-2 resize-none outline-none placeholder:text-muted-foreground/60"
            />
            <div className="flex items-center justify-between p-1.5 pt-2">
              <div className="flex gap-1.5 items-center min-w-0">
                <button
                  onClick={onAttachClick}
                  className="p-2 rounded-xl bg-muted/40 hover:bg-muted/70 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Attach"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <button
                  onClick={onOpenModelPicker}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/40 hover:bg-muted/70 border border-border rounded-full text-[11px] font-medium text-foreground transition-colors min-w-0"
                >
                  {selectedModel.iconUrl ? (
                    <img src={selectedModel.iconUrl} alt="" className="w-4 h-4 rounded-full object-cover" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  )}
                  <span className="truncate max-w-[140px]">{selectedModel.name}</span>
                  <ChevronDown className="w-3 h-3 text-muted-foreground" />
                </button>
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onSend}
                disabled={(!input.trim() && !attachedImage) || isGenerating}
                className="bg-primary hover:bg-primary/90 text-primary-foreground p-2.5 rounded-2xl shadow-[0_0_20px_hsl(var(--primary)/0.3)] transition-all disabled:opacity-40"
                aria-label="Generate"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </motion.button>
            </div>
          </div>
          <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={onFileChange} />
        </div>
      </aside>

      {/* ─── Main Canvas ─── */}
      <main className="flex-1 overflow-y-auto bg-background">
        <div className="max-w-7xl mx-auto p-10">
          <div className="flex items-end justify-between mb-8">
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">Generation Canvas</h2>
              <p className="text-muted-foreground text-sm">{assets.length} asset{assets.length === 1 ? "" : "s"} this session</p>
            </div>
          </div>

          {canvasOverride ? (
            canvasOverride
          ) : reversed.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
              <div className="w-16 h-16 rounded-2xl bg-muted/30 border border-border flex items-center justify-center mb-4">
                <Sparkles className="w-7 h-7 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-sm">Your generations will appear here.</p>
              <p className="text-muted-foreground/70 text-xs mt-1">Start by typing a prompt on the left.</p>
            </div>
          ) : (
            <div className="columns-1 sm:columns-2 xl:columns-3 gap-6 space-y-6">
              {isGenerating && (
                <div className="break-inside-avoid mb-6">
                  <div className="rounded-3xl border border-border bg-card aspect-square flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-9 h-9 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                      <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Rendering</span>
                    </div>
                  </div>
                </div>
              )}
              {reversed.map((a) => (
                <div key={`${a.url}-${a.idx}`} className="break-inside-avoid group relative mb-6">
                  <div className="rounded-3xl overflow-hidden border border-border bg-card shadow-2xl transition-all duration-300 group-hover:border-primary/40">
                    {kind === "image" ? (
                      <img
                        src={a.url}
                        alt={a.prompt}
                        className="w-full h-auto cursor-zoom-in"
                        onClick={() => onPreview(a.url)}
                      />
                    ) : (
                      <video
                        src={a.url}
                        controls
                        playsInline
                        className="w-full h-auto cursor-pointer"
                        onClick={() => onPreview(a.url)}
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 pointer-events-none">
                      <div className="flex gap-2 pointer-events-auto">
                        <button
                          onClick={() => onPreview(a.url)}
                          className="flex-1 bg-white/10 backdrop-blur-md py-2 rounded-xl text-xs font-semibold border border-white/15 hover:bg-white/20 text-white flex items-center justify-center gap-1.5 theme-fixed"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                          Preview
                        </button>
                        <button
                          onClick={() => onDownload(a.url)}
                          className="bg-white/10 backdrop-blur-md p-2 rounded-xl border border-white/15 hover:bg-white/20 theme-fixed"
                          aria-label="Download"
                        >
                          <Download className="w-4 h-4 text-white" />
                        </button>
                        <button
                          onClick={onRegenerate}
                          className="bg-white/10 backdrop-blur-md p-2 rounded-xl border border-white/15 hover:bg-white/20 theme-fixed"
                          aria-label="Regenerate"
                        >
                          <RefreshCw className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    </div>
                  </div>
                  {a.prompt && (
                    <p className="mt-2 px-2 text-[11px] text-muted-foreground line-clamp-2 leading-snug">{a.prompt}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default StudioDesktopLayout;
