// Gallery — user's generated media from media_assets
import SEOHead from "@/components/common/SEOHead";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Download, Trash2, ImageIcon, Film, Music } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMediaAssets, deleteMediaAsset, type MediaAsset } from "@/hooks/useMediaAssets";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

type Filter = "all" | "image" | "video" | "audio";

const FILTERS: { id: Filter; label: string; Icon: typeof ImageIcon }[] = [
  { id: "all", label: "All", Icon: ImageIcon },
  { id: "image", label: "Images", Icon: ImageIcon },
  { id: "video", label: "Videos", Icon: Film },
  { id: "audio", label: "Audio", Icon: Music },
];

const GalleryPage = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<MediaAsset | null>(null);

  const { data: assets = [], isLoading } = useMediaAssets(
    filter === "all" ? undefined : filter,
    200,
  );

  const handleDelete = async (a: MediaAsset) => {
    try {
      await deleteMediaAsset(a.id, a.storage_path);
      await qc.invalidateQueries({ queryKey: ["media-assets"] });
      setSelected(null);
      toast.success("Deleted");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to delete");
    }
  };

  const handleDownload = async (a: MediaAsset) => {
    try {
      const res = await fetch(a.public_url);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const ext = a.kind === "video" ? "mp4" : a.kind === "audio" ? "mp3" : "png";
      link.download = `megsy-${a.id}.${ext}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Download failed");
    }
  };

  return (
    <>
    <SEOHead title="Gallery" description="Your personal gallery of AI-generated images, videos and audio — download, share and manage every asset." path="/gallery" noindex />
    <div className="min-h-[100dvh] bg-background">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/85 backdrop-blur-xl border-b border-border/60">
        <div className="max-w-6xl mx-auto flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 grid place-items-center rounded-xl hover:bg-muted/60 transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold tracking-tight">Gallery</h1>
          <span className="ml-2 text-xs text-muted-foreground tabular-nums">
            {assets.length} items
          </span>
        </div>
        <div className="max-w-6xl mx-auto flex gap-1.5 px-4 pb-3 overflow-x-auto">
          {FILTERS.map((f) => {
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`shrink-0 inline-flex items-center gap-1.5 px-3 h-8 rounded-full text-[12.5px] font-medium transition-colors ${
                  active
                    ? "bg-foreground text-background"
                    : "text-foreground/70 bg-foreground/[0.06] hover:bg-foreground/[0.1]"
                }`}
              >
                <f.Icon className="w-3.5 h-3.5" />
                {f.label}
              </button>
            );
          })}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-2xl" />
            ))}
          </div>
        ) : assets.length === 0 ? (
          <div className="text-center py-24">
            <ImageIcon className="w-10 h-10 mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-sm text-foreground">No media yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Generate images or videos to fill your gallery.
            </p>
            <button
              onClick={() => navigate("/media")}
              className="mt-5 px-4 h-9 rounded-full bg-foreground text-background text-sm font-semibold"
            >
              Open Studio
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {assets.map((a) => (
              <motion.button
                key={a.id}
                onClick={() => setSelected(a)}
                whileTap={{ scale: 0.97 }}
                className="group relative aspect-square overflow-hidden rounded-2xl bg-foreground/[0.05] ring-1 ring-foreground/[0.08] hover:ring-foreground/30 transition-all"
              >
                {a.kind === "video" ? (
                  <video
                    src={a.public_url}
                    muted
                    playsInline
                    preload="metadata"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : a.kind === "audio" ? (
                  <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-foreground/15 to-foreground/[0.04]">
                    <Music className="w-8 h-8 text-foreground/60" />
                  </div>
                ) : (
                  <img
                    src={a.public_url}
                    alt={a.prompt ?? ""}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                )}
                <div className="theme-fixed absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="theme-fixed text-[10.5px] font-medium text-white/95 line-clamp-2 drop-shadow-sm">{a.prompt}</p>
                </div>
                {a.kind === "video" && (
                  <span className="theme-fixed absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-semibold">
                    VIDEO
                  </span>
                )}
              </motion.button>
            ))}
          </div>
        )}
      </main>

      {/* Lightbox */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelected(null)}
            className="theme-fixed fixed inset-0 z-50 bg-black/85 backdrop-blur-md p-4 sm:p-8 grid place-items-center"
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-4xl w-full max-h-[90vh] flex flex-col gap-4"
            >
              <div className="relative rounded-2xl overflow-hidden bg-black flex items-center justify-center min-h-[40vh]">
                {selected.kind === "video" ? (
                  <video
                    src={selected.public_url}
                    controls
                    autoPlay
                    className="max-h-[70vh] w-full"
                  />
                ) : selected.kind === "audio" ? (
                  <audio src={selected.public_url} controls className="w-full" />
                ) : (
                  <img
                    src={selected.public_url}
                    alt={selected.prompt ?? ""}
                    className="max-h-[70vh] w-auto object-contain"
                  />
                )}
              </div>
              <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <p className="theme-fixed text-[11px] uppercase tracking-[0.18em] text-white/65 font-medium">
                    {selected.model} · {selected.cost_credits} MC
                  </p>
                  {selected.prompt && (
                    <p className="theme-fixed text-sm text-white/90 mt-1.5 line-clamp-3">
                      {selected.prompt}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleDownload(selected)}
                    className="theme-fixed h-10 px-4 rounded-full bg-white text-black text-sm font-semibold inline-flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" /> Download
                  </button>
                  <button
                    onClick={() => handleDelete(selected)}
                    className="theme-fixed h-10 px-4 rounded-full bg-white/10 text-white text-sm font-medium inline-flex items-center gap-2 hover:bg-white/20"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </>
  );
};

export default GalleryPage;
