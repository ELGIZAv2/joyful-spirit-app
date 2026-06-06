import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import ChatDemoMock from "./demos/ChatDemoMock";
import ImageDemoMock from "./demos/ImageDemoMock";
import VideoDemoMock from "./demos/VideoDemoMock";
import CodeDemoMock from "./demos/CodeDemoMock";

type Tab = {
  title: string;
  shortLabel: string;
  description: string;
  bg: string;
  fg: string;
  rotate: number;
  offsetX: number;
  Demo: React.ComponentType;
};

const tabs: Tab[] = [
  {
    title: "AI Chat",
    shortLabel: "Start a conversation",
    description: "Chat naturally with Megsy's own model. Upload files, search the web in real-time, and let AI remember everything.",
    bg: "#22d36b",
    fg: "#000",
    rotate: -4,
    offsetX: 0,
    Demo: ChatDemoMock,
  },
  {
    title: "Image Generation",
    shortLabel: "Pick a model & prompt",
    description: "Megsy Image — our in-house generator built for cinematic concept art, product shots, and photoreal scenes. One model, every style.",
    bg: "#f5d90a",
    fg: "#000",
    rotate: 3,
    offsetX: 48,
    Demo: ImageDemoMock,
  },
  {
    title: "Video Creation",
    shortLabel: "Refine & animate",
    description: "Megsy Video — cinematic scenes with camera control, prompt-to-video, and character consistency built in.",
    bg: "#ff6b5e",
    fg: "#000",
    rotate: -3,
    offsetX: 24,
    Demo: VideoDemoMock,
  },
  {
    title: "Code & Deploy",
    shortLabel: "Ship with one click",
    description: "Describe what you want, watch it come to life. Live preview, GitHub sync & one-click deploy.",
    bg: "#e879c1",
    fg: "#000",
    rotate: 4,
    offsetX: 64,
    Demo: CodeDemoMock,
  },
];


const StickyFeatureTabs = () => {
  const [active, setActive] = useState(0);
  const navigate = useNavigate();
  const current = tabs[active];

  const renderPreview = (tab: Tab) => {
    const Demo = tab.Demo;
    return <Demo />;
  };



  return (
    <section id="features" className="bg-black py-12 md:py-28 text-white overflow-hidden">
      <div className="mx-auto max-w-[1600px] px-5 md:px-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mb-8 md:mb-20 text-center"
        >
          <h2
            id="anchor-what-create"
            style={{ fontFamily: '"Dela Gothic One", sans-serif' }}
            className="uppercase tracking-tight text-white leading-[0.95] text-[8vw] md:text-7xl"
          >
            HOW MEGSY'S AI<br className="hidden md:inline" /> <span className="md:hidden">CREATIVE SUITE WORKS</span><span className="hidden md:inline">CREATIVE SUITE WORKS</span>
          </h2>
          <p className="mt-4 md:mt-6 mx-auto max-w-2xl text-[13px] md:text-base text-white/70 leading-snug">
            Pick a tool, prompt it, refine it, ship it. Four steps, one creative platform.
          </p>
        </motion.div>

        <div className="grid gap-6 md:gap-16 lg:grid-cols-[460px_1fr] lg:items-center">

          {/* Stacked numbered cards */}
          <div className="relative mx-auto w-full max-w-[460px]">
            <div className="flex flex-col gap-3">
              {tabs.map((tab, i) => {
                const isActive = i === active;
                return (
                  <motion.button
                    key={tab.title}
                    type="button"
                    onClick={() => setActive(i)}
                    initial={{ opacity: 0, x: -40, rotate: tab.rotate }}
                    whileInView={{ opacity: 1, x: 0, rotate: tab.rotate }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.55, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                    animate={{
                      scale: isActive ? 1.04 : 1,
                      rotate: isActive ? 0 : tab.rotate,
                    }}
                    whileHover={{ scale: 1.03, rotate: 0 }}
                    style={{
                      backgroundColor: tab.bg,
                      color: tab.fg,
                      ["--offset" as string]: `${tab.offsetX}px`,
                      boxShadow: isActive
                        ? "0 24px 50px -10px rgba(0,0,0,0.6)"
                        : "0 12px 30px -10px rgba(0,0,0,0.45)",
                      zIndex: isActive ? 20 : 10 - i,
                    } as React.CSSProperties}
                    className="relative flex w-full items-center gap-4 md:gap-5 rounded-[28px] p-4 md:p-6 text-left transition-shadow md:ml-[var(--offset)]"
                  >
                    <span
                      style={{ fontFamily: '"Dela Gothic One", sans-serif' }}
                      className="text-[64px] md:text-[110px] leading-none tracking-tighter shrink-0"
                    >
                      {i + 1}
                    </span>
                    <span className="flex flex-col gap-1 pr-2">
                      <span
                        style={{ fontFamily: '"Dela Gothic One", sans-serif' }}
                        className="text-xl md:text-2xl leading-tight"
                      >
                        {tab.title}
                      </span>
                      <span className="text-[13px] md:text-sm font-medium opacity-80 leading-snug">
                        {tab.description}
                      </span>
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Preview panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7 }}
            className="relative w-full"
          >
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-3xl border border-white/10 bg-neutral-950 shadow-2xl shadow-black/50">
              <AnimatePresence mode="wait">
                <motion.div
                  key={current.title}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-0 h-full w-full"
                >
                  {renderPreview(current)}
                </motion.div>
              </AnimatePresence>
            </div>

          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default StickyFeatureTabs;
