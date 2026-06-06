import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Image as ImageIcon, ArrowUp } from "lucide-react";

const prompts = [
  { text: "Cinematic portrait of a samurai in neon Tokyo rain", img: "/showcase/img-1.webp" },
  { text: "Futuristic cyberpunk street scene at night, ultra detailed", img: "/showcase/img-2.webp" },
  { text: "Minimal product photo of perfume on marble, soft light", img: "/showcase/img-3.webp" },
];

const models = ["Nano Banana Pro", "GPT-Image 2", "Gemini 3 Pro Image", "Recraft V4"];

const ImageDemoMock = () => {
  const [idx, setIdx] = useState(0);
  const [stage, setStage] = useState(0);
  const [typed, setTyped] = useState("");

  useEffect(() => {
    const t = setTimeout(() => {
      if (stage === 0) {
        let i = 0;
        const id = setInterval(() => {
          i++;
          setTyped(prompts[idx].text.slice(0, i));
          if (i >= prompts[idx].text.length) {
            clearInterval(id);
            setTimeout(() => setStage(1), 400);
          }
        }, 25);
        return () => clearInterval(id);
      }
      if (stage === 1) setTimeout(() => setStage(2), 900);
      if (stage === 2)
        setTimeout(() => {
          setStage(0);
          setTyped("");
          setIdx((p) => (p + 1) % prompts.length);
        }, 3500);
    }, 100);
    return () => clearTimeout(t);
  }, [stage, idx]);

  return (
    <div className="h-full w-full bg-[#0a0a0a] flex text-white font-sans overflow-hidden">
      {/* Left controls */}
      <div className="w-[38%] border-r border-white/5 p-5 flex flex-col">
        <div className="flex items-center gap-2 mb-5">
          <span className="text-sm font-semibold">Image Studio</span>
        </div>

        <div className="text-[11px] uppercase tracking-wider text-white/40 mb-2">Model</div>
        <div className="space-y-1.5 mb-5">
          {models.map((m, i) => (
            <div
              key={m}
              className={`px-3 py-2 rounded-lg text-xs flex items-center justify-between ${
                i === 0 ? "bg-[#f5d90a]/15 border border-[#f5d90a]/40 text-[#f5d90a]" : "bg-white/[0.03] border border-white/5 text-white/60"
              }`}
            >
              <span className="font-medium">{m}</span>
              {i === 0 && <div className="h-1.5 w-1.5 rounded-full bg-[#f5d90a]" />}
            </div>
          ))}
        </div>

        <div className="text-[11px] uppercase tracking-wider text-white/40 mb-2">Prompt</div>
        <div className="flex-1 rounded-lg border border-white/10 bg-white/[0.03] p-3 text-xs text-white/80 leading-relaxed min-h-[60px]">
          {typed}
          {stage === 0 && <span className="inline-block w-0.5 h-3 bg-[#f5d90a] ml-0.5 align-middle animate-pulse" />}
        </div>

        <button className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-[#f5d90a] py-2.5 text-xs font-bold text-black">
          Generate
        </button>
      </div>

      {/* Right preview */}
      <div className="flex-1 p-5 flex items-center justify-center bg-[#050505]">
        <AnimatePresence mode="wait">
          {stage === 1 && (
            <motion.div
              key={`load-${idx}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="aspect-[4/5] w-[70%] rounded-xl border border-white/10 bg-white/[0.03] flex items-center justify-center overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent" style={{ animation: "shimmer 1.5s infinite" }} />
              <Sparkles className="h-8 w-8 text-[#f5d90a] animate-pulse" />
            </motion.div>
          )}
          {stage === 2 && (
            <motion.img
              key={`img-${idx}`}
              src={prompts[idx].img}
              initial={{ opacity: 0, scale: 0.96, filter: "blur(20px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7 }}
              className="aspect-[4/5] w-[70%] rounded-xl object-cover border border-white/10"
            />
          )}
          {stage === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-white/30 text-xs">
              <ImageIcon className="h-10 w-10 mx-auto mb-3 opacity-30" />
              Type a prompt to start
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <style>{`@keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }`}</style>
    </div>
  );
};

export default ImageDemoMock;
