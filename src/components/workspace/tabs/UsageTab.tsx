import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, BarChart3 } from "lucide-react";
import type { WorkspaceCtx } from "@/hooks/useWorkspaceContext";

export default function UsageTab() {
  const { ws } = useOutletContext<{ ws: WorkspaceCtx }>();
  const [rows, setRows] = useState<any[]>([]);
  const [profMap, setProfMap] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      const since = new Date(); since.setDate(since.getDate() - 30);
      const { data } = await supabase.from("workspace_usage").select("*").eq("workspace_id", ws.id).gte("created_at", since.toISOString()).order("created_at", { ascending: true });
      const list = (data as any) ?? [];
      setRows(list);
      const ids = Array.from(new Set(list.map((r: any) => r.user_id)));
      if (ids.length) {
        const { data: profs } = await supabase.from("profiles").select("id, display_name").in("id", ids as string[]);
        const m: Record<string, string> = {};
        (profs ?? []).forEach((p: any) => { m[p.id] = p.display_name || p.id.slice(0, 8); });
        setProfMap(m);
      }
    })();
  }, [ws.id]);

  const daily = useMemo(() => {
    const map = new Map<string, number>();
    rows.forEach(r => {
      const k = new Date(r.created_at).toISOString().slice(0, 10);
      map.set(k, (map.get(k) || 0) + Number(r.amount));
    });
    return Array.from(map.entries()).map(([date, amount]) => ({ date: date.slice(5), amount: Number(amount.toFixed(2)) }));
  }, [rows]);

  const perMember = useMemo(() => {
    const map = new Map<string, number>();
    rows.forEach(r => map.set(r.user_id, (map.get(r.user_id) || 0) + Number(r.amount)));
    return Array.from(map.entries()).map(([uid, amount]) => ({ name: profMap[uid] || uid.slice(0, 8), amount: Number(amount.toFixed(2)) })).sort((a, b) => b.amount - a.amount);
  }, [rows, profMap]);

  const perTool = useMemo(() => {
    const map = new Map<string, number>();
    rows.forEach(r => map.set(r.action_type, (map.get(r.action_type) || 0) + Number(r.amount)));
    return Array.from(map.entries()).map(([name, amount]) => ({ name, amount: Number(amount.toFixed(2)) })).sort((a, b) => b.amount - a.amount).slice(0, 10);
  }, [rows]);

  const forecast = useMemo(() => {
    const now = new Date();
    const dayOfMonth = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const monthRows = rows.filter(r => new Date(r.created_at).getMonth() === now.getMonth());
    const monthTotal = monthRows.reduce((s, r) => s + Number(r.amount), 0);
    const projected = dayOfMonth > 0 ? (monthTotal / dayOfMonth) * daysInMonth : 0;
    return { current: monthTotal, projected };
  }, [rows]);

  const tooltipStyle = {
    backgroundColor: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: 12,
    fontSize: 12,
    padding: "6px 10px",
    boxShadow: "0 4px 20px -4px hsl(var(--foreground) / 0.08)",
  };

  return (
    <div className="space-y-10 animate-fade-in">
      <div>
        <h2 className="text-[22px] font-semibold tracking-tight text-foreground">Usage</h2>
        <p className="text-[13px] text-muted-foreground mt-1">Track consumption across members and actions.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="relative p-5 rounded-2xl border border-border/60 bg-card overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.08] via-primary/0 to-transparent pointer-events-none" />
          <div className="relative">
            <p className="text-[11.5px] uppercase tracking-wider text-muted-foreground/80 font-medium">This month</p>
            <p className="text-3xl font-semibold mt-1.5 tabular-nums tracking-tight">{forecast.current.toFixed(0)} <span className="text-sm text-muted-foreground font-normal">MC</span></p>
          </div>
        </div>
        <div className="relative p-5 rounded-2xl border border-border/60 bg-card overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.08] via-emerald-500/0 to-transparent pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3 h-3 text-emerald-500" />
              <p className="text-[11.5px] uppercase tracking-wider text-muted-foreground/80 font-medium">Forecast</p>
            </div>
            <p className="text-3xl font-semibold mt-1.5 tabular-nums tracking-tight">{forecast.projected.toFixed(0)} <span className="text-sm text-muted-foreground font-normal">MC</span></p>
          </div>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="p-10 rounded-2xl border border-dashed border-border/60 bg-card/40 text-center">
          <BarChart3 className="w-5 h-5 text-muted-foreground/60 mx-auto mb-2" />
          <p className="text-[13px] text-muted-foreground">No usage in the last 30 days.</p>
        </div>
      ) : (
        <>
          <section className="space-y-3">
            <h3 className="text-[14px] font-semibold tracking-tight">Daily usage <span className="text-muted-foreground font-normal">· 30 days</span></h3>
            <div className="h-56 p-4 rounded-2xl border border-border/60 bg-card">
              <ResponsiveContainer>
                <LineChart data={daily} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: "hsl(var(--border))" }} />
                  <Line type="monotone" dataKey="amount" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-[14px] font-semibold tracking-tight">Per member</h3>
            <div className="h-56 p-4 rounded-2xl border border-border/60 bg-card">
              <ResponsiveContainer>
                <BarChart data={perMember} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "hsl(var(--foreground) / 0.04)" }} />
                  <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-[14px] font-semibold tracking-tight">Top actions</h3>
            <div className="rounded-2xl border border-border/60 bg-card divide-y divide-border/60 overflow-hidden">
              {perTool.map(t => {
                const max = perTool[0]?.amount || 1;
                const pct = Math.max(4, (t.amount / max) * 100);
                return (
                  <div key={t.name} className="relative px-4 py-2.5 hover:bg-foreground/[0.02] transition-colors">
                    <div className="absolute inset-y-0 left-0 bg-primary/[0.05]" style={{ width: `${pct}%` }} />
                    <div className="relative flex items-center justify-between text-[12.5px]">
                      <span className="truncate font-medium">{t.name}</span>
                      <span className="font-mono tabular-nums text-muted-foreground">{t.amount}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
