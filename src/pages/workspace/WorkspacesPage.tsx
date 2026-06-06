// Workspaces list — minimal, spacious, focused.
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Plus, Sparkles, Lock } from "lucide-react";
import { toast } from "sonner";
import { useWorkspaces } from "@/hooks/useWorkspace";
import { useIsMobile } from "@/hooks/use-mobile";
import { DesktopSettingsLayout } from "@/components/settings/DesktopSettingsLayout";
import { useUserPlan } from "@/hooks/useUserPlan";

const PRO_PLANS = new Set(["pro", "elite", "business", "enterprise"]);

// Custom "settings" mark — minimalist 2x2 dot quadrant.
// Designed in-house to avoid the generic gear/cog look.
function WorkspaceSettingsMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none" aria-hidden="true">
      <rect x="2" y="2" width="4.5" height="4.5" rx="1.2" fill="currentColor" opacity="0.35" />
      <rect x="9.5" y="2" width="4.5" height="4.5" rx="1.2" fill="currentColor" opacity="0.55" />
      <rect x="2" y="9.5" width="4.5" height="4.5" rx="1.2" fill="currentColor" opacity="0.55" />
      <rect x="9.5" y="9.5" width="4.5" height="4.5" rx="1.2" fill="currentColor" />
    </svg>
  );
}

export default function WorkspacesPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { workspaces, activeId, setActive, loading } = useWorkspaces();
  const { plan } = useUserPlan();
  const canCreate = PRO_PLANS.has(plan);

  const switchTo = async (id: string | null, name: string) => {
    await setActive(id);
    toast.success(`Switched to ${name}`);
  };

  const body = (
    <div className="space-y-10">
      <div className="space-y-2">
        <h2 className="text-[28px] font-semibold tracking-tight text-foreground">Your workspaces</h2>
        <p className="text-[14px] text-muted-foreground max-w-xl">
          Switch between personal and team spaces. Each workspace has its own credits, members, and settings.
        </p>
      </div>
      <div className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden">
        <Row
          name="Personal"
          subtitle="Your private space"
          initial="P"
          active={activeId === null}
          onSwitch={() => switchTo(null, "Personal")}
        />
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : (
          workspaces.map((w) => (
            <Row
              key={w.id}
              name={w.name}
              subtitle={`${Number(w.credits).toFixed(0)} credits`}
              avatarUrl={w.avatar_url}
              initial={w.name[0]?.toUpperCase() || "W"}
              active={activeId === w.id}
              onSwitch={() => switchTo(w.id, w.name)}
              onSettings={() => navigate(`/settings/workspaces/${w.id}`)}
            />
          ))
        )}
      </div>
      {canCreate ? (
        <button
          onClick={() => navigate("/settings/workspaces/new")}
          className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl border border-dashed border-border hover:border-foreground/30 hover:bg-muted/40 transition-colors text-left group"
        >
          <div className="w-10 h-10 rounded-xl border border-dashed border-border grid place-items-center text-muted-foreground group-hover:text-foreground group-hover:border-foreground/30 transition-colors">
            <Plus className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-medium text-foreground">Create a new workspace</p>
            <p className="text-[12.5px] text-muted-foreground mt-0.5">Invite teammates and share credits.</p>
          </div>
        </button>
      ) : (
        <button
          onClick={() => navigate("/pricing")}
          className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/[0.06] via-card to-card hover:border-primary/50 transition-colors text-left group relative overflow-hidden"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20 grid place-items-center shrink-0">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-[14px] font-medium text-foreground">Create a workspace</p>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
                <Lock className="w-2.5 h-2.5" /> PRO
              </span>
            </div>
            <p className="text-[12.5px] text-muted-foreground mt-0.5">Upgrade to Pro to create team workspaces and invite members.</p>
          </div>
          <span className="text-[12.5px] font-medium text-primary shrink-0">Upgrade →</span>
        </button>
      )}
    </div>
  );

  if (!isMobile) {
    return (
      <DesktopSettingsLayout title="Workspaces" subtitle="Switch between personal and team spaces.">
        <div className="max-w-3xl">{body}</div>
      </DesktopSettingsLayout>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-3xl mx-auto px-6 sm:px-8 h-16 flex items-center gap-3">
          <button
            onClick={() => navigate("/settings")}
            className="p-2 -ml-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-[15px] font-medium text-foreground flex-1">Workspaces</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 sm:px-8 py-14">{body}</main>
    </div>
  );
}

function Row({
  name, subtitle, initial, avatarUrl, active, onSwitch, onSettings,
}: {
  name: string;
  subtitle: string;
  initial: string;
  avatarUrl?: string | null;
  active: boolean;
  onSwitch: () => void;
  onSettings?: () => void;
}) {
  return (
    <div className="flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors">
      {avatarUrl ? (
        <img src={avatarUrl} alt="" className="w-10 h-10 rounded-xl object-cover shrink-0" />
      ) : (
        <div className="w-10 h-10 rounded-xl bg-foreground text-background grid place-items-center text-[14px] font-semibold shrink-0">
          {initial}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-[14.5px] font-medium text-foreground truncate">{name}</p>
          {active && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-foreground/10 text-foreground">
              Active
            </span>
          )}
        </div>
        <p className="text-[12.5px] text-muted-foreground truncate mt-0.5">{subtitle}</p>
      </div>

      {!active && (
        <button
          onClick={onSwitch}
          className="text-[12.5px] font-medium text-foreground/80 hover:text-foreground px-3 py-1.5 rounded-md hover:bg-foreground/[0.06] transition-colors"
        >
          Switch
        </button>
      )}

      {onSettings && (
        <button
          onClick={onSettings}
          className="w-9 h-9 grid place-items-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-foreground/[0.06] transition-colors"
          aria-label={`${name} settings`}
          title="Settings"
        >
          <WorkspaceSettingsMark className="w-[15px] h-[15px]" />
        </button>
      )}
    </div>
  );
}
