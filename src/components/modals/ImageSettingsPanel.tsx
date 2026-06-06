import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, RotateCcw, HelpCircle, Lock, Unlock, Settings2, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { ModelOption } from "@/components/model-picker/ModelSelector";

export interface ImageDimensions {
  width: number;
  height: number;
  label: string;
}

export interface ImageSettings {
  dimensions: ImageDimensions;
  numImages: number;
  privateMode: boolean;
}

const PRESET_DIMENSIONS: { dims: ImageDimensions; icon: React.ReactNode }[] = [
  {
    dims: { width: 768, height: 1024, label: "2:3" },
    icon: (
      <div className="flex flex-col items-center gap-1">
        <div className="w-4 h-6 border-2 border-current rounded-sm" />
        <span className="text-[10px]">2:3</span>
      </div>
    ),
  },
  {
    dims: { width: 1024, height: 1024, label: "1:1" },
    icon: (
      <div className="flex flex-col items-center gap-1">
        <div className="w-5 h-5 border-2 border-current rounded-sm" />
        <span className="text-[10px]">1:1</span>
      </div>
    ),
  },
  {
    dims: { width: 1024, height: 576, label: "16:9" },
    icon: (
      <div className="flex flex-col items-center gap-1">
        <div className="w-7 h-4 border-2 border-current rounded-sm" />
        <span className="text-[10px]">16:9</span>
      </div>
    ),
  },
];

const SOCIAL_PRESETS: ImageDimensions[] = [
  { width: 1200, height: 900, label: "Twitter/X (4:3)" },
  { width: 1080, height: 1350, label: "Instagram (4:5)" },
  { width: 1080, height: 1920, label: "TikTok (9:16)" },
];

const DEVICE_PRESETS: ImageDimensions[] = [
  { width: 1920, height: 1080, label: "Desktop (16:9)" },
  { width: 1024, height: 1024, label: "Square (1:1)" },
];

export const DEFAULT_SETTINGS: ImageSettings = {
  dimensions: { width: 1024, height: 1024, label: "1:1" },
  numImages: 1,
  privateMode: false,
};

interface ImageSettingsPanelProps {
  selectedModel: ModelOption;
  onModelChange: (model: ModelOption) => void;
  onOpenModelPicker: () => void;
  settings: ImageSettings;
  onSettingsChange: (settings: ImageSettings) => void;
  className?: string;
}

