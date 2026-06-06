import { toast } from "sonner";
import { markOnboardingStep } from "@/components/onboarding/OnboardingChecklist";

type AhaKey = "chat" | "image" | "doc" | "slide" | "video" | "code";

const STORAGE = "megsy_aha_seen_v1";
const COUNT = "megsy_aha_count_v1";

const seen = (): Record<string, boolean> => {
  try { return JSON.parse(localStorage.getItem(STORAGE) || "{}"); } catch { return {}; }
};

const setSeen = (s: Record<string, boolean>) => {
  try { localStorage.setItem(STORAGE, JSON.stringify(s)); } catch { /* noop */ }
};

const bumpCount = (): number => {
  try {
    const n = (parseInt(localStorage.getItem(COUNT) || "0", 10) || 0) + 1;
    localStorage.setItem(COUNT, String(n));
    return n;
  } catch { return 0; }
};

/**
 * Trigger after a successful user action (first chat, image, slide, etc).
 * Fires a celebratory toast the first time per key, and a soft Pro upsell
 * after the 3rd overall success.
 */
export const triggerAha = (key: AhaKey, opts?: { onShare?: () => void; onUpgrade?: () => void }) => {
  const s = seen();
  const checklistMap: Record<AhaKey, "chat" | "image" | "doc" | undefined> = {
    chat: "chat", image: "image", doc: "doc", slide: "doc", video: undefined, code: undefined,
  };
  const step = checklistMap[key];
  if (step) markOnboardingStep(step);

  if (!s[key]) {
    s[key] = true;
    setSeen(s);
    const label: Record<AhaKey, string> = {
      chat: "First chat done! ✨",
      image: "First image ready! 🎨",
      doc: "First document done! 📄",
      slide: "First deck ready! 🎞️",
      video: "First video done! 🎬",
      code: "First code project! 💻",
    };
    toast.success(label[key], {
      description: opts?.onShare ? "Share it with friends" : undefined,
      action: opts?.onShare ? { label: "Share", onClick: opts.onShare } : undefined,
    });
  }

  const n = bumpCount();
  if (n === 3) {
    setTimeout(() => {
      toast("💎 50% off Megsy Pro", {
        description: "Unlimited images, slides and docs — limited time",
        duration: 8000,
        action: {
          label: "Activate now",
          onClick: opts?.onUpgrade ?? (() => { window.location.href = "/pricing?promo=WELCOME50"; }),
        },
      });
    }, 1500);
  }
};
