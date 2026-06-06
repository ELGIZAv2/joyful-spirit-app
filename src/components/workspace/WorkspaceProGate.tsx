// Pro+ gate for workspace features. Free / Starter users see a beautiful upgrade screen.
import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Sparkles, Users, Shield, Zap, Check, ArrowRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUserPlan } from "@/hooks/useUserPlan";

const ALLOWED = new Set(["pro", "elite", "business", "enterprise"]);

const FEATURES = [
  { icon: Users, title: "Team collaboration", desc: "Invite members, assign roles, and work together in one shared space." },
  { icon: Zap, title: "Shared credits pool", desc: "Pool credits across your team with per-member monthly limits." },
  { icon: Shield, title: "Enterprise controls", desc: "SSO, audit logs, approval flows, and granular permissions." },
  { icon: Sparkles, title: "Brand kit & API keys", desc: "Workspace brand, API access, and shared resources." },
];

export default function WorkspaceProGate({ children }: { children: ReactNode }) {
  const { plan, loading } = useUserPlan();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (ALLOWED.has(plan)) return <>{children}</>;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Ambient gradient */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full bg-gradient-to-br from-primary/20 via-primary/5 to-transparent blur-3xl" />
        <div className="absolute top-1/3 right-0 w-[500px] h-[500px] rounded-full bg-gradient-to-bl from-blue-500/10 to-transparent blur-3xl" />
      </div>

      <div className="max-w-5xl mx-auto px-6 sm:px-10 pt-24 pb-20">
        <div className="flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-border/60 bg-card/60 backdrop-blur text-[11px] font-medium text-muted-foreground mb-6">
            <Lock className="w-3 h-3" />
            Workspaces are a Pro feature
          </div>

          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-foreground max-w-2xl leading-[1.1]">
            Collaborate as a team with{" "}
            <span className="bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">Workspaces</span>
          </h1>
          <p className="text-[15px] text-muted-foreground mt-5 max-w-xl leading-relaxed">
            Upgrade to <span className="font-semibold text-foreground">Pro</span> or higher to create a shared workspace,
            invite your team, pool credits, and unlock enterprise-grade controls.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <Button size="lg" onClick={() => navigate("/pricing")} className="px-6 group">
              Upgrade to Pro
              <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-0.5" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/")}>
              Back to dashboard
            </Button>
          </div>

          <p className="text-[11px] text-muted-foreground mt-4">
            Your current plan: <span className="font-medium capitalize text-foreground">{plan}</span>
          </p>
        </div>

        {/* Feature grid */}
        <div className="mt-20 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="group p-5 rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm hover:border-border hover:bg-card transition-all"
            >
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20 flex items-center justify-center mb-3">
                <f.icon className="w-4 h-4 text-primary" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">{f.title}</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Pro card */}
        <div className="mt-10 p-6 sm:p-8 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 via-card to-card relative overflow-hidden">
          <div className="absolute top-0 right-0 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground bg-primary rounded-bl-lg">
            Recommended
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div>
              <p className="text-xs font-medium text-primary uppercase tracking-wider">Pro plan</p>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-4xl font-semibold text-foreground">$29</span>
                <span className="text-sm text-muted-foreground">/month</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">240 MC / month · Team workspace included</p>
              <ul className="mt-4 space-y-1.5">
                {["Unlimited team workspaces", "Shared credit pool", "Member limits & roles", "Brand kit & API keys"].map((p) => (
                  <li key={p} className="flex items-center gap-2 text-xs text-foreground/80">
                    <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
            <Button size="lg" onClick={() => navigate("/pricing")} className="shrink-0">
              View all plans
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}