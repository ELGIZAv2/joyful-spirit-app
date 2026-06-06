import { useState, useCallback, useMemo, useRef, memo, lazy, Suspense } from "react";
import {
  GlassSheet,
  GlassSheetContent,
} from "@/components/ui/glass-sheet";
import { Copy, ThumbsUp, ThumbsDown, Check, Play, FileUp, Share2, Pencil, Type, Ellipsis, Link2, ChevronDown, Sparkles } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { motion, AnimatePresence } from "framer-motion";
import MegsyStar from "@/components/files/MegsyStar";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import { visit, SKIP } from "unist-util-visit";
import { toString } from "mdast-util-to-string";
import { toast } from "sonner";
import ThinkingLoader from "./ThinkingLoader";
import { detectLang, langDir } from "@/lib/detectLang";
import { parseLearnSegments, hasLearnCards } from "@/lib/learnCardParser";

// Heavy / conditionally-rendered components — lazy load
const FlowCard = lazy(() => import("@/components/showcase/FlowCard"));
const InfoCards = lazy(() => import("@/components/showcase/InfoCards"));
const CodePreviewModal = lazy(() => import("@/components/modals/CodePreviewModal"));
const ImagePreviewModal = lazy(() => import("@/components/modals/ImagePreviewModal"));
const DeepResearchCard = lazy(() => import("@/components/chat/DeepResearchCard"));
const ResearchNarration = lazy(() => import("@/components/research/ResearchNarration"));
const LearnCard = lazy(() => import("@/components/learn/LearnCard"));
const StepFlowCards = lazy(() => import("@/components/chat/StepFlowCards"));
import { parseSteps } from "@/components/chat/StepFlowCards";
import CodeBlock from "@/components/chat/CodeBlock";
import { parseSlidesOutline } from "@/lib/slidesOutlineParser";
import { ChainOfThought, ChainOfThoughtStep, ChainOfThoughtTrigger, ChainOfThoughtContent, ChainOfThoughtItem } from "@/components/prompt-kit/chain-of-thought";
import { Message, MessageContent } from "@/components/prompt-kit/message";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  messageIndex?: number;
  isStreaming?: boolean;
  isThinking?: boolean;
  images?: string[];
  products?: { title: string; price: string; image?: string; link?: string; seller?: string; rating?: string | null; delivery?: string | null }[];
  attachedImages?: string[];
  attachedFiles?: { name: string; type: string }[];
  onLike?: (liked: boolean | null) => void;
  onLikeMessage?: (index: number, liked: boolean | null) => void;
  liked?: boolean | null;
  onShare?: () => void;
  onStructuredAction?: (text: string) => void;
  searchStatus?: string;
  onEditUserMessage?: (text: string) => void;
  onEditUserMessageAt?: (index: number, text: string) => void;
  isDeepResearch?: boolean;
  isSlidesMode?: boolean;
  isLearningMode?: boolean;
  researchQuery?: string;
  researchSessionKey?: string;
  narrations?: string[];
  senderName?: string | null;
  senderAvatar?: string | null;
  isOtherMember?: boolean;
  bubbleColor?: { bg: string; text: string } | null;
  messageId?: string;
  reactions?: { id: string; emoji: string; user_id: string }[];
  onToggleReaction?: (messageId: string, emoji: string) => void;
  currentUserId?: string;
  usersById?: Record<string, { name?: string; avatar?: string }>;
  readers?: { user_id: string; name?: string; avatar?: string }[];
  showReaders?: boolean;
  /** Optional slot rendered between message body and the action buttons. Used for artifact cards (docs/slides) so actions appear below the artifact. */
  bottomSlot?: React.ReactNode;
  /** Hide action buttons (copy/like/dislike) — used when an interactive clarify card is shown below. */
  hideActions?: boolean;
}

const getDomain = (url: string) => {
  try { return new URL(url).hostname.replace("www.", ""); } catch { return url; }
};

