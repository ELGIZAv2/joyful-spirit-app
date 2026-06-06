import { useState, useRef, useEffect, useMemo } from "react";
import { Loader2, ChevronDown, X, Image as ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { ModelOption } from "@/components/model-picker/ModelSelector";
import InlineModelPicker from "@/components/model-picker/InlineModelPicker";

const PLACEHOLDERS = [
  "Describe the video you want to create...",
  "A cinematic shot of a sunset over the ocean...",
  "A sports car speeding through a neon city...",
  "A woman walking through a misty forest...",
  "An astronaut floating in space with Earth behind...",
];

export interface VideoDimensions {
  width: number;
  height: number;
  label: string;
}

export interface VideoSettings {
  dimensions: VideoDimensions;
  duration: number;
  resolution: string;
  negativePrompt: string;
}

export const DEFAULT_VIDEO_SETTINGS: VideoSettings = {
  dimensions: { width: 1280, height: 720, label: "16:9" },
  duration: 5,
  resolution: "1080p",
  negativePrompt: "",
};

const DEFAULT_ASPECT_RATIOS: VideoDimensions[] = [
  { width: 1080, height: 1920, label: "9:16" },
  { width: 1280, height: 720, label: "16:9" },
  { width: 1024, height: 1024, label: "1:1" },
  { width: 1200, height: 900, label: "4:3" },
];

const DEFAULT_DURATIONS = [4, 5, 6, 8, 10];
const DEFAULT_RESOLUTIONS = ["720p", "1080p", "2K", "4K"];

const ASPECT_DIM_MAP: Record<string, VideoDimensions> = {
  "1:1": { width: 1024, height: 1024, label: "1:1" },
  "2:3": { width: 768, height: 1024, label: "2:3" },
  "3:2": { width: 1024, height: 768, label: "3:2" },
  "4:3": { width: 1200, height: 900, label: "4:3" },
  "3:4": { width: 900, height: 1200, label: "3:4" },
  "16:9": { width: 1280, height: 720, label: "16:9" },
  "9:16": { width: 1080, height: 1920, label: "9:16" },
  "21:9": { width: 1920, height: 820, label: "21:9" },
};

type DropdownId = "aspect" | "duration" | "resolution" | "negative" | null;

interface AttachedImage {
  id: string;
  dataUrl: string;
  mimeType: string;
  name: string;
}

interface VideoBottomInputBarProps {
  input: string;
  onInputChange: (val: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  selectedModel: ModelOption;
  onModelSelect: (model: ModelOption) => void;
  settings: VideoSettings;
  onSettingsChange: (s: VideoSettings) => void;
  creditCost: number;
  canAttach: boolean;
  onAttach: () => void;
  attachedImages: AttachedImage[];
  onRemoveAttached: (id: string) => void;
}

const VideoBottomInputBar = ({
  input,
  onInputChange,
  onGenerate,
  isGenerating,
  selectedModel,
  onModelSelect,
  settings,
  onSettingsChange,
  creditCost,
  canAttach,
  onAttach,
  attachedImages,
  onRemoveAttached,
}: VideoBottomInputBarProps) => {
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [displayedPlaceholder, setDisplayedPlaceholder] = useState("");
  const [modelPickerOpen, setModelPickerOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<DropdownId>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Read customization from model
  const cust = selectedModel.customization;
  const showAspect = !cust || cust.ar?.on !== false;
  const showDuration = !cust || cust.dur?.on !== false;

  // Build dynamic options from customization
  const aspectOptions = useMemo(() => {
    if (cust?.ar?.opts?.length > 0) {
      return cust.ar.opts.map((label: string) => ASPECT_DIM_MAP[label] || { width: 1024, height: 1024, label });
    }
    return DEFAULT_ASPECT_RATIOS;
  }, [cust]);

  const durationOptions = useMemo(() => {
    if (cust?.dur?.opts?.length > 0) return cust.dur.opts.map((s: string) => parseInt(s));
    return DEFAULT_DURATIONS;
  }, [cust]);


  // Animated placeholder
  useEffect(() => {
    if (input) return;
    const target = PLACEHOLDERS[placeholderIdx];
    let i = 0;
    setDisplayedPlaceholder("");
    const t = setInterval(() => {
      if (i < target.length) {
        setDisplayedPlaceholder(target.slice(0, i + 1));
        i += 1;
      } else {
        clearInterval(t);
        setTimeout(() => setPlaceholderIdx((p) => (p + 1) % PLACEHOLDERS.length), 2500);
      }
    }, 50);
    return () => clearInterval(t);
  }, [placeholderIdx, input]);

  const updateSetting = <K extends keyof VideoSettings>(key: K, value: VideoSettings[K]) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  const currentAspect = settings.dimensions.label;
  const logo = selectedModel.iconUrl;

  const chipClass =
    "shrink-0 px-3 py-2 rounded-xl text-xs font-medium " +
    "bg-muted/80 backdrop-blur-3xl border border-border " +
    "text-foreground hover:bg-accent hover:border-border " +
    "transition-all duration-300 ease-out";

  const menuClass =
    "w-40 p-1.5 rounded-xl border border-border " +
    "bg-popover backdrop-blur-3xl";

  const itemBase = "w-full text-left text-xs px-3 py-2 rounded-lg transition-colors text-popover-foreground";

  return (
    <div className="absolute bottom-0 left-0 right-0 z-30 p-4">
      <div className="max-w-4xl mx-auto relative">
        {/* Inline Model Picker */}
        <InlineModelPicker
          open={modelPickerOpen}
          onClose={() => setModelPickerOpen(false)}
          onSelect={(model) => {
            onModelSelect(model);
            setModelPickerOpen(false);
          }}
          selectedModelId={selectedModel.id}
          mode="videos"
        />

        {/* Attached images preview */}
        <AnimatePresence>
          {attachedImages.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex items-center gap-2 px-4 pb-3"
            >
              {attachedImages.map((img) => (
                <div key={img.id} className="relative shrink-0">
                  <img
                    src={img.dataUrl}
                    alt={img.name}
                    className="w-14 h-14 rounded-xl object-cover border border-border pointer-events-auto"
                  />
                  <button
                    onClick={() => onRemoveAttached(img.id)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center hover:bg-destructive/90 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main glass container */}
        <div className="bg-muted/80 backdrop-blur-3xl border border-border rounded-2xl overflow-visible">
          {/* Input area with media buttons */}
          <div className="flex items-start gap-3 px-5 pt-4 pb-3">
            {/* Image attach button */}
            <button
              onClick={onAttach}
              className="shrink-0 w-9 h-9 mt-0.5 flex items-center justify-center rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-accent hover:border-primary/30 transition-all duration-200"
              title="Attach image"
            >
              <ImageIcon className="w-4 h-4" />
            </button>

            <div className="flex-1 min-w-0">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => onInputChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && (typeof window === 'undefined' || window.innerWidth >= 768)) {
                    e.preventDefault();
                    onGenerate();
                  }
                }}
                placeholder={displayedPlaceholder}
                rows={1}
                className="w-full bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-foreground/30 py-2 max-h-24"
                style={{ minHeight: "40px" }}
              />
            </div>
          </div>

          {/* Bottom controls row */}
          <div className="flex items-center justify-between gap-3 px-4 pb-4">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
              {/* Model chip */}
              <button
                onClick={() => setModelPickerOpen(!modelPickerOpen)}
                className={
                  "shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium " +
                  "bg-muted/80 backdrop-blur-3xl border border-border text-foreground " +
                  "hover:bg-accent hover:border-border transition-all duration-300 ease-out"
                }
              >
                {logo && <img src={logo} alt="" className="w-4 h-4 rounded-sm object-contain pointer-events-auto" />}
                {selectedModel.name}
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${modelPickerOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Duration - conditional */}
              {showDuration && (
              <Popover open={openDropdown === "duration"} onOpenChange={(o) => setOpenDropdown(o ? "duration" : null)}>
                <PopoverTrigger asChild>
                  <button className={chipClass}>{settings.duration}s</button>
                </PopoverTrigger>
                <PopoverContent className={menuClass} side="top" align="start" sideOffset={10}>
                  <p className="text-[10px] font-semibold text-foreground/50 uppercase tracking-wider px-2 py-1">Duration</p>
                  <div className="space-y-0.5">
                    {durationOptions.map((d: number) => (
                      <button
                        key={d}
                        onClick={() => {
                          updateSetting("duration", d);
                          setOpenDropdown(null);
                        }}
                        className={`${itemBase} ${
                          settings.duration === d
                            ? "bg-accent text-accent-foreground font-semibold"
                            : "hover:bg-accent hover:text-accent-foreground"
                        }`}
                      >
                        {d} seconds
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              )}


              {/* Aspect Ratio - conditional */}
              {showAspect && (
              <Popover open={openDropdown === "aspect"} onOpenChange={(o) => setOpenDropdown(o ? "aspect" : null)}>
                <PopoverTrigger asChild>
                  <button className={chipClass}>{currentAspect}</button>
                </PopoverTrigger>
                <PopoverContent className={menuClass} side="top" align="start" sideOffset={10}>
                  <p className="text-[10px] font-semibold text-foreground/50 uppercase tracking-wider px-2 py-1">Aspect</p>
                  <div className="space-y-0.5">
                    {aspectOptions.map((ar: VideoDimensions) => (
                      <button
                        key={ar.label}
                        onClick={() => {
                          updateSetting("dimensions", ar);
                          setOpenDropdown(null);
                        }}
                        className={`${itemBase} ${
                          settings.dimensions.label === ar.label
                            ? "bg-accent text-accent-foreground font-semibold"
                            : "hover:bg-accent hover:text-accent-foreground"
                        }`}
                      >
                        {ar.label}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              )}

            </div>

            {/* Generate button */}
            <button
              onClick={onGenerate}
              disabled={!input.trim() && attachedImages.length === 0 || isGenerating}
              className={`shrink-0 h-10 px-6 flex items-center justify-center rounded-xl font-semibold text-sm 
                transition-all duration-300 disabled:opacity-30 active:scale-[0.97]
                ${input.trim() || attachedImages.length > 0 ? "bg-warning text-background hover:bg-warning/90" : "bg-foreground text-background hover:bg-foreground/90"}`}
            >
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Generate · {creditCost} MC</span>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoBottomInputBar;
