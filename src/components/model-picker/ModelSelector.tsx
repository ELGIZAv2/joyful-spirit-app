import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import ModelPickerSheet from "./ModelPickerSheet";

export interface ModelOption {
  id: string;
  name: string;
  credits: string;
  description?: string;
  requiresImage?: boolean;
  category?: "model" | "tool";
  customization?: Record<string, any>;
  iconUrl?: string;
  badges?: string[];
}

type ModelMode = "chat" | "images" | "videos" | "files" | "code";

const CHAT_MODELS: ModelOption[] = [
  { id: "google/gemini-2.5-flash-lite-preview-09-2025", name: "Megsy V1", credits: "" },
  { id: "google/gemini-2.5-pro", name: "Gemini 2.5 Pro", credits: "" },
  { id: "openai/gpt-5", name: "GPT-5", credits: "" },
  { id: "x-ai/grok-3", name: "Grok 3", credits: "" },
];

// Image & Video models are now fully dynamic via admin bot
export const IMAGE_MODELS: ModelOption[] = [];
export const VIDEO_MODELS: ModelOption[] = [];

const MODELS: Record<ModelMode, ModelOption[]> = {
  chat: CHAT_MODELS,
  images: IMAGE_MODELS,
  videos: VIDEO_MODELS,
  files: CHAT_MODELS.slice(0, 3),
  code: [
    { id: "x-ai/grok-3", name: "Grok 3", credits: "" },
    { id: "openai/gpt-5", name: "GPT-5", credits: "" },
  ],
};

// Real brand icons for chat models
export const ModelBrandIcon = ({ modelId }: { modelId: string }) => {
  if (modelId.includes("gemini-2.5-flash-lite") || modelId.includes("gemini-3.1-flash-lite")) {
    return (
      <span className="text-sm font-black leading-none" style={{ background: "linear-gradient(135deg, #C0C0C0, #888)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>M</span>
    );
  }
  if (modelId.includes("gemini")) {
    return (
      <svg viewBox="0 0 28 28" className="w-4 h-4" fill="none">
        <path d="M14 0C14 7.732 7.732 14 0 14c7.732 0 14 6.268 14 14 0-7.732 6.268-14 14-14C20.268 14 14 7.732 14 0z" fill="#4285F4"/>
      </svg>
    );
  }
  if (modelId.includes("gpt")) {
    return (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
        <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z" fill="#10A37F"/>
      </svg>
    );
  }
  if (modelId.includes("grok")) {
    return (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    );
  }
  return <div className="w-4 h-4 rounded-full bg-primary/20" />;
};

export const getDefaultModel = (mode: ModelMode): ModelOption => MODELS[mode]?.[0] || CHAT_MODELS[0];
export const getModelsForMode = (mode: ModelMode): ModelOption[] => MODELS[mode] || CHAT_MODELS;

interface ModelSelectorProps {
  mode: ModelMode;
  selectedModel: ModelOption;
  onModelChange: (model: ModelOption) => void;
  showCategories?: boolean;
  centerDropdown?: boolean;
  colorClass?: string;
}

const ModelSelector = ({ mode, selectedModel, onModelChange, colorClass }: ModelSelectorProps) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  if (mode === "chat" || mode === "code" || mode === "files") {
    const models = MODELS[mode];
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
          className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-medium transition-colors ${colorClass || "bg-primary text-primary-foreground hover:bg-primary/90"}`}
        >
          <span className="hidden md:inline-flex"><ModelBrandIcon modelId={selectedModel.id} /></span>
          {selectedModel.name}
          <ChevronDown className="w-3 h-3" />
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 4, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-full mb-2 left-0 z-50 w-56 rounded-xl border border-border bg-popover shadow-lg overflow-hidden"
            >
              {models.map((m) => (
                <button
                  key={m.id}
                  onClick={() => { onModelChange(m); setOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors ${
                    selectedModel.id === m.id
                      ? "bg-accent text-accent-foreground"
                      : "text-popover-foreground hover:bg-accent/50"
                  }`}
                >
                  <span className="hidden md:inline-flex"><ModelBrandIcon modelId={m.id} /></span>
                  <span className="font-medium">{m.name}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  const pickerMode = mode === "images" ? "images" : mode === "videos" ? "videos" : "chat";

  return (
    <>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-medium transition-colors ${colorClass || "bg-primary text-primary-foreground hover:bg-primary/90"}`}
      >
        {selectedModel.name}
        <ChevronDown className="w-3 h-3" />
      </button>

      <ModelPickerSheet
        open={open}
        onClose={() => setOpen(false)}
        onSelect={onModelChange}
        mode={pickerMode}
        selectedModelId={selectedModel.id}
      />
    </>
  );
};

export default ModelSelector;
