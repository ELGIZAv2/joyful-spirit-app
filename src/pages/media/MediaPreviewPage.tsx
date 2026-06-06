import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Download, Share2, Play, Pause, Volume2, VolumeX, Maximize2 } from "lucide-react";
import AppLayout from "@/layouts/AppLayout";
import { toast } from "sonner";

type PreviewItem = {
  url: string;
  type: "image" | "video";
  prompt?: string;
  created_at?: string;
};

const MediaPreviewPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { type } = useParams<{ type: string }>();
  const item: PreviewItem | undefined = (location.state as any)?.item;

  if (!item) {
    return (
      <AppLayout onSelectConversation={() => {}} onNewChat={() => {}} activeConversationId={null}>
        <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
          <p className="text-muted-foreground text-sm mb-4">No media to preview</p>
          <button onClick={() => navigate(-1)} className="text-primary text-sm font-medium">
            Go back
          </button>
        </div>
      </AppLayout>
    );
  }

  const isVideo = (item.type || type) === "video";

  const handleDownload = async () => {
    try {
      const res = await fetch(item.url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `${isVideo ? "video" : "image"}-${Date.now()}.${isVideo ? "mp4" : "jpg"}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      toast.success("Downloaded");
    } catch {
      toast.error("Download failed");
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ url: item.url, title: item.prompt || "Generated media" });
      } else {
        await navigator.clipboard.writeText(item.url);
        toast.success("Link copied to clipboard");
      }
    } catch {
      /* user cancelled */
    }
  };

  return (
    <AppLayout onSelectConversation={() => {}} onNewChat={() => {}} activeConversationId={null}>
      <div className="theme-fixed min-h-screen w-full bg-gradient-to-b from-black via-zinc-950 to-black flex flex-col">
        {/* Top bar */}
        <div className="sticky top-0 z-20 px-4 pt-4 pb-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="theme-fixed w-10 h-10 rounded-full flex items-center justify-center bg-white/[0.08] backdrop-blur-3xl backdrop-saturate-200 border border-white/15 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.18),0_8px_24px_-8px_rgba(0,0,0,0.6)]"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div className="theme-fixed px-3 py-1.5 rounded-full bg-white/[0.08] backdrop-blur-3xl backdrop-saturate-200 border border-white/15">
              <span className="theme-fixed text-[11px] font-medium text-white/85 tracking-wide uppercase">
                {isVideo ? "Video" : "Image"}
              </span>
            </div>
            <div className="w-10" />
          </div>
        </div>

        {/* Media */}
        <div className="flex-1 flex items-center justify-center px-4 py-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-2xl rounded-3xl overflow-hidden bg-white/[0.04] backdrop-blur-3xl border border-white/10 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]"
          >
            {isVideo ? <CustomVideoPlayer src={item.url} /> : <img src={item.url} alt={item.prompt || ""} className="w-full h-auto block" />}
          </motion.div>
        </div>

        {/* Prompt */}
        {item.prompt && (
          <div className="px-4 pb-3">
            <div className="theme-fixed mx-auto max-w-2xl px-4 py-3 rounded-2xl bg-white/[0.07] backdrop-blur-3xl backdrop-saturate-200 border border-white/10">
              <p className="theme-fixed text-[13px] font-medium text-white/88 leading-relaxed line-clamp-3">{item.prompt}</p>
            </div>
          </div>
        )}

        {/* Action bar */}
        <div className="sticky bottom-0 z-20 px-4 pb-6 pt-2">
          <div className="theme-fixed mx-auto max-w-2xl flex items-center gap-2 p-2 rounded-full bg-white/[0.08] backdrop-blur-3xl backdrop-saturate-200 border border-white/15 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.22),0_20px_50px_-15px_rgba(0,0,0,0.7)]">
            <button
              onClick={handleDownload}
              className="theme-fixed flex-1 flex items-center justify-center gap-2 h-11 rounded-full bg-white text-black font-semibold text-sm active:scale-[0.97] transition-transform"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
            <button
              onClick={handleShare}
              className="theme-fixed flex-1 flex items-center justify-center gap-2 h-11 rounded-full bg-white/12 border border-white/15 text-white font-semibold text-sm active:scale-[0.97] transition-transform"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

const CustomVideoPlayer = ({ src }: { src: string }) => {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const onTime = () => {
      setCurrent(v.currentTime);
      setProgress(v.duration ? (v.currentTime / v.duration) * 100 : 0);
    };
    const onLoad = () => setDuration(v.duration || 0);
    const onEnd = () => setPlaying(false);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("loadedmetadata", onLoad);
    v.addEventListener("ended", onEnd);
    return () => {
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("loadedmetadata", onLoad);
      v.removeEventListener("ended", onEnd);
    };
  }, []);

  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  const fmt = (s: number) => {
    if (!isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const ss = Math.floor(s % 60).toString().padStart(2, "0");
    return `${m}:${ss}`;
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const v = ref.current;
    if (!v || !v.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    v.currentTime = pct * v.duration;
  };

  const requestFs = () => {
    const v = ref.current;
    if (!v) return;
    if (v.requestFullscreen) v.requestFullscreen();
  };

  return (
    <div className="relative group/video bg-black">
      <video
        ref={ref}
        src={src}
        playsInline
        onClick={toggle}
        className="w-full h-auto block max-h-[70vh] object-contain"
      />

      {/* Center play button when paused */}
      {!playing && (
        <button
          onClick={toggle}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="w-16 h-16 rounded-full flex items-center justify-center bg-white/15 backdrop-blur-2xl backdrop-saturate-200 border border-white/30 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4),0_10px_30px_-10px_rgba(0,0,0,0.7)]">
            <Play className="w-6 h-6 text-white ml-0.5" fill="white" />
          </div>
        </button>
      )}

      {/* Controls overlay */}
      <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 via-black/30 to-transparent">
        <div
          className="relative h-1 rounded-full bg-white/20 cursor-pointer mb-2.5"
          onClick={seek}
        >
          <div
            className="absolute left-0 top-0 h-full rounded-full bg-white"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggle} className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 backdrop-blur-xl border border-white/15">
            {playing ? <Pause className="w-3.5 h-3.5 text-white" /> : <Play className="w-3.5 h-3.5 text-white ml-0.5" fill="white" />}
          </button>
          <button
            onClick={() => {
              const v = ref.current;
              if (!v) return;
              v.muted = !v.muted;
              setMuted(v.muted);
            }}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 backdrop-blur-xl border border-white/15"
          >
            {muted ? <VolumeX className="w-3.5 h-3.5 text-white" /> : <Volume2 className="w-3.5 h-3.5 text-white" />}
          </button>
          <span className="text-[11px] text-white/80 font-medium tabular-nums ml-1">
            {fmt(current)} / {fmt(duration)}
          </span>
          <div className="flex-1" />
          <button onClick={requestFs} className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 backdrop-blur-xl border border-white/15">
            <Maximize2 className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MediaPreviewPage;
