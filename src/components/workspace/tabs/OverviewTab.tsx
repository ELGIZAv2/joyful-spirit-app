import { useEffect, useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Wallet, Users, Activity, Plus, ListTodo, ArrowUpRight } from "lucide-react";
import type { WorkspaceCtx } from "@/hooks/useWorkspaceContext";

export default function WorkspaceOverviewTab() {
  const { ws, isAdmin } = useOutletContext<{ ws: WorkspaceCtx; isAdmin: boolean }>();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ members: 0, projects: 0, tasks: 0, monthlyUsage: 0 });
  const [recent, setRecent] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const [m, t, u, a] = await Promise.all([
        supabase.from("workspace_members").select("id", { count: "exact", head: true }).eq("workspace_id", ws.id),
        supabase.from("workspace_tasks").select("id", { count: "exact", head: true }).eq("workspace_id", ws.id),
        supabase.from("workspace_usage").select("amount").eq("workspace_id", ws.id).gte("created_at", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
        supabase.from("workspace_audit_log").select("*").eq("workspace_id", ws.id).order("created_at", { ascending: false }).limit(5),
      ]);
      setStats({
        members: m.count ?? 0,
        projects: 0,
        tasks: t.count ?? 0,
        monthlyUsage: (u.data ?? []).reduce((s: number, r: any) => s + Number(r.amount), 0),
      });
      setRecent((a.data as any) ?? []);
    })();
  }, [ws.id]);

  const cards = [
    {
      label: "Shared credits",
      value: Number(ws.credits).toFixed(0),
      icon: Wallet,
      tint: "from-emerald-500/15 to-emerald-500/0 text-emerald-500 ring-emerald-500/20",
    },
    {
      label: "Members",
      value: stats.members,
      icon: Users,
      tint: "from-blue-500/15 to-blue-500/0 text-blue-500 ring-blue-500/20",
    },
    {
      label: "This month",
      value: stats.monthlyUsage.toFixed(0) + " MC",
      icon: Activity,
      tint: "from-orange-500/15 to-orange-500/0 text-orange-500 ring-orange-500/20",
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-[22px] font-semibold tracking-tight text-foreground">Overview</h2>
        <p className="text-[13px] text-muted-foreground mt-1">A snapshot of your workspace activity and resources.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {cards.map((c) => (
          <div
            key={c.label}
            className="group relative p-5 rounded-2xl border border-border/60 bg-card hover:border-border transition-all duration-200 hover:shadow-[0_4px_20px_-4px_hsl(var(--foreground)/0.06)] overflow-hidden"
          >
            <div className={`absolute inset-0 bg-gradient-to-br opacity-60 pointer-events-none ${c.tint}`} />
            <div className="relative">
              <div className={`w-9 h-9 rounded-xl bg-background ring-1 grid place-items-center ${c.tint.split(" ").filter(x => x.startsWith("text-") || x.startsWith("ring-")).join(" ")}`}>
                <c.icon className="w-4 h-4" />
              </div>
              <p className="text-[11.5px] uppercase tracking-wider text-muted-foreground/80 mt-4 font-medium">{c.label}</p>
              <p className="text-2xl font-semibold mt-1 tabular-nums tracking-tight">{c.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button size="sm" onClick={() => navigate(`/workspaces/${ws.id}/tasks`)} className="rounded-lg">
          <ListTodo className="w-4 h-4 mr-1.5" /> Tasks
        </Button>
        {isAdmin && (
          <Button size="sm" variant="outline" onClick={() => navigate(`/settings/workspaces/${ws.id}/billing`)} className="rounded-lg">
            <Plus className="w-4 h-4 mr-1.5" /> Top up credits
          </Button>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[15px] font-semibold tracking-tight">Recent activity</h3>
          {recent.length > 0 && (
            <button
              onClick={() => navigate(`/settings/workspaces/${ws.id}/activity`)}
              className="text-[12px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
            >
              View all <ArrowUpRight className="w-3 h-3" />
            </button>
          )}
        </div>
        {recent.length === 0 ? (
          <div className="p-8 rounded-2xl border border-dashed border-border/60 bg-card/40 text-center">
            <Activity className="w-5 h-5 text-muted-foreground/60 mx-auto mb-2" />
            <p className="text-[13px] text-muted-foreground">No activity yet.</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-border/60 bg-card divide-y divide-border/60 overflow-hidden">
            {recent.map((a) => (
              <div key={a.id} className="px-4 py-3 hover:bg-foreground/[0.02] transition-colors">
                <p className="font-medium capitalize text-[13px]">{a.action.replace(/_/g, " ")}</p>
                <p className="text-muted-foreground mt-0.5 text-[11.5px] tabular-nums">{new Date(a.created_at).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
