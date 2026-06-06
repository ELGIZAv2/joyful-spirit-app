import { useState, useRef, useEffect, useMemo } from "react";
import { Loader2, ChevronDown, Image as ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { ModelOption } from "@/components/model-picker/ModelSelector";
import type { ImageSettings, ImageDimensions } from "@/components/modals/ImageSettingsPanel";
import InlineModelPicker from "@/components/model-picker/InlineModelPicker";

const PLACEHOLDERS = [
  "Describe the image…",
  "A coffee shop on a rainy street, warm window light",
  "Portrait of my dog wearing tiny sunglasses",
  "Minimal product shot on cream paper background",
  "Album cover, neon, late-night highway",
];


// Default aspect ratios (used when model has no customization)
const DEFAULT_ASPECT_RATIOS: ImageDimensions[] = [
  { width: 768, height: 1024, label: "2:3" },
  { width: 1024, height: 1024, label: "1:1" },
  { width: 1024, height: 576, label: "16:9" },
  { width: 1200, height: 900, label: "4:3" },
  { width: 1080, height: 1350, label: "4:5" },
  { width: 1080, height: 1920, label: "9:16" },
];

const DEFAULT_QUALITIES = ["512px", "1K", "2K", "4K"];

// Map aspect ratio labels to dimensions
const ASPECT_DIM_MAP: Record<string, ImageDimensions> = {
  "1:1": { width: 1024, height: 1024, label: "1:1" },
  "2:3": { width: 768, height: 1024, label: "2:3" },
  "3:2": { width: 1024, height: 768, label: "3:2" },
  "4:3": { width: 1200, height: 900, label: "4:3" },
  "3:4": { width: 900, height: 1200, label: "3:4" },
  "16:9": { width: 1024, height: 576, label: "16:9" },
  "9:16": { width: 576, height: 1024, label: "9:16" },
  "4:5": { width: 1080, height: 1350, label: "4:5" },
  "5:4": { width: 1350, height: 1080, label: "5:4" },
};

// Fallback logos for known models
const FALLBACK_LOGOS: Record<string, string> = {
  "megsy-v1-img": "/model-logos/megsy.webp",
  "gpt-image": "/model-logos/openai.svg",
  "gpt-image-1": "/model-logos/openai.svg",
  "nano-banana-2": "/model-logos/google.ico",
  "nano-banana-pro": "/model-logos/google.ico",
  "flux-kontext": "/model-logos/bfl.webp",
  "flux-2-pro": "/model-logos/bfl.webp",
  "fal-flux-realism": "/model-logos/bfl.webp",
  "ideogram-3": "/model-logos/ideogram.webp",
  "seedream-4": "/model-logos/bytedance.ico",
  "seedream-5-lite": "/model-logos/bytedance.ico",
  "recraft-v4": "/model-logos/recraft.webp",
  "grok-imagine": "/model-logos/xai.ico",
};

type DropdownId = "aspect" | "quality" | "count" | null;

interface BottomInputBarProps {
  input: string;
  onInputChange: (val: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  selectedModel: ModelOption;
  onModelSelect: (model: ModelOption) => void;
  onOpenModelPicker: () => void;
  settings: ImageSettings;
  onSettingsChange: (s: ImageSettings) => void;
  creditCost: number;
  canAttach: boolean;
  onAttach: () => void;
}

const BottomInputBar = ({
  input,
  onInputChange,
  onGenerate,
  isGenerating,
  selectedModel,
  onModelSelect,
  onOpenModelPicker,
  settings,
  onSettingsChange,
  creditCost,
  canAttach,
  onAttach,
}: BottomInputBarProps) => {
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [displayedPlaceholder, setDisplayedPlaceholder] = useState("");
  const [modelPickerOpen, setModelPickerOpen] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState("2K");
  const [openDropdown, setOpenDropdown] = useState<DropdownId>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Read customization from model
  const cust = selectedModel.customization;
  const showAspect = !cust || cust.ar?.on !== false;
  const showQuality = !cust || cust.q?.on !== false;
  const showCount = !cust || cust.ni?.on !== false;

  // Build dynamic options from customization
  const aspectOptions = useMemo(() => {
    if (cust?.ar?.opts?.length > 0) {
      return cust.ar.opts.map((label: string) => ASPECT_DIM_MAP[label] || { width: 1024, height: 1024, label });
    }
    return DEFAULT_ASPECT_RATIOS;
  }, [cust]);

  const qualityOptions = useMemo(() => {
    if (cust?.q?.opts?.length > 0) return cust.q.opts as string[];
    return DEFAULT_QUALITIES;
  }, [cust]);

  const maxImages = useMemo(() => {
    if (cust?.ni?.max) return cust.ni.max;
    return 4;
  }, [cust]);

  const countOptions = useMemo(() => {
    const opts: number[] = [];
    for (let i = 1; i <= maxImages; i++) opts.push(i);
    return opts;
  }, [maxImages]);

  // Set quality default from customization
  useEffect(() => {
    if (cust?.q?.def) setSelectedQuality(cust.q.def);
  }, [cust?.q?.def]);

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

  const updateSetting = <K extends keyof ImageSettings>(key: K, value: ImageSettings[K]) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  const currentAspect = settings.dimensions.label;
  const logo = selectedModel.iconUrl || FALLBACK_LOGOS[selectedModel.id];

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
        />

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

              {/* Aspect ratio chip - conditional */}
              {showAspect && (
                <Popover open={openDropdown === "aspect"} onOpenChange={(o) => setOpenDropdown(o ? "aspect" : null)}>
                  <PopoverTrigger asChild>
                    <button className={chipClass}>{currentAspect}</button>
                  </PopoverTrigger>
                  <PopoverContent className={menuClass} side="top" align="start" sideOffset={10}>
                    <p className="text-[10px] font-semibold text-foreground/50 uppercase tracking-wider px-2 py-1">Aspect</p>
                    <div className="space-y-0.5">
                      {aspectOptions.map((ar: ImageDimensions) => (
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

              {/* Quality chip - conditional */}
              {showQuality && (
                <Popover open={openDropdown === "quality"} onOpenChange={(o) => setOpenDropdown(o ? "quality" : null)}>
                  <PopoverTrigger asChild>
                    <button className={chipClass}>{selectedQuality}</button>
                  </PopoverTrigger>
                  <PopoverContent className={menuClass} side="top" align="start" sideOffset={10}>
                    <p className="text-[10px] font-semibold text-foreground/50 uppercase tracking-wider px-2 py-1">Quality</p>
                    <div className="space-y-0.5">
                      {qualityOptions.map((q: string) => (
                        <button
                          key={q}
                          onClick={() => {
                            setSelectedQuality(q);
                            setOpenDropdown(null);
                          }}
                          className={`${itemBase} ${
                            selectedQuality === q
                              ? "bg-accent text-accent-foreground font-semibold"
                              : "hover:bg-accent hover:text-accent-foreground"
                          }`}
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              )}

              {/* Images count chip - conditional */}
              {showCount && (
                <Popover open={openDropdown === "count"} onOpenChange={(o) => setOpenDropdown(o ? "count" : null)}>
                  <PopoverTrigger asChild>
                    <button className={chipClass}>
                      {settings.numImages} Image{settings.numImages > 1 ? "s" : ""}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className={menuClass} side="top" align="start" sideOffset={10}>
                    <p className="text-[10px] font-semibold text-foreground/50 uppercase tracking-wider px-2 py-1">Images</p>
                    <div className="space-y-0.5">
                      {countOptions.map((n) => (
                        <button
                          key={n}
                          onClick={() => {
                            updateSetting("numImages", n);
                            setOpenDropdown(null);
                          }}
                          className={`${itemBase} ${
                            settings.numImages === n
                              ? "bg-accent text-accent-foreground font-semibold"
                              : "hover:bg-accent hover:text-accent-foreground"
                          }`}
                        >
                          {n} Image{n > 1 ? "s" : ""}
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
              disabled={!input.trim() || isGenerating}
              className={`shrink-0 h-10 px-6 flex items-center justify-center rounded-xl font-semibold text-sm 
                transition-all duration-300 disabled:opacity-30 active:scale-[0.97]
                ${input.trim() ? "bg-warning text-background hover:bg-warning/90" : "bg-foreground text-background hover:bg-foreground/90"}`}
            >
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Generate · {creditCost} MC</span>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BottomInputBar;