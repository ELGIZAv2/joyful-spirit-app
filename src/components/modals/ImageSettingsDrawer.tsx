import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronDown, ChevronRight, Check } from "lucide-react";
import type { ModelOption } from "@/components/model-picker/ModelSelector";
import type { ImageSettings, ImageDimensions } from "@/components/modals/ImageSettingsPanel";
import { usePageSettings, type PageSettingsImages } from "@/hooks/usePageSettings";

const ALL_ASPECT_RATIOS: {dims: ImageDimensions;label: string;}[] = [
{ dims: { width: 1024, height: 1024, label: "1:1" }, label: "1:1" },
{ dims: { width: 768, height: 1024, label: "2:3" }, label: "2:3" },
{ dims: { width: 1024, height: 768, label: "3:2" }, label: "3:2" },
{ dims: { width: 1024, height: 576, label: "16:9" }, label: "16:9" },
{ dims: { width: 576, height: 1024, label: "9:16" }, label: "9:16" },
{ dims: { width: 1200, height: 900, label: "4:3" }, label: "4:3" },
{ dims: { width: 1080, height: 1350, label: "4:5" }, label: "4:5" },
{ dims: { width: 1080, height: 1920, label: "TikTok 9:16" }, label: "TikTok 9:16" }];

type ExpandedSection = "aspect" | "numImages" | "negative" | null;

interface ImageSettingsDrawerProps {
  open: boolean;
  onClose: () => void;
  settings: ImageSettings;
  onSettingsChange: (s: ImageSettings) => void;
  selectedModel: ModelOption;
  onOpenModelPicker: () => void;
}

const ImageSettingsDrawer = ({
  open,
  onClose,
  settings,
  onSettingsChange,
  selectedModel,
  onOpenModelPicker
}: ImageSettingsDrawerProps) => {
  const [expanded, setExpanded] = useState<ExpandedSection>(null);
  const { settings: pageSettings } = usePageSettings("images");
  const ps = pageSettings as PageSettingsImages;

  const ASPECT_RATIOS = useMemo(() => ALL_ASPECT_RATIOS.filter(ar => ps.aspectRatios.includes(ar.label)), [ps.aspectRatios]);
  const NUM_IMAGES = useMemo(() => Array.from({ length: ps.maxImages }, (_, i) => i + 1), [ps.maxImages]);

  const toggle = (section: ExpandedSection) => {
    setExpanded((prev) => prev === section ? null : section);
  };

  const updateSetting = <K extends keyof ImageSettings,>(key: K, value: ImageSettings[K]) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <AnimatePresence>
      {open &&
      <>
          <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm" />

          <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          className="fixed inset-x-0 bottom-0 z-50 bg-card rounded-t-3xl border-t border-border max-h-[85vh] flex flex-col">
          
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4">
              <span className="text-sm font-bold text-foreground">Settings</span>
              <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-accent">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sections */}
            <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-2">
              {/* Model */}
              <button
              onClick={() => {
                onClose();
                onOpenModelPicker();
              }}
              className="w-full flex items-center justify-between px-5 py-4 rounded-2xl bg-muted/60 text-sm font-medium text-foreground transition-colors hover:bg-muted/80">
                <span>Model</span>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="text-xs">{selectedModel.name}</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </button>

              {/* Aspect Ratio */}
              <div className={`rounded-2xl transition-colors ${expanded === "aspect" ? "bg-muted/60" : ""}`}>
                <button
                onClick={() => toggle("aspect")}
                className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl text-sm font-medium text-foreground transition-colors ${
                expanded === "aspect" ? "" : "bg-muted/60 hover:bg-muted/80"}`}>
                  <span>Aspect Ratio</span>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span className="text-xs">{settings.dimensions.label}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${expanded === "aspect" ? "rotate-180" : ""}`} />
                  </div>
                </button>
                <AnimatePresence>
                  {expanded === "aspect" &&
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden">
                      <div className="px-2 pb-3 space-y-0.5">
                        {ASPECT_RATIOS.map((ar) => {
                      const isActive = settings.dimensions.label === ar.dims.label;
                      return (
                        <button
                          key={ar.label}
                          onClick={() => {
                            updateSetting("dimensions", ar.dims);
                            setExpanded(null);
                          }}
                          className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm transition-colors ${
                          isActive ? "bg-primary/10 text-primary" : "text-foreground/70 hover:bg-muted/40"}`}>
                              <span>{ar.label}</span>
                              {isActive && <Check className="w-4 h-4 ml-auto text-primary" />}
                            </button>);
                    })}
                      </div>
                    </motion.div>
                }
                </AnimatePresence>
              </div>

              {/* Number of Images */}
              <div className={`rounded-2xl transition-colors ${expanded === "numImages" ? "bg-muted/60" : ""}`}>
                <button
                onClick={() => toggle("numImages")}
                className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl text-sm font-medium text-foreground transition-colors ${
                expanded === "numImages" ? "" : "bg-muted/60 hover:bg-muted/80"}`}>
                  <span>Number of Images</span>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span className="text-xs">{settings.numImages}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${expanded === "numImages" ? "rotate-180" : ""}`} />
                  </div>
                </button>
                <AnimatePresence>
                  {expanded === "numImages" &&
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden">
                      <div className="px-2 pb-3 space-y-0.5">
                        {NUM_IMAGES.map((n) => {
                      const isActive = settings.numImages === n;
                      return (
                        <button
                          key={n}
                          onClick={() => {
                            updateSetting("numImages", n);
                            setExpanded(null);
                          }}
                          className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm transition-colors ${
                          isActive ? "bg-primary/10 text-primary" : "text-foreground/70 hover:bg-muted/40"}`}>
                              <span>{n} {n === 1 ? "image" : "images"}</span>
                              {isActive && <Check className="w-4 h-4 ml-auto text-primary" />}
                            </button>);
                    })}
                      </div>
                    </motion.div>
                }
                </AnimatePresence>
              </div>

              {/* Negative Prompt */}
              <div className={`rounded-2xl transition-colors ${expanded === "negative" ? "bg-muted/60" : ""}`}>
                <button
                onClick={() => toggle("negative")}
                className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl text-sm font-medium text-foreground transition-colors ${
                expanded === "negative" ? "" : "bg-muted/60 hover:bg-muted/80"}`}>
                  <span>Negative Prompt</span>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expanded === "negative" ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence>
                  {expanded === "negative" &&
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden">
                      <div className="px-4 pb-4 space-y-2">
                        <p className="text-xs text-muted-foreground">
                          Describe what to exclude from your image
                        </p>
                        <textarea
                      placeholder="Blurry, low quality, distorted..."
                      rows={3}
                      className="w-full bg-muted/40 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none resize-none focus:border-primary/30 transition-colors" />
                      </div>
                    </motion.div>
                }
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </>
      }
    </AnimatePresence>);
};

export default ImageSettingsDrawer;
