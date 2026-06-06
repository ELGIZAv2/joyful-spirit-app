import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const MESSAGES = [
  "Creating your masterpiece...",
  "Bringing ideas to life...",
  "Generating creativity...",
  "Almost there...",
  "Crafting something amazing...",
  "Mixing colors & light...",
  "Painting pixels...",
];

interface OrbLoaderProps {
  visible: boolean;
  onComplete?: () => void;
}

const OrbLoader = ({ visible }: OrbLoaderProps) => {
  const [msgIndex, setMsgIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!visible) { setElapsed(0); setMsgIndex(0); return; }
    const timer = setInterval(() => setElapsed(p => p + 1), 1000);
    const msgTimer = setInterval(() => setMsgIndex(p => (p + 1) % MESSAGES.length), 3000);
    return () => { clearInterval(timer); clearInterval(msgTimer); };
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/95 backdrop-blur-2xl"
        >
          {/* Orb */}
          <div className="orb-loader">
            <div className="box">
              <svg xmlns="http://www.w3.org/2000/svg" width="0" height="0">
                <defs>
                  <mask id="clipping">
                    <polygon points="50,0 100,38 82,100 18,100 0,38" fill="white" />
                    <polygon points="50,10 90,40 76,90 24,90 10,40" fill="white" />
                    <polygon points="50,20 80,42 70,85 30,85 20,42" fill="white" />
                    <polygon points="50,5 95,35 80,95 20,95 5,35" fill="white" />
                    <polygon points="50,15 85,38 74,88 26,88 15,38" fill="white" />
                    <polygon points="50,8 92,36 78,92 22,92 8,36" fill="white" />
                    <polygon points="50,12 88,39 72,87 28,87 12,39" fill="white" />
                  </mask>
                </defs>
              </svg>
            </div>
          </div>

          {/* Text */}
          <div className="mt-10 text-center">
            <AnimatePresence mode="wait">
              <motion.p
                key={msgIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-base font-medium text-foreground"
              >
                {MESSAGES[msgIndex]}
              </motion.p>
            </AnimatePresence>
            <p className="mt-3 text-xs text-muted-foreground tracking-widest uppercase">
              .... IN PROGRESS
            </p>
            <p className="mt-2 text-xs text-muted-foreground/60 tabular-nums">
              {elapsed}s
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OrbLoader;
