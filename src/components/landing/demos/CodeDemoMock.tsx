import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Code2, Sparkles, Globe } from "lucide-react";

const codeLines = [
  { c: "text-pink-400", t: "export default" }, { c: "text-blue-300", t: " function " }, { c: "text-yellow-300", t: "Hero" }, { c: "text-white/50", t: "() {" },
  { c: "text-white/50", t: "\n  return (" },
  { c: "text-white/50", t: "\n    <" }, { c: "text-pink-400", t: "section" }, { c: "text-blue-300", t: " className" }, { c: "text-white/50", t: "=" }, { c: "text-green-300", t: '"hero"' }, { c: "text-white/50", t: ">" },
  { c: "text-white/50", t: "\n      <" }, { c: "text-pink-400", t: "h1" }, { c: "text-white/50", t: ">" }, { c: "text-white", t: "Launch faster" }, { c: "text-white/50", t: "</" }, { c: "text-pink-400", t: "h1" }, { c: "text-white/50", t: ">" },
  { c: "text-white/50", t: "\n      <" }, { c: "text-pink-400", t: "Button" }, { c: "text-white/50", t: ">" }, { c: "text-white", t: "Get started" }, { c: "text-white/50", t: "</" }, { c: "text-pink-400", t: "Button" }, { c: "text-white/50", t: ">" },
  { c: "text-white/50", t: "\n    </" }, { c: "text-pink-400", t: "section" }, { c: "text-white/50", t: ">);" },
  { c: "text-white/50", t: "\n}" },
];

const CodeDemoMock = () => {
  const [stage, setStage] = useState(0);
  const [visibleChars, setVisibleChars] = useState(0);

  const totalText = codeLines.map((l) => l.t).join("");

  useEffect(() => {
    const loop = setInterval(() => {
      setStage(0);
      setVisibleChars(0);
    }, 14000);
    return () => clearInterval(loop);
  }, []);

  useEffect(() => {
    if (stage !== 0) return;
    let n = 0;
    const id = setInterval(() => {
      n += 2;
      setVisibleChars(n);
      if (n >= totalText.length) {
        clearInterval(id);
        setTimeout(() => setStage(1), 500);
      }
    }, 25);
    return () => clearInterval(id);
  }, [stage, totalText.length]);

  // Build rendered code limited to visibleChars
  let remaining = visibleChars;
  const rendered = codeLines.map((l, i) => {
    if (remaining <= 0) return null;
    const piece = l.t.slice(0, remaining);
    remaining -= l.t.length;
    return (
      <span key={i} className={l.c}>
        {piece}
      </span>
    );
  });

  return (
    <div className="h-full w-full bg-[#0a0a0a] flex text-white font-sans overflow-hidden">
      {/* Code panel */}
      <div className="w-[48%] border-r border-white/5 flex flex-col">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5 bg-white/[0.02]">
          <div className="ml-3 flex items-center gap-1.5 text-[11px] text-white/50">
            <Code2 className="h-3 w-3" />
            Hero.tsx
          </div>
        </div>
        <div className="flex-1 p-4 font-mono text-[11px] leading-[1.6] whitespace-pre-wrap">
          {rendered}
          <span className="inline-block w-1.5 h-3 bg-[#e879c1] ml-0.5 align-middle animate-pulse" />
        </div>
        <div className="px-4 py-2 border-t border-white/5 flex items-center gap-2 text-[10px] text-white/40">
          
          Megsy is building your page…
        </div>
      </div>

      {/* Preview panel */}
      <div className="flex-1 flex flex-col bg-[#050505]">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5 bg-white/[0.02]">
          <Globe className="h-3 w-3 text-white/40" />
          <div className="flex-1" />
          
        </div>
        <div className="flex-1 flex items-center justify-center p-6 relative overflow-hidden bg-gradient-to-br from-[#1a0a1f] via-[#0a0a0a] to-[#0a1014]">
          <AnimatePresence>
            {stage >= 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center"
              >
                <motion.h1
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.15, duration: 0.5 }}
                  className="text-3xl md:text-4xl font-black tracking-tight bg-gradient-to-r from-white to-[#e879c1] bg-clip-text text-transparent mb-3"
                >
                  Launch faster
                </motion.h1>
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="rounded-full bg-[#e879c1] px-5 py-2 text-xs font-bold text-black"
                >
                  Get started
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
          {stage === 0 && (
            <div className="text-white/20 text-[11px] flex items-center gap-2">
              <div className="h-3 w-3 rounded-full border-2 border-[#e879c1] border-t-transparent animate-spin" />
              Preview updating…
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CodeDemoMock;
