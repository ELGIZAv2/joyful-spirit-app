import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Loader2, ShieldCheck, Bot, Terminal, Globe, Users, Wallet, ScrollText } from "lucide-react";
import { MegsyComputerIcon } from "@/components/settings/MegsyComputerIcon";
import { BackIcon } from "@/components/settings/SettingsIcons";
import { toast } from "sonner";

interface OperatorSettings {
  ask_before_sensitive: boolean;
  ask_before_anything: boolean;
  allow_free_shell: boolean;
  allow_browser_automation: boolean;
  allow_dynamic_agents: boolean;
  max_parallel_agents: number;
  budget_cap_cents: number;
}

const DEFAULTS: OperatorSettings = {
  ask_before_sensitive: true,
  ask_before_anything: false,
  allow_free_shell: false,
  allow_browser_automation: true,
  allow_dynamic_agents: true,
  max_parallel_agents: 3,
  budget_cap_cents: 500,
};

const MegsyOperatorSettingsPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [settings, setSettings] = useState<OperatorSettings>(DEFAULTS);
  const [agentCount, setAgentCount] = useState(0);
  const [auditCount, setAuditCount] = useState(0);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }
      setUserId(user.id);

      const [{ data: s }, { count: ac }, { count: lc }] = await Promise.all([
        supabase.from("operator_user_settings").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("operator_dynamic_agents").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("operator_audit_log").select("*", { count: "exact", head: true }).eq("user_id", user.id),
      ]);

      if (s) setSettings({ ...DEFAULTS, ...s });
      setAgentCount(ac || 0);
      setAuditCount(lc || 0);
      setLoading(false);
    })();
  }, [navigate]);

  const save = async (patch: Partial<OperatorSettings>) => {
    if (!userId) return;
    const next = { ...settings, ...patch };
    setSettings(next);
    setSaving(true);
    const { error } = await supabase.from("operator_user_settings").upsert({ user_id: userId, ...next });
    setSaving(false);
    if (error) toast.error("Save failed"); else toast.success("Saved");
  };

  if (loading) {
    return (
      <div className="h-[100dvh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const Row = ({ icon: Icon, title, desc, children }: { icon: React.ComponentType<{ className?: string }>; title: string; desc: string; children: React.ReactNode }) => (
    <div className="flex items-start gap-3 py-4 border-b border-border/40">
      <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );

  return (
    <div className="h-[100dvh] bg-background overflow-y-auto">
      <div className="max-w-lg mx-auto pb-16 px-5">
        <div className="flex items-center justify-between py-4">
          <button onClick={() => navigate("/settings")} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-muted/50">
            <BackIcon className="w-5 h-5" />
          </button>
          <h1 className="font-display text-base font-bold">Megsy Operator</h1>
          <div className="w-9">{saving && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}</div>
        </div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          {/* Hero */}
          <div className="mt-2 mb-6 p-5 rounded-3xl bg-gradient-to-br from-primary/10 to-accent/5 border border-border/40">
            <div className="flex items-center gap-3 mb-2">
              <MegsyComputerIcon className="w-8 h-8 text-primary" />
              <h2 className="font-display text-lg font-bold">Megsy Computer</h2>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Control AI permissions inside its own environment: Browser, Shell, Dynamic agents, and spend limits.
            </p>
            <div className="grid grid-cols-2 gap-2 mt-4">
              <div className="rounded-2xl bg-background/60 p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Generated agents</p>
                <p className="text-lg font-bold">{agentCount}</p>
              </div>
              <div className="rounded-2xl bg-background/60 p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Audit log</p>
                <p className="text-lg font-bold">{auditCount}</p>
              </div>
            </div>
          </div>

          {/* Approval gates */}
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1 px-1">Approval gates</p>
          <Row icon={ShieldCheck} title="Ask me before sensitive actions" desc="Payments, emails, deleting files, public publishing.">
            <Switch checked={settings.ask_before_sensitive} onCheckedChange={(v) => save({ ask_before_sensitive: v })} />
          </Row>
          <Row icon={ShieldCheck} title="Ask me before any action" desc="Strict mode — the AI asks before every tool.">
            <Switch checked={settings.ask_before_anything} onCheckedChange={(v) => save({ ask_before_anything: v })} />
          </Row>

          {/* Capabilities */}
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1 px-1 mt-6">Capabilities</p>
          <Row icon={Globe} title="Browser automation" desc="Open sites, click, fill forms, extract data.">
            <Switch checked={settings.allow_browser_automation} onCheckedChange={(v) => save({ allow_browser_automation: v })} />
          </Row>
          <Row icon={Terminal} title="Free shell inside the environment" desc="bash, apt, python, ffmpeg. Danger — for advanced users only.">
            <Switch checked={settings.allow_free_shell} onCheckedChange={(v) => save({ allow_free_shell: v })} />
          </Row>
          <Row icon={Bot} title="Dynamic agents" desc="AI generates a new agent (e.g. marketing agent) on demand and saves it.">
            <Switch checked={settings.allow_dynamic_agents} onCheckedChange={(v) => save({ allow_dynamic_agents: v })} />
          </Row>

          {/* Limits */}
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1 px-1 mt-6">Limits</p>
          <div className="py-4 border-b border-border/40">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center"><Users className="w-5 h-5" /></div>
              <div className="flex-1">
                <p className="text-sm font-semibold">Number of parallel agents</p>
                <p className="text-xs text-muted-foreground">{settings.max_parallel_agents} Agents working together</p>
              </div>
            </div>
            <Slider value={[settings.max_parallel_agents]} min={1} max={10} step={1}
              onValueChange={(v) => setSettings({ ...settings, max_parallel_agents: v[0] })}
              onValueCommit={(v) => save({ max_parallel_agents: v[0] })} />
          </div>
          <div className="py-4 border-b border-border/40">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center"><Wallet className="w-5 h-5" /></div>
              <div className="flex-1">
                <p className="text-sm font-semibold">Spend limit per task</p>
                <p className="text-xs text-muted-foreground">${(settings.budget_cap_cents / 100).toFixed(2)} max</p>
              </div>
            </div>
            <Slider value={[settings.budget_cap_cents]} min={50} max={5000} step={50}
              onValueChange={(v) => setSettings({ ...settings, budget_cap_cents: v[0] })}
              onValueCommit={(v) => save({ budget_cap_cents: v[0] })} />
          </div>

          {/* Sub-pages */}
          <button onClick={() => navigate("/settings/operator/agents")}
            className="w-full flex items-center gap-3 py-4 mt-2 text-left border-b border-border/40">
            <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center"><Bot className="w-5 h-5" /></div>
            <div className="flex-1">
              <p className="text-sm font-semibold">Dynamic agents</p>
              <p className="text-xs text-muted-foreground">{agentCount} Specialized agent generated automatically</p>
            </div>
            <span className="text-muted-foreground/40">›</span>
          </button>
          <button onClick={() => navigate("/settings/operator/audit")}
            className="w-full flex items-center gap-3 py-4 text-left">
            <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center"><ScrollText className="w-5 h-5" /></div>
            <div className="flex-1">
              <p className="text-sm font-semibold">Full audit log</p>
              <p className="text-xs text-muted-foreground">Every action the AI performed — exportable</p>
            </div>
            <span className="text-muted-foreground/40">›</span>
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default MegsyOperatorSettingsPage;
