import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Upload, Download, X, Share2, Sparkles, ImagePlus, Zap, Eye as EyeIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useCredits } from "@/hooks/useCredits";
import { supabase } from "@/integrations/supabase/client";

// Silky multi-layered radial gradients per tool (same style as hub cards)
export const TOOL_SILK: Record<string, { bg: string; s1: string; s2: string; s3: string; s4: string }> = {
  "inpaint": { bg: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 40%, #1e40af 100%)", s1: "rgba(96,165,250,0.5)", s2: "rgba(37,99,235,0.4)", s3: "rgba(147,197,253,0.15)", s4: "rgba(59,130,246,0.25)" },
  "clothes-changer": { bg: "linear-gradient(135deg, #5f1e3a 0%, #e11d48 40%, #9f1239 100%)", s1: "rgba(251,113,133,0.5)", s2: "rgba(225,29,72,0.4)", s3: "rgba(253,164,175,0.15)", s4: "rgba(244,63,94,0.25)" },
  "headshot": { bg: "linear-gradient(135deg, #5f3a1e 0%, #d97706 40%, #b45309 100%)", s1: "rgba(251,191,36,0.5)", s2: "rgba(217,119,6,0.4)", s3: "rgba(253,224,71,0.15)", s4: "rgba(245,158,11,0.25)" },
  "face-swap": { bg: "linear-gradient(135deg, #3a1e5f 0%, #7c3aed 40%, #6d28d9 100%)", s1: "rgba(167,139,250,0.5)", s2: "rgba(124,58,237,0.4)", s3: "rgba(196,181,253,0.15)", s4: "rgba(139,92,246,0.25)" },
  "bg-remover": { bg: "linear-gradient(135deg, #1e4a4a 0%, #0d9488 40%, #0f766e 100%)", s1: "rgba(94,234,212,0.5)", s2: "rgba(13,148,136,0.4)", s3: "rgba(153,246,228,0.15)", s4: "rgba(20,184,166,0.25)" },
  "cartoon": { bg: "linear-gradient(135deg, #5f1e4a 0%, #d946ef 40%, #a21caf 100%)", s1: "rgba(232,121,249,0.5)", s2: "rgba(217,70,239,0.4)", s3: "rgba(240,171,252,0.15)", s4: "rgba(192,38,211,0.25)" },
  "colorizer": { bg: "linear-gradient(135deg, #1e5f2a 0%, #16a34a 40%, #15803d 100%)", s1: "rgba(74,222,128,0.5)", s2: "rgba(22,163,74,0.4)", s3: "rgba(134,239,172,0.15)", s4: "rgba(34,197,94,0.25)" },
  "retouching": { bg: "linear-gradient(135deg, #1e3a5f 0%, #0284c7 40%, #0369a1 100%)", s1: "rgba(56,189,248,0.5)", s2: "rgba(2,132,199,0.4)", s3: "rgba(125,211,252,0.15)", s4: "rgba(14,165,233,0.25)" },
  "remover": { bg: "linear-gradient(135deg, #2a2a3a 0%, #475569 40%, #334155 100%)", s1: "rgba(148,163,184,0.5)", s2: "rgba(71,85,105,0.4)", s3: "rgba(203,213,225,0.15)", s4: "rgba(100,116,139,0.25)" },
  "sketch-to-image": { bg: "linear-gradient(135deg, #2a4a1e 0%, #65a30d 40%, #4d7c0f 100%)", s1: "rgba(163,230,53,0.5)", s2: "rgba(101,163,13,0.4)", s3: "rgba(190,242,100,0.15)", s4: "rgba(132,204,22,0.25)" },
  "relight": { bg: "linear-gradient(135deg, #5f4a1e 0%, #eab308 40%, #ca8a04 100%)", s1: "rgba(250,204,21,0.5)", s2: "rgba(234,179,8,0.4)", s3: "rgba(253,224,71,0.15)", s4: "rgba(202,138,4,0.25)" },
  "character-swap": { bg: "linear-gradient(135deg, #4a1e5f 0%, #c026d3 40%, #a21caf 100%)", s1: "rgba(232,121,249,0.5)", s2: "rgba(192,38,211,0.4)", s3: "rgba(240,171,252,0.15)", s4: "rgba(168,85,247,0.25)" },
  "storyboard": { bg: "linear-gradient(135deg, #1e2a5f 0%, #4f46e5 40%, #4338ca 100%)", s1: "rgba(129,140,248,0.5)", s2: "rgba(79,70,229,0.4)", s3: "rgba(165,180,252,0.15)", s4: "rgba(99,102,241,0.25)" },
  "hair-changer": { bg: "linear-gradient(135deg, #1e4a4f 0%, #06b6d4 40%, #0891b2 100%)", s1: "rgba(34,211,238,0.5)", s2: "rgba(6,182,212,0.4)", s3: "rgba(103,232,249,0.15)", s4: "rgba(8,145,178,0.25)" },
  "avatar-generator": { bg: "linear-gradient(135deg, #2d1b69 0%, #8b5cf6 40%, #7c3aed 100%)", s1: "rgba(167,139,250,0.5)", s2: "rgba(139,92,246,0.4)", s3: "rgba(196,181,253,0.15)", s4: "rgba(124,58,237,0.25)" },
  "product-photo": { bg: "linear-gradient(135deg, #1e3a3a 0%, #14b8a6 40%, #0d9488 100%)", s1: "rgba(94,234,212,0.5)", s2: "rgba(20,184,166,0.4)", s3: "rgba(153,246,228,0.15)", s4: "rgba(13,148,136,0.25)" },
  "logo-generator": { bg: "linear-gradient(135deg, #3a1e1e 0%, #ef4444 40%, #dc2626 100%)", s1: "rgba(248,113,113,0.5)", s2: "rgba(239,68,68,0.4)", s3: "rgba(254,202,202,0.15)", s4: "rgba(220,38,38,0.25)" },
  "perspective-correction": { bg: "linear-gradient(135deg, #1e2a4a 0%, #6366f1 40%, #4f46e5 100%)", s1: "rgba(129,140,248,0.5)", s2: "rgba(99,102,241,0.4)", s3: "rgba(165,180,252,0.15)", s4: "rgba(79,70,229,0.25)" },
  "green-screen": { bg: "linear-gradient(135deg, #1e4a2a 0%, #22c55e 40%, #16a34a 100%)", s1: "rgba(74,222,128,0.5)", s2: "rgba(34,197,94,0.4)", s3: "rgba(134,239,172,0.15)", s4: "rgba(22,163,74,0.25)" },
  "video-colorizer": { bg: "linear-gradient(135deg, #1e4a4a 0%, #06b6d4 40%, #0891b2 100%)", s1: "rgba(34,211,238,0.5)", s2: "rgba(6,182,212,0.4)", s3: "rgba(103,232,249,0.15)", s4: "rgba(8,145,178,0.25)" },
  "video-watermark": { bg: "linear-gradient(135deg, #2a2a3a 0%, #64748b 40%, #475569 100%)", s1: "rgba(148,163,184,0.5)", s2: "rgba(100,116,139,0.4)", s3: "rgba(203,213,225,0.15)", s4: "rgba(71,85,105,0.25)" },
  "video-bg-replacer": { bg: "linear-gradient(135deg, #1e2a5f 0%, #3b82f6 40%, #2563eb 100%)", s1: "rgba(96,165,250,0.5)", s2: "rgba(59,130,246,0.4)", s3: "rgba(147,197,253,0.15)", s4: "rgba(37,99,235,0.25)" },
  "video-intro": { bg: "linear-gradient(135deg, #5f3a1e 0%, #f59e0b 40%, #d97706 100%)", s1: "rgba(251,191,36,0.5)", s2: "rgba(245,158,11,0.4)", s3: "rgba(253,224,71,0.15)", s4: "rgba(217,119,6,0.25)" },
  "video-denoise": { bg: "linear-gradient(135deg, #2a2a3a 0%, #6b7280 40%, #4b5563 100%)", s1: "rgba(156,163,175,0.5)", s2: "rgba(107,114,128,0.4)", s3: "rgba(209,213,219,0.15)", s4: "rgba(75,85,99,0.25)" },
  "thumbnail-generator": { bg: "linear-gradient(135deg, #5f1e1e 0%, #ef4444 40%, #dc2626 100%)", s1: "rgba(248,113,113,0.5)", s2: "rgba(239,68,68,0.4)", s3: "rgba(254,202,202,0.15)", s4: "rgba(220,38,38,0.25)" },
  "auto-caption": { bg: "linear-gradient(135deg, #1e2a5f 0%, #6366f1 40%, #4f46e5 100%)", s1: "rgba(129,140,248,0.5)", s2: "rgba(99,102,241,0.4)", s3: "rgba(165,180,252,0.15)", s4: "rgba(79,70,229,0.25)" },
  "lip-sync": { bg: "linear-gradient(135deg, #5f1e3a 0%, #ec4899 40%, #db2777 100%)", s1: "rgba(244,114,182,0.5)", s2: "rgba(236,72,153,0.4)", s3: "rgba(249,168,212,0.15)", s4: "rgba(219,39,119,0.25)" },
  "video-extender": { bg: "linear-gradient(135deg, #1e4a4f 0%, #0891b2 40%, #0e7490 100%)", s1: "rgba(34,211,238,0.5)", s2: "rgba(8,145,178,0.4)", s3: "rgba(103,232,249,0.15)", s4: "rgba(14,116,144,0.25)" },
  "video-to-text": { bg: "linear-gradient(135deg, #1e4a2a 0%, #10b981 40%, #059669 100%)", s1: "rgba(52,211,153,0.5)", s2: "rgba(16,185,129,0.4)", s3: "rgba(110,231,183,0.15)", s4: "rgba(5,150,105,0.25)" },
  "talking-photo": { bg: "linear-gradient(135deg, #3a1e5f 0%, #a855f7 40%, #9333ea 100%)", s1: "rgba(192,132,252,0.5)", s2: "rgba(168,85,247,0.4)", s3: "rgba(216,180,254,0.15)", s4: "rgba(147,51,234,0.25)" },
  "video-upscale": { bg: "linear-gradient(135deg, #1e3a5f 0%, #0ea5e9 40%, #0284c7 100%)", s1: "rgba(56,189,248,0.5)", s2: "rgba(14,165,233,0.4)", s3: "rgba(125,211,252,0.15)", s4: "rgba(2,132,199,0.25)" },
  "video-swap": { bg: "linear-gradient(135deg, #1e4a4f 0%, #06b6d4 40%, #0891b2 100%)", s1: "rgba(34,211,238,0.5)", s2: "rgba(6,182,212,0.4)", s3: "rgba(103,232,249,0.15)", s4: "rgba(8,145,178,0.25)" },
  "swap-characters": { bg: "linear-gradient(135deg, #1e4a4f 0%, #06b6d4 40%, #0891b2 100%)", s1: "rgba(34,211,238,0.5)", s2: "rgba(6,182,212,0.4)", s3: "rgba(103,232,249,0.15)", s4: "rgba(8,145,178,0.25)" },
};

// Tool metadata
const TOOL_META: Record<string, { headline: string; accent: string; desc: string }> = {
  'inpaint': { headline: 'AI', accent: 'Inpainting', desc: 'Edit and replace any part of your image with AI-powered precision' },
  'clothes-changer': { headline: 'Change', accent: 'Outfits', desc: 'Transform clothing styles instantly using artificial intelligence' },
  'headshot': { headline: 'Professional', accent: 'Headshots', desc: 'Studio-quality professional portraits generated in seconds' },
  'bg-remover': { headline: 'Remove', accent: 'Backgrounds', desc: 'Clean and precise background removal with one click' },
  'face-swap': { headline: 'Face', accent: 'Swap', desc: 'Seamlessly swap faces between any two photographs' },
  'relight': { headline: 'AI', accent: 'Relight', desc: 'Dramatically change the lighting and mood of any photo' },
  'colorizer': { headline: 'Colorize', accent: 'Photos', desc: 'Bring black and white photos to vivid, realistic life' },
  'character-swap': { headline: 'Character', accent: 'Swap', desc: 'Replace characters in any scene with a new face' },
  'storyboard': { headline: 'AI', accent: 'Storyboard', desc: 'Create cinematic storyboard panels from your ideas' },
  'sketch-to-image': { headline: 'Sketch to', accent: 'Image', desc: 'Turn rough sketches into stunning realistic images' },
  'retouching': { headline: 'Photo', accent: 'Retouching', desc: 'Professional-grade beauty and skin retouching' },
  'remover': { headline: 'Object', accent: 'Remover', desc: 'Erase unwanted objects and people from photos cleanly' },
  'hair-changer': { headline: 'Change', accent: 'Hairstyle', desc: 'Try new hairstyles and colors with AI instantly' },
  'cartoon': { headline: 'AI', accent: 'Cartoon', desc: 'Transform your photos into stunning cartoon artwork' },
  'avatar-generator': { headline: 'AI', accent: 'Avatar', desc: 'Generate unique personal AI avatars from your photo' },
  'product-photo': { headline: 'Product', accent: 'Photography', desc: 'Professional product shots for e-commerce and ads' },
  'logo-generator': { headline: 'AI Logo', accent: 'Generator', desc: 'Design unique, professional logos with AI power' },
  'perspective-correction': { headline: 'Fix', accent: 'Perspective', desc: 'Correct distorted perspectives in architectural photos' },
  'green-screen': { headline: 'Green', accent: 'Screen', desc: 'Remove green screen backgrounds from video footage' },
  'video-colorizer': { headline: 'Colorize', accent: 'Video', desc: 'Add vibrant color to old black and white footage' },
  'video-watermark': { headline: 'Video', accent: 'Watermark', desc: 'Add professional watermarks to protect your videos' },
  'video-bg-replacer': { headline: 'Replace', accent: 'Background', desc: 'Change video backgrounds to any scene or color' },
  'video-intro': { headline: 'Video', accent: 'Intro', desc: 'Create stunning professional video introductions' },
  'video-denoise': { headline: 'Denoise', accent: 'Video', desc: 'Remove noise and grain from video footage' },
  'thumbnail-generator': { headline: 'AI', accent: 'Thumbnails', desc: 'Generate eye-catching YouTube thumbnail images' },
  'auto-caption': { headline: 'Auto', accent: 'Caption', desc: 'Add accurate subtitles to your videos automatically' },
  'lip-sync': { headline: 'Lip', accent: 'Sync', desc: 'Sync lip movements to any audio track perfectly' },
  'video-extender': { headline: 'Extend', accent: 'Video', desc: 'Make your videos longer with AI-generated content' },
  'video-to-text': { headline: 'Video to', accent: 'Text', desc: 'Transcribe video content into accurate text' },
  'talking-photo': { headline: 'Talking', accent: 'Photo', desc: 'Animate photos and make them speak any text' },
  'video-upscale': { headline: 'Upscale', accent: 'Video', desc: 'Enhance video resolution to crystal-clear quality' },
  'video-swap': { headline: 'Video Face', accent: 'Swap', desc: 'Swap faces in video footage seamlessly' },
  'swap-characters': { headline: 'Swap', accent: 'Characters', desc: 'Replace characters in video with any face' },
};

// ==================== Types ====================
export interface ToolTemplate {
  id: string;
  tool_id: string;
  name: string;
  prompt: string | null;
  preview_url: string | null;
  gender: string;
}

interface ToolPageLayoutProps {
  title: string;
  cost: number;
  costLabel?: string;
  toolId: string;
  children?: React.ReactNode;
  onGenerate: () => Promise<void>;
  isGenerating: boolean;
  resultUrl?: string | null;
  resultType?: "image" | "video";
  autoProcess?: boolean;
  hideHeaderCost?: boolean;
  backTo?: string;
  onFileSelected?: (dataUrl: string) => void;
  skipLanding?: boolean;
}

const TOOL_LOADING_TEXTS = [
  { text: "CREATING", accent: "MAGIC" },
  { text: "PROCESSING", accent: "YOUR IMAGE" },
  { text: "REFINING", accent: "DETAILS" },
  { text: "ALMOST", accent: "READY" },
];

const StarLoader = () => {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % TOOL_LOADING_TEXTS.length), 2400);
    return () => clearInterval(t);
  }, []);
  const current = TOOL_LOADING_TEXTS[idx];
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-5">
      <motion.svg
        width="36"
        height="36"
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        animate={{
          y: [0, -8, 0],
          rotate: [0, 180, 360],
          scale: [1, 1.2, 1],
        }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      >
        <path
          d="M50 5 L60 40 L95 50 L60 60 L50 95 L40 60 L5 50 L40 40 Z"
          fill="url(#toolStarGrad)"
        />
        <defs>
          <linearGradient id="toolStarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>
      </motion.svg>
      <AnimatePresence mode="wait">
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          className="text-center"
        >
          <p className="text-2xl font-black text-foreground">{current.text}</p>
          <p className="text-2xl font-black bg-gradient-to-r from-blue-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">
            {current.accent}
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

// ==================== Silky Landing (exported for custom pages) ====================
export const SilkyToolLanding = ({
  onStart,
  uploadLabel = "Upload Your Photo",
  accept = "image/*",
  toolId,
  onButtonClick,
}: {
  onStart?: (file: File) => void;
  uploadLabel?: string;
  accept?: string;
  toolId: string;
  onButtonClick?: () => void;
}) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const meta = TOOL_META[toolId];
  const silk = TOOL_SILK[toolId] || TOOL_SILK["inpaint"];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      toast.error("File too large. Maximum size is 20MB.");
      e.target.value = "";
      return;
    }
    if (file.size === 0) {
      toast.error("File is empty. Please select a valid file.");
      e.target.value = "";
      return;
    }
    if (onStart) onStart(file);
    e.target.value = "";
  };

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col items-center justify-center relative overflow-hidden">
      {/* Multi-layered silky radial gradient background */}
      <div className="absolute inset-0" style={{ background: silk.bg }} />
      <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse 150% 100% at 15% 25%, ${silk.s1}, transparent 70%), radial-gradient(ellipse 130% 90% at 85% 75%, ${silk.s2}, transparent 65%), radial-gradient(ellipse 100% 120% at 50% -10%, ${silk.s3}, transparent 60%)` }} />
      <div className="absolute inset-0" style={{ background: `radial-gradient(circle 80px at 25% 75%, ${silk.s4}, transparent), radial-gradient(circle 60px at 75% 25%, rgba(255,255,255,0.08), transparent), radial-gradient(circle 100px at 50% 50%, ${silk.s4}, transparent)` }} />
      <div className="absolute inset-0" style={{ background: `linear-gradient(160deg, rgba(255,255,255,0.06) 0%, transparent 40%, rgba(255,255,255,0.04) 60%, transparent 100%)` }} />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-md">
        {/* Headlines */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-5xl font-black text-white leading-[1.1] tracking-tight drop-shadow-lg">
            {meta?.headline || "AI"}
          </h2>
          <h2 className="text-5xl font-black text-white/90 leading-[1.1] tracking-tight drop-shadow-lg">
            {meta?.accent || "Tool"}
          </h2>
        </motion.div>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="text-sm text-white/60 mt-4 leading-relaxed max-w-[280px]"
        >
          {meta?.desc || "Transform your media with AI"}
        </motion.p>

        {/* Upload button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8"
        >
          <input ref={fileRef} type="file" className="hidden" accept={accept} onChange={handleFileChange} />
          <motion.button
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.02 }}
            onClick={() => onButtonClick ? onButtonClick() : fileRef.current?.click()}
            className="px-8 py-4 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 text-white font-semibold text-base shadow-2xl shadow-black/30 hover:bg-white/25 transition-colors flex items-center gap-2.5"
          >
            <Upload className="w-5 h-5" />
            {uploadLabel}
          </motion.button>
        </motion.div>

        {/* Subtle features */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="flex items-center gap-4 mt-6 text-[11px] text-white/40"
        >
          <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> Fast</span>
          <span className="w-1 h-1 rounded-full bg-white/30" />
          <span className="flex items-center gap-1"><Sparkles className="w-3 h-3" /> AI-Powered</span>
          <span className="w-1 h-1 rounded-full bg-white/30" />
          <span className="flex items-center gap-1"><EyeIcon className="w-3 h-3" /> HD</span>
        </motion.div>
      </div>
    </div>
  );
};

// Keep backward-compatible alias
const ToolLanding = SilkyToolLanding;

// ==================== Yellow Generate Button ====================
const YellowGenerateButton = ({
  cost, costLabel, onClick, disabled, isGenerating,
}: {
  cost: number; costLabel?: string; onClick: () => void; disabled?: boolean; isGenerating: boolean;
}) => (
  <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-xl border-t border-border/50 z-20 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      disabled={disabled || isGenerating}
      className="w-full py-3.5 rounded-2xl bg-yellow-500 text-black font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40 shadow-lg shadow-yellow-500/20"
    >
      {isGenerating ? (
        <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
      ) : (
        <>Generate · {costLabel || `${cost} MC`}</>
      )}
    </motion.button>
  </div>
);

// ==================== Result View ====================
const ResultView = ({
  resultUrl, resultType = "image", title, onBack,
}: {
  resultUrl: string; resultType?: "image" | "video"; title: string; onBack: () => void;
}) => {
  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = `${title.toLowerCase().replace(/\s+/g, "-")}-result.${resultType === "video" ? "mp4" : "png"}`;
    a.target = "_blank";
    a.click();
  };

  const handleShare = async () => {
    navigator.clipboard.writeText(resultUrl);
    toast.success("Link copied!");
  };

  return (
    <div className="px-4 py-4 space-y-4">
      <div className="rounded-2xl overflow-hidden border border-border/20">
        {resultType === "video" ? (
          <video src={resultUrl} controls autoPlay className="w-full" />
        ) : (
          <img src={resultUrl} alt="Result" className="w-full" />
        )}
      </div>
      <div className="flex gap-2">
        <button onClick={handleDownload} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-primary text-primary-foreground font-medium text-sm">
          <Download className="w-4 h-4" /> Download
        </button>
        <button onClick={handleShare} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-accent text-foreground font-medium text-sm">
          <Share2 className="w-4 h-4" /> Share
        </button>
      </div>
      <button onClick={onBack} className="w-full py-3 rounded-2xl bg-accent/50 text-foreground text-sm font-medium">
        Try Again
      </button>
    </div>
  );
};

// ==================== Template Grid ====================
export const TemplateGrid = ({
  templates, onSelect, onCustom, customLabel = "Custom", gender, onGenderChange, hideNames,
}: {
  templates: ToolTemplate[];
  onSelect: (template: ToolTemplate) => void;
  onCustom?: () => void;
  customLabel?: string;
  gender?: "male" | "female";
  onGenderChange?: (g: "male" | "female") => void;
  hideNames?: boolean;
}) => {
  const filtered = gender ? templates.filter(t => t.gender === "both" || t.gender === gender) : templates;

  return (
    <div className="space-y-4">
      {onGenderChange && (
        <div className="flex gap-2">
          <button onClick={() => onGenderChange("female")} className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${gender === "female" ? "bg-primary text-primary-foreground" : "bg-accent/40 text-muted-foreground"}`}>Female</button>
          <button onClick={() => onGenderChange("male")} className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${gender === "male" ? "bg-primary text-primary-foreground" : "bg-accent/40 text-muted-foreground"}`}>Male</button>
        </div>
      )}
      {onCustom && (
        <motion.button whileTap={{ scale: 0.97 }} onClick={onCustom} className="w-full rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-4 text-center hover:border-primary/50 transition-colors">
          <p className="text-sm font-semibold text-primary">{customLabel}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Create your own style</p>
        </motion.button>
      )}
      <div className="grid grid-cols-2 gap-3">
        {filtered.map(t => (
          <motion.button key={t.id} whileTap={{ scale: 0.97 }} onClick={() => onSelect(t)} className="rounded-2xl overflow-hidden border border-border/20 bg-card text-left">
            {t.preview_url ? (
              <img src={t.preview_url} alt={t.name} className="w-full h-36 object-cover" />
            ) : (
              <div className="w-full h-36 bg-gradient-to-br from-primary/10 to-accent/20 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-muted-foreground/20" />
              </div>
            )}
            {!hideNames && <div className="p-2.5"><p className="text-sm font-medium text-foreground">{t.name}</p></div>}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

// ==================== Main Layout ====================
const ToolPageLayout = ({
  title, cost, costLabel, toolId, children, onGenerate, isGenerating, resultUrl, resultType = "image", autoProcess, hideHeaderCost = true, backTo, onFileSelected, skipLanding = false,
}: ToolPageLayoutProps) => {
  const navigate = useNavigate();
  const { hasEnoughCredits } = useCredits();
  const [showLanding, setShowLanding] = useState(!skipLanding);

  const defaultBack = toolId && (
    ["swap-characters", "talking-photo", "upscale", "video-upscale", "auto-caption", "lip-sync", "video-extender", "video-to-text", "green-screen", "video-colorizer", "video-watermark", "video-bg-replacer", "video-intro", "video-denoise", "thumbnail-generator"].includes(toolId)
  ) ? "/videos" : "/images";
  const goBack = backTo || defaultBack;

  const acceptType = resultType === "video" ? "video/*" : "image/*";
  const uploadLabel = resultType === "video" ? "Upload Your Video" : "Upload Your Photo";

  const handleGenerate = async () => {
    if (!hasEnoughCredits(cost)) {
      toast.error("Insufficient MC credits.", { action: { label: "Top up", onClick: () => navigate("/pricing") } });
      return;
    }
    await onGenerate();
  };

  const handleLandingFileSelect = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      if (onFileSelected) {
        onFileSelected(dataUrl);
      }
      setShowLanding(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <button onClick={() => navigate(goBack)} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-accent transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base font-semibold text-foreground flex-1">{title}</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {showLanding && !resultUrl && (
            <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ToolLanding
                onStart={handleLandingFileSelect}
                uploadLabel={uploadLabel}
                accept={acceptType}
                toolId={toolId}
              />
            </motion.div>
          )}

          {resultUrl && (
            <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <ResultView
                resultUrl={resultUrl}
                resultType={resultType}
                title={title}
                onBack={() => navigate(0)}
              />
            </motion.div>
          )}

          {!showLanding && !resultUrl && (
            <motion.div key="work" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-4 py-4 space-y-4 pb-32">
              {isGenerating ? <StarLoader /> : children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {!showLanding && !resultUrl && !autoProcess && !isGenerating && (
        <YellowGenerateButton cost={cost} costLabel={costLabel} onClick={handleGenerate} isGenerating={isGenerating} />
      )}
    </div>
  );
};

export default ToolPageLayout;

// ==================== Upload Boxes ====================
export const ImageUploadBox = ({
  label, image, onUpload, onClear, accept = "image/*",
}: {
  label: string; image: string | null; onUpload: (dataUrl: string) => void; onClear: () => void; accept?: string;
}) => {
  const ref = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onUpload(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  if (image) {
    return (
      <div className="relative rounded-2xl overflow-hidden border border-border/50">
        <img src={image} alt={label} className="w-full h-48 object-cover" />
        <button onClick={onClear} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <>
      <button onClick={() => ref.current?.click()} className="w-full h-48 rounded-2xl border-2 border-dashed border-border/50 flex flex-col items-center justify-center gap-3 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors bg-gradient-to-br from-accent/20 to-accent/5">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
          <ImagePlus className="w-7 h-7 text-primary/60" />
        </div>
        <span className="text-sm font-medium">{label}</span>
      </button>
      <input ref={ref} type="file" className="hidden" accept={accept} onChange={handleChange} />
    </>
  );
};

export const VideoUploadBox = ({
  label, video, onUpload, onClear,
}: {
  label: string; video: string | null; onUpload: (dataUrl: string) => void; onClear: () => void;
}) => {
  const ref = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onUpload(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  if (video) {
    return (
      <div className="relative rounded-2xl overflow-hidden border border-border/50">
        <video src={video} controls className="w-full h-48 object-cover" />
        <button onClick={onClear} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <>
      <button onClick={() => ref.current?.click()} className="w-full h-48 rounded-2xl border-2 border-dashed border-border/50 flex flex-col items-center justify-center gap-3 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors bg-gradient-to-br from-accent/20 to-accent/5">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Upload className="w-7 h-7 text-primary/60" />
        </div>
        <span className="text-sm font-medium">{label}</span>
      </button>
      <input ref={ref} type="file" className="hidden" accept="video/*" onChange={handleChange} />
    </>
  );
};

export const AudioUploadBox = ({
  label, audioName, onUpload, onClear,
}: {
  label: string; audioName: string | null; onUpload: (dataUrl: string, name: string) => void; onClear: () => void;
}) => {
  const ref = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onUpload(reader.result as string, file.name);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  if (audioName) {
    return (
      <div className="flex items-center gap-2 px-4 py-3.5 rounded-2xl bg-accent border border-border/30">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Upload className="w-5 h-5 text-primary/60" />
        </div>
        <span className="text-sm text-foreground flex-1 truncate">{audioName}</span>
        <button onClick={onClear} className="text-muted-foreground"><X className="w-4 h-4" /></button>
      </div>
    );
  }

  return (
    <>
      <button onClick={() => ref.current?.click()} className="w-full py-4 rounded-2xl border-2 border-dashed border-border/50 text-sm text-muted-foreground flex items-center justify-center gap-3 hover:border-primary/50 transition-colors bg-gradient-to-br from-accent/20 to-accent/5">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Upload className="w-5 h-5 text-primary/60" />
        </div>
        {label}
      </button>
      <input ref={ref} type="file" className="hidden" accept="audio/*" onChange={handleChange} />
    </>
  );
};