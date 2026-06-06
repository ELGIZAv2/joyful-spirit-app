// Notification settings — luma/neutral redesign. Grouped cards, soft borders.
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { goBackOr } from "@/lib/navigation";
import { Switch } from "@/components/ui/switch";
import AppLayout from "@/layouts/AppLayout";
import { toast } from "@/hooks/use-toast";
import { useActiveWorkspaceId } from "@/lib/activeWorkspace";
import { BackIcon, NotificationsIcon } from "@/components/settings/SettingsIcons";
import { useIsMobile } from "@/hooks/use-mobile";
import { DesktopSettingsLayout } from "@/components/settings/DesktopSettingsLayout";

interface Preferences {
  email_welcome: boolean;
  email_low_balance: boolean;
  email_transactions: boolean;
  email_newsletter: boolean;
}

const defaults: Preferences = {
  email_welcome: true,
  email_low_balance: true,
  email_transactions: true,
  email_newsletter: false,
};

const groups: Array<{
  title: string;
  items: Array<{ key: keyof Preferences; label: string; desc: string }>;
}> = [
  {
    title: "Account",
    items: [
      { key: "email_welcome", label: "Welcome & onboarding", desc: "Tips to help you get started" },
      { key: "email_transactions", label: "Transactions & receipts", desc: "Payments, refunds and plan changes" },
    ],
  },
  {
    title: "Activity",
    items: [
      { key: "email_low_balance", label: "Low balance", desc: "Heads up when your credits run low" },
    ],
  },
  {
    title: "From Megsy",
    items: [
      { key: "email_newsletter", label: "Product newsletter", desc: "New features and product updates" },
    ],
  },
];

const NotificationSettingsPage = () => {
  const navigate = useNavigate();
  const workspaceId = useActiveWorkspaceId();
  const isMobile = useIsMobile();
  const [prefs, setPrefs] = useState<Preferences>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadPrefs(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [workspaceId]);

  const loadPrefs = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    let q = supabase
      .from("notification_preferences")
      .select("email_welcome, email_low_balance, email_transactions, email_newsletter")
      .eq("user_id", user.id);
    q = workspaceId ? q.eq("workspace_id", workspaceId) : q.is("workspace_id", null);
    const { data } = await q.maybeSingle();
    setPrefs(data ? (data as Preferences) : defaults);
    setLoading(false);
  };

  const updatePref = async (key: keyof Preferences, value: boolean) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    let sel = supabase.from("notification_preferences").select("id").eq("user_id", user.id);
    sel = workspaceId ? sel.eq("workspace_id", workspaceId) : sel.is("workspace_id", null);
    const { data: existing } = await sel.maybeSingle();

    let error;
    if (existing?.id) {
      const res = await supabase
        .from("notification_preferences")
        .update({ ...next, updated_at: new Date().toISOString() })
        .eq("id", existing.id);
      error = res.error;
    } else {
      const res = await supabase
        .from("notification_preferences")
        .insert({ user_id: user.id, workspace_id: workspaceId, ...next });
      error = res.error;
    }
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: "Failed to save preferences", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  const groupsBody = (
    <div className="space-y-8">
      {groups.map((group) => (
        <section key={group.title}>
          <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground/70 mb-2 px-1">
            {group.title}
          </p>
          <div className="rounded-2xl border border-border bg-card divide-y divide-border">
            {group.items.map((it) => (
              <div key={it.key} className="flex items-center justify-between gap-4 px-4 py-4">
                <div className="min-w-0">
                  <p className="text-[14px] font-medium text-foreground">{it.label}</p>
                  <p className="text-[12px] text-muted-foreground mt-0.5 leading-relaxed">{it.desc}</p>
                </div>
                <Switch checked={prefs[it.key]} onCheckedChange={(v) => updatePref(it.key, v)} />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );

  if (!isMobile) {
    return (
      <DesktopSettingsLayout title="Notifications" subtitle="Choose which emails you want to receive.">
        <div className="max-w-3xl">{groupsBody}</div>
      </DesktopSettingsLayout>
    );
  }

  return (
    <AppLayout>
      <div className="h-full overflow-y-auto bg-background">
        <div className="max-w-2xl mx-auto px-5 pb-16">
          <div className="flex items-center gap-3 py-4">
            <button onClick={() => goBackOr(navigate, "/settings")} className="w-9 h-9 grid place-items-center rounded-xl text-foreground/70 hover:bg-muted/50 transition-colors" aria-label="Back">
              <BackIcon className="w-5 h-5" />
            </button>
            <h1 className="text-base font-semibold text-foreground flex-1">Notifications</h1>
            {saving && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
          </div>

          {/* Intro */}
          <div className="flex items-start gap-3 p-4 rounded-2xl border border-border bg-card mb-8">
            <div className="w-10 h-10 rounded-xl bg-muted grid place-items-center text-foreground shrink-0">
              <NotificationsIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Email preferences</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Choose which emails you want to receive. We never send promotional messages without your permission.
              </p>
            </div>
          </div>

          {/* Groups */}
          <div className="space-y-8">
            {groups.map((group) => (
              <section key={group.title}>
                <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground/70 mb-2 px-1">
                  {group.title}
                </p>
                <div className="rounded-2xl border border-border bg-card divide-y divide-border">
                  {group.items.map((it) => (
                    <div key={it.key} className="flex items-center justify-between gap-4 px-4 py-4">
                      <div className="min-w-0">
                        <p className="text-[14px] font-medium text-foreground">{it.label}</p>
                        <p className="text-[12px] text-muted-foreground mt-0.5 leading-relaxed">{it.desc}</p>
                      </div>
                      <Switch checked={prefs[it.key]} onCheckedChange={(v) => updatePref(it.key, v)} />
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default NotificationSettingsPage;
