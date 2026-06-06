import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface GenerationLoaderProps {
  type?: "image" | "video";
}

const GenerationLoader = ({ type = "image" }: GenerationLoaderProps) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (s: number) => {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return min > 0 ? `${min}:${sec.toString().padStart(2, "0")}` : `${sec}s`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative w-full max-w-xs aspect-square rounded-2xl overflow-hidden"
    >
      {/* Animated gradient background */}
      <div className="absolute inset-0 generation-gradient-bg" />

      {/* Blur overlay */}
      <div className="absolute inset-0 backdrop-blur-xl bg-background/10" />

      {/* Floating blobs */}
      <motion.div
        className="absolute w-32 h-32 rounded-full bg-primary/30 blur-3xl"
        animate={{
          x: [0, 40, -20, 0],
          y: [0, -30, 20, 0],
          scale: [1, 1.2, 0.9, 1],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        style={{ top: "20%", left: "10%" }}
      />
      <motion.div
        className="absolute w-24 h-24 rounded-full bg-accent/40 blur-3xl"
        animate={{
          x: [0, -30, 20, 0],
          y: [0, 20, -30, 0],
          scale: [1, 0.8, 1.1, 1],
        }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        style={{ bottom: "20%", right: "15%" }}
      />
      <motion.div
        className="absolute w-20 h-20 rounded-full bg-secondary/50 blur-2xl"
        animate={{
          x: [0, 25, -15, 0],
          y: [0, -20, 15, 0],
        }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        style={{ top: "50%", left: "40%" }}
      />

      {/* Counter */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
        <motion.p
          className="text-3xl font-bold text-foreground tabular-nums"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {formatTime(elapsed)}
        </motion.p>
        <p className="text-xs text-muted-foreground mt-2">
          {type === "video" ? "Generating video" : "Generating image"}
        </p>
      </div>
    </motion.div>
  );
};

export default GenerationLoader;
