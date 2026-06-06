import { useNavigate, useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, Trash2, AlertTriangle, Copy } from "lucide-react";
import { toast } from "sonner";
import type { WorkspaceCtx } from "@/hooks/useWorkspaceContext";
import { setActiveWorkspaceId, getActiveWorkspaceId } from "@/lib/activeWorkspace";

export default function DangerTab() {
  const { ws, isOwner, me } = useOutletContext<{ ws: WorkspaceCtx; isOwner: boolean; me: string | null }>();
  const navigate = useNavigate();

  const leave = async () => {
    if (isOwner) { toast.error("Owner can't leave. Transfer ownership first."); return; }
    if (!confirm("Leave this workspace?")) return;
    await supabase.from("workspace_members").delete().eq("workspace_id", ws.id).eq("user_id", me!);
    if (getActiveWorkspaceId() === ws.id) {
      setActiveWorkspaceId(null);
      if (me) await supabase.from("profiles").update({ active_workspace_id: null } as any).eq("id", me);
    }
    toast.success("Left");
    navigate("/settings/workspaces");
  };

  const del = async () => {
    if (!confirm(`Permanently delete "${ws.name}" and all data? This cannot be undone.`)) return;
    const { error } = await supabase.from("workspaces").delete().eq("id", ws.id);
    if (error) { toast.error(error.message); return; }
    if (getActiveWorkspaceId() === ws.id) {
      setActiveWorkspaceId(null);
      if (me) await supabase.from("profiles").update({ active_workspace_id: null } as any).eq("id", me);
    }
    toast.success("Deleted");
    navigate("/settings/workspaces");
  };

  return (
    <div className="space-y-10 animate-fade-in">
      <div>
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-destructive" />
          <h2 className="text-[22px] font-semibold tracking-tight text-destructive">Danger zone</h2>
        </div>
        <p className="text-[13px] text-muted-foreground mt-1">Irreversible and destructive actions.</p>
      </div>

      <section className="p-4 rounded-2xl border border-border/60 bg-card flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-medium">Workspace ID</p>
          <p className="text-[11.5px] text-muted-foreground font-mono truncate mt-0.5">{ws.id}</p>
        </div>
        <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(ws.id); toast.success("Copied"); }} className="rounded-lg h-9 w-9 p-0 shrink-0">
          <Copy className="w-4 h-4" />
        </Button>
      </section>

      {!isOwner && (
        <section className="p-5 rounded-2xl border border-border/60 bg-card flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[13.5px] font-medium">Leave workspace</p>
            <p className="text-[12px] text-muted-foreground mt-0.5">You'll lose access to all workspace data immediately.</p>
          </div>
          <Button variant="outline" onClick={leave} className="rounded-lg h-9 shrink-0"><LogOut className="w-3.5 h-3.5 mr-1.5" /> Leave</Button>
        </section>
      )}

      {isOwner && (
        <section className="relative p-5 rounded-2xl border border-destructive/30 bg-card overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-destructive/[0.06] via-destructive/0 to-transparent pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-destructive/10 ring-1 ring-destructive/20 grid place-items-center shrink-0">
                <Trash2 className="w-4 h-4 text-destructive" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13.5px] font-medium text-destructive">Delete workspace</p>
                <p className="text-[12px] text-muted-foreground mt-0.5">All members, projects, tasks, and history will be permanently deleted.</p>
              </div>
            </div>
            <Button variant="destructive" onClick={del} className="mt-4 rounded-lg h-9"><Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete forever</Button>
          </div>
        </section>
      )}
    </div>
  );
}
