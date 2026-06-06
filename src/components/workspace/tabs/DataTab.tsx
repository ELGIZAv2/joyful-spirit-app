import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Database, Download, Archive, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { WorkspaceCtx } from "@/hooks/useWorkspaceContext";

export default function DataTab() {
  const { ws, isAdmin } = useOutletContext<{ ws: WorkspaceCtx; isAdmin: boolean }>();
  const [exporting, setExporting] = useState(false);

  const exportData = async () => {
    setExporting(true);
    const { data, error } = await supabase.rpc("workspace_export_gdpr" as any, { p_ws: ws.id });
    setExporting(false);
    if (error || !(data as any)?.success) { toast.error((data as any)?.error || error?.message); return; }
    const blob = new Blob([JSON.stringify((data as any).data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${ws.name.replace(/[^a-z0-9]/gi, "_")}_export_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    toast.success("Export downloaded");
  };

  const archive = async () => {
    if (!confirm("Archive this workspace? You can restore it within 30 days.")) return;
    const { data, error } = await supabase.rpc("workspace_archive" as any, { p_ws: ws.id });
    if (error || !(data as any)?.success) { toast.error((data as any)?.error || error?.message); return; }
    toast.success("Archived");
  };

  if (!isAdmin) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div>
          <h2 className="text-[22px] font-semibold tracking-tight text-foreground">Data & privacy</h2>
          <p className="text-[13px] text-muted-foreground mt-1">Only workspace admins can manage data and archival.</p>
        </div>
        <div className="p-10 rounded-2xl border border-dashed border-border/60 bg-card/40 text-center">
          <Database className="w-5 h-5 text-muted-foreground/60 mx-auto mb-2" />
          <p className="text-[13px] text-muted-foreground">Restricted to admins.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fade-in">
      <div>
        <h2 className="text-[22px] font-semibold tracking-tight text-foreground">Data & privacy</h2>
        <p className="text-[13px] text-muted-foreground mt-1">Export workspace data or archive the workspace.</p>
      </div>

      <section className="p-5 rounded-2xl border border-border/60 bg-card">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-foreground/[0.04] grid place-items-center shrink-0">
            <Download className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13.5px] font-medium">GDPR data export</p>
            <p className="text-[12px] text-muted-foreground mt-0.5">Download a complete JSON: members, projects, usage, audit log, brand kit, settings.</p>
          </div>
        </div>
        <Button onClick={exportData} disabled={exporting} className="mt-4 rounded-lg h-9">
          {exporting ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Download className="w-3.5 h-3.5 mr-1.5" />}
          Export all data
        </Button>
      </section>

      <section className="relative p-5 rounded-2xl border border-amber-500/30 bg-card overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.06] via-amber-500/0 to-transparent pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 ring-1 ring-amber-500/20 grid place-items-center shrink-0">
              <Archive className="w-4 h-4 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13.5px] font-medium">Archive workspace</p>
              <p className="text-[12px] text-muted-foreground mt-0.5">Hides the workspace from members. Recoverable within 30 days; permanently deleted after.</p>
            </div>
          </div>
          <Button variant="outline" onClick={archive} className="mt-4 rounded-lg h-9 border-amber-500/30 hover:bg-amber-500/10 text-amber-700 dark:text-amber-500">
            <Archive className="w-3.5 h-3.5 mr-1.5" /> Archive workspace
          </Button>
        </div>
      </section>
    </div>
  );
}
