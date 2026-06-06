import { useState, useCallback } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { DesktopSettingsLayout } from "@/components/settings/DesktopSettingsLayout";

const themes = [
  { id: "light", label: "Pure White", desc: "Bright & clean", bg: "#ffffff", fg: "#0a0a0a", muted: "#f4f4f5" },
  { id: "dark",  label: "Pitch Black", desc: "Deep & focused", bg: "#000000", fg: "#fafafa", muted: "#141414" },
];

const accentColors = [
  { hsl: "262 60% 55%", hex: "#7c5cfc" },
  { hsl: "210 80% 55%", hex: "#3b82f6" },
  { hsl: "142 50% 50%", hex: "#22c55e" },
  { hsl: "330 70% 55%", hex: "#ec4899" },
  { hsl: "25 90% 55%",  hex: "#f97316" },
  { hsl: "160 60% 45%", hex: "#14b8a6" },
  { hsl: "0 70% 55%",   hex: "#ef4444" },
  { hsl: "270 60% 55%", hex: "#8b5cf6" },
  { hsl: "180 60% 45%", hex: "#06b6d4" },
  { hsl: "45 90% 50%",  hex: "#eab308" },
  { hsl: "150 60% 40%", hex: "#10b981" },
  { hsl: "340 80% 55%", hex: "#f43f5e" },
];

const CustomizationPage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [currentTheme, setCurrentTheme] = useState(() => {
    const t = localStorage.getItem("theme");
    return t === "light" ? "light" : "dark";
  });
  const [currentAccent, setCurrentAccent] = useState(() => localStorage.getItem("accent") || "262 60% 55%");

  const handleThemeChange = useCallback((id: string) => {
    document.documentElement.setAttribute("data-theme", id);
    const isDark = id === "dark" || id === "ocean";
    document.documentElement.classList.toggle("dark", isDark);
    document.documentElement.style.colorScheme = isDark ? "dark" : "light";
    localStorage.setItem("theme", id);
    window.dispatchEvent(new Event("themechange-custom"));
    setCurrentTheme(id);
  }, []);

  const handleAccentChange = useCallback((hsl: string) => {
    document.documentElement.style.setProperty("--primary", hsl);
    document.documentElement.style.setProperty("--user-bubble", `hsl(${hsl})`);
    localStorage.setItem("accent", hsl);
    localStorage.setItem("userBubbleColor", `hsl(${hsl})`);
    setCurrentAccent(hsl);
  }, []);

  const content = (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-12 max-w-md mx-auto">
      {/* Theme Selection — only Pure White and Pitch Black */}
      <div>
        <p className="text-[11px] text-muted-foreground uppercase tracking-[0.12em] mb-5">Appearance</p>
        <div className="grid grid-cols-2 gap-3">
          {themes.map(t => {
            const isSelected = currentTheme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => handleThemeChange(t.id)}
                className={`relative rounded-2xl p-3 transition-all text-left ${
                  isSelected ? "ring-2 ring-foreground" : "ring-1 ring-border/60 hover:ring-foreground/40"
                }`}
              >
                <div
                  className="w-full aspect-[4/3] rounded-xl overflow-hidden mb-3 border"
                  style={{ background: t.bg, borderColor: t.muted }}
                >
                  <div className="p-3 space-y-2">
                    <div className="h-1.5 w-1/3 rounded-full" style={{ background: t.fg, opacity: 0.85 }} />
                    <div className="h-1 w-full rounded-full" style={{ background: t.fg, opacity: 0.25 }} />
                    <div className="h-1 w-3/4 rounded-full" style={{ background: t.fg, opacity: 0.25 }} />
                    <div className="h-1 w-1/2 rounded-full" style={{ background: t.fg, opacity: 0.25 }} />
                    <div className="mt-3 flex justify-end">
                      <div className="h-2 w-10 rounded-full" style={{ background: `hsl(${currentAccent})` }} />
                    </div>
                  </div>
                </div>
                <p className="text-[13px] font-medium text-foreground">{t.label}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{t.desc}</p>
                {isSelected && (
                  <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-foreground flex items-center justify-center">
                    <Check className="w-3 h-3 text-background" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Single color picker — applies to both accent and chat bubble */}
      <div>
        <p className="text-[11px] text-muted-foreground uppercase tracking-[0.12em] mb-5">Accent Color</p>

        <div className="rounded-2xl bg-muted/30 p-4 mb-6 space-y-2.5">
          <div className="flex justify-end">
            <div className="rounded-2xl rounded-br-sm px-3.5 py-2 max-w-[65%]" style={{ background: `hsl(${currentAccent})` }}>
              <p className="text-white text-[13px]">Hey! How's it going?</p>
            </div>
          </div>
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-sm px-3.5 py-2 bg-muted max-w-[65%]">
              <p className="text-[13px] text-foreground">Pretty good, thanks!</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 justify-center">
          {accentColors.map(c => {
            const isSelected = currentAccent === c.hsl;
            return (
              <button
                key={c.hex}
                onClick={() => handleAccentChange(c.hsl)}
                className={`w-9 h-9 rounded-full transition-all hover:scale-110 flex items-center justify-center ${
                  isSelected ? "ring-2 ring-offset-2 ring-offset-background ring-foreground" : ""
                }`}
                style={{ background: c.hex }}
                aria-label={c.hex}
              >
                {isSelected && <Check className="w-3.5 h-3.5 text-white drop-shadow-sm" />}
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );

  if (!isMobile) {
    return (
      <DesktopSettingsLayout title="Customization" subtitle="Personalize your experience">
        {content}
      </DesktopSettingsLayout>
    );
  }

  return (
    <div className="h-[100dvh] bg-background overflow-y-auto">
      <div className="max-w-lg mx-auto pb-12">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate("/settings")} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display text-lg font-bold text-foreground">Customization</h1>
        </div>
        <div className="px-4 pt-4">{content}</div>
      </div>
    </div>
  );
};

export default CustomizationPage;
