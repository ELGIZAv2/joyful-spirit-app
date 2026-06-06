import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Gift } from "lucide-react";
import MegsyStar from "@/components/branding/MegsyStar";
import WorkspaceSwitcher from "@/components/workspace/WorkspaceSwitcher";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { DesktopSettingsLayout } from "@/components/settings/DesktopSettingsLayout";
import { DesktopSettingsHome } from "@/components/settings/DesktopSettingsHome";
import FancyButton from "@/components/branding/FancyButton";
import OliveAvatar from "@/components/branding/OliveAvatar";
import { useActiveAccount } from "@/hooks/useActiveAccount";
import {
  AccountIcon, WorkspacesIcon, BillingIcon, ThemeIcon, IntegrationsIcon,
  MemoryIcon, SkillsIcon, LanguageIcon, NotificationsIcon,
  StatusIcon, SignOutIcon, SwitchIcon, ChevronIcon,
  BackIcon, AiPersonalizationIcon, SupportIcon, PrivacyIcon,
} from "@/components/settings/SettingsIcons";

const SettingsPage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const account = useActiveAccount();
  const [userEmail, setUserEmail] = useState("user@email.com");
  const [plan, setPlan] = useState("free");
  // Display values mirror the active account (personal vs workspace).
  const userName = account.name || "User";
  const avatarUrl = account.avatarUrl;
  const credits = account.credits;
  useEffect(() => {
    let cancelled = false;
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      setUserEmail(user.email || "");
      const { data: profile } = await supabase
        .from("profiles")
        .select("plan")
        .eq("id", user.id)
        .single();
      if (profile && !cancelled) {
        setPlan(profile.plan || "free");
      }
    };
    loadUser();
    return () => { cancelled = true; };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (!isMobile) {
    return (
      <DesktopSettingsLayout title="Overview" subtitle="Manage your account, plan, and preferences.">
        <DesktopSettingsHome />
      </DesktopSettingsLayout>
    );
  }

  const initial = userName.charAt(0).toUpperCase();
  

  const sections: Array<{
    title: string;
    items: Array<{
      icon: typeof AccountIcon;
      label: string;
      desc?: string;
      path: string;
      external?: boolean;
      trailing?: string;
    }>;
  }> = [
    {
      title: "Plan & Usage",
      items: [
        { icon: BillingIcon, label: "Billing & MC", path: "/settings/billing", trailing: `${Math.floor(credits)} MC` },
      ],
    },
    {
      title: "Workspace",
      items: [
        { icon: AccountIcon, label: "Account", desc: "Profile & security", path: "/settings/profile" },
        { icon: WorkspacesIcon, label: "Workspaces", desc: "Team & shared credits", path: "/settings/workspaces" },
      ],
    },
    {
      title: "AI",
      items: [
        { icon: AiPersonalizationIcon, label: "AI Personalization", desc: "Customize AI behavior", path: "/settings/ai-personalization" },
        { icon: MemoryIcon, label: "Memory", desc: "AI memory & data", path: "/settings/memory" },
        { icon: SkillsIcon, label: "Skills", desc: "Custom & library skills", path: "/settings/skills" },
      ],
    },
    {
      title: "App",
      items: [
        { icon: ThemeIcon, label: "Theme", desc: "Colors & style", path: "/settings/customization" },
        { icon: LanguageIcon, label: "Language", desc: "Auto-translate UI", path: "/settings/language" },
        { icon: NotificationsIcon, label: "Notifications", desc: "Alerts & email prefs", path: "/settings/notifications" },
        { icon: IntegrationsIcon, label: "Integrations", desc: "Connect external tools", path: "/settings/integrations" },
      ],
    },
    {
      title: "Support",
      items: [
        { icon: SupportIcon, label: "Help & Support", desc: "FAQs, guides & contact", path: "/settings/support" },
        { icon: PrivacyIcon, label: "Privacy & Data", desc: "Control your data", path: "/settings/privacy" },
        { icon: StatusIcon, label: "System Status", path: "https://status.megsyai.com", external: true },
      ],
    },
  ];

  return (
    <div className="h-[100dvh] bg-background overflow-y-auto">
      <div className="max-w-lg mx-auto pb-8 px-5">
        {/* Header */}
        <div className="flex items-center justify-between py-3 -mx-1">
          <button onClick={() => navigate("/")} className="w-9 h-9 flex items-center justify-center rounded-xl text-foreground/70 hover:text-foreground hover:bg-muted/50 transition-all">
            <BackIcon className="w-5 h-5" />
          </button>
          <h1 className="font-display text-base font-bold text-foreground">Settings</h1>
          <div className="w-9" />
        </div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          {/* Profile Card — identity only */}
          <button
            onClick={() => navigate("/settings/profile")}
            className="w-full flex items-center gap-3 py-2.5 text-left transition-all active:scale-[0.99]"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-16 h-16 rounded-2xl object-cover" />
            ) : (
              <OliveAvatar seed={userEmail || userName} className="w-16 h-16 rounded-2xl" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-lg font-semibold text-foreground truncate">{userName}</p>
              <p className="text-xs text-muted-foreground truncate mt-0.5">{userEmail}</p>
              <p className="text-[10px] text-muted-foreground/70 uppercase tracking-wider mt-1.5 capitalize">{plan} plan</p>
            </div>
            <ChevronIcon className="w-4 h-4 text-muted-foreground/40 shrink-0" />
          </button>

          {/* Switch account */}
          <WorkspaceSwitcher align="center" side="bottom">
            <button className="w-full flex items-center gap-3 py-2 text-left border-t border-border/40">
              <SwitchIcon className="w-5 h-5 text-foreground shrink-0" />
              <span className="flex-1 text-sm font-medium text-foreground">Switch account</span>
              <ChevronIcon className="w-4 h-4 text-muted-foreground/40 shrink-0" />
            </button>
          </WorkspaceSwitcher>

          {/* CTA zone — Upgrade + Referrals */}
          <div className="mt-3 mb-4 space-y-1.5">
            {(() => {
              const order = ["free", "starter", "pro", "elite", "business", "enterprise"];
              const cur = (plan || "free").toLowerCase();
              const idx = Math.max(0, order.indexOf(cur));
              const atTop = idx >= order.length - 1;
              // For top-tier (Enterprise) users, Megsy recommends top-up credits
              // — the most useful action once every paid tier is unlocked.
              if (atTop) {
                return (
                  <FancyButton onClick={() => navigate("/settings/credits")} className="w-full">
                    <MegsyStar className="w-3.5 h-3.5" />
                    Megsy recommends: Top up credits
                  </FancyButton>
                );
              }
              const next = order[Math.min(order.length - 1, idx + 1)];
              const nextLabel = next.charAt(0).toUpperCase() + next.slice(1);
              return (
                <FancyButton onClick={() => navigate("/pricing")} className="w-full">
                  <MegsyStar className="w-3.5 h-3.5" />
                  {`Get ${nextLabel}`}
                </FancyButton>
              );
            })()}
            <button onClick={() => navigate("/settings/referrals")} className="fancy-btn fancy-btn-green w-full">
              <span className="fold" />
              <div className="points_wrapper">
                {Array.from({ length: 8 }).map((_, j) => <span key={j} className="point" />)}
              </div>
              <span className="inner">
                <Gift className="w-4 h-4" />
                Referrals — Earn 20%
              </span>
            </button>
          </div>

          {/* Sections */}
          {sections.map((section, sIdx) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + sIdx * 0.06 }}
              className="mb-6"
            >
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground/60 mb-1 px-1">
                {section.title}
              </p>
              <div>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.label}
                      onClick={() => item.external ? window.open(item.path, "_blank") : navigate(item.path)}
                      className="w-full flex items-center gap-3.5 py-3.5 text-left hover:bg-muted/30 -mx-2 px-2 rounded-xl transition-colors"
                    >
                      <Icon className="w-5 h-5 text-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{item.label}</p>
                        {item.desc && <p className="text-[11px] text-muted-foreground mt-0.5">{item.desc}</p>}
                      </div>
                      {item.trailing && (
                        <span className="text-xs font-medium text-muted-foreground tabular-nums shrink-0">{item.trailing}</span>
                      )}
                      <ChevronIcon className="w-4 h-4 text-muted-foreground/30 shrink-0" />
                    </button>
                  );
                })}
              </div>
            </motion.div>
          ))}

          {/* Sign Out — quiet */}
          <button
            onClick={handleLogout}
            className="w-full py-4 text-sm font-medium text-destructive/80 hover:text-destructive transition-colors"
          >
            Sign out
          </button>

          
        </motion.div>
      </div>
    </div>
  );
};

export default SettingsPage;
