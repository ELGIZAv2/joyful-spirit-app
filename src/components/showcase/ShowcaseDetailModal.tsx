import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Copy, RefreshCw, Sparkles, Ratio, FileType, Clock } from "lucide-react";
import { toast } from "sonner";
import type { ShowcaseItem } from "./ShowcaseGrid";

interface ShowcaseDetailModalProps {
  item: ShowcaseItem | null;
  onClose: () => void;
  onRecreate?: (item: ShowcaseItem) => void;
}

const ShowcaseDetailModal = ({ item, onClose, onRecreate }: ShowcaseDetailModalProps) => {
  if (!item) return null;

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = item.media_url;
    a.download = `${item.prompt.slice(0, 30).replace(/\s+/g, "_")}.${item.media_type === "video" ? "mp4" : "png"}`;
    a.target = "_blank";
    a.click();
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(item.prompt);
    toast.success("Prompt copied!");
  };

  const specs = [
    { label: "Model", value: item.model_name, icon: Sparkles },
    { label: "Aspect ratio", value: item.aspect_ratio, icon: Ratio },
    ...(item.duration ? [{ label: "Duration", value: item.duration, icon: Clock }] : []),
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-black/40 backdrop-blur-3xl border border-white/[0.08] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col md:flex-row shadow-[0_16px_64px_rgba(0,0,0,0.6)]"
        >
          {/* Media */}
          <div className="flex-1 bg-black/30 flex items-center justify-center min-h-[300px] md:min-h-0">
            {item.media_type === "video" ? (
              <video
                src={item.media_url}
                controls
                autoPlay
                loop
                className="w-full h-full object-contain max-h-[60vh] md:max-h-[80vh] pointer-events-auto"
              />
            ) : (
              <img
                src={item.media_url}
                alt={item.prompt}
                className="w-full h-full object-contain max-h-[60vh] md:max-h-[80vh] pointer-events-auto"
              />
            )}
          </div>

          {/* Details panel */}
          <div className="w-full md:w-[320px] shrink-0 flex flex-col p-5 border-t md:border-t-0 md:border-l border-white/[0.06]">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-bold text-white/90">Details</h3>
              <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/[0.08] transition-all duration-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Prompt hidden - only copyable */}

            {/* Specs */}
            <div className="space-y-3 mb-5">
              {specs.map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white/40">
                    <Icon className="w-3.5 h-3.5" />
                    <span className="text-xs">{label}</span>
                  </div>
                  <span className="text-xs font-medium text-white/80">{value}</span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="mt-auto space-y-2">
              {/* Copy Prompt */}
              <button
                onClick={handleCopyPrompt}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium 
                  bg-white/[0.06] backdrop-blur-xl border border-white/[0.08] text-white/80 
                  hover:bg-white/[0.1] hover:text-white transition-all duration-300"
              >
                <Copy className="w-4 h-4" />
                Copy Prompt
              </button>

              {/* Recreate */}
              {onRecreate && (
                <button
                  onClick={() => onRecreate(item)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold
                    bg-[#f5d90a] text-black hover:bg-[#e5c900] hover:shadow-[0_0_20px_rgba(245,217,10,0.3)]
                    transition-all duration-300 active:scale-[0.97]"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reuse Prompt
                </button>
              )}

              {/* Download */}
              <button
                onClick={handleDownload}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium 
                  bg-white/[0.06] backdrop-blur-xl border border-white/[0.08] text-white/80 
                  hover:bg-white/[0.1] hover:text-white transition-all duration-300"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ShowcaseDetailModal;
