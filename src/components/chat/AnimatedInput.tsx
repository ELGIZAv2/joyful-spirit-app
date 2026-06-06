import { useState, useEffect, useRef, useMemo, useCallback, useDeferredValue } from "react";
import { Plus, ArrowUp, Square, X, Sparkles, Loader2, Pencil } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import MentionDropdown from "./MentionDropdown";
import ModelPickerDropdown from "@/components/model-picker/ModelPickerDropdown";
import type { AgentDef, AgentModel } from "@/lib/agentRegistry";
import { getAgentById } from "@/lib/agentRegistry";
import { TypingAnimation } from "@/components/ui/typing-animation";
import { isSendKey } from "@/lib/composerKey";

interface SmartQuestion {
  title: string;
  options: string[];
  allowText?: boolean;
}

interface AnimatedInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onCancel?: () => void;
  onPlusClick: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  placeholders?: string[];
  pendingQuestions?: SmartQuestion[];
  onQuestionAnswer?: (answer: string) => void;
  onQuestionSkip?: () => void;
  activeAgent?: string | null;
  activeAgentDef?: AgentDef | null;
  onAgentSelect?: (agent: AgentDef) => void;
  onAgentRemove?: () => void;
  mentionCategories?: string[];
  selectedModel?: AgentModel | null;
  onModelSelect?: (model: AgentModel) => void;
  onModelRemove?: () => void;
  accentMode?: "learn" | null;
  headerSlot?: React.ReactNode;
  inlineSlot?: React.ReactNode;
  isEditing?: boolean;
  onCancelEdit?: () => void;
}

const DEFAULT_PLACEHOLDERS = [
  "Ask Megsy anything…",
  "Start your next project with one idea…",
  "Design, write, research — all in one place",
  "Type a question and let's get started",
];



