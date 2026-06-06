import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ImagePlus, ChevronDown } from "lucide-react";

interface UnifiedInputBarProps {
  prompt: string;
  onPromptChange: (val: string) => void;
  onGenerate: () => void;
  onAttach?: () => void;
  onModelPick?: () => void;
  modelIcon?: string | null;
  modelName?: string;
  placeholders?: string[];
  generateLabel?: string;
  disabled?: boolean;
  isGenerating?: boolean;
  attachedImage?: string | null;
  onClearAttachment?: () => void;
  showModelPicker?: boolean;
  className?: string;
}

const DEFAULT_PLACEHOLDERS = [
  "What are we making?",
  "Describe it in your own words…",
  "Be as specific as you like.",
];


const UnifiedInputBar = ({
  prompt,
  onPromptChange,
  onGenerate,
  onAttach,
  onModelPick,
  modelIcon,
  modelName,
  placeholders = DEFAULT_PLACEHOLDERS,
  generateLabel = "Generate",
  disabled,
  isGenerating,
  attachedImage,
  onClearAttachment,
  showModelPicker = false,
  className = "",
}: UnifiedInputBarProps) => {
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [displayedPlaceholder, setDisplayedPlaceholder] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const target = placeholders[placeholderIdx];
    if (!target) return;
    let charIdx = 0;
    setIsTyping(true);
    setDisplayedPlaceholder("");
    const typeInterval = setInterval(() => {
      charIdx++;
      setDisplayedPlaceholder(target.slice(0, charIdx));
      if (charIdx >= target.length) {
        clearInterval(typeInterval);
        setIsTyping(false);
        setTimeout(() => setPlaceholderIdx(i => (i + 1) % placeholders.length), 2000);
      }
    }, 40);
    return () => clearInterval(typeInterval);
  }, [placeholderIdx, placeholders]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "0px";
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  }, [prompt]);

  return (
    <div className={`rounded-2xl bg-accent/40 backdrop-blur-sm ${className}`}>
      {attachedImage && (
        <div className="px-4 pt-4 relative inline-block">
          <img src={attachedImage} alt="" className="h-16 w-16 rounded-xl object-cover" />
          <button onClick={onClearAttachment} className="absolute -right-1 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px]">✕</button>
        </div>
      )}

      {/* Textarea area */}
      <div className="px-4 pt-4 pb-2">
        <textarea
          ref={textareaRef}
          rows={2}
          value={prompt}
          onChange={e => onPromptChange(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && typeof window !== "undefined" && window.innerWidth >= 768) { e.preventDefault(); onGenerate(); } }}
          placeholder={displayedPlaceholder + (isTyping ? "|" : "")}
          className="min-h-[64px] w-full resize-none bg-transparent text-sm leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/40"
        />
      </div>

      {/* Bottom controls */}
      <div className="flex items-center gap-2 px-4 pb-4">
        {showModelPicker && onModelPick && (
          <button
            onClick={onModelPick}
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-accent/60 px-3 py-2 hover:bg-accent transition-all text-xs font-medium"
          >
            {modelIcon ? (
              <img src={modelIcon} alt="" className="w-4 h-4 rounded-full object-cover" />
            ) : null}
            {modelName ? (
              <span className="text-foreground font-semibold truncate max-w-[100px]">{modelName}</span>
            ) : (
              <>
                <span className="text-muted-foreground">Select</span>
                <span className="text-blue-400 font-bold">Model</span>
              </>
            )}
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          </button>
        )}

        {onAttach && (
          <button onClick={onAttach} className="flex shrink-0 items-center gap-1.5 rounded-full bg-accent/60 px-3 py-2 hover:bg-accent transition-all text-xs font-medium text-muted-foreground hover:text-foreground">
            <ImagePlus className="w-3.5 h-3.5" />
            <span>Media</span>
          </button>
        )}

        <div className="flex-1" />

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onGenerate}
          disabled={disabled || isGenerating}
          className="shrink-0 rounded-xl bg-foreground px-6 py-2.5 text-xs font-semibold text-background transition-all disabled:opacity-30"
        >
          {isGenerating ? (
            <div className="mx-auto h-3.5 w-3.5 rounded-full border-2 border-background/30 border-t-background animate-spin" />
          ) : generateLabel}
        </motion.button>
      </div>
    </div>
  );
};

export default UnifiedInputBar;
