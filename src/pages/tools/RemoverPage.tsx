import { useState, useRef, useCallback } from "react";
import { useToolSeo } from "@/hooks/useToolSeo";
import MediaToolLanding from "@/components/media/MediaToolLanding";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Paintbrush, Eraser, Upload, Download, Undo2, Loader2, Wand2, RefreshCw, Share2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { useCredits } from "@/hooks/useCredits";
import removerHero from "@/assets/remover-hero.webp";

const REMOVER_COST = 1;

type Stage = "landing" | "edit" | "result";
type Tool = "brush" | "eraser";
type Stroke = { tool: Tool; size: number; points: { x: number; y: number }[] };

const GRADIENT_BORDER =
  "rounded-[26px] p-[1.5px] bg-gradient-to-br from-primary/80 via-fuchsia-500/60 to-orange-400/70 shadow-[0_0_30px_-10px_hsl(var(--primary)/0.6)]";

const RemoverPage = () => {
  useToolSeo("remover");
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { hasEnoughCredits } = useCredits();
  const [stage, setStage] = useState<Stage>("landing");
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<Tool>("brush");
  const [brushSize, setBrushSize] = useState(36);
  const landingImage = removerHero;
  const [showOriginal, setShowOriginal] = useState(false);
  const [cursor, setCursor] = useState<{ x: number; y: number; visible: boolean }>({ x: 0, y: 0, visible: false });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDrawing = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
      strokesRef.current = [];
    };
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
      clientX = e.touches[0].clientX; clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX; clientY = e.clientY;
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
      const dist = Math.hypot(x - lastPos.current.x, y - lastPos.current.y);
      const steps = Math.max(Math.ceil(dist / (scaledBrush / 4)), 1);
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const ix = lastPos.current.x + (x - lastPos.current.x) * t;
        const iy = lastPos.current.y + (y - lastPos.current.y) * t;
        ctx.beginPath(); ctx.arc(ix, iy, scaledBrush / 2, 0, Math.PI * 2); ctx.fill();
      }
    } else {
      ctx.beginPath(); ctx.arc(x, y, scaledBrush / 2, 0, Math.PI * 2); ctx.fill();
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

  const undoStroke = () => { strokesRef.current.pop(); redrawAll(); };

  const getMaskDataUrl = (): string | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const maskCanvas = document.createElement("canvas");
    maskCanvas.width = canvas.width; maskCanvas.height = canvas.height;
    const ctx = maskCanvas.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = "black"; ctx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
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
    if (!hasMaskSelection()) { toast.error("Select the part you want to erase first"); return; }
    if (!hasEnoughCredits(REMOVER_COST)) {
      toast.error("Insufficient MC");
      navigate("/pricing");
      return;
    }
    setIsGenerating(true);
    try {
      const maskDataUrl = getMaskDataUrl();
      const { data, error } = await supabase.functions.invoke("image-tools", {
        body: { tool: "remover", image: sourceImage, mask: maskDataUrl },
      });
      if (error) throw error;
      if (data?.url) { setResultUrl(data.url); setStage("result"); }
      else throw new Error(data?.error || "Generation failed");
    } catch (e: any) { toast.error(e.message || "Failed to remove"); }
    finally { setIsGenerating(false); }
  };

  if ((stage as string) === "landing") {

    return (

      <MediaToolLanding
      title="Remover"
      headline="Erase any"
      accent="object."
      description={`Brush over what you want gone — it disappears, naturally.`}
      heroImage={landingImage}
      cost={1}
      accept="image/*"
      resultType="image"
      onFileSelected={handleFileUpload}
    />

    );

  }

  // ─────────── DESKTOP STUDIO ───────────
  if (!isMobile) {
    return (
      <div className="h-[100dvh] w-full flex flex-col bg-paper text-ink overflow-hidden">
        <header className="h-14 shrink-0 flex items-center justify-between px-6 border-b border-ink/10 bg-paper/90 backdrop-blur">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/images")}
              className="flex items-center gap-2 font-manrope text-sm font-medium text-ink/70 hover:text-ink transition"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <div className="h-5 w-px bg-ink/15" />
            <div>
              <div className="font-sora text-sm font-semibold text-ink leading-tight">Remover Studio</div>
              
            </div>
          </div>
          {resultUrl && (
            <a
              href={resultUrl}
              download="remover-result.png"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-ink text-paper text-sm font-sora font-semibold hover:bg-ink/90 transition"
            >
              <Download className="w-4 h-4" /> Download
            </a>
          )}
        </header>

        <div className="flex-1 min-h-0 grid grid-cols-[1fr_340px]">
          {/* CENTER */}
          <main className="relative overflow-hidden bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary)/0.06),_transparent_60%)] flex items-center justify-center p-8">
            {!sourceImage && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-3 w-full max-w-md aspect-[4/3] rounded-3xl bg-white border-2 border-dashed border-ink/20 hover:border-ink/40 transition group"
              >
                <div className="w-16 h-16 rounded-2xl bg-ink/5 group-hover:bg-ink/10 flex items-center justify-center transition">
                  <Upload className="w-6 h-6 text-ink/50" />
                </div>
                <div className="text-center">
                  <div className="font-sora font-semibold text-sm text-ink/70">Upload a photo</div>
                  <div className="font-manrope text-xs text-ink/40 mt-0.5">PNG, JPG up to 10 MB</div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                />
              </button>
            )}

            {sourceImage && stage !== "result" && (
              <div
                ref={containerRef}
                className="relative max-h-full max-w-full rounded-2xl overflow-hidden bg-white border border-ink/10 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.2)]"
              >
                <img
                  ref={imgRef}
                  src={sourceImage}
                  alt=""
                  className="max-h-[78dvh] max-w-full block object-contain"
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
                {isGenerating && (
                  <div className="absolute inset-0 bg-paper/40 backdrop-blur-sm flex items-center justify-center">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-paper border border-ink/10 shadow-sm text-ink/70 font-manrope text-xs">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Erasing…
                    </div>
                  </div>
                )}
              </div>
            )}

            {stage === "result" && resultUrl && sourceImage && (
              <div className="relative max-h-full max-w-full rounded-2xl overflow-hidden bg-white border border-ink/10 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.2)]">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={showOriginal ? "before" : "after"}
                    src={showOriginal ? sourceImage : resultUrl}
                    alt={showOriginal ? "Original" : "Result"}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="max-h-[78dvh] max-w-full block object-contain"
                  />
                </AnimatePresence>
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-paper/95 backdrop-blur border border-ink/10 rounded-full p-1 flex items-center shadow-sm">
                  {(["before", "after"] as const).map((k) => {
                    const active = (k === "before") === showOriginal;
                    return (
                      <button
                        key={k}
                        onClick={() => setShowOriginal(k === "before")}
                        className={`relative z-10 px-4 py-1.5 rounded-full text-xs font-sora font-semibold transition-colors ${
                          active ? "text-paper" : "text-ink/60"
                        }`}
                      >
                        {active && (
                          <motion.span
                            layoutId="d-remover-pill"
                            className="absolute inset-0 rounded-full bg-ink"
                            transition={{ type: "spring", stiffness: 380, damping: 30 }}
                          />
                        )}
                        <span className="relative z-10">{k === "before" ? "Before" : "After"}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </main>

          {/* RIGHT — controls */}
          <aside className="border-l border-ink/10 bg-ink/[0.02] flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Source */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink/40">Source</div>
                  {sourceImage && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[11px] font-manrope text-ink/50 hover:text-ink flex items-center gap-1"
                    >
                      <Upload className="w-3 h-3" /> Replace
                    </button>
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-20 rounded-xl border border-ink/10 bg-white hover:border-ink/30 transition overflow-hidden relative flex items-center justify-center group"
                >
                  {sourceImage ? (
                    <img src={sourceImage} alt="" className="w-full h-full object-contain p-2" />
                  ) : (
                    <div className="flex items-center gap-2 text-ink/40 group-hover:text-ink/70 transition">
                      <Upload className="w-4 h-4" />
                      <span className="font-manrope text-xs">Upload image</span>
                    </div>
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                />
              </div>

              {/* Tool toggle */}
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink/40 mb-2">Tool</div>
                <div className="grid grid-cols-2 gap-2">
                  {(["brush", "eraser"] as const).map((t) => {
                    const active = activeTool === t;
                    return (
                      <button
                        key={t}
                        onClick={() => setActiveTool(t)}
                        disabled={!sourceImage || stage === "result"}
                        className={`px-3 py-3 rounded-xl text-xs font-sora font-semibold border transition flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed ${
                          active
                            ? "border-ink bg-ink text-paper"
                            : "border-ink/10 bg-paper hover:border-ink/30 text-ink"
                        }`}
                      >
                        {t === "brush" ? <Paintbrush className="w-3.5 h-3.5" /> : <Eraser className="w-3.5 h-3.5" />}
                        {t === "brush" ? "Brush" : "Eraser"}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Brush size */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink/40">Brush size</div>
                  <div className="font-mono text-[10px] text-ink/50">{brushSize}px</div>
                </div>
                <input
                  type="range"
                  min={5}
                  max={120}
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                  disabled={!sourceImage || stage === "result"}
                  className="accent-ink w-full h-1 cursor-pointer disabled:opacity-40"
                />
              </div>

              {/* Undo */}
              <button
                onClick={undoStroke}
                disabled={!sourceImage || stage === "result"}
                className="w-full py-2.5 rounded-xl border border-ink/15 hover:border-ink/40 hover:bg-ink/[0.04] transition flex items-center justify-center gap-2 font-manrope text-sm text-ink/70 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Undo2 className="w-3.5 h-3.5" /> Undo last stroke
              </button>

              <div className="text-[11px] font-manrope text-ink/40 leading-relaxed">
                Paint over the object you want to remove. Use the eraser to clean up your selection. Hit Erase when ready.
              </div>
            </div>

            {/* Sticky footer */}
            <div className="p-6 pt-3 border-t border-ink/10 bg-paper/60 backdrop-blur space-y-2">
              {stage !== "result" ? (
                <button
                  disabled={!sourceImage || isGenerating}
                  onClick={handleGenerate}
                  className="w-full py-3.5 rounded-full bg-ink text-paper font-sora font-semibold text-sm flex items-center justify-between px-5 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-ink/90 transition"
                >
                  <span className="flex items-center gap-2">
                    {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                    {isGenerating ? "Erasing…" : "Erase"}
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-paper/15 text-paper text-[10px] font-mono tracking-wider">
                    1 MC
                  </span>
                </button>
              ) : (
                <>
                  <button
                    onClick={() => { setStage("edit"); setShowOriginal(false); setResultUrl(null); }}
                    className="w-full py-3 rounded-full bg-ink text-paper font-sora font-semibold text-sm flex items-center justify-center gap-2 hover:bg-ink/90 transition"
                  >
                    <RefreshCw className="w-4 h-4" /> Edit again
                  </button>
                  <button
                    onClick={() => {
                      if (resultUrl) { navigator.clipboard.writeText(resultUrl); toast.success("Link copied!"); }
                    }}
                    className="w-full py-2.5 rounded-full border border-ink/15 hover:border-ink/40 hover:bg-ink/[0.04] transition flex items-center justify-center gap-2 font-manrope text-sm text-ink/70"
                  >
                    <Share2 className="w-3.5 h-3.5" /> Copy link
                  </button>
                </>
              )}
            </div>
          </aside>
        </div>
      </div>
    );
  }


  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden bg-background">
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
              <motion.div
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 24, delay: 0.05 }}
                className={`${GRADIENT_BORDER} flex-1 max-h-[55vh]`}
              >
                <div className="relative w-full h-full rounded-[24px] overflow-hidden bg-muted">
                  <img src={landingImage} alt="Object Remover" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent" />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.5 }}
                className="mt-6 text-center"
              >
                <h2 className="font-display text-[10vw] sm:text-[6vw] uppercase leading-[0.95] tracking-tight text-foreground">
                  Erase any{" "}
                  <span className="text-primary">object.</span>
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Brush over what you want gone — it disappears, naturally.
                </p>
              </motion.div>

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
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 32, delay: 0.05 }}
                className="shrink-0 flex flex-col items-center gap-2.5 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-3"
              >
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
                      max={120}
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

                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full max-w-md h-12 rounded-full text-white text-sm font-bold disabled:opacity-40 flex items-center justify-center bg-primary/35 backdrop-blur-2xl backdrop-saturate-200 border border-primary/40 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25),0_10px_30px_-8px_hsl(var(--primary)/0.55)]"
                >
                  {isGenerating ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : "Erase"}
                </motion.button>
              </motion.div>
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
                            layoutId="remover-result-pill"
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
                    onClick={() => { setStage("landing"); setSourceImage(null); setResultUrl(null); setShowOriginal(false); strokesRef.current = []; }}
                    className="flex-1 py-3 rounded-2xl bg-foreground/10 backdrop-blur-xl border border-border/40 text-foreground text-sm font-semibold hover:bg-foreground/15 transition"
                  >
                    Start Over
                  </motion.button>
                </div>
                <div className={GRADIENT_BORDER}>
                  <a
                    href={resultUrl}
                    download="remover-result.png"
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

export default RemoverPage;
