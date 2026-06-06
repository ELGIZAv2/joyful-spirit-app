import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Paperclip, Globe, ArrowUp } from "lucide-react";
import MegsyStar from "@/components/branding/MegsyStar";

const conversation = [
  { role: "user", text: "Plan a 3-day creative trip to Tokyo." },
  {
    role: "ai",
    text: "Here's a curated 3-day Tokyo itinerary focused on art, food & design ✨\n\n**Day 1 — Shibuya & Harajuku**\n• teamLab Planets (immersive art)\n• Vintage shopping in Cat Street\n• Sushi omakase at Sushi Tokami\n\n**Day 2 — Asakusa & Akihabara**\n• Senso-ji Temple at sunrise\n• Yanaka Ginza street food walk",
  },
];

const ChatDemoMock = () => {
  const [stage, setStage] = useState(0);
  const [typed, setTyped] = useState("");
  const [aiTyped, setAiTyped] = useState("");

  useEffect(() => {
    const loop = setInterval(() => {
      setStage(0);
      setTyped("");
      setAiTyped("");
    }, 14000);
    return () => clearInterval(loop);
  }, []);

  useEffect(() => {
    if (stage !== 0) return;
    let i = 0;
    const id = setInterval(() => {
      i++;
      setTyped(conversation[0].text.slice(0, i));
      if (i >= conversation[0].text.length) {
        clearInterval(id);
        setTimeout(() => setStage(1), 600);
      }
    }, 35);
    return () => clearInterval(id);
  }, [stage]);

  useEffect(() => {
    if (stage !== 1) return;
    setTimeout(() => setStage(2), 900);
  }, [stage]);

  useEffect(() => {
    if (stage !== 2) return;
    let i = 0;
    const id = setInterval(() => {
      i += 3;
      setAiTyped(conversation[1].text.slice(0, i));
      if (i >= conversation[1].text.length) clearInterval(id);
    }, 20);
    return () => clearInterval(id);
  }, [stage]);

  return (
    <div className="h-full w-full bg-[#0a0a0a] flex flex-col text-white font-sans relative overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">Megsy Chat</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden px-6 py-5 space-y-4 flex flex-col justify-end">
        {stage >= 1 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end">
            <div className="max-w-[70%] rounded-2xl rounded-br-md bg-[#22d36b] px-4 py-2.5 text-sm font-medium text-black">
              {conversation[0].text}
            </div>
          </motion.div>
        )}
        {stage >= 2 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
            <div className="h-7 w-7 shrink-0 flex items-center justify-center">
              <MegsyStar className="h-5 w-5 text-[#3b82f6]" />
            </div>
            <div className="max-w-[80%] rounded-2xl rounded-tl-md bg-white/[0.06] px-4 py-3 text-[13px] leading-relaxed whitespace-pre-line border border-white/5">
              {aiTyped}
              <span className="inline-block w-1.5 h-3.5 bg-[#22d36b] ml-0.5 align-middle animate-pulse" />
            </div>
          </motion.div>
        )}
      </div>

      {/* Input */}
      <div className="px-5 pb-5">
        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5">
          <Paperclip className="h-4 w-4 text-white/40" />
          <div className="flex-1 text-sm text-white/90 min-h-[20px]">
            {stage === 0 ? typed : ""}
            {stage === 0 && <span className="inline-block w-0.5 h-4 bg-[#22d36b] ml-0.5 align-middle animate-pulse" />}
            {stage > 0 && <span className="text-white/30">Message Megsy…</span>}
          </div>
          <button className="h-8 w-8 rounded-full bg-[#22d36b] flex items-center justify-center">
            <ArrowUp className="h-4 w-4 text-black" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatDemoMock;
