import { motion, AnimatePresence } from "framer-motion";
import { Globe, Paperclip, Check } from "lucide-react";
import ModelSelector, { type ModelOption } from "./ModelSelector";

interface AgentMenuProps {
  open: boolean;
  onClose: () => void;
  onToggleSearch?: () => void;
  isSearchEnabled?: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  mode?: string;
  selectedModel?: ModelOption;
  onModelChange?: (m: ModelOption) => void;
}

const AgentMenu = ({ open, onClose, onToggleSearch, isSearchEnabled, fileInputRef, mode, selectedModel, onModelChange }: AgentMenuProps) => {
  return (
    <AnimatePresence>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute bottom-full mb-2 left-0 z-40 w-72 rounded-2xl border border-border/40 bg-popover/95 backdrop-blur-2xl shadow-[0_24px_60px_-12px_rgba(0,0,0,0.4)] overflow-hidden"
          >
            {selectedModel && onModelChange && (
              <div className="px-3 pt-3 pb-2 border-b border-border/30">
                <p className="text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wider mb-2 px-1">Model</p>
                <ModelSelector
                  mode={(mode as any) || "chat"}
                  selectedModel={selectedModel}
                  onModelChange={onModelChange}
                  showCategories={mode === "images" || mode === "videos"}
                />
              </div>
            )}

            <div className="p-1.5">
              {onToggleSearch && (
                <button
                  onClick={() => { onToggleSearch(); onClose(); }}
                  className="w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-left hover:bg-accent/60 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-muted/40 flex items-center justify-center shrink-0">
                    <Globe className="w-4 h-4 text-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">Web Search</p>
                    <p className="text-[11px] text-muted-foreground truncate">{isSearchEnabled ? "Enabled" : "Search the web"}</p>
                  </div>
                  {isSearchEnabled && <Check className="w-4 h-4 text-primary shrink-0" />}
                </button>
              )}

              <button
                onClick={() => { fileInputRef.current?.click(); onClose(); }}
                className="w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-left hover:bg-accent/60 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-muted/40 flex items-center justify-center shrink-0">
                  <Paperclip className="w-4 h-4 text-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">Attach File</p>
                  <p className="text-[11px] text-muted-foreground truncate">Images or documents</p>
                </div>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AgentMenu;