const ImageSettingsPanel = ({
  selectedModel,
  onModelChange,
  onOpenModelPicker,
  settings,
  onSettingsChange,
  className = "",
}: ImageSettingsPanelProps) => {
  const [customOpen, setCustomOpen] = useState(false);
  const [numExpanded, setNumExpanded] = useState(false);

  const updateSetting = <K extends keyof ImageSettings>(key: K, value: ImageSettings[K]) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  const handleReset = () => onSettingsChange({ ...DEFAULT_SETTINGS });

  const dimRatio = settings.dimensions.width / settings.dimensions.height;

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div className="flex-1 overflow-y-auto space-y-5 px-1">
        {/* ── Model ── */}
        <div>
          <button
            onClick={onOpenModelPicker}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl bg-secondary/50 border border-border hover:border-primary/40 transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Settings2 className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 text-left min-w-0">
              <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">Model</span>
              <p className="text-sm font-medium text-foreground truncate">{selectedModel.name}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </button>
        </div>

        {/* ── Image Dimensions ── */}
        <div>
          <div className="flex items-center gap-1.5 mb-2.5">
            <span className="text-xs font-semibold text-foreground">Image Dimensions</span>
            <HelpCircle className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <div className="flex gap-2">
            {PRESET_DIMENSIONS.map(({ dims, icon }) => (
              <button
                key={dims.label}
                onClick={() => updateSetting("dimensions", dims)}
                className={`flex-1 flex flex-col items-center justify-center py-3 rounded-xl transition-all border ${
                  settings.dimensions.label === dims.label
                    ? "bg-primary/10 border-primary text-primary"
                    : "bg-secondary/50 border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
                }`}
              >
                {icon}
              </button>
            ))}
            <Popover open={customOpen} onOpenChange={setCustomOpen}>
              <PopoverTrigger asChild>
                <button
                  className={`flex-1 flex flex-col items-center justify-center py-3 rounded-xl transition-all border ${
                    !PRESET_DIMENSIONS.find(p => p.dims.label === settings.dimensions.label)
                      ? "bg-primary/10 border-primary text-primary"
                      : "bg-secondary/50 border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
                  }`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-5 h-5 border-2 border-dashed border-current rounded-sm flex items-center justify-center">
                      <span className="text-[8px] font-bold">+</span>
                    </div>
                    <span className="text-[10px]">Custom</span>
                  </div>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-4 space-y-4" side="right" align="start">
                <div className="flex justify-center">
                  <div
                    className="border-2 border-primary rounded-lg bg-primary/10 transition-all"
                    style={{
                      width: dimRatio >= 1 ? 80 : 80 * dimRatio,
                      height: dimRatio >= 1 ? 80 / dimRatio : 80,
                    }}
                  />
                </div>
                <div className="text-center text-xs text-muted-foreground">
                  {settings.dimensions.width} × {settings.dimensions.height}
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>Wide</span>
                    <span>Tall</span>
                  </div>
                  <Slider
                    value={[dimRatio]}
                    min={0.5}
                    max={2}
                    step={0.05}
                    onValueChange={([v]) => {
                      const w = Math.round(1024 * Math.min(v, 1) + (v > 1 ? (v - 1) * 512 : 0));
                      const h = Math.round(1024 / Math.max(v, 1) + (v < 1 ? (1 - v) * 512 : 0));
                      updateSetting("dimensions", {
                        width: Math.round(w / 32) * 32,
                        height: Math.round(h / 32) * 32,
                        label: `${Math.round(w / 32) * 32}×${Math.round(h / 32) * 32}`,
                      });
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold">Socials</p>
                  {SOCIAL_PRESETS.map(d => (
                    <button
                      key={d.label}
                      onClick={() => { updateSetting("dimensions", d); setCustomOpen(false); }}
                      className="w-full text-left text-xs px-2 py-1.5 rounded-md hover:bg-accent transition-colors text-foreground"
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold">Devices</p>
                  {DEVICE_PRESETS.map(d => (
                    <button
                      key={d.label}
                      onClick={() => { updateSetting("dimensions", d); setCustomOpen(false); }}
                      className="w-full text-left text-xs px-2 py-1.5 rounded-md hover:bg-accent transition-colors text-foreground"
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* ── Number of Images ── */}
        <div>
          <div className="flex items-center gap-1.5 mb-2.5">
            <span className="text-xs font-semibold text-foreground">Number of images</span>
            <HelpCircle className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map(n => (
              <button
                key={n}
                onClick={() => updateSetting("numImages", n)}
                className={`w-10 h-10 rounded-xl text-sm font-semibold transition-all border ${
                  settings.numImages === n
                    ? "bg-primary/10 border-primary text-primary"
                    : "bg-secondary/50 border-border text-muted-foreground hover:border-primary/30"
                }`}
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => setNumExpanded(!numExpanded)}
              className="w-10 h-10 rounded-xl text-sm font-semibold transition-all border bg-secondary/50 border-border text-muted-foreground hover:border-primary/30"
            >
              <ChevronDown className={`w-4 h-4 mx-auto transition-transform ${numExpanded ? "rotate-180" : ""}`} />
            </button>
          </div>
          <AnimatePresence>
            {numExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex gap-2 mt-2">
                  {[5, 6, 7, 8].map(n => (
                    <button
                      key={n}
                      onClick={() => updateSetting("numImages", n)}
                      className={`w-10 h-10 rounded-xl text-sm font-semibold transition-all border ${
                        settings.numImages === n
                          ? "bg-primary/10 border-primary text-primary"
                          : "bg-secondary/50 border-border text-muted-foreground hover:border-primary/30"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Private Mode ── */}
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-foreground">Private Mode</span>
              <HelpCircle className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            <div className="flex items-center gap-2">
              {settings.privateMode ? (
                <Lock className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Unlock className="w-3.5 h-3.5 text-muted-foreground" />
              )}
              <Switch
                checked={settings.privateMode}
                onCheckedChange={(v) => updateSetting("privateMode", v)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Reset ── */}
      <div className="shrink-0 pt-4 mt-auto border-t border-border">
        <button
          onClick={handleReset}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Reset to Defaults
        </button>
      </div>
    </div>
  );
};

// Mobile drawer wrapper
export const MobileSettingsDrawer = ({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) => (
  <AnimatePresence>
    {open && (
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
        />
        <motion.div
          initial={{ x: "-100%" }}
          animate={{ x: 0 }}
          exit={{ x: "-100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed left-0 top-0 bottom-0 z-50 w-[260px] bg-card border-r border-border flex flex-col"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-sm font-bold text-foreground">Settings</span>
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-accent">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {children}
          </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

export default ImageSettingsPanel;