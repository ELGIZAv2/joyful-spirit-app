// Support hub — three clean cards: FAQ, Human, AI.
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { goBackOr } from "@/lib/navigation";
import { BackIcon, ChevronIcon, FAQIcon, HumanSupportIcon, AISupportIcon } from "@/components/settings/SettingsIcons";
import { useIsMobile } from "@/hooks/use-mobile";
import { DesktopSettingsLayout } from "@/components/settings/DesktopSettingsLayout";

const options = [
  {
    icon: FAQIcon,
    title: "Help Center",
    desc: "Browse FAQs and a guide for every page and section.",
    path: "/settings/support/help",
  },
  {
    icon: AISupportIcon,
    title: "Ask AI",
    desc: "Instant answers from Megsy's AI support assistant.",
    path: "/support",
  },
  {
    icon: HumanSupportIcon,
    title: "Contact our team",
    desc: "Write your issue and a human will reply by email.",
    path: "/settings/support/contact",
  },
];

export default function SettingsSupportPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const list = (
    <div className="space-y-2.5">
      {options.map((opt, i) => {
        const Icon = opt.icon;
        return (
          <motion.button
            key={opt.title}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 + i * 0.06 }}
            onClick={() => navigate(opt.path)}
            className="w-full flex items-center gap-4 p-4 rounded-2xl border border-border bg-card hover:bg-muted/40 transition-colors text-left"
          >
            <div className="w-11 h-11 rounded-xl bg-muted grid place-items-center text-foreground shrink-0">
              <Icon className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{opt.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{opt.desc}</p>
            </div>
            <ChevronIcon className="w-4 h-4 text-muted-foreground/40 shrink-0" />
          </motion.button>
        );
      })}
    </div>
  );

  if (!isMobile) {
    return (
      <DesktopSettingsLayout title="Help & Support" subtitle="Choose how you'd like to get help.">
        {list}
      </DesktopSettingsLayout>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background">
      <div className="max-w-lg mx-auto px-5 pb-16">
        <div className="flex items-center gap-3 py-4">
          <button onClick={() => goBackOr(navigate, "/settings")} className="w-9 h-9 grid place-items-center rounded-xl text-foreground/70 hover:bg-muted/50 transition-colors">
            <BackIcon className="w-5 h-5" />
          </button>
          <h1 className="text-base font-semibold text-foreground">Help & Support</h1>
        </div>

        <p className="text-sm text-muted-foreground mt-2 mb-6 leading-relaxed">
          Choose how you'd like to get help. We're here whenever you need us.
        </p>

        <div className="space-y-2.5">
          {options.map((opt, i) => {
            const Icon = opt.icon;
            return (
              <motion.button
                key={opt.title}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 + i * 0.06 }}
                onClick={() => navigate(opt.path)}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border border-border bg-card hover:bg-muted/40 transition-colors text-left"
              >
                <div className="w-11 h-11 rounded-xl bg-muted grid place-items-center text-foreground shrink-0">
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{opt.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{opt.desc}</p>
                </div>
                <ChevronIcon className="w-4 h-4 text-muted-foreground/40 shrink-0" />
              </motion.button>
            );
          })}
        </div>

        <p className="text-center text-[11px] text-muted-foreground/60 mt-10">
          Typical reply time · under 24 hours
        </p>
      </div>
    </div>
  );
}
