import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export interface ShowcaseItem {
  id: string;
  media_url: string;
  media_type: string;
  prompt: string;
  model_id: string;
  model_name: string;
  aspect_ratio: string;
  quality: string;
  duration: string | null;
  style: string | null;
  display_order: number;
  created_at: string;
  is_trending?: boolean;
  trending_at?: string | null;
  thumbnail_url?: string | null;
  category?: string | null;
}

interface ShowcaseGridProps {
  onItemClick: (item: ShowcaseItem) => void;
}

const ShowcaseGrid = ({ onItemClick }: ShowcaseGridProps) => {
  const [items, setItems] = useState<ShowcaseItem[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from("showcase_items" as any)
      .select("*")
      .order("is_trending", { ascending: false })
      .order("trending_at", { ascending: false, nullsFirst: false })
      .order("display_order", { ascending: true });
    if (data) setItems(data as unknown as ShowcaseItem[]);
  };

  useEffect(() => {
    load();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.rpc("has_role" as any, {
        _user_id: user.id,
        _role: "admin",
      });
      setIsAdmin(!!data);
    })();
  }, []);

  const toggleTrend = async (item: ShowcaseItem) => {
    const next = !item.is_trending;
    const { error } = await supabase
      .from("showcase_items" as any)
      .update({
        is_trending: next,
        trending_at: next ? new Date().toISOString() : null,
      })
      .eq("id", item.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(next ? "Pinned as Trending" : "Removed from Trending");
    await load();
  };

  if (items.length === 0) return null;

  return (
    <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-3 p-4">
      {items.map((item, i) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04, duration: 0.4 }}
          className="break-inside-avoid mb-3 cursor-pointer group relative rounded-2xl overflow-hidden"
          onClick={() => onItemClick(item)}
        >
          {item.media_type === "video" ? (
            <video
              src={item.media_url}
              muted
              loop
              playsInline
              autoPlay
              className="w-full rounded-2xl object-cover pointer-events-auto"
              onMouseEnter={(e) => e.currentTarget.play()}
            />
          ) : (
            <img
              src={item.media_url}
              alt={item.prompt}
              className="w-full rounded-2xl object-cover pointer-events-auto"
              loading="lazy"
            />
          )}

          {item.is_trending && (
            <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/90 backdrop-blur-md text-white text-[10px] font-semibold shadow">
              <Star className="w-3 h-3 fill-current" />
              Trending
            </div>
          )}

          {isAdmin && (
            <button
              onClick={(e) => { e.stopPropagation(); toggleTrend(item); }}
              title={item.is_trending ? "Unpin from trending" : "Pin as trending"}
              className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-md transition-all ${
                item.is_trending
                  ? "bg-amber-500 text-white"
                  : "bg-black/40 text-white/80 opacity-0 group-hover:opacity-100 hover:bg-amber-500"
              }`}
            >
              <Star className={`w-4 h-4 ${item.is_trending ? "fill-current" : ""}`} />
            </button>
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-2xl flex flex-col justify-end p-3">
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(item.prompt); toast.success("Prompt copied!"); }}
                className="px-3 py-1.5 rounded-lg bg-white/15 backdrop-blur-xl text-white/90 text-[11px] font-medium hover:bg-white/25 transition-colors"
              >
                Copy
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onItemClick(item); }}
                className="px-3 py-1.5 rounded-lg bg-white/15 backdrop-blur-xl text-white/90 text-[11px] font-medium hover:bg-white/25 transition-colors"
              >
                Reuse
              </button>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default ShowcaseGrid;
