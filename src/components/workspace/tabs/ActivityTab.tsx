import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Activity } from "lucide-react";
import type { WorkspaceCtx } from "@/hooks/useWorkspaceContext";

export default function ActivityTab() {
  const { ws } = useOutletContext<{ ws: WorkspaceCtx }>();
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("workspace_audit_log").select("*").eq("workspace_id", ws.id).order("created_at", { ascending: false }).limit(100);
      setLogs((data as any) ?? []);
    })();
  }, [ws.id]);

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-[22px] font-semibold tracking-tight text-foreground">Activity</h2>
        <p className="text-[13px] text-muted-foreground mt-1">Audit trail of recent actions in this workspace.</p>
      </div>
      {logs.length === 0 ? (
        <div className="p-10 rounded-2xl border border-dashed border-border/60 bg-card/40 text-center">
          <Activity className="w-5 h-5 text-muted-foreground/60 mx-auto mb-2" />
          <p className="text-[13px] text-muted-foreground">No activity recorded yet.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border/60 bg-card divide-y divide-border/60 overflow-hidden">
          {logs.map(l => (
            <div key={l.id} className="px-4 py-3.5 hover:bg-foreground/[0.02] transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-primary/60 mt-2 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] font-medium capitalize text-foreground">{l.action.replace(/_/g, " ")}</p>
                  <p className="text-[11.5px] text-muted-foreground mt-0.5 tabular-nums">
                    {new Date(l.created_at).toLocaleString()}
                    {l.target_type && <> <span className="text-muted-foreground/40">·</span> {l.target_type}</>}
                  </p>
                  {l.metadata && Object.keys(l.metadata).length > 0 && (
                    <pre className="text-[10.5px] text-muted-foreground/80 mt-2 p-2.5 rounded-lg bg-foreground/[0.03] border border-border/40 overflow-x-auto">{JSON.stringify(l.metadata, null, 2)}</pre>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