const AnimatedInput = ({ value, onChange, onSend, onCancel, onPlusClick, disabled, isLoading, placeholders, pendingQuestions, onQuestionAnswer, onQuestionSkip, activeAgent, activeAgentDef, onAgentSelect, onAgentRemove, mentionCategories, selectedModel, onModelSelect, onModelRemove, accentMode, headerSlot, inlineSlot, isEditing, onCancelEdit }: AnimatedInputProps) => {
  const deferredValue = useDeferredValue(value);
  const items = useMemo(() => placeholders && placeholders.length > 0 ? placeholders : DEFAULT_PLACEHOLDERS, [placeholders]);
  const [placeholderIndex, setPlaceholderIndex] = useState(() => Math.floor(Math.random() * items.length));
  const [displayedPlaceholder, setDisplayedPlaceholder] = useState("");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [questionInput, setQuestionInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const placeholderTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const placeholderIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const valueRef = useRef(value);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [modelPickerOpen, setModelPickerOpen] = useState(false);
  const [modelQuery, setModelQuery] = useState("");
  const [lastSelectedAgent, setLastSelectedAgent] = useState<AgentDef | null>(null);




  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const hasQuestions = !!pendingQuestions?.length;
  const safeQuestionIndex = hasQuestions ? Math.min(questionIndex, pendingQuestions!.length - 1) : 0;
  const currentQuestion = hasQuestions ? pendingQuestions![safeQuestionIndex] : null;

  // Get models for active agent OR last selected agent
  const activeAgentModels = useMemo(() => {
    if (lastSelectedAgent?.models?.length) return lastSelectedAgent.models;
    if (!activeAgent) return [];
    const agent = getAgentById(activeAgent);
    return agent?.models || [];
  }, [activeAgent, lastSelectedAgent]);

  // Static placeholder that quietly rotates every few seconds (no per-char typing,
  // which previously caused 20fps re-renders and a "reloading" feel while typing/streaming).
  useEffect(() => {
    setDisplayedPlaceholder(items[placeholderIndex] || DEFAULT_PLACEHOLDERS[0]);
  }, [placeholderIndex, items]);

  useEffect(() => {
    if (value) return; // pause rotation while user is typing
    const id = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % items.length);
    }, 5000);
    return () => clearInterval(id);
  }, [value, items]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Escape" && (mentionOpen || modelPickerOpen)) {
      setMentionOpen(false);
      setModelPickerOpen(false);
      return;
    }
    // Desktop: Enter sends. Mobile: Enter inserts a newline (no preventDefault).
    if (isSendKey(e)) {
      e.preventDefault();
      if (mentionOpen || modelPickerOpen) { setMentionOpen(false); setModelPickerOpen(false); return; }
      if (value.trim() && !disabled && !isLoading) onSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    onChange(newVal);
    
    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = newVal.slice(0, cursorPos);

    // Check for # model picker (when agent with models is selected)
    if ((activeAgent || lastSelectedAgent) && activeAgentModels.length > 0) {
      const hashMatch = textBeforeCursor.match(/#(\w*)$/);
      if (hashMatch) {
        setModelPickerOpen(true);
        setModelQuery(hashMatch[1]);
        setMentionOpen(false);
        return;
      }
    }

    // Check for @ mention
    const atMatch = textBeforeCursor.match(/@(\w*)$/);
    if (atMatch) {
      setMentionOpen(true);
      setMentionQuery(atMatch[1]);
      setModelPickerOpen(false);
    } else {
      setMentionOpen(false);
      setMentionQuery("");
      if (!textBeforeCursor.match(/#(\w*)$/)) {
        setModelPickerOpen(false);
        setModelQuery("");
      }
    }
  };

  const handleMentionSelect = (agent: AgentDef) => {
    const cursorPos = textareaRef.current?.selectionStart || value.length;
    const textBeforeCursor = value.slice(0, cursorPos);
    const cleanedBefore = textBeforeCursor.replace(/@\w*$/, "");
    const textAfter = value.slice(cursorPos);
    // Keep @agent visible in input
    const agentTag = `@${agent.label} `;
    const newVal = cleanedBefore + agentTag + textAfter;
    onChange(newVal);
    setMentionOpen(false);
    setMentionQuery("");
    setLastSelectedAgent(agent);
    onAgentSelect?.(agent);

    // Auto-open model picker if agent has models
    if (agent.models && agent.models.length > 0) {
      setTimeout(() => {
        // Insert # and open model picker
        const pos = (cleanedBefore + agentTag).length;
        onChange(cleanedBefore + agentTag + "#" + textAfter);
        setModelPickerOpen(true);
        setModelQuery("");
      }, 50);
    }
  };

  const handleModelSelect = (model: AgentModel) => {
    // Replace #query with #model-label and keep it visible
    const cursorPos = textareaRef.current?.selectionStart || value.length;
    const textBeforeCursor = value.slice(0, cursorPos);
    const cleanedBefore = textBeforeCursor.replace(/#\w*$/, "");
    const textAfter = value.slice(cursorPos);
    const modelTag = `#${model.label} `;
    onChange(cleanedBefore + modelTag + textAfter);
    setModelPickerOpen(false);
    setModelQuery("");
    onModelSelect?.(model);
  };

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      const maxH = typeof window !== "undefined" && window.innerWidth < 768 ? 120 : 160;
      el.style.height = Math.min(el.scrollHeight, maxH) + "px";
    }
  }, []);

  useEffect(() => {
    autoResize();
  }, [value, autoResize]);

  useEffect(() => {
    setQuestionIndex(0);
    setQuestionInput("");
  }, [pendingQuestions]);

  const moveToNextQuestion = () => {
    if (!pendingQuestions?.length) return;
    if (safeQuestionIndex < pendingQuestions.length - 1) {
      setQuestionIndex((prev) => prev + 1);
    } else {
      setQuestionIndex(0);
    }
    setQuestionInput("");
  };

  const handleQuestionSelect = (option: string) => {
    onQuestionAnswer?.(option);
    moveToNextQuestion();
  };

  const handleQuestionTextSend = () => {
    if (!questionInput.trim()) return;
    onQuestionAnswer?.(questionInput.trim());
    moveToNextQuestion();
  };

  return (
    <div className="relative">
      <AnimatePresence>
        {mentionOpen && (
          <MentionDropdown
            query={mentionQuery}
            onSelect={handleMentionSelect}
            onClose={() => setMentionOpen(false)}
            visible={mentionOpen}
            categories={mentionCategories}
          />
        )}
        {modelPickerOpen && activeAgentModels.length > 0 && (
          <ModelPickerDropdown
            models={activeAgentModels}
            query={modelQuery}
            onSelect={handleModelSelect}
            onClose={() => setModelPickerOpen(false)}
          />
        )}
      </AnimatePresence>
      {/* Floating chips ABOVE the input (no border / no surface) */}
      {headerSlot && (
        <div className="mb-2 flex justify-start pointer-events-auto px-1">
          {headerSlot}
        </div>
      )}

      {/* Desktop: subtle semantic border wrapper (no glow / no shadow) */}
      <div className="md:rounded-[26px] md:p-[1px] md:bg-border/60">
      <div className="chat-composer-frame pointer-events-auto rounded-[1.35rem] px-4 pt-1 pb-2 relative z-10 bg-background md:bg-card md:rounded-[25px] md:px-3.5 md:pt-3.5 md:pb-3 md:border md:border-foreground/[0.02]">
        <AnimatePresence>
          {hasQuestions && currentQuestion && (
            <motion.div
              initial={{ opacity: 0, y: 6, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: 4, height: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              className="overflow-hidden"
            >
              {/* Fused into the composer surface — no separate panel, no border strip */}
              <div className="px-1.5 pt-1 pb-2.5">
                <div className="flex items-center justify-between mb-2 gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="inline-flex items-center justify-center w-4 h-4 rounded-full shrink-0"
                      style={{
                        background: "linear-gradient(135deg, hsl(var(--primary) / 0.18), hsl(var(--primary) / 0.05))",
                      }}
                    >
                      <Sparkles className="w-2.5 h-2.5 text-primary" strokeWidth={2.5} />
                    </span>
                    <span className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground shrink-0">
                      Megsy is asking
                    </span>
                    {pendingQuestions!.length > 1 && (
                      <span className="text-[10px] text-muted-foreground/70 shrink-0">
                        · {safeQuestionIndex + 1}/{pendingQuestions!.length}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={onQuestionSkip}
                    className="p-1 rounded-md text-muted-foreground/70 hover:text-foreground hover:bg-foreground/[0.06] transition-colors shrink-0"
                    aria-label="Skip question"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-[13.5px] font-medium text-foreground/95 leading-snug mb-2.5 px-0.5" dir="auto">
                  {currentQuestion.title}
                </p>

                <div className="flex flex-wrap gap-1.5">
                  {currentQuestion.options.map((opt, i) => (
                    <motion.button
                      key={`${opt}-${i}`}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.03 * i, duration: 0.25 }}
                      whileTap={{ scale: 0.96 }}
                      whileHover={{ y: -1 }}
                      onClick={() => handleQuestionSelect(opt)}
                      className="group/pill relative px-3 py-1.5 rounded-full text-[12.5px] font-medium text-foreground/85 hover:text-foreground transition-colors"
                      style={{
                        background: "hsl(var(--foreground) / 0.045)",
                        border: "1px solid hsl(var(--foreground) / 0.08)",
                        boxShadow: "inset 0 1px 0 hsl(var(--foreground) / 0.04)",
                      }}
                      dir="auto"
                    >
                      <span className="relative z-10">{opt}</span>
                      <span
                        aria-hidden
                        className="absolute inset-0 rounded-full opacity-0 group-hover/pill:opacity-100 transition-opacity"
                        style={{
                          background: "linear-gradient(135deg, hsl(var(--primary) / 0.10), hsl(var(--primary) / 0.02))",
                          border: "1px solid hsl(var(--primary) / 0.28)",
                        }}
                      />
                    </motion.button>
                  ))}
                </div>

                {currentQuestion.allowText && (
                  <div className="flex items-center gap-2 mt-2.5 px-0.5">
                    <input
                      type="text"
                      autoComplete="off"
                      dir="auto"
                      value={questionInput}
                      onChange={(e) => setQuestionInput(e.target.value)}
                      onKeyDown={(e) => {
                        e.stopPropagation();
                        if (e.key === "Enter") { e.preventDefault(); handleQuestionTextSend(); }
                      }}
                      placeholder="Type your own answer…"
                      className="flex-1 bg-transparent border-none px-0 py-0.5 text-[13px] text-foreground outline-none placeholder:text-muted-foreground/50"
                    />
                    <button
                      onClick={handleQuestionTextSend}
                      disabled={!questionInput.trim()}
                      className="w-6 h-6 flex items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-25 transition-opacity"
                      aria-label="Send answer"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {/* hairline separator that visually fuses the card with the textarea below */}
                <div className="mt-2.5 h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>


        {/* Textarea — full width, on top */}
        <div className="px-1">
          {/* Inline service chip — lives inside the input box and pushes the textarea down */}
          <AnimatePresence>
            {isEditing && (
              <motion.div
                key="editing-chip"
                initial={{ opacity: 0, y: -4, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -4, height: 0 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="overflow-hidden"
              >
                <div className="flex items-center pt-1 pb-1.5">
                  <span className="inline-flex items-center gap-1.5 rounded-full pl-3 pr-1 py-1 text-[12px] font-semibold bg-primary/15 text-primary">
                    <Pencil className="w-3 h-3" strokeWidth={2.4} />
                    <span className="leading-none">Edit</span>
                    <button
                      type="button"
                      onClick={onCancelEdit}
                      className="ml-0.5 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-current/15 transition-colors"
                      aria-label="Cancel edit"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                </div>
              </motion.div>
            )}
            {activeAgentDef && (
              <motion.div
                key={activeAgentDef.id}
                initial={{ opacity: 0, y: -4, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -4, height: 0 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="overflow-hidden md:hidden"
              >
                <div className="flex items-center pt-1 pb-1.5">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full pl-3 pr-1 py-1 text-[12px] font-semibold ${activeAgentDef.bg} ${activeAgentDef.color}`}
                  >
                    <span className="leading-none">{activeAgentDef.label}</span>
                    <button
                      type="button"
                      onClick={onAgentRemove}
                      className="ml-0.5 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-current/15 transition-colors"
                      aria-label={`Remove ${activeAgentDef.label}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative">
          {!value && displayedPlaceholder && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 flex items-start px-1 pt-2 text-[15.5px] md:text-sm text-muted-foreground leading-relaxed overflow-hidden"
            >
              <AnimatePresence mode="wait">
                <motion.span
                  key={displayedPlaceholder}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.35 }}
                  className="truncate"
                >
                  {displayedPlaceholder}
                </motion.span>
              </AnimatePresence>
            </div>
          )}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder=""
            rows={1}
            className="relative w-full bg-transparent border-none outline-none resize-none text-[15.5px] md:text-sm text-foreground py-1.5 px-1 leading-relaxed md:py-2"
            style={{ minHeight: "38px" }}
          />
          </div>
        </div>

        {/* Bottom controls row */}
        <div dir="ltr" className="relative flex items-center gap-2 pt-1 -ml-3 -mr-1 md:ml-0 md:mr-0 md:pt-0">
          <motion.button
            whileTap={{ scale: 0.92 }}
            transition={{ type: "spring", stiffness: 400, damping: 22 }}
            type="button"
            onClick={onPlusClick}
            className={`shrink-0 w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-full transition-colors bg-transparent border-0 ${
              accentMode === "learn"
                ? "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                : "text-foreground/85 hover:text-foreground hover:bg-foreground/10"
            }`}
            aria-label="Open attachments"
            data-plus-trigger
          >
            <Plus className="w-[22px] h-[22px] md:w-5 md:h-5" strokeWidth={2} />
          </motion.button>

          <div className="flex-1" />

          {inlineSlot}

          <AnimatePresence mode="popLayout" initial={false}>
            {isLoading ? (
              <motion.button
                key="stop"
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{ type: "spring", stiffness: 380, damping: 22 }}
                whileTap={{ scale: 0.9 }}
                onClick={onCancel}
                className="shrink-0 w-9 h-9 md:h-10 md:w-10 flex items-center justify-center rounded-full bg-foreground text-background md:ios26-button"
                aria-label="Stop generation"
              >
                <Square className="w-3.5 h-3.5" fill="currentColor" />
              </motion.button>
            ) : value.trim() ? (
              <motion.button
                key="send"
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{ type: "spring", stiffness: 380, damping: 22 }}
                whileTap={{ scale: 0.9 }}
                onClick={onSend}
                disabled={disabled}
                className="shrink-0 w-9 h-9 md:h-10 md:w-10 flex items-center justify-center rounded-full bg-foreground text-background hover:bg-foreground/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Send message"
              >
                <ArrowUp className="w-[18px] h-[18px] md:w-4 md:h-4" strokeWidth={2} />
              </motion.button>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
      </div>
    </div>
  );
};

export default AnimatedInput;
