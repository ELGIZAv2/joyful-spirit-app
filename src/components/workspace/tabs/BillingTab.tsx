import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { FileText, Download, Wallet, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import type { WorkspaceCtx } from "@/hooks/useWorkspaceContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function BillingTab() {
  const { ws, isAdmin, canBilling } = useOutletContext<{ ws: WorkspaceCtx; isAdmin: boolean; canBilling: boolean }>();
  const navigate = useNavigate();
  const [topups, setTopups] = useState<any[]>([]);
  const [defaultLimit, setDefaultLimit] = useState<string>(ws.default_member_monthly_limit?.toString() ?? "");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("workspace_credit_topups").select("*").eq("workspace_id", ws.id).order("created_at", { ascending: false });
      setTopups((data as any) ?? []);
    })();
  }, [ws.id]);

  const downloadInvoice = (t: any) => {
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Invoice ${t.invoice_number}</title>
      <style>body{font-family:Inter,Arial;padding:40px;max-width:600px}h1{margin:0}table{width:100%;border-collapse:collapse;margin-top:20px}td{padding:8px;border-bottom:1px solid #ddd}.r{text-align:right}</style>
      </head><body>
      <h1>Invoice</h1>
      <p>${t.invoice_number}</p>
      <p>Date: ${new Date(t.created_at).toLocaleDateString()}</p>
      <p>Workspace: ${ws.name}</p>
      <table>
        <tr><td>Credits top-up</td><td class="r">${t.amount_credits} MC</td></tr>
        <tr><td><strong>Total</strong></td><td class="r"><strong>$${Number(t.amount_usd).toFixed(2)}</strong></td></tr>
      </table>
      <p style="margin-top:40px;color:#888;font-size:12px">Thank you for your business.</p>
      </body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${t.invoice_number}.html`;
    a.click();
  };

  const updateDefault = async () => {
    const v = defaultLimit.trim() === "" ? null : Number(defaultLimit);
    if (v !== null && (!Number.isFinite(v) || v < 0)) { toast.error("Invalid limit"); return; }
    const { error } = await supabase.from("workspaces").update({ default_member_monthly_limit: v } as any).eq("id", ws.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Default limit saved");
  };

  return (
    <div className="space-y-10 animate-fade-in">
      <div>
        <h2 className="text-[22px] font-semibold tracking-tight text-foreground">Billing</h2>
        <p className="text-[13px] text-muted-foreground mt-1">Credits, plans and invoices for this workspace.</p>
      </div>

      <section className="relative p-6 rounded-2xl border border-border/60 bg-card overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-emerald-500/0 to-transparent pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-background ring-1 ring-emerald-500/20 grid place-items-center">
              <Wallet className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-[12px] uppercase tracking-wider text-muted-foreground/80 font-medium">Workspace balance</p>
          </div>
          <p className="text-4xl font-semibold mt-3 tabular-nums tracking-tight">
            {Number(ws.credits).toFixed(0)} <span className="text-base text-muted-foreground font-normal">MC</span>
          </p>
        </div>
      </section>

      {canBilling && (
        <section className="space-y-3">
          <h3 className="text-[14px] font-semibold tracking-tight">More credits</h3>
          <div className="p-5 rounded-2xl border border-border/60 bg-card flex items-center justify-between gap-3 hover:border-border transition-colors">
            <div className="min-w-0">
              <p className="text-[13.5px] font-medium">Upgrade plan</p>
              <p className="text-[12px] text-muted-foreground mt-0.5">Higher plans add more monthly credits to this workspace.</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => navigate("/pricing")} className="rounded-lg shrink-0">
              View plans <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </section>
      )}

      {isAdmin && (
        <section className="space-y-3">
          <h3 className="text-[14px] font-semibold tracking-tight">Default monthly limit per member</h3>
          <div className="p-4 rounded-2xl border border-border/60 bg-card space-y-2.5">
            <div className="flex gap-2">
              <Input type="number" placeholder="No limit" value={defaultLimit} onChange={(e) => setDefaultLimit(e.target.value)} className="h-10 rounded-lg" />
              <Button onClick={updateDefault} className="h-10 rounded-lg">Save</Button>
            </div>
            <p className="text-[11.5px] text-muted-foreground px-0.5">Applied to new members. Existing limits unchanged.</p>
          </div>
        </section>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[14px] font-semibold tracking-tight">Invoices</h3>
          {topups.length > 0 && <span className="text-[11.5px] tabular-nums text-muted-foreground">{topups.length}</span>}
        </div>
        {topups.length === 0 ? (
          <div className="p-10 rounded-2xl border border-dashed border-border/60 bg-card/40 text-center">
            <FileText className="w-5 h-5 text-muted-foreground/60 mx-auto mb-2" />
            <p className="text-[13px] text-muted-foreground">No invoices yet.</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-border/60 bg-card divide-y divide-border/60 overflow-hidden">
            {topups.map(t => (
              <div key={t.id} className="flex items-center gap-3 px-4 py-3 hover:bg-foreground/[0.02] transition-colors">
                <div className="w-9 h-9 rounded-xl bg-foreground/[0.04] grid place-items-center shrink-0">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] font-medium truncate">{t.invoice_number || "—"}</p>
                  <p className="text-[11.5px] text-muted-foreground mt-0.5 tabular-nums">
                    {new Date(t.created_at).toLocaleDateString()} <span className="text-muted-foreground/40">·</span> {t.amount_credits} MC <span className="text-muted-foreground/40">·</span> ${Number(t.amount_usd).toFixed(2)}
                  </p>
                </div>
                <span className="text-[10.5px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-md border bg-muted text-muted-foreground border-border capitalize">{t.status}</span>
                <Button size="sm" variant="ghost" onClick={() => downloadInvoice(t)} className="h-8 w-8 p-0 rounded-lg"><Download className="w-4 h-4" /></Button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
