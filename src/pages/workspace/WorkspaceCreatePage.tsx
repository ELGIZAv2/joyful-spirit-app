import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { openWorkspaceCheckout } from "@/lib/workspaceCheckout";
import { isWorkspacePaidPlan, WORKSPACE_PLANS } from "@/lib/workspacePlans";
import { setActiveWorkspaceId } from "@/lib/activeWorkspace";

type Step = "name" | "plan";

export default function WorkspaceCreatePage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("name");
  const [name, setName] = useState("");
  const [plan, setPlan] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    try {
      const pendingName = sessionStorage.getItem("megsy_pending_workspace_name");
      if (pendingName) setName(pendingName);
    } catch {
      // ignore
    }
  }, []);

  const create = async (selectedPlan: string | null) => {
    if (!name.trim()) return;
    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSubmitting(false); navigate("/auth"); return; }

    const { data, error } = await supabase.rpc("create_workspace", {
      p_name: name.trim(),
      p_plan: selectedPlan,
    } as never);

    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    // Persist active workspace in DB (source of truth).
    await supabase.from("profiles").update({ active_workspace_id: (data as any).id } as any).eq("id", user.id);
    setActiveWorkspaceId((data as any).id);
    try { sessionStorage.removeItem("megsy_pending_workspace_name"); } catch {}
    toast.success("Workspace created");
    navigate(`/settings/workspaces/${(data as any).id}`);
  };

  const handleContinueWithPlan = async () => {
    if (!plan) return;

    if (plan === "free") {
      await create(null);
      return;
    }

    if (!isWorkspacePaidPlan(plan)) {
      toast.error("Plan not supported yet");
      return;
    }

    setSubmitting(true);
    try {
      sessionStorage.setItem("megsy_pending_workspace_name", name.trim());
      sessionStorage.setItem("megsy_pending_workspace_plan", plan);
    } catch {
      // ignore
    }

    const result = await openWorkspaceCheckout(plan, "monthly");
    if (!result.ok) {
      setSubmitting(false);
      if (result.reason === "auth_required") {
        navigate("/auth?redirect=/settings/workspaces/new");
        return;
      }
      toast.error("Could not open checkout page");
      return;
    }

    window.location.href = result.url;
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border/40">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => step === "plan" ? setStep("name") : navigate("/settings/workspaces")}
            className="p-2 -ml-2 rounded-full hover:bg-muted"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold">
            {step === "name" ? "New workspace" : "Choose plan"}
          </h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {step === "name" && (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight">What's the workspace name?</h2>
              <p className="text-sm text-muted-foreground">You can change it later from settings.</p>
            </div>
            <Input
              placeholder="Example: Marketing team"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && name.trim() && setStep("plan")}
              autoFocus
              className="h-12 text-base"
            />
            <Button
              onClick={() => setStep("plan")}
              disabled={!name.trim()}
              className="w-full h-12 bg-foreground text-background hover:bg-foreground/90"
            >
              Next
            </Button>
          </div>
        )}

        {step === "plan" && (
          <div className="space-y-5">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight">Choose a plan for {name}</h2>
              <p className="text-sm text-muted-foreground">You can skip this step and change it later.</p>
            </div>

            <div className="space-y-3">
              {WORKSPACE_PLANS.map((p) => {
                const selected = plan === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setPlan(p.id)}
                    className={`w-full text-right p-4 rounded-2xl border transition ${
                      selected ? "border-foreground bg-muted/40" : "border-border/60 bg-card hover:bg-muted/20"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-baseline gap-2">
                        <span className="font-semibold">{p.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {p.monthlyPrice === 0 ? "$0" : `$${p.monthlyPrice}/mo`}
                        </span>
                      </div>
                      {selected && <Check className="w-4 h-4" />}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{p.tagline}</p>
                    {p.creditsLabel && <p className="text-xs text-muted-foreground mb-2">{p.creditsLabel}</p>}
                    <ul className="text-xs text-muted-foreground space-y-0.5">
                      {p.perks.map((x) => <li key={x}>• {x}</li>)}
                    </ul>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="ghost"
                onClick={() => create(null)}
                disabled={submitting}
                className="flex-1 h-12"
              >
                Skip
              </Button>
              <Button
                onClick={handleContinueWithPlan}
                disabled={submitting || !plan}
                className="flex-1 h-12 bg-foreground text-background hover:bg-foreground/90"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : plan === "free" ? "Create" : "Pay and continue"}
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
