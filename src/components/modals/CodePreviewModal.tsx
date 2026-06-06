import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Maximize2, Minimize2 } from "lucide-react";
import { motion } from "framer-motion";

interface CodePreviewModalProps {
  code: string;
  lang: string;
  onClose: () => void;
}

const wrapCodeForPreview = (lang: string, code: string): string => {
  if (["html", "htm"].includes(lang.toLowerCase())) {
    return code;
  }
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#0a0a0a;color:#fff}</style>
</head><body>
<div id="root"></div>
<script>${code}<\/script>
</body></html>`;
};

const CodePreviewModal = ({ code, lang, onClose }: CodePreviewModalProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(true);

  useEffect(() => {
    if (iframeRef.current) {
      const html = wrapCodeForPreview(lang, code);
      const blob = new Blob([html], { type: "text/html" });
      iframeRef.current.src = URL.createObjectURL(blob);
    }
  }, [code, lang]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col bg-background"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/40 bg-secondary/30 shrink-0">
        <button
          onClick={onClose}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <span className="text-xs font-medium text-muted-foreground">Live Preview</span>
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>
      <iframe
        ref={iframeRef}
        className="flex-1 w-full bg-black"
        sandbox="allow-scripts allow-same-origin"
        title="Code preview"
      />
    </motion.div>
  );
};

export default CodePreviewModal;
