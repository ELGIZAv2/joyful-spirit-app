import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useActiveAccount } from "@/hooks/useActiveAccount";
import OliveAvatar from "@/components/branding/OliveAvatar";
import { ArrowUpRight, CheckCircle2 } from "lucide-react";
import {
  SparkleIcon, IntegrationsIcon, MemoryIcon, PrivacyIcon,
  NotificationsIcon, AiPersonalizationIcon, ChevronIcon,
} from "@/components/settings/SettingsIcons";

export function DesktopSettingsHome() {
  const navigate = useNavigate();
  const account = useActiveAccount();
  const credits = account.credits;
  const userName = account.name || "User";
  const avatarUrl = account.avatarUrl;
  const [userEmail, setUserEmail] = useState("");
  const [plan, setPlan] = useState("free");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      setUserEmail(user.email || "");
      const { data: profile } = await supabase.from("profiles").select("plan").eq("id", user.id).single();
      if (profile && !cancelled) setPlan(profile.plan || "free");
    })();
    return () => { cancelled = true; };
  }, [account.kind]);

  const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);
  const creditPct = credits !== null ? Math.min(100, Math.max(4, (credits / 200) * 100)) : 0;

  return (
    <div className="grid grid-cols-6 gap-6">
      {/* Identity — large */}
      <div className="col-span-6 md:col-span-4 rounded-3xl border border-border bg-card p-8">
        <div className="flex items-center gap-6 mb-8">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="w-20 h-20 rounded-2xl object-cover shadow-sm" />
          ) : (
            <OliveAvatar seed={userEmail || userName} className="w-20 h-20 rounded-2xl" />
          )}
          <div className="min-w-0">
            <h3 className="font-display text-xl font-bold text-foreground truncate">{userName}</h3>
            <p className="text-sm text-muted-foreground truncate">{userEmail}</p>
            <div className="flex gap-2 mt-3">
              <span className="px-2.5 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded-md uppercase tracking-wider">
                {planLabel}
              </span>
              <span className="px-2.5 py-1 bg-success/10 text-success text-[10px] font-bold rounded-md uppercase tracking-wider">
                Verified
              </span>
            </div>
          </div>
          <button
            onClick={() => navigate("/settings/profile")}
            className="ml-auto self-start text-xs font-semibold text-primary hover:underline flex items-center gap-1"
          >
            Edit profile <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FieldTile label="Primary Email" value={userEmail || "—"} />
          <FieldTile label="Account Type" value={account.kind === "workspace" ? "Workspace" : "Personal"} />
        </div>
      </div>

      {/* Credits — dark accent */}
      <div className="col-span-6 md:col-span-2 rounded-3xl bg-card text-card-foreground border border-border p-8 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-10">
            <div className="p-2 bg-primary/10 rounded-lg">
              <SparkleIcon className="w-5 h-5 text-primary" />
            </div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Credits</span>
          </div>
          <div className="font-display text-4xl font-bold tabular-nums">
            {credits !== null ? credits.toFixed(0) : "—"}
          </div>
          <div className="text-muted-foreground text-sm mt-1 mb-6">MC available</div>
          <div className="w-full h-1 bg-muted rounded-full mb-3 overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${creditPct}%` }} />
          </div>
          <button
            onClick={() => navigate("/pricing")}
            className="text-[11px] text-primary font-bold hover:text-foreground transition-colors"
          >
            Upgrade for more →
          </button>
        </div>
        <div className="absolute -right-12 -top-12 w-48 h-48 bg-primary/10 blur-3xl rounded-full" />
      </div>

      {/* Plan tile */}
      <button
        onClick={() => navigate("/settings/billing")}
        className="col-span-6 md:col-span-3 group text-left rounded-3xl border border-border bg-card p-8 hover:border-primary/40 transition-all"
      >
        <div className="flex items-center justify-between mb-6">
          <h4 className="font-display font-bold text-foreground">Current Plan</h4>
          <ChevronIcon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
        <p className="font-display text-3xl font-bold text-foreground mb-1">{planLabel}</p>
        <p className="text-sm text-muted-foreground mb-5">Manage subscription & invoices</p>
        <div className="flex flex-wrap gap-2">
          {["All AI models", "Memory", "Skills"].map((f) => (
            <span key={f} className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-secondary/60 px-2.5 py-1 rounded-md">
              <CheckCircle2 className="w-3 h-3 text-primary" /> {f}
            </span>
          ))}
        </div>
      </button>

      <QuickTile title="Personalization" desc="Tune AI behavior & tone" icon={AiPersonalizationIcon} onClick={() => navigate("/settings/ai-personalization")} />
      <QuickTile title="Memory" desc="What Megsy remembers" icon={MemoryIcon} onClick={() => navigate("/settings/memory")} />
      <QuickTile title="Integrations" desc="Connect external tools" icon={IntegrationsIcon} onClick={() => navigate("/settings/integrations")} />

      <button
        onClick={() => navigate("/settings/notifications")}
        className="col-span-6 md:col-span-3 group text-left rounded-3xl border border-border bg-secondary/40 p-8 hover:border-primary/40 hover:bg-secondary/60 transition-all"
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-card grid place-items-center border border-border">
              <NotificationsIcon className="w-4 h-4 text-foreground" />
            </div>
            <h4 className="font-display font-bold text-foreground">Notifications</h4>
          </div>
          <ChevronIcon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
        <p className="text-sm text-muted-foreground">Email alerts, mentions & product news preferences.</p>
      </button>

      <button
        onClick={() => navigate("/settings/privacy")}
        className="col-span-6 md:col-span-3 group text-left rounded-3xl border border-border bg-card p-8 hover:border-primary/40 transition-all"
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary/60 grid place-items-center">
              <PrivacyIcon className="w-4 h-4 text-foreground" />
            </div>
            <h4 className="font-display font-bold text-foreground">Privacy & Data</h4>
          </div>
          <ChevronIcon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
        <p className="text-sm text-muted-foreground">Export your data, control memory, or delete your account.</p>
      </button>
    </div>
  );
}

function FieldTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{label}</p>
      <div className="px-4 py-3 bg-secondary/40 border border-border rounded-xl text-sm text-foreground font-medium truncate">
        {value}
      </div>
    </div>
  );
}

function QuickTile({
  title, desc, icon: Icon, onClick,
}: { title: string; desc: string; icon: React.ElementType; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="col-span-6 md:col-span-2 group text-left rounded-3xl border border-border bg-card p-6 hover:border-primary/40 hover:-translate-y-0.5 transition-all"
    >
      <div className="w-10 h-10 rounded-xl bg-primary/10 grid place-items-center mb-4">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <h4 className="font-display font-bold text-foreground mb-1">{title}</h4>
      <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
    </button>
  );
}

export default DesktopSettingsHome;