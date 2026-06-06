// Privacy & data settings — links and toggles for personal data controls.
import { useNavigate } from "react-router-dom";
import { goBackOr } from "@/lib/navigation";
import { BackIcon, ChevronIcon } from "@/components/settings/SettingsIcons";
import { useIsMobile } from "@/hooks/use-mobile";
import { DesktopSettingsLayout } from "@/components/settings/DesktopSettingsLayout";

const links = [
  { title: "Privacy Policy", desc: "How we collect and use your data", href: "https://privacy.megsyai.com", external: true },
  { title: "Terms of Service", desc: "The rules for using Megsy", href: "https://terms.megsyai.com", external: true },
  { title: "Cookie Policy", desc: "Which cookies we use and why", href: "/cookies", external: false },
];

const actions = [
  { title: "Memory", desc: "View or clear what Megsy remembers", path: "/settings/memory" },
  { title: "Change email", desc: "Update your account email", path: "/settings/change-email" },
  { title: "Change password", desc: "Set a new password", path: "/settings/change-password" },
  { title: "Delete account", desc: "Permanently delete your data", path: "/settings/delete-account", danger: true },
];

export default function SettingsPrivacyPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const body = (
    <div className="space-y-8">
      <p className="text-sm text-muted-foreground leading-relaxed p-5 rounded-2xl border border-border bg-card">
        Your data belongs to you. Review our policies and control your data at any time.
      </p>
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground/70 mb-2 px-1">Policies</p>
        <div className="rounded-2xl border border-border bg-card divide-y divide-border">
          {links.map((l) => (
            <button key={l.title} onClick={() => l.external ? window.open(l.href, "_blank") : navigate(l.href)} className="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-muted/40 transition-colors first:rounded-t-2xl last:rounded-b-2xl">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{l.title}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{l.desc}</p>
              </div>
              <ChevronIcon className="w-4 h-4 text-muted-foreground/40 shrink-0" />
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground/70 mb-2 px-1">Your data</p>
        <div className="rounded-2xl border border-border bg-card divide-y divide-border">
          {actions.map((a) => (
            <button key={a.title} onClick={() => navigate(a.path)} className="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-muted/40 transition-colors first:rounded-t-2xl last:rounded-b-2xl">
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${a.danger ? "text-destructive" : "text-foreground"}`}>{a.title}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{a.desc}</p>
              </div>
              <ChevronIcon className="w-4 h-4 text-muted-foreground/40 shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  if (!isMobile) {
    return (
      <DesktopSettingsLayout title="Privacy & Data" subtitle="Control your data and review our policies.">
        {body}
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
          <h1 className="text-base font-semibold text-foreground">Privacy & Data</h1>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed p-4 rounded-2xl border border-border bg-card mb-6">
          Your data belongs to you. Review our policies and control your data at any time.
        </p>

        <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground/70 mb-2 px-1">Policies</p>
        <div className="rounded-2xl border border-border bg-card divide-y divide-border mb-8">
          {links.map((l) => (
            <button
              key={l.title}
              onClick={() => l.external ? window.open(l.href, "_blank") : navigate(l.href)}
              className="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-muted/40 transition-colors first:rounded-t-2xl last:rounded-b-2xl"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{l.title}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{l.desc}</p>
              </div>
              <ChevronIcon className="w-4 h-4 text-muted-foreground/40 shrink-0" />
            </button>
          ))}
        </div>

        <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground/70 mb-2 px-1">Your data</p>
        <div className="rounded-2xl border border-border bg-card divide-y divide-border">
          {actions.map((a) => (
            <button
              key={a.title}
              onClick={() => navigate(a.path)}
              className="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-muted/40 transition-colors first:rounded-t-2xl last:rounded-b-2xl"
            >
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${a.danger ? "text-destructive" : "text-foreground"}`}>{a.title}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{a.desc}</p>
              </div>
              <ChevronIcon className="w-4 h-4 text-muted-foreground/40 shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
