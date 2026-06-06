import { useState, useRef, useCallback } from "react";
import { useToolSeo } from "@/hooks/useToolSeo";
import MediaToolLanding from "@/components/media/MediaToolLanding";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Paintbrush, Eraser, Upload, Download, RotateCcw, Plus, ImagePlus, Undo2, Sparkles, X, Trash2, Wand2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import inpaintHero from "@/assets/inpaint-hero.webp";
import { useIsMobile } from "@/hooks/use-mobile";
import { useCredits } from "@/hooks/useCredits";

const INPAINT_COST = 1;

type Stage = "landing" | "edit" | "result";
type Tool = "brush" | "eraser";
type Stroke = { tool: Tool; size: number; points: { x: number; y: number }[] };

const GRADIENT_BORDER =
  "rounded-[26px] p-[1.5px] bg-gradient-to-br from-primary/80 via-fuchsia-500/60 to-orange-400/70 shadow-[0_0_30px_-10px_hsl(var(--primary)/0.6)]";

const InpaintPage = () => {
  useToolSeo("inpaint");
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { hasEnoughCredits } = useCredits();
  const [stage, setStage] = useState<Stage>("landing");
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [refImage, setRefImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<Tool>("brush");
  const [brushSize, setBrushSize] = useState(30);
  const landingImage = inpaintHero;
  const [showOriginal, setShowOriginal] = useState(false);
  const [promptOpen, setPromptOpen] = useState(false);
  const [cursor, setCursor] = useState<{ x: number; y: number; visible: boolean }>({ x: 0, y: 0, visible: false });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDrawing = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const refInputRef = useRef<HTMLInputElement>(null);
  const strokesRef = useRef<Stroke[]>([]);

  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Please upload an image"); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      setSourceImage(e.target?.result as string);
      setStage("edit");
      setResultUrl(null);
    };
    reader.readAsDataURL(file);
  };

  const handleRefUpload = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => setRefImage(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const getCanvasCoords = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    let clientX: number, clientY: number;
    if ("touches" in e) {
      if (e.touches.length > 1) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  };

  const draw = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const scaledBrush = brushSize * (canvas.width / (containerRef.current?.offsetWidth || canvas.width));
    if (activeTool === "brush") {
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "hsla(var(--primary) / 0.45)";
    } else {
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "rgba(0,0,0,1)";
    }
    if (lastPos.current) {
      const dist = Math.sqrt((x - lastPos.current.x) ** 2 + (y - lastPos.current.y) ** 2);
      const steps = Math.max(Math.ceil(dist / (scaledBrush / 4)), 1);
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const ix = lastPos.current.x + (x - lastPos.current.x) * t;
        const iy = lastPos.current.y + (y - lastPos.current.y) * t;
        ctx.beginPath();
        ctx.arc(ix, iy, scaledBrush / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      ctx.beginPath();
      ctx.arc(x, y, scaledBrush / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    lastPos.current = { x, y };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    if ("touches" in e && e.touches.length > 1) return;
    e.preventDefault();
    isDrawing.current = true;
    lastPos.current = null;
    strokesRef.current.push({ tool: activeTool, size: brushSize, points: [] });
    const coords = getCanvasCoords(e);
    if (coords) {
      strokesRef.current[strokesRef.current.length - 1].points.push(coords);
      draw(coords.x, coords.y);
    }
  };

  const moveDraw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing.current) return;
    if ("touches" in e && e.touches.length > 1) { endDraw(); return; }
    e.preventDefault();
    const coords = getCanvasCoords(e);
    if (coords) {
      strokesRef.current[strokesRef.current.length - 1]?.points.push(coords);
      draw(coords.x, coords.y);
    }
  };

  const endDraw = () => { isDrawing.current = false; lastPos.current = null; };

  const redrawAll = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const scale = canvas.width / (containerRef.current?.offsetWidth || canvas.width);
    for (const stroke of strokesRef.current) {
      const sb = stroke.size * scale;
      if (stroke.tool === "brush") {
        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = "hsla(var(--primary) / 0.45)";
      } else {
        ctx.globalCompositeOperation = "destination-out";
        ctx.fillStyle = "rgba(0,0,0,1)";
      }
      let prev: { x: number; y: number } | null = null;
      for (const p of stroke.points) {
        if (prev) {
          const dist = Math.hypot(p.x - prev.x, p.y - prev.y);
          const steps = Math.max(Math.ceil(dist / (sb / 4)), 1);
          for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            ctx.beginPath();
            ctx.arc(prev.x + (p.x - prev.x) * t, prev.y + (p.y - prev.y) * t, sb / 2, 0, Math.PI * 2);
            ctx.fill();
          }
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, sb / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        prev = p;
      }
    }
  };

  const undoStroke = () => {
    strokesRef.current.pop();
    redrawAll();
  };

  const clearMask = () => {
    strokesRef.current = [];
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const getMaskDataUrl = (): string | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const maskCanvas = document.createElement("canvas");
    maskCanvas.width = canvas.width;
    maskCanvas.height = canvas.height;
    const ctx = maskCanvas.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
    const srcCtx = canvas.getContext("2d");
    if (!srcCtx) return null;
    const imageData = srcCtx.getImageData(0, 0, canvas.width, canvas.height);
    const maskData = ctx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
    for (let i = 0; i < imageData.data.length; i += 4) {
      if (imageData.data[i + 3] > 10) {
        maskData.data[i] = maskData.data[i + 1] = maskData.data[i + 2] = maskData.data[i + 3] = 255;
      }
    }
    ctx.putImageData(maskData, 0, 0);
    return maskCanvas.toDataURL("image/png");
  };

  const hasMaskSelection = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return false;
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] > 10) return true;
    }
    return false;
  };

  const handleGenerate = async () => {
    if (!sourceImage) { toast.error("Please upload an image"); return; }
    if (!hasMaskSelection()) { toast.error("Select the part you want to edit first"); return; }
    if (!prompt.trim()) { setPromptOpen(true); return; }
    if (!hasEnoughCredits(INPAINT_COST)) {
      toast.error("Insufficient MC");
      navigate("/pricing");
      return;
    }
    setPromptOpen(false);
    setIsGenerating(true);
    try {
      const maskDataUrl = getMaskDataUrl();
      const { data, error } = await supabase.functions.invoke("image-tools", {
        body: { tool: "inpaint", image: sourceImage, mask: maskDataUrl, referenceImage: refImage, prompt: prompt.trim() },
      });
      if (error) throw error;
      if (data?.url) { setResultUrl(data.url); setStage("result"); }
      else throw new Error(data?.error || "Generation failed");
    } catch (e: any) { toast.error(e.message || "Failed to generate"); }
    finally { setIsGenerating(false); }
  };

  const headerTitle = stage === "result" ? "Result" : "Inpaint";

  const isDark = stage === "edit" || stage === "result";

  if ((stage as string) === "landing") {

    return (

      <MediaToolLanding
      title="Inpaint"
      headline="Edit any"
      accent="part."
      description={`Upload a photo, brush an area, describe the change.`}
      heroImage={landingImage}
      cost={1}
      accept="image/*"
      resultType="image"
      onFileSelected={handleFileUpload}
    />

    );

  }


  // ════════════════════════════════════════════════════════════════
  // DESKTOP — Photopea/Krita-inspired studio workspace
  // ════════════════════════════════════════════════════════════════
  if (!isMobile) {
    return (
      <div className="h-[100dvh] w-full flex flex-col overflow-hidden bg-[#0e0e10] text-zinc-200">
        {/* Top bar */}
        <header className="shrink-0 h-12 border-b border-white/[0.06] flex items-center px-4 gap-3 bg-[#141417]">
          <button
            onClick={() => stage === "result" ? setStage("edit") : setStage("landing")}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition px-2 py-1 rounded-md hover:bg-white/5"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> {stage === "result" ? "Back to edit" : "Back"}
          </button>
          <div className="flex-1" />
          {stage === "result" && resultUrl && (
            <a
              href={resultUrl}
              download="inpaint-result.png"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-medium text-zinc-200 bg-white/[0.06] hover:bg-white/10 border border-white/10 rounded-md px-3 py-1.5 transition"
            >
              <Download className="w-3.5 h-3.5" /> Download
            </a>
          )}
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* Left tool rail */}
          <aside className="shrink-0 w-14 border-r border-white/[0.06] bg-[#141417] flex flex-col items-center py-3 gap-1">
            {[
              { id: "brush" as Tool, icon: Paintbrush, label: "Brush" },
              { id: "eraser" as Tool, icon: Eraser, label: "Eraser" },
            ].map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setActiveTool(id)}
                title={label}
                className={`w-11 h-11 rounded-lg flex items-center justify-center transition ${
                  activeTool === id
                    ? "bg-white/10 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
                    : "text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04]"
                }`}
              >
                <Icon className="w-[18px] h-[18px]" />
              </button>
            ))}
            <div className="h-px w-7 bg-white/[0.06] my-2" />
            <button
              onClick={undoStroke}
              title="Undo"
              className="w-11 h-11 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04] transition"
            >
              <Undo2 className="w-[18px] h-[18px]" />
            </button>
            <button
              onClick={clearMask}
              title="Clear mask"
              className="w-11 h-11 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04] transition"
            >
              <Trash2 className="w-[18px] h-[18px]" />
            </button>
          </aside>

          {/* Canvas */}
          <main className="flex-1 relative overflow-hidden flex items-center justify-center"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)",
              backgroundSize: "22px 22px",
            }}
          >
            {sourceImage && stage === "edit" && (
              <div
                ref={containerRef}
                className="relative max-h-[calc(100dvh-7rem)] max-w-[calc(100%-4rem)] rounded-lg overflow-hidden shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] ring-1 ring-white/10"
              >
                <img
                  ref={imgRef}
                  src={sourceImage}
                  alt=""
                  className="max-h-[calc(100dvh-7rem)] max-w-full block object-contain"
                  onLoad={setupCanvas}
                  draggable={false}
                />
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 w-full h-full"
                  style={{ cursor: "none", touchAction: "none" }}
                  onMouseDown={(e) => { startDraw(e); setCursor({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY, visible: true }); }}
                  onMouseMove={(e) => { moveDraw(e); setCursor({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY, visible: true }); }}
                  onMouseUp={endDraw}
                  onMouseEnter={(e) => setCursor({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY, visible: true })}
                  onMouseLeave={() => { endDraw(); setCursor((c) => ({ ...c, visible: false })); }}
                />
                {cursor.visible && (
                  <div
                    className="pointer-events-none absolute rounded-full border-2 border-white mix-blend-difference"
                    style={{
                      left: cursor.x,
                      top: cursor.y,
                      width: brushSize,
                      height: brushSize,
                      transform: "translate(-50%, -50%)",
                    }}
                  />
                )}
              </div>
            )}

            {stage === "result" && resultUrl && sourceImage && (
              <div className="relative max-h-[calc(100dvh-7rem)] max-w-[calc(100%-4rem)] rounded-lg overflow-hidden shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] ring-1 ring-white/10">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={showOriginal ? "b" : "a"}
                    src={showOriginal ? sourceImage : resultUrl}
                    alt=""
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="max-h-[calc(100dvh-7rem)] max-w-full object-contain block"
                  />
                </AnimatePresence>
                <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-xl border border-white/10 rounded-full p-1 flex items-center text-xs">
                  {(["before", "after"] as const).map((k) => {
                    const active = (k === "before") === showOriginal;
                    return (
                      <button
                        key={k}
                        onClick={() => setShowOriginal(k === "before")}
                        className={`relative px-4 py-1 rounded-full font-semibold transition ${
                          active ? "text-white" : "text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        {active && (
                          <motion.span layoutId="ip-desk-pill" className="absolute inset-0 rounded-full bg-white/15" />
                        )}
                        <span className="relative z-10">{k === "before" ? "Before" : "After"}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

          </main>

          {/* Right inspector panel */}
          <aside className="hidden md:flex shrink-0 w-full md:w-[340px] border-l border-white/[0.06] bg-[#141417] flex-col">
            <div className="p-5 border-b border-white/[0.06]">
              <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-zinc-500 mb-3">Brush</div>
              <div className="flex items-center gap-3">
                <div
                  className="rounded-full bg-primary/40 ring-1 ring-primary/60 shrink-0"
                  style={{ width: Math.min(brushSize, 44), height: Math.min(brushSize, 44) }}
                />
                <input
                  type="range"
                  min={5}
                  max={120}
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                  className="accent-primary flex-1 h-1 cursor-pointer"
                />
                <span className="text-xs font-mono text-zinc-400 w-8 text-right">{brushSize}</span>
              </div>
            </div>

            <div className="p-5 border-b border-white/[0.06]">
              <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-zinc-500 mb-3">Reference</div>
              <input ref={refInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleRefUpload(e.target.files[0]); }} />
              {refImage ? (
                <div className="relative rounded-lg overflow-hidden ring-1 ring-white/10 group">
                  <img src={refImage} alt="ref" className="w-full h-32 object-cover" />
                  <button
                    onClick={() => setRefImage(null)}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 backdrop-blur text-white grid place-items-center opacity-0 group-hover:opacity-100 transition"
                    aria-label="Remove reference"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => refInputRef.current?.click()}
                  className="w-full h-24 rounded-lg border border-dashed border-white/15 flex flex-col items-center justify-center gap-1 text-zinc-500 hover:text-zinc-300 hover:border-white/30 hover:bg-white/[0.02] transition"
                >
                  <ImagePlus className="w-5 h-5" />
                  <span className="text-xs">Add reference image</span>
                </button>
              )}
            </div>

            <div className="p-5 flex-1 flex flex-col">
              <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-zinc-500 mb-3">Prompt</div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); handleGenerate(); } }}
                placeholder="Describe the change… (e.g. replace with a leather jacket)"
                rows={5}
                className="w-full bg-black/30 border border-white/[0.08] rounded-lg p-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-primary/60 transition resize-none"
              />
              <p className="text-[10px] text-zinc-600 mt-2 font-mono">⌘ + Enter to generate</p>

              <div className="flex-1" />

              {stage === "result" ? (
                <button
                  onClick={() => { setStage("landing"); setSourceImage(null); setRefImage(null); setPrompt(""); setResultUrl(null); setShowOriginal(false); strokesRef.current = []; }}
                  className="w-full mt-4 py-3 rounded-lg bg-white/[0.06] hover:bg-white/10 border border-white/10 text-sm font-semibold text-zinc-200 flex items-center justify-center gap-2 transition"
                >
                  <RotateCcw className="w-4 h-4" /> Start over
                </button>
              ) : (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="relative w-full mt-4 py-3 rounded-2xl text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 overflow-hidden backdrop-blur-2xl bg-white/10 border border-white/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.35),inset_0_-1px_0_0_rgba(255,255,255,0.08),0_8px_32px_-8px_rgba(0,0,0,0.5)] hover:bg-white/[0.14] transition-all before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-b before:from-white/20 before:via-transparent before:to-transparent before:pointer-events-none"
                >
                  <span className="relative z-10 flex items-center gap-2">
                  {isGenerating ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <><Wand2 className="w-4 h-4" /> Generate · 1 MC</>
                  )}
                  </span>
                </motion.button>

              )}
            </div>
          </aside>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════
  // MOBILE — existing immersive layout (untouched)
  // ════════════════════════════════════════════════════════════════
  return (
    <div className={`h-[100dvh] flex flex-col overflow-hidden ${isDark ? "bg-background" : "bg-background"}`}>
      {/* Floating back button */}
      <button
        onClick={() => (stage as string) === "landing" ? navigate("/images") : setStage("landing")}
        className="fixed top-[calc(env(safe-area-inset-top)+1rem)] left-3 z-30 w-9 h-9 flex items-center justify-center rounded-full bg-background/40 backdrop-blur-xl border border-border/40 text-foreground hover:bg-background/60 transition"
        aria-label="Back"
      >
        <ArrowLeft className="w-4 h-4" />
      </button>

      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {/* ─── Landing ─── */}
          {(stage as string) === "landing" && (
            <motion.div
              key="landing"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 flex flex-col px-5 pt-[calc(env(safe-area-inset-top)+4rem)] pb-8"
            >
              {/* Hero card */}
              <motion.div
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 24, delay: 0.05 }}
                className={`${GRADIENT_BORDER} flex-1 max-h-[55vh]`}
              >
                <div className="relative w-full h-full rounded-[24px] overflow-hidden bg-muted">
                  {landingImage ? (
                    <img src={landingImage} alt="Inpaint" className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-fuchsia-500/20 to-orange-400/20" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent" />
                </div>
              </motion.div>

              {/* Title */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.5 }}
                className="mt-6 text-center"
              >
                <h2 className="font-display text-[10vw] sm:text-[6vw] uppercase leading-[0.95] tracking-tight text-foreground">
                  Edit any{" "}
                  <span className="text-primary">part.</span>
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Upload a photo, brush an area, describe the change.
                </p>
              </motion.div>

              {/* Upload button */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.5 }}
                className="mt-6"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0]); }}
                />
                <div className={GRADIENT_BORDER}>
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    transition={{ type: "spring", stiffness: 400, damping: 22 }}
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full bg-background rounded-[24px] py-4 flex items-center justify-center gap-2 text-foreground font-semibold text-sm"
                  >
                    <Upload className="w-4 h-4" /> Upload Photo
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* ─── Edit ─── */}
          {stage === "edit" && sourceImage && (
            <motion.div
              key="edit"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 flex flex-col bg-background"
            >
              {/* Image canvas — centered, breathing room */}
              <div
                className="flex-1 relative overflow-hidden flex items-center justify-center px-4"
                style={{ touchAction: "pinch-zoom" }}
              >
                <div ref={containerRef} className="relative max-h-full max-w-full rounded-2xl overflow-hidden shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]">
                  <img
                    ref={imgRef}
                    src={sourceImage}
                    alt=""
                    className="max-h-[72dvh] max-w-full block object-contain"
                    onLoad={setupCanvas}
                    draggable={false}
                  />
                  <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full"
                    style={{ cursor: "none", touchAction: "none" }}
                    onMouseDown={(e) => { startDraw(e); setCursor({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY, visible: true }); }}
                    onMouseMove={(e) => { moveDraw(e); setCursor({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY, visible: true }); }}
                    onMouseUp={endDraw}
                    onMouseEnter={(e) => setCursor({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY, visible: true })}
                    onMouseLeave={() => { endDraw(); setCursor((c) => ({ ...c, visible: false })); }}
                    onTouchStart={startDraw} onTouchMove={moveDraw} onTouchEnd={endDraw}
                  />
                  {/* Brush cursor follower */}
                  {cursor.visible && (
                    <div
                      className="pointer-events-none absolute rounded-full border-2 border-white mix-blend-difference"
                      style={{
                        left: cursor.x,
                        top: cursor.y,
                        width: brushSize,
                        height: brushSize,
                        transform: "translate(-50%, -50%)",
                      }}
                    />
                  )}
                </div>

                {/* Reference chip — top-left */}
                {refImage && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute top-3 left-3 flex items-center gap-1.5 bg-foreground/5 backdrop-blur-2xl border border-border/40 rounded-full pl-1 pr-2 py-1 shadow-2xl"
                  >
                    <img src={refImage} alt="" className="w-7 h-7 rounded-full object-cover" />
                    <button onClick={() => setRefImage(null)} className="text-foreground/70 hover:text-foreground" aria-label="Remove reference">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                )}
              </div>

              {/* Bottom controls — prompt input + toolbar */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 32, delay: 0.05 }}
                className="shrink-0 flex flex-col items-center gap-2.5 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-3"
              >
                {/* Tool toolbar */}
                <div className="bg-white/10 dark:bg-white/[0.06] backdrop-blur-2xl backdrop-saturate-200 border border-white/20 dark:border-white/10 rounded-full p-1.5 flex items-center gap-1 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.18),0_10px_40px_-10px_rgba(0,0,0,0.5)]">
                  <button
                    onClick={() => setActiveTool(activeTool === "brush" ? "eraser" : "brush")}
                    className="relative w-11 h-11 rounded-full flex items-center justify-center text-foreground"
                    aria-label="Toggle tool"
                  >
                    <motion.span
                      key={activeTool}
                      initial={{ scale: 0.6, opacity: 0, rotate: -30 }}
                      animate={{ scale: 1, opacity: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 22 }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      {activeTool === "brush"
                        ? <Paintbrush className="w-[18px] h-[18px]" />
                        : <Eraser className="w-[18px] h-[18px]" />}
                    </motion.span>
                  </button>
                  <div className="flex items-center gap-2 px-2">
                    <input
                      type="range"
                      min={5}
                      max={80}
                      value={brushSize}
                      onChange={(e) => setBrushSize(Number(e.target.value))}
                      className="accent-primary w-24 h-1 cursor-pointer"
                    />
                  </div>
                  <button
                    onClick={undoStroke}
                    className="w-11 h-11 rounded-full flex items-center justify-center text-foreground/80 hover:text-foreground hover:bg-foreground/10 transition"
                    aria-label="Undo"
                  >
                    <Undo2 className="w-[18px] h-[18px]" />
                  </button>
                </div>

                {/* Slim prompt input */}
                <div className="w-full max-w-md flex items-center gap-2 bg-white/10 dark:bg-white/[0.06] backdrop-blur-2xl backdrop-saturate-200 border border-white/20 dark:border-white/10 rounded-full pl-2 pr-1.5 py-1.5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.18),0_10px_40px_-10px_rgba(0,0,0,0.5)]">
                  <input ref={refInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleRefUpload(e.target.files[0]); }} />
                  <button
                    onClick={() => refInputRef.current?.click()}
                    className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-foreground/70 hover:text-foreground hover:bg-foreground/10 transition"
                    aria-label="Reference image"
                  >
                    {refImage ? <ImagePlus className="w-[17px] h-[17px] text-primary" /> : <Plus className="w-[17px] h-[17px]" />}
                  </button>
                  <input
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleGenerate(); } }}
                    placeholder="Replace with…"
                    className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground px-1 min-w-0"
                  />
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    transition={{ type: "spring", stiffness: 500, damping: 22 }}
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className={
                      prompt.trim() || refImage
                        ? "shrink-0 h-9 px-4 rounded-full text-white text-sm font-bold disabled:opacity-40 flex items-center justify-center min-w-[92px] bg-primary/35 backdrop-blur-2xl backdrop-saturate-200 border border-primary/40 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25),0_10px_30px_-8px_hsl(var(--primary)/0.55)]"
                        : "shrink-0 h-9 px-4 rounded-full text-foreground/80 text-sm font-bold disabled:opacity-40 flex items-center justify-center min-w-[92px] bg-white/10 dark:bg-white/[0.06] backdrop-blur-2xl backdrop-saturate-150 border border-white/15 dark:border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15),0_8px_24px_-8px_rgba(0,0,0,0.4)]"
                    }
                  >
                    {isGenerating ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : "Generate"}
                  </motion.button>
                </div>
              </motion.div>

              {/* Prompt sheet — slides up from bottom on demand */}
              <AnimatePresence>
                {promptOpen && (
                  <>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="absolute inset-0 bg-background/50 backdrop-blur-sm z-20"
                      onClick={() => setPromptOpen(false)}
                    />
                    <motion.div
                      initial={{ y: "100%" }}
                      animate={{ y: 0 }}
                      exit={{ y: "100%" }}
                      transition={{ type: "spring", stiffness: 400, damping: 36 }}
                      className="absolute bottom-0 left-0 right-0 z-30 bg-card border-t border-border/40 rounded-t-3xl p-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] shadow-2xl"
                    >
                      <div className="mx-auto w-10 h-1 rounded-full bg-foreground/20 mb-4" />
                      <h3 className="text-foreground text-sm font-semibold mb-3">Describe the change</h3>
                      <input
                        autoFocus
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleGenerate(); } }}
                        placeholder="e.g. replace with a leather jacket"
                        className="w-full bg-foreground/5 border border-border/40 rounded-2xl px-4 py-3 text-foreground text-sm outline-none placeholder:text-muted-foreground/70 focus:border-primary/60 transition"
                      />
                      <div className="flex items-center gap-2 mt-3">
                        <input ref={refInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleRefUpload(e.target.files[0]); }} />
                        <button
                          onClick={() => refInputRef.current?.click()}
                          className="flex items-center gap-1.5 h-10 px-3 rounded-full bg-foreground/5 border border-border/40 text-foreground/80 text-xs font-medium hover:bg-foreground/10 transition"
                        >
                          {refImage ? <ImagePlus className="w-3.5 h-3.5 text-primary" /> : <Plus className="w-3.5 h-3.5" />}
                          {refImage ? "Reference added" : "Add reference"}
                        </button>
                        <div className="flex-1" />
                        <motion.button
                          whileTap={{ scale: 0.94 }}
                          onClick={handleGenerate}
                          disabled={isGenerating || !prompt.trim()}
                          className="h-10 px-5 rounded-full bg-primary text-primary-foreground text-sm font-bold disabled:opacity-40 flex items-center gap-1.5"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          Generate
                        </motion.button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ─── Result ─── */}
          {stage === "result" && resultUrl && sourceImage && (
            <motion.div
              key="result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 flex flex-col bg-background"
            >
              {/* Fullscreen result */}
              <div className="flex-1 relative overflow-hidden flex items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={showOriginal ? "before" : "after"}
                    src={showOriginal ? sourceImage : resultUrl}
                    alt={showOriginal ? "Original" : "Result"}
                    initial={{ opacity: 0, scale: 1.02 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="max-h-[100dvh] max-w-full object-contain"
                  />
                </AnimatePresence>

                {/* Before/After floating toggle — top */}
                <motion.div
                  initial={{ opacity: 0, y: -16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 24, delay: 0.15 }}
                  className="absolute top-3 left-1/2 -translate-x-1/2 bg-background/60 backdrop-blur-2xl border border-border/40 rounded-full p-1 flex items-center shadow-xl"
                >
                  {(["before", "after"] as const).map((k) => {
                    const active = (k === "before") === showOriginal;
                    return (
                      <button
                        key={k}
                        onClick={() => setShowOriginal(k === "before")}
                        className={`relative z-10 px-5 py-1.5 rounded-full text-xs font-bold transition-colors ${
                          active ? "text-primary-foreground" : "text-foreground/70"
                        }`}
                      >
                        {active && (
                          <motion.span
                            layoutId="inpaint-result-pill"
                            className="absolute inset-0 rounded-full bg-primary"
                            transition={{ type: "spring", stiffness: 380, damping: 30 }}
                          />
                        )}
                        <span className="relative z-10">{k === "before" ? "Before" : "After"}</span>
                      </button>
                    );
                  })}
                </motion.div>
              </div>

              {/* Bottom action dock */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 24, delay: 0.1 }}
                className="shrink-0 px-3 pt-2 pb-[calc(env(safe-area-inset-bottom)+0.6rem)] bg-gradient-to-t from-background via-background/80 to-transparent space-y-2"
              >
                <div className="flex gap-2">
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={() => { setStage("edit"); setShowOriginal(false); setResultUrl(null); }}
                    className="flex-1 py-3 rounded-2xl bg-foreground/10 backdrop-blur-xl border border-border/40 text-foreground text-sm font-semibold hover:bg-foreground/15 transition"
                  >
                    Edit Again
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={() => { setStage("landing"); setSourceImage(null); setRefImage(null); setPrompt(""); setResultUrl(null); setShowOriginal(false); }}
                    className="flex-1 py-3 rounded-2xl bg-foreground/10 backdrop-blur-xl border border-border/40 text-foreground text-sm font-semibold hover:bg-foreground/15 transition"
                  >
                    Start Over
                  </motion.button>
                </div>
                <div className={GRADIENT_BORDER}>
                  <a
                    href={resultUrl}
                    download="inpaint-result.png"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-background rounded-[24px] py-3.5 flex items-center justify-center gap-2 text-foreground font-semibold text-sm"
                  >
                    <Download className="w-4 h-4" /> Download
                  </a>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default InpaintPage;
