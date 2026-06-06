import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";

interface CodeMsg {
  role: "user" | "assistant";
  content: string;
  displayedContent?: string;
  isTyping?: boolean;
  isPreview?: boolean;
}

const conversation: { role: "user" | "assistant"; content: string; delay: number; isPreview?: boolean }[] = [
  { role: "user", content: "Build me a music streaming website with a modern dark theme", delay: 800 },
  { role: "assistant", content: "On it! I'm creating a music streaming app with:\n\n• Dark glassmorphism UI\n• Artist cards with hover effects\n• Music player bar with controls\n• Playlist sidebar\n\nGenerating code now...", delay: 400 },
  { role: "assistant", content: "PREVIEW", delay: 2500, isPreview: true },
  { role: "user", content: "Add a search bar with filters for genre and artist", delay: 2800 },
  { role: "assistant", content: "Done! Added a search bar with real-time filtering, genre chips (Pop, Rock, Hip-Hop, Jazz, Electronic), and artist suggestions dropdown. Try it out in the preview!", delay: 400 },
  { role: "user", content: "Deploy it to production", delay: 2200 },
  { role: "assistant", content: "Deployed! 🚀\n\n• Live URL: music-app.megsyai.com\n• GitHub repo synced\n• SSL certificate active\n• Build time: 12s\n\nYour app is live and ready to share!", delay: 400 },
];

const CHAR_SPEED = 45;
const CHARS_PER_TICK = 5;

const PreviewMockup = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5 }}
    className="my-2 overflow-hidden rounded-xl border border-border/30 bg-background/80"
  >
    {/* Browser bar */}
    <div className="flex items-center gap-2 border-b border-border/20 bg-muted/30 px-3 py-1.5">
      <div className="flex gap-1">
        <span className="h-2 w-2 rounded-full bg-destructive/50" />
        <span className="h-2 w-2 rounded-full bg-amber-500/50" />
        <span className="h-2 w-2 rounded-full bg-emerald-500/50" />
      </div>
      <div className="flex-1 rounded-md bg-background/60 px-2 py-0.5 text-[9px] text-muted-foreground/60">
        localhost:5173
      </div>
    </div>
    {/* Fake music UI */}
    <div className="p-3 space-y-2">
      <div className="flex items-center gap-2">
        <div className="h-5 w-5 rounded bg-primary/30" />
        <div className="h-2 w-16 rounded-full bg-foreground/20" />
        <div className="ml-auto h-2 w-10 rounded-full bg-muted-foreground/20" />
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {[1,2,3].map(i => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.15 }}
            className="space-y-1 rounded-lg bg-muted/40 p-1.5"
          >
            <div className="aspect-square rounded-md bg-gradient-to-br from-primary/20 to-accent/20" />
            <div className="h-1.5 w-3/4 rounded-full bg-foreground/15" />
            <div className="h-1 w-1/2 rounded-full bg-muted-foreground/15" />
          </motion.div>
        ))}
      </div>
      {/* Player bar */}
      <div className="flex items-center gap-2 rounded-lg bg-muted/30 p-1.5">
        <div className="h-6 w-6 rounded bg-primary/20" />
        <div className="flex-1 space-y-1">
          <div className="h-1 w-2/3 rounded-full bg-foreground/15" />
          <div className="h-0.5 w-full rounded-full bg-muted-foreground/10">
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: "60%" }}
              transition={{ duration: 2, ease: "linear" }}
              className="h-full rounded-full bg-primary/50"
            />
          </div>
        </div>
      </div>
    </div>
  </motion.div>
);

const CodeDemo = () => {
  const [messages, setMessages] = useState<CodeMsg[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inView, setInView] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      rootMargin: "120px",
      threshold: 0.15,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;

    if (currentIndex >= conversation.length) {
      const timer = setTimeout(() => {
        setMessages([]);
        setCurrentIndex(0);
      }, 4000);
      return () => clearTimeout(timer);
    }

    const msg = conversation[currentIndex];

    if (msg.role === "user") {
      const timer = setTimeout(() => {
        setMessages((prev) => [...prev, { role: "user", content: msg.content }]);
        setCurrentIndex((i) => i + 1);
      }, msg.delay);
      return () => clearTimeout(timer);
    } else if (msg.isPreview) {
      const timer = setTimeout(() => {
        setMessages((prev) => [...prev, { role: "assistant", content: "", isPreview: true }]);
        setCurrentIndex((i) => i + 1);
      }, msg.delay);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: msg.content, displayedContent: "", isTyping: true },
        ]);
      }, msg.delay);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, inView]);

  // Typewriter
  useEffect(() => {
    if (!inView) return;

    const lastMsg = messages[messages.length - 1];
    if (!lastMsg || lastMsg.role !== "assistant" || !lastMsg.isTyping) return;

    const fullContent = lastMsg.content;
    const currentLen = lastMsg.displayedContent?.length ?? 0;

    if (currentLen >= fullContent.length) {
      setMessages((prev) =>
        prev.map((m, i) =>
          i === prev.length - 1 ? { ...m, isTyping: false, displayedContent: fullContent } : m
        )
      );
      setCurrentIndex((i) => i + 1);
      return;
    }

    const timer = setTimeout(() => {
      setMessages((prev) =>
        prev.map((m, i) =>
          i === prev.length - 1
            ? { ...m, displayedContent: fullContent.slice(0, currentLen + CHARS_PER_TICK) }
            : m
        )
      );
    }, CHAR_SPEED);

    return () => clearTimeout(timer);
  }, [messages, inView]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const renderContent = (msg: CodeMsg) => {
    const text = msg.role === "assistant" ? (msg.displayedContent ?? msg.content) : msg.content;
    return text.split("\n").map((line, li, arr) => (
      <span key={li}>
        {line}
        {li < arr.length - 1 && <br />}
      </span>
    ));
  };

  return (
    <div ref={rootRef} className="flex h-full flex-col overflow-hidden rounded-2xl border border-border/30 bg-card/30 backdrop-blur-md">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3" style={{ scrollbarWidth: "none" }}>
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.3 }}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.isPreview ? (
              <div className="w-full">
                <PreviewMockup />
              </div>
            ) : (
              <div
                className={`max-w-[85%] text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "rounded-2xl rounded-br-md bg-primary text-primary-foreground px-4 py-2.5"
                    : "text-foreground/90"
                }`}
              >
                {renderContent(msg)}
                {msg.role === "assistant" && msg.isTyping && (
                  <span className="inline-block w-[2px] h-4 bg-primary ml-0.5 animate-pulse align-middle" />
                )}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default CodeDemo;