const getFavicon = (url: string) => {
  try { return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=32`; } catch { return null; }
};

function parseStructuredBlocks(content: string): { type: "text" | "questions" | "flow" | "cards"; data: any; raw: string }[] {
  const blocks: { type: "text" | "questions" | "flow" | "cards"; data: any; raw: string }[] = [];
  const jsonBlockRegex = /```json\s*\n?([\s\S]*?)\n?```/g;
  let lastIndex = 0;
  let match;

  while ((match = jsonBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      const textBefore = content.slice(lastIndex, match.index).trim();
      if (textBefore) blocks.push({ type: "text", data: textBefore, raw: textBefore });
    }
    try {
      const parsed = JSON.parse(match[1]);
      if (parsed.type === "questions" && parsed.questions) {
        blocks.push({ type: "questions", data: parsed, raw: match[0] });
      } else if (parsed.type === "flow" && parsed.steps) {
        blocks.push({ type: "flow", data: parsed, raw: match[0] });
      } else if (parsed.type === "cards" && parsed.items) {
        blocks.push({ type: "cards", data: parsed, raw: match[0] });
      } else {
        blocks.push({ type: "text", data: match[0], raw: match[0] });
      }
    } catch {
      blocks.push({ type: "text", data: match[0], raw: match[0] });
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    const remaining = content.slice(lastIndex).trim();
    if (remaining) blocks.push({ type: "text", data: remaining, raw: remaining });
  }
  if (blocks.length === 0 && content.trim()) {
    blocks.push({ type: "text", data: content, raw: content });
  }
  return blocks;
}

const isPreviewableCode = (lang: string | undefined, code: string): boolean => {
  if (!lang) return false;
  const previewableLangs = ["html", "htm", "jsx", "tsx", "javascript", "js"];
  return previewableLangs.includes(lang.toLowerCase());
};

const wrapCodeForPreview = (lang: string, code: string): string => {
  if (["html", "htm"].includes(lang.toLowerCase())) {
    return code;
  }
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#111}</style>
</head><body>
<div id="root"></div>
<script>${code}</script>
</body></html>`;
};

const wrapEnglishInBdi = (text: string): (string | React.ReactElement)[] => {
  const parts: (string | React.ReactElement)[] = [];
  const regex = /[A-Za-z0-9_./:\-]+/g;
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(<bdi key={match.index}>{match[0]}</bdi>);
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts.length > 0 ? parts : [text];
};

const BidiText = ({ children }: { children: React.ReactNode }) => {
  if (typeof children === "string") {
    return <>{wrapEnglishInBdi(children)}</>;
  }
  if (Array.isArray(children)) {
    return <>{children.map((child, i) => typeof child === "string" ? <span key={i}>{wrapEnglishInBdi(child)}</span> : child)}</>;
  }
  return <>{children}</>;
};

const formatRawUrls = (text: string): string => {
  const parts = text.split(/(\[[^\]]*\]\([^)]+\))/g);
  return parts.map(part => {
    if (/^\[[^\]]*\]\([^)]+\)$/.test(part)) return part;
    return part.replace(
      /(?<!\]\()https?:\/\/[^\s<>")\]]+/g,
      (url) => {
        const cleanUrl = url.replace(/[.,;:!?]+$/, '');
        try {
          const domain = new URL(cleanUrl).hostname.replace('www.', '');
          return `[${domain}](${cleanUrl})`;
        } catch {
          return cleanUrl;
        }
      }
    );
  }).join('');
};

const researchHeadingLabels = new Set([
  "Search the web",
  "Overview",
  "Key Findings",
  "Image Gallery",
  "Sources",
  "References",
  "overview",
  "key findings",
  "image gallery",
  "sources",
  "references",
]);

