import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronDown, ChevronRight, Check } from "lucide-react";
import type { ModelOption } from "@/components/model-picker/ModelSelector";
import type { VideoSettings, VideoDimensions } from "@/components/chat/VideoBottomInputBar";
import { usePageSettings, type PageSettingsVideos } from "@/hooks/usePageSettings";

const ALL_ASPECT_RATIOS: {dims: VideoDimensions;icon: React.ReactNode;}[] = [
{
  dims: { width: 1024, height: 1024, label: "1:1" },
  icon: <div className="w-4 h-4 border-2 border-current rounded-sm" />
},
{
  dims: { width: 768, height: 1024, label: "2:3" },
  icon: <div className="w-3.5 h-5 border-2 border-current rounded-sm" />
},
{
  dims: { width: 1024, height: 768, label: "3:2" },
  icon: <div className="w-5 h-3.5 border-2 border-current rounded-sm" />
},
{
  dims: { width: 768, height: 1024, label: "3:4" },
  icon: <div className="w-3 h-4 border-2 border-current rounded-sm" />
},
{
  dims: { width: 1200, height: 900, label: "4:3" },
  icon: <div className="w-5 h-4 border-2 border-current rounded-sm" />
},
{
  dims: { width: 1280, height: 720, label: "16:9" },
  icon: <div className="w-6 h-3.5 border-2 border-current rounded-sm" />
},
{
  dims: { width: 1080, height: 1920, label: "9:16" },
  icon: <div className="w-3 h-5 border-2 border-current rounded-sm" />
},
{
  dims: { width: 1920, height: 820, label: "21:9" },
  icon: <div className="w-7 h-3 border-2 border-current rounded-sm" />
}];

type ExpandedSection = "aspect" | "duration" | "resolution" | "negative" | null;

interface VideoSettingsDrawerProps {
  open: boolean;
  onClose: () => void;
  settings: VideoSettings;
  onSettingsChange: (s: VideoSettings) => void;
  selectedModel: ModelOption;
  onOpenModelPicker: () => void;
}

const VideoSettingsDrawer = ({
  open,
  onClose,
  settings,
  onSettingsChange,
  selectedModel,
  onOpenModelPicker
}: VideoSettingsDrawerProps) => {
  const [expanded, setExpanded] = useState<ExpandedSection>(null);
  const { settings: pageSettings } = usePageSettings("videos");
  const ps = pageSettings as PageSettingsVideos;

  const ASPECT_RATIOS = useMemo(() => ALL_ASPECT_RATIOS.filter(ar => ps.aspectRatios.includes(ar.dims.label)), [ps.aspectRatios]);
  const DURATIONS = useMemo(() => ps.durations, [ps.durations]);
  const RESOLUTIONS = useMemo(() => ps.resolutions, [ps.resolutions]);

  const toggle = (section: ExpandedSection) => {
    setExpanded((prev) => prev === section ? null : section);
  };

  const updateSetting = <K extends keyof VideoSettings,>(key: K, value: VideoSettings[K]) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  // Get the current aspect ratio icon for display in the header
  const currentAspectIcon = ASPECT_RATIOS.find(
    (ar) => ar.dims.label === settings.dimensions.label
  )?.icon;

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
                expanded === "aspect" ? "" : "bg-muted/60 hover:bg-muted/80"}`
                }>
                
                  <span>Aspect Ratio</span>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    
                    <span className="text-xs">{settings.dimensions.label}</span>
                    <ChevronDown
                    className={`w-4 h-4 transition-transform ${expanded === "aspect" ? "rotate-180" : ""}`} />
                  
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
                          key={ar.dims.label}
                          onClick={() => {
                            updateSetting("dimensions", ar.dims);
                            setExpanded(null);
                          }}
                          className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm transition-colors ${
                          isActive ?
                          "bg-primary/10 text-primary" :
                          "text-foreground/70 hover:bg-muted/40"}`
                          }>
                          
                              
                              <span>{ar.dims.label}</span>
                              {isActive && <Check className="w-4 h-4 ml-auto text-primary" />}
                            </button>);

                    })}
                      </div>
                    </motion.div>
                }
                </AnimatePresence>
              </div>

              {/* Duration */}
              <div className={`rounded-2xl transition-colors ${expanded === "duration" ? "bg-muted/60" : ""}`}>
                <button
                onClick={() => toggle("duration")}
                className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl text-sm font-medium text-foreground transition-colors ${
                expanded === "duration" ? "" : "bg-muted/60 hover:bg-muted/80"}`
                }>
                
                  <span>Duration</span>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span className="text-xs">{settings.duration}s</span>
                    <ChevronDown
                    className={`w-4 h-4 transition-transform ${expanded === "duration" ? "rotate-180" : ""}`} />
                  
                  </div>
                </button>
                <AnimatePresence>
                  {expanded === "duration" &&
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden">
                  
                      <div className="px-2 pb-3 space-y-0.5">
                        {DURATIONS.map((d) => {
                      const isActive = settings.duration === d;
                      return (
                        <button
                          key={d}
                          onClick={() => {
                            updateSetting("duration", d);
                            setExpanded(null);
                          }}
                          className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm transition-colors ${
                          isActive ?
                          "bg-primary/10 text-primary" :
                          "text-foreground/70 hover:bg-muted/40"}`
                          }>
                          
                              <span>{d} seconds</span>
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
                expanded === "negative" ? "" : "bg-muted/60 hover:bg-muted/80"}`
                }>
                
                  <span>Negative Prompt</span>
                  <ChevronDown
                  className={`w-4 h-4 text-muted-foreground transition-transform ${expanded === "negative" ? "rotate-180" : ""}`} />
                
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
                          Describe what to exclude from your video
                        </p>
                        <textarea
                      value={settings.negativePrompt}
                      onChange={(e) => updateSetting("negativePrompt", e.target.value)}
                      placeholder="Blurry faces, low quality, distorted..."
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

export default VideoSettingsDrawer;