import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const clips = [
  { src: "/showcase/vid-1.mp4" },
  { src: "/showcase/vid-2.mp4" },
  { src: "/showcase/vid-3.mp4" },
];

const VideoDemoMock = () => {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setIdx((p) => (p + 1) % clips.length);
    }, 6000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="h-full w-full bg-[#0a0a0a] flex flex-col text-white font-sans overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">Video Studio</span>
        </div>
      </div>

      {/* Preview */}
      <div className="flex-1 p-5 flex items-center justify-center bg-[#050505] relative">
        <div className="aspect-video w-[88%] rounded-xl border border-white/10 bg-black overflow-hidden relative">
          <AnimatePresence mode="wait">
            <motion.video
              key={`v-${idx}`}
              src={clips[idx].src}
              autoPlay
              muted
              loop
              playsInline
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="h-full w-full object-cover"
            />
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default VideoDemoMock;
