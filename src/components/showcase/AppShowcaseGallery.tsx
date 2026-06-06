import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Copy, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { ShowcaseItem } from "@/components/showcase/ShowcaseGrid";

interface AppShowcaseGalleryProps {
  mode: "images" | "videos";
  onItemClick: (item: ShowcaseItem) => void;
}

const AppShowcaseGallery = ({ mode, onItemClick }: AppShowcaseGalleryProps) => {
  const [dbItems, setDbItems] = useState<ShowcaseItem[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef<number | null>(null);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(mode === "images");

  useEffect(() => {
    const load = async () => {
      const mediaType = mode === "images" ? "image" : "video";
      const { data } = await supabase
        .from("showcase_items" as any)
        .select("*")
        .eq("media_type", mediaType)
        .order("is_trending", { ascending: false })
        .order("trending_at", { ascending: false, nullsFirst: false })
        .order("display_order", { ascending: true });
      if (data) setDbItems(data as unknown as ShowcaseItem[]);
    };
    load();
  }, [mode]);

  // Auto-scroll for images page — slow continuous scroll, stops permanently on touch
  useEffect(() => {
    if (mode !== "images" || !autoScrollEnabled) return;
    const el = scrollRef.current;
    if (!el) return;

    let animId: number;
    const scrollStep = () => {
      if (!autoScrollEnabled) return;
      el.scrollTop += 0.5;
      animId = requestAnimationFrame(scrollStep);
    };
    animId = requestAnimationFrame(scrollStep);
    autoScrollRef.current = animId;

    return () => cancelAnimationFrame(animId);
  }, [mode, autoScrollEnabled, dbItems]);

  // Stop auto-scroll permanently on any touch/pointer interaction
  const handleUserInteraction = useCallback(() => {
    if (autoScrollEnabled) {
      setAutoScrollEnabled(false);
      if (autoScrollRef.current) {
        cancelAnimationFrame(autoScrollRef.current);
        autoScrollRef.current = null;
      }
    }
  }, [autoScrollEnabled]);

  if (dbItems.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-center px-6">
        <div>
          <p className="text-sm text-muted-foreground">
            {mode === "images" ? "No images in showcase yet" : "No videos in showcase yet"}
          </p>
        </div>
      </div>
    );
  }

  const handleCopyPrompt = (e: React.MouseEvent, prompt: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(prompt);
    toast.success("Prompt copied!");
  };

  const handleReuse = (e: React.MouseEvent, item: ShowcaseItem) => {
    e.stopPropagation();
    onItemClick(item);
  };

  return (
    <div
      ref={scrollRef}
      className="p-3 md:p-4"
      onTouchStart={handleUserInteraction}
      onMouseDown={handleUserInteraction}
      onWheel={handleUserInteraction}
    >
      <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-3">
        {dbItems.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.04 }}
            className="break-inside-avoid mb-3 cursor-pointer group relative rounded-2xl overflow-hidden"
            onClick={() => onItemClick(item)}
          >
            {item.media_type === "video" ? (
              <video
                src={item.media_url}
                muted
                loop
                playsInline
                preload="metadata"
                className="w-full rounded-2xl object-cover pointer-events-auto"
                onClick={(e) => {
                  const vid = e.currentTarget;
                  if (vid.paused) vid.play();
                  else vid.pause();
                }}
              />
            ) : (
              <img
                src={item.media_url}
                alt={item.prompt}
                className="w-full rounded-2xl object-cover pointer-events-auto"
                loading="lazy"
              />
            )}
            {/* Clean hover overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-2xl flex flex-col justify-end p-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => handleCopyPrompt(e, item.prompt)}
                  className="px-3 py-1.5 rounded-lg bg-white/15 backdrop-blur-xl text-white/90 text-[11px] font-medium hover:bg-white/25 transition-colors"
                >
                  Copy
                </button>
                <button
                  onClick={(e) => handleReuse(e, item)}
                  className="px-3 py-1.5 rounded-lg bg-white/15 backdrop-blur-xl text-white/90 text-[11px] font-medium hover:bg-white/25 transition-colors"
                >
                  Reuse
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default AppShowcaseGallery;
