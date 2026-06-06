import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { ShowcaseItem } from "@/components/showcase/ShowcaseGrid";
import CachedMediaImage, { preloadMediaImage } from "@/components/media/CachedMediaImage";

const TemplatePreviewPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const stateItem = (location.state as { item?: ShowcaseItem } | null)?.item ?? null;
  const [item, setItem] = useState<ShowcaseItem | null>(stateItem);
  const [loading, setLoading] = useState(!stateItem);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (item || !id) return;
    try {
      const cached = [
        ...(JSON.parse(localStorage.getItem("megsy_cache_showcase_v1") || "[]") as ShowcaseItem[]),
        ...(JSON.parse(localStorage.getItem("megsy_cache_community_v1") || "[]") as ShowcaseItem[]),
      ].find((cachedItem) => cachedItem.id === id);
      if (cached) {
        setItem(cached as any);
        setLoading(false);
        return;
      }
    } catch {
      /* ignore cache parse errors */
    }
    (async () => {
      const { data } = await supabase
        .from("showcase_items" as any)
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (data) setItem(data as any);
      setLoading(false);
    })();
  }, [id, item]);

  const isVideo = item?.media_type === "video";
  const mediaUrl = (item as any)?.media_url as string | undefined;
  const prompt = item?.prompt || "";
  const backTo = isVideo ? "/videos" : "/images";

  const handleUseClick = () => {
    fileInputRef.current?.click();
  };

  useEffect(() => {
    if (!isVideo && mediaUrl) preloadMediaImage(mediaUrl);
  }, [isVideo, mediaUrl]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) {
      // User cancelled — auto-copy prompt as fallback
      try {
        await navigator.clipboard.writeText(prompt);
        toast.success("Prompt copied to clipboard");
      } catch {
        toast.error("Couldn't copy prompt");
      }
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      navigate(backTo, { state: { reusePrompt: prompt, attachedImage: dataUrl } });
    };
    reader.readAsDataURL(f);
  };

  // Detect cancellation of file picker (focus returns without change)
  useEffect(() => {
    const onFocus = () => {
      setTimeout(async () => {
        const input = fileInputRef.current;
        if (input && input.dataset.opened === "1" && !input.files?.length) {
          input.dataset.opened = "0";
          try {
            await navigator.clipboard.writeText(prompt);
            toast.success("Prompt copied to clipboard");
          } catch {
            /* ignore */
          }
        }
      }, 400);
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [prompt]);

  return (
    <div className="theme-fixed fixed inset-0 z-50 bg-black flex flex-col">
      {/* Top bar */}
      <header className="absolute top-0 inset-x-0 z-20 flex items-center justify-between px-4 pt-4 pb-3 bg-gradient-to-b from-black/70 via-black/30 to-transparent">
        <button
          onClick={() => navigate(backTo, { state: { tab: "community" } })}
          className="theme-fixed w-10 h-10 rounded-full flex items-center justify-center bg-white/10 backdrop-blur-2xl border border-white/15 text-white active:scale-95 transition"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-10" />
      </header>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-7 h-7 rounded-full border-2 border-white border-t-transparent animate-spin" />
        </div>
      ) : !item ? (
        <div className="theme-fixed flex-1 flex items-center justify-center text-sm text-white/75">
          Template not found
        </div>
      ) : (
        <>
          {/* Fullscreen media */}
          <motion.div
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 flex items-center justify-center"
          >
            {isVideo ? (
              <video
                src={mediaUrl}
                className="w-full h-full object-contain"
                controls
                autoPlay
                loop
                playsInline
              />
            ) : (
              <CachedMediaImage
                src={mediaUrl}
                alt={prompt}
                className="w-full h-full object-contain"
                loading="eager"
                decoding="async"
              />
            )}
          </motion.div>

          {/* Bottom prompt + CTA */}
          <div className="absolute bottom-0 inset-x-0 z-20 px-4 pt-12 pb-6 bg-gradient-to-t from-black via-black/95 to-transparent">
            <div className="max-w-[560px] mx-auto">
              <button
                onClick={handleUseClick}
                className="theme-fixed w-full h-14 rounded-2xl bg-gradient-to-r from-fuchsia-500 via-pink-500 to-orange-400 text-white font-bold text-[15px] flex items-center justify-center gap-2 active:scale-[0.98] transition shadow-[0_20px_50px_-10px_rgba(236,72,153,0.55)]"
              >
                Use this template
              </button>
              <p className="theme-fixed mt-2 text-center text-[11px] font-medium text-white/80">
                Upload a photo or video — or skip to copy the prompt
              </p>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept={isVideo ? "image/*,video/*" : "image/*"}
            className="hidden"
            onChange={handleFile}
            onClick={(e) => {
              (e.currentTarget as HTMLInputElement).dataset.opened = "1";
            }}
          />
        </>
      )}
    </div>
  );
};

export default TemplatePreviewPage;