const normalizeResearchMarkdown = (content: string) => {
  if (!content.trim()) return { cleaned: content, extractedImages: [] as string[] };

  const extractedImages: string[] = [];
  const cleaned = content
    .replace(/!\[[^\]]*\]\((https?:\/\/[^\s)]+)\)/g, (_m, url) => {
      extractedImages.push(url);
      return "";
    })
    .replace(/^\s*##\s*Search the web\s*$/gim, "")
    .replace(/^\s*##\s*(?:Overview|Overview)\s*$/gim, "")
    .replace(/^\s*##\s*(?:Highlights|Key Findings)\s*$/gim, "")
    .replace(/^\s*##\s*(?:Gallery Images|Image Gallery)\s*$/gim, "")
    .replace(/\n+\s*(?:#{1,6}\s*)?(?:\*\*)?\s*(?:Sources|Sources|References|References)\s*[:：]?\s*(?:\*\*)?\s*\n[\s\S]*$/i, "")
    .replace(/^\s*\*\*(\d+)\.\s*\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)\*\*\s*$/gm, "### [$2]($3)")
    .replace(/^\s*Here is a summary[^\n]*$\n?/gim, "")
    .replace(/^\s*Here is a summary[^\n]*$\n?/gim, "")
    .replace(/^\s*Below is a summary[^\n]*$\n?/gim, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return {
    cleaned,
    extractedImages: extractedImages.filter((url, index, arr) => arr.indexOf(url) === index),
  };
};

const remarkCleanResearchLayout = () => {
  return (tree: any) => {
    const removeIndexes = new Set<number>();
    const children = Array.isArray(tree?.children) ? tree.children : [];

    children.forEach((node: any, index: number) => {
      if (node?.type === "heading") {
        const label = toString(node).trim().toLowerCase();
        if (researchHeadingLabels.has(label)) {
          removeIndexes.add(index);
        }
      }
    });

    visit(tree, "paragraph", (node: any, index: number | undefined, parent: any) => {
      if (typeof index !== "number" || !parent?.children) return;
      const text = toString(node).trim();
      if (/^Here is a summary/i.test(text) || /^here('?s| is) what i found/i.test(text) || /^below is a summary/i.test(text)) {
        parent.children.splice(index, 1);
        return [SKIP, index];
      }
    });

    if (removeIndexes.size > 0) {
      tree.children = children.filter((_: any, index: number) => !removeIndexes.has(index));
    }
  };
};

const looksLikeSlidesInfo = (text: string) => {
  const slideLabels = text.match(/(?:Title|Image|Text|Slide|Slide|Title|Image|Text)\s*:/gi) || [];
  const slideMarkers = text.match(/(?:^|\n)\s*(?:#{1,4}\s*)?(?:Slide|Slide)\s*\d+/gi) || [];
  return slideLabels.length >= 3 || slideMarkers.length >= 2;
};

const MarkdownRenderer = ({ content, onLinkClick, onPreviewCode }: { 
  content: string; 
  onLinkClick: (e: React.MouseEvent<HTMLAnchorElement>, href: string) => void;
  onPreviewCode?: (code: string, lang: string) => void;
}) => (
  <ReactMarkdown
    remarkPlugins={[remarkGfm, remarkBreaks, remarkCleanResearchLayout]}
    components={{
      p: ({ children }) => <p><BidiText>{children}</BidiText></p>,
      li: ({ children }) => <li><BidiText>{children}</BidiText></li>,
      strong: ({ children }) => <strong><BidiText>{children}</BidiText></strong>,
      em: ({ children }) => <em><BidiText>{children}</BidiText></em>,
      a: ({ href, children }) => (
        <a href={href} onClick={(e) => href && onLinkClick(e, href)} className="text-primary underline underline-offset-2 cursor-pointer hover:opacity-80">
          {children}
        </a>
      ),
      code: ({ className, children, ...props }) => {
        const match = /language-(\w+)/.exec(className || "");
        const lang = match ? match[1] : undefined;
        const codeStr = String(children).replace(/\n$/, "");
        const isBlock = className?.startsWith("language-");

        // Hide data-only fenced blocks consumed by upstream parsers
        // (learn-mode cards, mermaid, etc.). They have no value to the reader.
        if (isBlock && lang && ["learn", "learn_card", "cards", "json"].includes(lang)) {
          return null;
        }

        if (isBlock && lang) {
          const canPreview = isPreviewableCode(lang, codeStr);
          return (
            <CodeBlock
              code={codeStr}
              lang={lang}
              className={className}
              onPreview={canPreview && onPreviewCode ? onPreviewCode : undefined}
            />
          );
        }

        return <code className="px-1.5 py-0.5 rounded-md bg-secondary/60 border border-border/40 text-[0.875em] font-mono text-foreground" {...props}>{children}</code>;
      },
      pre: ({ children }) => <>{children}</>,
      table: ({ children }) => (
        <div className="my-4 max-w-full overflow-x-auto rounded-2xl border border-white/10 bg-zinc-900/40 backdrop-blur-xl shadow-2xl shadow-black/40">
          <table className="w-full border-collapse text-start">{children}</table>
        </div>
      ),
      thead: ({ children }) => <thead>{children}</thead>,
      tbody: ({ children }) => <tbody className="divide-y divide-white/5">{children}</tbody>,
      tr: ({ children }) => <tr className="group border-b border-white/10 last:border-0 bg-transparent first:bg-white/5 transition-colors duration-200 hover:bg-white/5">{children}</tr>,
      th: ({ children }) => <th className="px-6 py-4 text-start text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">{children}</th>,
      td: ({ children }) => <td className="px-6 py-4 text-[13px] text-zinc-400 leading-relaxed align-top first:text-zinc-200 first:font-medium group-hover:text-zinc-300 transition-colors">{children}</td>,
    }}
  >
    {formatRawUrls(content)}
  </ReactMarkdown>
);

const SelectTextModal = ({ open, onClose, text, onCopy }: { open: boolean; onClose: () => void; text: string; onCopy: () => void }) => (
  <AnimatePresence>
    {open && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ type: "spring", damping: 24, stiffness: 320 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg max-h-[80vh] flex flex-col rounded-3xl liquid-glass border border-border/30 overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <div>
              <h3 className="text-base font-semibold text-foreground">Select text</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Tap and hold to copy any part</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-accent/40 flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-3 border-t border-border/30">
            <p className="text-[14px] leading-relaxed text-foreground whitespace-pre-wrap break-words select-text" style={{ WebkitUserSelect: "text", userSelect: "text" }}>
              {text}
            </p>
          </div>
          <div className="flex justify-end gap-2 px-5 py-4 border-t border-border/30">
            <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-accent/30 transition-colors">Close</button>
            <button onClick={onCopy} className="px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-opacity flex items-center gap-2">
              <Copy className="w-3.5 h-3.5" />
              Copy all
            </button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🎉"];

const ReactionsRow = ({ reactions, currentUserId, onToggle, messageId, align }: { reactions: { id: string; emoji: string; user_id: string }[]; currentUserId?: string; onToggle?: (id: string, emoji: string) => void; messageId?: string; align: "left" | "right" }) => {
  const [pickerOpen, setPickerOpen] = useState(false);
  const grouped = useMemo(() => {
    const map: Record<string, { count: number; mine: boolean }> = {};
    for (const r of reactions) {
      if (!map[r.emoji]) map[r.emoji] = { count: 0, mine: false };
      map[r.emoji].count++;
      if (r.user_id === currentUserId) map[r.emoji].mine = true;
    }
    return Object.entries(map);
  }, [reactions, currentUserId]);
  if (!messageId || !onToggle) return null;
  if (grouped.length === 0) return null;
  return (
    <div className={`flex items-center gap-1 mt-1 flex-wrap ${align === "right" ? "justify-end" : "justify-start"}`}>
      {grouped.map(([emoji, { count, mine }]) => (
        <button
          key={emoji}
          onClick={() => onToggle(messageId, emoji)}
          className={`px-2 py-0.5 rounded-full text-[12px] flex items-center gap-1 border transition-colors ${mine ? "bg-primary/15 border-primary/40 text-foreground" : "bg-accent/30 border-border/30 text-foreground/80 hover:bg-accent/50"}`}
        >
          <span>{emoji}</span>
          <span className="text-[11px] font-medium">{count}</span>
        </button>
      ))}
      <div className="relative">
        <button
          onClick={() => setPickerOpen((v) => !v)}
          className="px-1.5 py-0.5 rounded-full text-[13px] bg-accent/20 hover:bg-accent/40 border border-border/30 text-foreground/60 transition-colors"
          aria-label="Add reaction"
        >＋</button>
        <AnimatePresence>
          {pickerOpen && (
            <>
              <button className="fixed inset-0 z-40 cursor-default" onClick={() => setPickerOpen(false)} aria-label="Close" />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 4 }}
                transition={{ duration: 0.15 }}
                className={`absolute z-50 ${align === "right" ? "right-0" : "left-0"} bottom-full mb-1 flex gap-1 p-1.5 rounded-2xl liquid-glass border border-border/30`}
              >
                {REACTION_EMOJIS.map((e) => (
                  <button
                    key={e}
                    onClick={() => { onToggle(messageId, e); setPickerOpen(false); }}
                    className="w-8 h-8 rounded-full hover:bg-accent/50 flex items-center justify-center text-[18px] transition-colors"
                  >{e}</button>
                ))}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const ReadersRow = ({ readers, align }: { readers: { user_id: string; name?: string; avatar?: string }[]; align: "left" | "right" }) => {
  if (!readers.length) return null;
  return (
    <div className={`flex items-center gap-1 mt-1 ${align === "right" ? "justify-end" : "justify-start"}`}>
      <span className="text-[10px] text-muted-foreground mr-1">Seen by</span>
      <div className="flex -space-x-1.5">
        {readers.slice(0, 4).map((r) => (
          r.avatar ? (
            <img key={r.user_id} src={r.avatar} alt={r.name || ""} title={r.name || ""} className="w-4 h-4 rounded-full border border-background object-cover" />
          ) : (
            <div key={r.user_id} title={r.name || ""} className="w-4 h-4 rounded-full border border-background bg-accent flex items-center justify-center text-[8px] font-bold text-foreground/70">
              {(r.name || "?")[0]?.toUpperCase()}
            </div>
          )
        ))}
        {readers.length > 4 && <span className="text-[10px] text-muted-foreground ml-1">+{readers.length - 4}</span>}
      </div>
    </div>
  );
};

const renderTextWithMentions = (text: string) => {
  const parts = text.split(/(@[A-Za-z0-9_]+)/g);
  return parts.map((p, i) =>
    p.startsWith("@") ? (
      <span key={i} className="px-1 rounded bg-white/25 font-semibold">{p}</span>
    ) : (
      <span key={i}>{p}</span>
    )
  );
};

const renderChildrenWithMentions = (children: React.ReactNode): React.ReactNode => {
  if (typeof children === "string") return renderTextWithMentions(children);
  if (Array.isArray(children)) {
    return children.map((c, i) =>
      typeof c === "string" ? <span key={i}>{renderTextWithMentions(c)}</span> : c
    );
  }
  return children;
};

const UserMarkdown = ({ content, onLinkClick }: { content: string; onLinkClick: (e: React.MouseEvent<HTMLAnchorElement>, href: string) => void }) => (
  <ReactMarkdown
    remarkPlugins={[remarkGfm, remarkBreaks]}
    components={{
      p: ({ children }) => <p className="m-0 [&:not(:first-child)]:mt-2">{renderChildrenWithMentions(children)}</p>,
      li: ({ children }) => <li>{renderChildrenWithMentions(children)}</li>,
      strong: ({ children }) => <strong className="font-bold">{renderChildrenWithMentions(children)}</strong>,
      em: ({ children }) => <em>{renderChildrenWithMentions(children)}</em>,
      del: ({ children }) => <del>{renderChildrenWithMentions(children)}</del>,
      a: ({ href, children }) => (
        <a href={href} onClick={(e) => href && onLinkClick(e, href)} className="underline underline-offset-2 cursor-pointer hover:opacity-80">
          {children}
        </a>
      ),
      code: ({ className, children, ...props }) => {
        const isBlock = className?.startsWith("language-");
        if (isBlock) {
          return (
            <pre className="my-2 p-2 rounded-lg bg-black/25 overflow-x-auto text-[12px] leading-relaxed">
              <code {...props}>{children}</code>
            </pre>
          );
        }
        return <code className="px-1 py-0.5 rounded bg-black/20 text-[12px] font-mono" {...props}>{children}</code>;
      },
      pre: ({ children }) => <>{children}</>,
      ul: ({ children }) => <ul className="list-disc ps-5 my-1 space-y-0.5">{children}</ul>,
      ol: ({ children }) => <ol className="list-decimal ps-5 my-1 space-y-0.5">{children}</ol>,
      blockquote: ({ children }) => <blockquote className="border-s-2 border-white/40 ps-2 my-1 opacity-90">{children}</blockquote>,
      h1: ({ children }) => <h1 className="text-base font-bold mt-1 mb-1">{renderChildrenWithMentions(children)}</h1>,
      h2: ({ children }) => <h2 className="text-base font-bold mt-1 mb-1">{renderChildrenWithMentions(children)}</h2>,
      h3: ({ children }) => <h3 className="text-sm font-bold mt-1 mb-1">{renderChildrenWithMentions(children)}</h3>,
    }}
  >
    {content}
  </ReactMarkdown>
);

const ChatMessage = ({ role, content, messageIndex, isStreaming, isThinking, images, products, attachedImages, attachedFiles, onLike, onLikeMessage, liked, onShare, onStructuredAction, searchStatus, onEditUserMessage, onEditUserMessageAt, isDeepResearch, isSlidesMode, isLearningMode, researchQuery, researchSessionKey, narrations, senderName, senderAvatar, isOtherMember, bubbleColor, messageId, reactions, onToggleReaction, currentUserId, readers, showReaders, bottomSlot, hideActions }: ChatMessageProps) => {
  const [copied, setCopied] = useState(false);
  const [slidesInfoOpen, setSlidesInfoOpen] = useState(true);
  const [researchDraftOpen, setResearchDraftOpen] = useState(true);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [previewCode, setPreviewCode] = useState<{ code: string; lang: string } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectTextOpen, setSelectTextOpen] = useState(false);
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userBubbleRef = useRef<HTMLDivElement>(null);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Copied");
  };

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  const clearLongPress = useCallback(() => {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
  }, []);

  const handleUserShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({ text: content });
        return;
      } catch {}
    }
    await navigator.clipboard.writeText(content);
    toast.success("Message copied for sharing");
  }, [content]);

  const handleSelectText = useCallback(() => {
    setSelectTextOpen(true);
  }, []);

  const handleCopyAllText = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Failed to copy");
    }
  }, [content]);

  const handleLongPressStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (role !== "user") return;
    e.preventDefault();
    longPressRef.current = setTimeout(() => {
      setMenuOpen(true);
    }, 450);
  }, [role]);

  const handleContextMenu = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (role !== "user") return;
    e.preventDefault();
    setMenuOpen(true);
  }, []);

  const handleLinkClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    window.open(href, "_blank", "width=800,height=600,scrollbars=yes,resizable=yes");
  }, []);

  const handlePreviewCode = useCallback((code: string, lang: string) => {
    setPreviewCode({ code, lang });
  }, []);

  const handleLikeAction = useCallback((nextLiked: boolean | null) => {
    if (typeof messageIndex === "number" && onLikeMessage) {
      onLikeMessage(messageIndex, nextLiked);
      return;
    }
    onLike?.(nextLiked);
  }, [messageIndex, onLike, onLikeMessage]);

  const handleEditAction = useCallback(() => {
    if (typeof messageIndex === "number" && onEditUserMessageAt) {
      onEditUserMessageAt(messageIndex, content);
      return;
    }
    onEditUserMessage?.(content);
  }, [content, messageIndex, onEditUserMessage, onEditUserMessageAt]);

  // Normalize legacy web-search markdown into a clean assistant-style message.
  const { displayContent, inlineImages } = useMemo(() => {
    if (role === "user") return { displayContent: content, inlineImages: [] as string[] };
    const normalized = normalizeResearchMarkdown(content);
    return { displayContent: normalized.cleaned, inlineImages: normalized.extractedImages };
  }, [content, role]);

  const structuredBlocks = useMemo(() => {
    if (role === "user" || isStreaming) return null;
    return parseStructuredBlocks(displayContent);
  }, [displayContent, role, isStreaming]);

  const urlRegex = /\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g;
  const links: { text: string; url: string }[] = [];
  let urlMatch;
  while ((urlMatch = urlRegex.exec(content)) !== null) {
    links.push({ text: urlMatch[1], url: urlMatch[2] });
  }
  const uniqueLinks = links.filter((link, i, arr) => arr.findIndex(l => l.url === link.url) === i);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // Other member's message → render on LEFT (assistant side) with avatar + name
  if (role === "user" && isOtherMember) {
    const initial = (senderName || "?")[0]?.toUpperCase();
    return (
      <div className="flex justify-start mb-6 gap-2.5">
        <div className="flex-shrink-0 mt-0.5">
          {senderAvatar ? (
            <img src={senderAvatar} alt={senderName || ""} className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-foreground/10 flex items-center justify-center text-xs font-semibold text-foreground/70">
              {initial}
            </div>
          )}
        </div>
        <div className="max-w-[82%] min-w-0">
          {senderName && (
            <div
              className="text-[11px] font-semibold mb-1 px-1"
              style={{ color: bubbleColor?.bg || undefined }}
            >
              {senderName}
            </div>
          )}
          {attachedImages && attachedImages.length > 0 && (
            <div className="flex gap-2 mb-2 flex-wrap">
              {attachedImages.map((img, i) => (
                <img key={i} src={img} alt="" className="rounded-xl max-h-32 max-w-[120px] object-cover" />
              ))}
            </div>
          )}
          {(() => { const l = detectLang(content); return (
          <div
            dir={langDir(l)}
            lang={l === "ar" ? "ar" : l === "en" ? "en" : undefined}
            className={`px-4 py-2.5 rounded-3xl rounded-bl-lg text-[0.9375rem] leading-relaxed select-text break-words user-bubble lang-${l}`}
            style={bubbleColor ? { background: bubbleColor.bg, color: bubbleColor.text } : { background: "hsl(var(--muted))", color: "hsl(var(--foreground))" }}
          >
            <UserMarkdown content={content} onLinkClick={handleLinkClick} />
          </div>
          ); })()}
        </div>
      </div>
    );
  }

  if (role === "user") {
    return (
      <div className="flex justify-end mb-6 relative">
        <div className="max-w-[82%]">
          {senderName && (
            <div className="flex items-center gap-1.5 mb-1 justify-end pr-1">
              <span className="text-[11px] font-medium text-muted-foreground">{senderName}</span>
              {senderAvatar ? (
                <img src={senderAvatar} alt="" className="w-4 h-4 rounded-full object-cover" />
              ) : (
                <div className="w-4 h-4 rounded-full bg-foreground/10 flex items-center justify-center text-[8px] font-semibold text-foreground/70">
                  {senderName[0]?.toUpperCase()}
                </div>
              )}
            </div>
          )}
          {attachedImages && attachedImages.length > 0 && (
            <div className="flex gap-2 mb-2 justify-end flex-wrap">
              {attachedImages.map((img, i) => (
                <img key={i} src={img} alt="" className="rounded-xl max-h-32 max-w-[120px] object-cover" />
              ))}
            </div>
          )}
          {attachedFiles && attachedFiles.length > 0 && (
            <div className="flex gap-2 mb-2 justify-end flex-wrap">
              {attachedFiles.map((f, i) => (
                <div key={i} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-muted text-xs text-foreground border border-border">
                  <FileUp className="w-3 h-3 text-muted-foreground" />
                  <span className="truncate max-w-[100px]">{f.name}</span>
                </div>
              ))}
            </div>
          )}
          {(() => { const l = detectLang(content); return (
          <div className="relative inline-block self-end group">
            <div
              ref={userBubbleRef}
              dir={langDir(l)}
              lang={l === "ar" ? "ar" : l === "en" ? "en" : undefined}
              onContextMenu={handleContextMenu}
              onTouchStart={handleLongPressStart}
              onTouchEnd={clearLongPress}
              onTouchCancel={clearLongPress}
              onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
              style={{
                background: "var(--user-bubble, #2563eb)",
                color: "var(--user-bubble-text, #ffffff)",
              }}
              className={`px-4 py-2.5 rounded-3xl rounded-br-lg text-[0.9375rem] leading-relaxed select-text break-words user-bubble lang-${l}`}
            >
              <UserMarkdown content={content} onLinkClick={handleLinkClick} />
            </div>
            {/* Desktop hover actions: copy + edit below the user bubble */}
            <div className="hidden md:flex absolute right-0 top-full mt-1.5 z-30 items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none group-hover:pointer-events-auto">
              <button
                onClick={async (e) => { e.stopPropagation(); await handleCopy(); }}
                className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-black text-white/70 hover:text-white hover:bg-neutral-900 transition-colors"
                title="Copy"
                aria-label="Copy"
              >
                <Copy className="w-3.5 h-3.5" strokeWidth={1.8} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleEditAction(); }}
                className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-black text-white/70 hover:text-white hover:bg-neutral-900 transition-colors"
                title="Edit"
                aria-label="Edit"
              >
                <Pencil className="w-3.5 h-3.5" strokeWidth={1.8} />
              </button>
            </div>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={closeMenu} onTouchStart={closeMenu} />
                <div
                  role="menu"
                  className="absolute right-0 top-full mt-2 z-50 min-w-[180px] rounded-[22px] bg-neutral-900/95 dark:bg-neutral-900/95 backdrop-blur-xl shadow-[0_20px_50px_-10px_rgba(0,0,0,0.55)] ring-1 ring-white/10 p-2 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 slide-in-from-top-1 duration-150"
                >
                  <button
                    onClick={async (e) => { e.stopPropagation(); await handleCopy(); closeMenu(); }}
                    className="flex items-center justify-between gap-4 px-2 py-1.5 text-white/95 hover:text-white transition-colors bg-transparent border-0"
                    role="menuitem"
                  >
                    <span className="text-[15px] font-normal">Copy</span>
                    <Copy className="w-[18px] h-[18px]" strokeWidth={1.8} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleEditAction(); closeMenu(); }}
                    className="flex items-center justify-between gap-4 px-2 py-1.5 text-white/95 hover:text-white transition-colors bg-transparent border-0"
                    role="menuitem"
                  >
                    <span className="text-[15px] font-normal">Edit</span>
                    <Pencil className="w-[18px] h-[18px]" strokeWidth={1.8} />
                  </button>
                </div>
              </>
            )}
          </div>
          ); })()}
          <ReactionsRow reactions={reactions || []} currentUserId={currentUserId} onToggle={onToggleReaction} messageId={messageId} align={isOtherMember ? "left" : "right"} />
          {showReaders && <ReadersRow readers={readers || []} align={isOtherMember ? "left" : "right"} />}
        </div>
        <SelectTextModal open={selectTextOpen} onClose={() => setSelectTextOpen(false)} text={content} onCopy={handleCopyAllText} />
      </div>
    );
  }

  const hasStructured = structuredBlocks && structuredBlocks.some(b => b.type !== "text");

  // Deep Research: render a clean card after streaming completes.
  // Auto-detect research output by content markers so it survives chat reload.
  const looksLikeResearch =
    role === "assistant" &&
    (/Browser Agent Result for/i.test(content) ||
      /===\s*Next Source\s*===/i.test(content) ||
      (isDeepResearch === true));
  const showResearchCard = looksLikeResearch && !isStreaming && content.trim().length > 200;

  const showNarration = role === "assistant" && isDeepResearch && narrations && narrations.length > 0;
  const isResearchActive = !!isStreaming || (!!isThinking && !content);
  const showSlidesInfoBox = role === "assistant" && (looksLikeSlidesInfo(displayContent) || (!!isSlidesMode && displayContent.trim().length > 0));

  return (
    <Message className="mb-6 relative">
      <MessageContent>
      {showNarration && (
        <Suspense fallback={null}>
          <ResearchNarration items={narrations!} active={isResearchActive} />
        </Suspense>
      )}
      {isThinking && !content && !showNarration ? (
        <ThinkingLoader searchStatus={searchStatus} />
      ) : showResearchCard ? (
        <Suspense fallback={<ThinkingLoader />}>
          <DeepResearchCard
            query={researchQuery || content.split("\n").find((l) => l.trim().length > 0)?.replace(/^#+\s*/, "").slice(0, 80) || "Deep Research"}
            report={content}
            images={images || []}
            sessionKey={researchSessionKey}
          />
        </Suspense>
      ) : (
        <>
          {(() => {
            // Hosts that block hot-linking (broken image icon in chat).
            const BLOCKED_IMG_HOSTS = /(^|\.)(tiktok\.com|instagram\.com|cdninstagram\.com|fbcdn\.net|lookaside\.instagram\.com|facebook\.com|x\.com|twitter\.com|twimg\.com)$/i;
            const isUsable = (u: string) => {
              try {
                const h = new URL(u).hostname;
                return !BLOCKED_IMG_HOSTS.test(h);
              } catch { return false; }
            };
            const allImages = [...(images || []), ...inlineImages].filter(isUsable);
            const dedupImages = allImages.filter((u, i, a) => a.indexOf(u) === i);
            return !isStreaming && dedupImages.length > 0 && (
              <div className="flex gap-3 mb-3 overflow-x-auto overflow-y-hidden pb-2 snap-x snap-mandatory touch-pan-x">
                {dedupImages.map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt=""
                    loading="lazy"
                    className="shrink-0 snap-start w-[74vw] max-w-[18rem] aspect-[4/3] rounded-xl border border-border/40 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setPreviewImageUrl(img)}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                  />
                ))}
              </div>
            );
          })()}

          {/* Shopping product cards removed */}

          {isLearningMode && hasLearnCards(content) && !isStreaming ? (
            <div className="space-y-3">
              <Suspense fallback={null}>
                {parseLearnSegments(content).map((seg, idx) => {
                  if (seg.kind === "card" && seg.card) {
                    return (
                      <LearnCard
                        key={idx}
                        card={seg.card}
                        onAnswer={(t) => onStructuredAction?.(t)}
                      />
                    );
                  }
                  const txt = seg.text || "";
                  const bl = detectLang(txt);
                  return (
                    <div key={idx} dir={langDir(bl)} lang={bl === "ar" ? "ar" : bl === "en" ? "en" : undefined} className={`prose-chat text-foreground lang-${bl}`}>
                      <MarkdownRenderer content={txt} onLinkClick={handleLinkClick} onPreviewCode={handlePreviewCode} />
                    </div>
                  );
                })}
              </Suspense>
            </div>
          ) : hasStructured && !isStreaming ? (
             <div className="space-y-3">
              <Suspense fallback={null}>
              {structuredBlocks!.map((block, idx) => {
                if (block.type === "flow") {
                  return <FlowCard key={idx} steps={block.data.steps} onAction={(action, stepTitle) => { onStructuredAction?.(`${action}: ${stepTitle}`); }} />;
                }
                if (block.type === "cards") {
                  return <InfoCards key={idx} items={block.data.items} onAction={(action, title) => { onStructuredAction?.(`${action}: ${title}`); }} />;
                }
                if (block.type === "questions") {
                  return null;
                }
                const blockText = typeof block.data === "string" ? block.data : JSON.stringify(block.data);
                const bl = detectLang(blockText);
                return (
                  <div key={idx} dir={langDir(bl)} lang={bl === "ar" ? "ar" : bl === "en" ? "en" : undefined} className={`prose-chat text-foreground lang-${bl}`}>
                    <MarkdownRenderer content={blockText} onLinkClick={handleLinkClick} onPreviewCode={handlePreviewCode} />
                  </div>
                );
              })}
              </Suspense>
            </div>
          ) : (() => {
            const al = detectLang(displayContent);
            // Detect numbered step plans and render as connected step cards
            const { steps, remaining } = !isStreaming && role === "assistant"
              ? parseSteps(displayContent)
              : { steps: [], remaining: displayContent };
            const bodyText = steps.length ? remaining : displayContent;
            // While a deep-research report is still streaming, wrap the live text
            // in a simple "live draft" box so it doesn't look like the final answer.
            const inner = (
              <div dir={langDir(al)} lang={al === "ar" ? "ar" : al === "en" ? "en" : undefined} className={`prose-chat text-foreground lang-${al}`}>
                {steps.length > 0 && (
                  <Suspense fallback={null}>
                    <StepFlowCards steps={steps} />
                  </Suspense>
                )}
                {bodyText && <MarkdownRenderer content={bodyText} onLinkClick={handleLinkClick} onPreviewCode={handlePreviewCode} />}
              </div>
            );
            if (showSlidesInfoBox) {
              return (
                <div className="space-y-2" dir={langDir(al)}>
                  <div className="relative">
                    {inner}
                    {isStreaming && (
                      <span className="inline-flex ms-1 align-baseline">
                        <MegsyStar size={14} />
                      </span>
                    )}
                  </div>
                </div>
              );
            }
            // Deep Research live/in-progress text (when the final card isn't ready yet)
            // → wrap inside a collapsible "Research draft" box so it doesn't spill into chat.
            const showResearchDraftBox =
              role === "assistant" &&
              !!isDeepResearch &&
              !showResearchCard &&
              displayContent.trim().length > 0;
            if (showResearchDraftBox) {
              const isAr = al === "ar";
              return (
                <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl overflow-hidden" dir={langDir(al)}>
                  <button
                    type="button"
                    onClick={() => setResearchDraftOpen((v) => !v)}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium text-foreground/90 hover:bg-foreground/5 transition"
                  >
                    <span className="flex-1 text-start">
                      {isAr ? "Research draft" : "Research draft"}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${researchDraftOpen ? "" : "-rotate-90"}`} />
                  </button>
                  <AnimatePresence initial={false}>
                    {researchDraftOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-border/40 px-4 py-3 max-h-[50vh] overflow-y-auto">
                          {inner}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            }
            return inner;
          })()}

          {/* Sources — hidden for deep research */}
          {!isStreaming && !isDeepResearch && uniqueLinks.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border/40">
              <Popover>
                <PopoverTrigger asChild>
                  <button className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/60 border border-border/40 text-xs font-medium text-foreground hover:border-primary/40 transition-colors">
                    <span>Sources</span>
                    <span className="text-muted-foreground">({uniqueLinks.length})</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-80 p-2 max-h-80 overflow-y-auto">
                  <div className="flex flex-col gap-1">
                    {uniqueLinks.map((link, i) => (
                      <a
                        key={i}
                        href={link.url}
                        onClick={(e) => handleLinkClick(e, link.url)}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-secondary/60 transition-colors"
                      >
                        <div className="w-6 h-6 shrink-0 rounded-full bg-secondary/60 border border-border/40 flex items-center justify-center">
                          {getFavicon(link.url) && <img src={getFavicon(link.url)!} alt="" className="w-3.5 h-3.5 rounded-sm" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-foreground truncate">{getDomain(link.url)}</div>
                          <div className="text-[10px] text-muted-foreground truncate">{link.url}</div>
                        </div>
                      </a>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Optional artifact slot (e.g. docs/slides card) — rendered before action buttons */}
          {bottomSlot && !isStreaming && (
            <div className="mt-3">{bottomSlot}</div>
          )}

          {/* Action buttons */}
          {!isStreaming && content && !showSlidesInfoBox && !hideActions && (
            <div className="flex items-center gap-1 mt-2">
              <button onClick={handleCopy} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground liquid-glass-hover transition-all" title="Copy">
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <motion.button
                onClick={() => handleLikeAction(liked === true ? null : true)}
                className={`p-1.5 rounded-lg transition-all ${liked === true ? "text-primary" : "text-muted-foreground hover:text-foreground liquid-glass-hover"}`}
                title="Like"
                whileTap={{ scale: 1.3 }}
                transition={{ type: "spring", stiffness: 500, damping: 15 }}
              >
                <ThumbsUp className="w-3.5 h-3.5" />
              </motion.button>
              <motion.button
                onClick={() => handleLikeAction(liked === false ? null : false)}
                className={`p-1.5 rounded-lg transition-all ${liked === false ? "text-destructive" : "text-muted-foreground hover:text-foreground liquid-glass-hover"}`}
                title="Dislike"
                whileTap={{ scale: 1.3 }}
                transition={{ type: "spring", stiffness: 500, damping: 15 }}
              >
                <ThumbsDown className="w-3.5 h-3.5" />
              </motion.button>
              {onShare && (
                <button onClick={onShare} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground liquid-glass-hover transition-all" title="More">
                  <Ellipsis className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
          {!isStreaming && content && (
            <ReactionsRow reactions={reactions || []} currentUserId={currentUserId} onToggle={onToggleReaction} messageId={messageId} align="left" />
          )}
        </>
      )}

      <Suspense fallback={null}>
        {previewCode && (
          <CodePreviewModal
            code={previewCode.code}
            lang={previewCode.lang}
            onClose={() => setPreviewCode(null)}
          />
        )}

        {previewImageUrl && (
          <ImagePreviewModal
            url={previewImageUrl}
            onClose={() => setPreviewImageUrl(null)}
          />
        )}
      </Suspense>
      </MessageContent>
    </Message>
  );
};

export default memo(ChatMessage);
