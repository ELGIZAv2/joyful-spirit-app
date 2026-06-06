// @ts-nocheck — imported design from external repo; backend wiring deferred.
import { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Copy, ThumbsUp, ThumbsDown, MoreHorizontal, Check, Database, Send, Loader2 } from "lucide-react";
import CodeStepMessage, { CodeStep } from "./CodeStepMessage";
import { toast } from "sonner";

export interface ChatMsg {
  role: "user" | "assistant" | "system";
  content: string;
  type?: "plan" | "build" | "log" | "status" | "steps" | "timeline" | "api_key_request";
  // Optional metadata for assistant messages
  meta?: {
    durationMs?: number;
    credits?: number;
  };
  // For api_key_request type
  apiKeyName?: string;
  apiKeyDescription?: string;
  apiKeyResolved?: boolean;
}

interface Props {
  messages: ChatMsg[];
  steps: CodeStep[];
  activeStepId: string | null;
  isThinking: boolean;
  onSubmitApiKey?: (name: string, value: string) => void;
}

const VISIBLE_LIMIT = 60;

const fmtDuration = (ms?: number) => {
  if (!ms || ms < 0) return "—";
  if (ms < 1000) return `${ms}ms`;
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)}s`;
  const m = Math.floor(s / 60);
  const rs = Math.round(s - m * 60);
  return `${m}m ${rs}s`;
};

const ApiKeyCard = ({ msg, onSubmit }: { msg: ChatMsg; onSubmit?: (n: string, v: string) => void }) => {
  const [val, setVal] = useState("");
  const [busy, setBusy] = useState(false);
  const handle = async () => {
    if (!val.trim()) return;
    setBusy(true);
    onSubmit?.(msg.apiKeyName || "", val.trim());
    setVal("");
    setBusy(false);
  };
  return (
    <div className="rounded-2xl border border-border/60 bg-card/90 backdrop-blur-xl p-4 my-1 max-w-md">
      <div className="flex items-center gap-2 mb-2">
        <Database className="w-4 h-4 text-emerald-500" />
        <p className="text-sm font-semibold text-foreground">{msg.apiKeyName || "API Key"}</p>
      </div>
      {msg.apiKeyDescription && (
        <p className="text-xs text-muted-foreground mb-3" dir="auto">{msg.apiKeyDescription}</p>
      )}
      {msg.apiKeyResolved ? (
        <div className="flex items-center gap-2 text-xs text-emerald-500">
          <Check className="w-4 h-4" /> Saved securely
        </div>
      ) : (
        <div className="flex items-center gap-1.5 rounded-xl border border-border/60 bg-background/60 pl-3 pr-1 py-1">
          <input
            type="password"
            value={val}
            onChange={e => setVal(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handle(); }}
            placeholder="Paste your key here..."
            className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground/60 py-1.5"
          />
          <button
            onClick={handle}
            disabled={!val.trim() || busy}
            className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-30"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      )}
    </div>
  );
};

const AssistantActions = ({ msg, onLike }: { msg: ChatMsg; onLike?: (v: boolean | null) => void }) => {
  const [reaction, setReaction] = useState<boolean | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try { await navigator.clipboard.writeText(msg.content); setCopied(true); setTimeout(() => setCopied(false), 1500); }
    catch { toast.error("Copy failed"); }
  };

  const setReact = (v: boolean) => {
    const next = reaction === v ? null : v;
    setReaction(next);
    onLike?.(next);
  };

  return (
    <div className="flex items-center gap-1 mt-1.5 -ml-1.5 relative">
      <button onClick={copy} className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-colors" title="Copy">
        {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
      <button onClick={() => setReact(true)} className={`h-8 w-8 rounded-lg flex items-center justify-center hover:bg-accent/40 transition-colors ${reaction === true ? "text-primary" : "text-muted-foreground hover:text-foreground"}`} title="Like">
        <ThumbsUp className="w-3.5 h-3.5" />
      </button>
      <button onClick={() => setReact(false)} className={`h-8 w-8 rounded-lg flex items-center justify-center hover:bg-accent/40 transition-colors ${reaction === false ? "text-destructive" : "text-muted-foreground hover:text-foreground"}`} title="Dislike">
        <ThumbsDown className="w-3.5 h-3.5" />
      </button>
      <div className="relative">
        <button onClick={() => setMoreOpen(o => !o)} className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-colors" title="More">
          <MoreHorizontal className="w-3.5 h-3.5" />
        </button>
        <AnimatePresence>
          {moreOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setMoreOpen(false)} />
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.96 }}
                className="absolute top-full mt-1 left-0 z-40 w-56 rounded-2xl bg-card/95 backdrop-blur-2xl border border-border/60 shadow-2xl p-3"
              >
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 font-semibold">Details</p>
                <div className="flex justify-between text-xs text-foreground py-1">
                  <span className="text-muted-foreground">Time</span>
                  <span className="font-mono">{fmtDuration(msg.meta?.durationMs)}</span>
                </div>
                <div className="flex justify-between text-xs text-foreground py-1">
                  <span className="text-muted-foreground">Credits</span>
                  <span className="font-mono">{msg.meta?.credits != null ? `${msg.meta.credits} MC` : "—"}</span>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const CodeChatContainer = ({ messages, steps, activeStepId, isThinking, onSubmitApiKey }: Props) => {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, steps]);

  const visibleMessages = messages.slice(-VISIBLE_LIMIT);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 max-w-3xl mx-auto w-full space-y-3">
      <AnimatePresence mode="popLayout">
        {visibleMessages.map((msg, i) => (
          <motion.div
            key={`msg-${i}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className={msg.role === "user" ? "flex justify-end" : ""}
          >
            {msg.role === "user" ? (
              <div className="max-w-[80%] bg-card border border-border/60 text-foreground px-4 py-2.5 rounded-2xl rounded-br-md text-sm shadow-sm" dir="auto">
                {msg.content}
              </div>
            ) : msg.type === "steps" ? null : msg.type === "api_key_request" ? (
              <ApiKeyCard msg={msg} onSubmit={onSubmitApiKey} />
            ) : (
              <div>
                <div className="text-foreground text-sm prose-chat" dir="auto">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
                {!(isThinking && i === visibleMessages.length - 1) && <AssistantActions msg={msg} />}
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Steps rendered inline */}
      {steps.length > 0 && (
        <div className="space-y-0.5">
          {steps.map(step => (
            <CodeStepMessage
              key={step.id}
              step={step}
              isActive={step.id === activeStepId}
            />
          ))}
        </div>
      )}

      <div ref={endRef} />
    </div>
  );
};

export default CodeChatContainer;
