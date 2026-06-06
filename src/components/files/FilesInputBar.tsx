import { useState, useRef, useEffect, forwardRef, useImperativeHandle, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Paperclip, Image, Globe, ArrowUp, Loader2, X, FileText, Square } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import MentionDropdown from "@/components/chat/MentionDropdown";
import type { AgentDef } from "@/lib/agentRegistry";

interface AttachedFile {
  name: string;
  type: string;
  data: string;
}

export interface FilesInputBarRef {
  focus: () => void;
}

interface FilesInputBarProps {
  compact?: boolean;
  input: string;
  onInputChange: (val: string) => void;
  onSubmit: () => void;
  onCancel?: () => void;
  isGenerating: boolean;
  activeAgent: string | null;
  onAgentChange: (id: string | null) => void;
  attachedFiles: AttachedFile[];
  onAttach: (type: "file" | "image") => void;
  onRemoveAttachment: (index: number) => void;
  searchEnabled: boolean;
  onToggleSearch: () => void;
}

const FILE_PLACEHOLDERS = [
  "Write a professional business proposal...",
  "Create a detailed report about...",
  "Create a structured presentation about...",
  "Summarize this document for me...",
];

const FilesInputBar = forwardRef<FilesInputBarRef, FilesInputBarProps>(({
  compact, input, onInputChange, onSubmit, isGenerating,
  activeAgent, onAgentChange, attachedFiles, onAttach,
  onRemoveAttachment, searchEnabled, onToggleSearch,
}, ref) => {
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [displayedPlaceholder, setDisplayedPlaceholder] = useState("");
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef(input);
  const skipPlaceholderReset = useRef(false);

  useImperativeHandle(ref, () => ({ focus: () => textareaRef.current?.focus() }));
  useEffect(() => { inputRef.current = input; }, [input]);

  useEffect(() => {
    if (inputRef.current) { setDisplayedPlaceholder(""); return; }
    const target = FILE_PLACEHOLDERS[placeholderIdx];
    let i = 0;
    setDisplayedPlaceholder("");
    const t = setInterval(() => {
      if (inputRef.current) { clearInterval(t); setDisplayedPlaceholder(""); return; }
      if (i < target.length) { setDisplayedPlaceholder(target.slice(0, i + 1)); i++; }
      else { clearInterval(t); setTimeout(() => { skipPlaceholderReset.current = true; setPlaceholderIdx(p => (p + 1) % FILE_PLACEHOLDERS.length); }, 2500); }
    }, 50);
    return () => clearInterval(t);
  }, [placeholderIdx]);

  useEffect(() => {
    if (input) setDisplayedPlaceholder("");
    else if (!skipPlaceholderReset.current) setPlaceholderIdx(p => (p + 1) % FILE_PLACEHOLDERS.length);
    skipPlaceholderReset.current = false;
  }, [input]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.style.height = "auto";
      const minH = focused || input ? 64 : (compact ? 40 : 56);
      el.style.height = Math.max(Math.min(el.scrollHeight, 180), minH) + "px";
    });
  }, [input, focused, compact]);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    onInputChange(val);
    const cursorPos = e.target.selectionStart;
    const before = val.slice(0, cursorPos);
    const atMatch = before.match(/@(\w*)$/);
    if (atMatch) { setMentionOpen(true); setMentionQuery(atMatch[1]); }
    else { setMentionOpen(false); setMentionQuery(""); }
  }, [onInputChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // On mobile, Enter = new line (like ChatGPT). On desktop, Enter = send.
    if (e.key === "Enter" && !e.shiftKey && !isMobile) {
      e.preventDefault();
      if (!mentionOpen) onSubmit();
    }
  }, [mentionOpen, onSubmit, isMobile]);

  const handleAgentSelect = useCallback((agent: AgentDef) => {
    const cursorPos = textareaRef.current?.selectionStart || input.length;
    const before = input.slice(0, cursorPos).replace(/@\w*$/, "");
    const after = input.slice(cursorPos);
    onInputChange(before + after);
    onAgentChange(agent.id);
    setMentionOpen(false);
    setMentionQuery("");
    setTimeout(() => textareaRef.current?.focus(), 50);
  }, [input, onInputChange, onAgentChange]);

  return (
    <div className={`files-input-container ${compact ? "max-w-2xl mx-auto w-full" : "max-w-xl mx-auto w-full"}`}>
      {attachedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {attachedFiles.map((f, i) => (
            <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-secondary text-xs text-foreground">
              {f.type === "image" ? <Image className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
              <span className="truncate max-w-[100px]">{f.name}</span>
              <button onClick={() => onRemoveAttachment(i)} className="text-muted-foreground hover:text-foreground"><X className="w-3 h-3" /></button>
            </div>
          ))}
        </div>
      )}
      <div className="relative">
        <AnimatePresence>
          {mentionOpen && (
            <MentionDropdown query={mentionQuery} onSelect={handleAgentSelect} onClose={() => setMentionOpen(false)} visible={mentionOpen} categories={["files"]} />
          )}
        </AnimatePresence>
        <div className={`flex items-end gap-2 rounded-2xl border bg-secondary/80 backdrop-blur-sm px-4 py-3 transition-all duration-200 ${focused ? "border-primary/30 shadow-[0_0_20px_rgba(139,92,246,0.08)]" : "border-border/50"}`}>
          <div className="relative" ref={menuRef}>
            <button onClick={() => setMenuOpen(!menuOpen)} type="button" tabIndex={-1} className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
              <Plus className="w-5 h-5" />
            </button>
            <AnimatePresence>
              {menuOpen && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="absolute bottom-full mb-2 left-0 z-40 w-48 liquid-glass rounded-xl shadow-lg p-1">
                  <button onClick={() => { setMenuOpen(false); onAttach("file"); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm text-foreground hover:bg-accent/30"><Paperclip className="w-4 h-4" /> Attach file</button>
                  <button onClick={() => { setMenuOpen(false); onAttach("image"); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm text-foreground hover:bg-accent/30"><Image className="w-4 h-4" /> Attach image</button>
                  <button onClick={() => { setMenuOpen(false); onToggleSearch(); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm text-foreground hover:bg-accent/30">
                    <Globe className={`w-4 h-4 ${searchEnabled ? "text-primary" : ""}`} /> {searchEnabled ? "Web search ON" : "Web search"}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder={displayedPlaceholder || "Describe what you need..."}
              rows={1}
              autoComplete="off"
              autoCorrect="off"
              enterKeyHint="enter"
              className="w-full bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground/60 py-2 max-h-[180px] select-text"
              style={{ minHeight: focused || input ? "64px" : (compact ? "40px" : "56px") }}
            />
          </div>
          <button
            onClick={onSubmit}
            disabled={(!input.trim() && attachedFiles.length === 0) || isGenerating}
            type="button"
            tabIndex={-1}
            className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-20"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
});

FilesInputBar.displayName = "FilesInputBar";
export default FilesInputBar;
