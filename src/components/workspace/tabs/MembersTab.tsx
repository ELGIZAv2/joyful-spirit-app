import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Crown, Pause, Play, UserCheck, UserX, Users } from "lucide-react";
import { toast } from "sonner";
import { useWorkspaceMembers } from "@/hooks/useWorkspace";
import type { WorkspaceCtx } from "@/hooks/useWorkspaceContext";

const ROLES = ["admin", "editor", "member", "viewer", "billing_manager"] as const;

export default function MembersTab() {
  const { ws, isAdmin, isOwner, me } = useOutletContext<{ ws: WorkspaceCtx; isAdmin: boolean; isOwner: boolean; me: string | null }>();
  const { members, refresh } = useWorkspaceMembers(ws.id);
  const [requests, setRequests] = useState<any[]>([]);
  const [statusMap, setStatusMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    (async () => {
      const [r, s] = await Promise.all([
        supabase.from("workspace_join_requests").select("*").eq("workspace_id", ws.id).eq("status", "pending"),
        supabase.from("workspace_member_status").select("user_id, suspended").eq("workspace_id", ws.id),
      ]);
      setRequests((r.data as any) ?? []);
      const m: Record<string, boolean> = {};
      ((s.data as any) ?? []).forEach((x: any) => { m[x.user_id] = x.suspended; });
      setStatusMap(m);
    })();
  }, [ws.id, members.length]);

  const setRole = async (userId: string, role: string) => {
    const { data, error } = await supabase.rpc("workspace_set_member_role" as any, { p_ws: ws.id, p_user: userId, p_role: role });
    if (error || !(data as any)?.success) { toast.error((data as any)?.error || error?.message || "Failed"); return; }
    toast.success("Role updated"); refresh();
  };

  const transferOwnership = async (userId: string) => {
    if (!confirm("Transfer ownership to this member? You will become an admin.")) return;
    const { data, error } = await supabase.rpc("workspace_transfer_ownership" as any, { p_ws: ws.id, p_new_owner: userId });
    if (error || !(data as any)?.success) { toast.error((data as any)?.error || error?.message || "Failed"); return; }
    toast.success("Ownership transferred"); window.location.reload();
  };

  const toggleSuspend = async (userId: string, suspend: boolean) => {
    const { data, error } = await supabase.rpc("workspace_set_member_status" as any, { p_ws: ws.id, p_user: userId, p_suspended: suspend, p_reason: null });
    if (error || !(data as any)?.success) { toast.error((data as any)?.error || error?.message); return; }
    toast.success(suspend ? "Member suspended" : "Member reactivated");
    setStatusMap(s => ({ ...s, [userId]: suspend }));
  };

  const removeMember = async (memberId: string, userId: string) => {
    if (userId === ws.owner_id) { toast.error("Can't remove owner"); return; }
    if (!confirm("Remove this member?")) return;
    const { error } = await supabase.from("workspace_members").delete().eq("id", memberId);
    if (error) { toast.error(error.message); return; }
    toast.success("Member removed");
    refresh();
  };

  const updateLimit = async (memberId: string, val: string) => {
    const v = val.trim() === "" ? null : Number(val);
    if (v !== null && (!Number.isFinite(v) || v < 0)) { toast.error("Invalid limit"); return; }
    const { error } = await supabase.from("workspace_members").update({ monthly_limit: v } as any).eq("id", memberId);
    if (error) toast.error(error.message); else toast.success("Limit updated");
  };

  const approveRequest = async (id: string) => {
    const { data, error } = await supabase.rpc("workspace_approve_request" as any, { p_request_id: id });
    if (error || !(data as any)?.success) {
      toast.error((data as any)?.error || error?.message || "Failed to approve");
      return;
    }
    toast.success("Approved");
    setRequests((r) => r.filter((x) => x.id !== id));
    refresh();
  };
  const rejectRequest = async (id: string) => {
    const { data, error } = await supabase.rpc("workspace_reject_request" as any, { p_request_id: id });
    if (error || !(data as any)?.success) {
      toast.error((data as any)?.error || error?.message || "Failed to reject");
      return;
    }
    toast.success("Rejected");
    setRequests((r) => r.filter((x) => x.id !== id));
  };

  return (
    <div className="space-y-10 animate-fade-in">
      <div>
        <h2 className="text-[22px] font-semibold tracking-tight text-foreground">Members</h2>
        <p className="text-[13px] text-muted-foreground mt-1">Manage who has access to this workspace and what they can do.</p>
      </div>

      {requests.length > 0 && isAdmin && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[14px] font-semibold tracking-tight">Pending join requests</h3>
            <span className="text-[11.5px] tabular-nums text-muted-foreground">{requests.length}</span>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card divide-y divide-border/60 overflow-hidden">
            {requests.map(r => (
              <div key={r.id} className="flex items-center justify-between px-4 py-3 hover:bg-foreground/[0.02] transition-colors">
                <span className="text-[12.5px] font-mono text-muted-foreground truncate">{r.user_id.slice(0, 12)}…</span>
                <div className="flex gap-1.5">
                  <Button size="sm" variant="outline" onClick={() => approveRequest(r.id)} className="rounded-lg h-8"><UserCheck className="w-3.5 h-3.5 mr-1" /> Approve</Button>
                  <Button size="sm" variant="ghost" onClick={() => rejectRequest(r.id)} className="rounded-lg h-8 text-muted-foreground"><UserX className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[14px] font-semibold tracking-tight">Members</h3>
          <span className="text-[11.5px] tabular-nums text-muted-foreground">{members.length}</span>
        </div>
        {members.length === 0 ? (
          <div className="p-10 rounded-2xl border border-dashed border-border/60 bg-card/40 text-center">
            <Users className="w-5 h-5 text-muted-foreground/60 mx-auto mb-2" />
            <p className="text-[13px] text-muted-foreground">No members yet.</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-border/60 bg-card divide-y divide-border/60 overflow-hidden">
            {members.map(m => {
              const suspended = !!statusMap[m.user_id];
              const isOwnerRow = m.user_id === ws.owner_id;
              return (
                <div key={m.id} className={`px-4 py-4 transition-colors hover:bg-foreground/[0.02] ${suspended ? "opacity-70" : ""}`}>
                  <div className="flex items-center gap-3">
                    {m.avatar_url ? (
                      <img src={m.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover ring-1 ring-border/60" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-foreground/10 to-foreground/5 ring-1 ring-border/60 grid place-items-center text-[13px] font-semibold text-foreground">
                        {(m.display_name || "?")[0]?.toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[13.5px] truncate flex items-center gap-1.5">
                        <span className="truncate">{m.display_name || "Member"}</span>
                        {isOwnerRow && <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                        {m.user_id === me && <span className="text-[11px] text-muted-foreground font-normal">(you)</span>}
                        {suspended && <span className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded-md bg-orange-500/10 text-orange-500 border border-orange-500/20">suspended</span>}
                      </p>
                      <p className="text-[12px] text-muted-foreground tabular-nums mt-0.5">
                        <span className="capitalize text-foreground/70">{m.role.replace("_", " ")}</span>
                        <span className="mx-1.5 text-muted-foreground/40">·</span>
                        {Number(m.monthly_used).toFixed(1)} MC this month
                        {m.monthly_limit ? ` / ${m.monthly_limit}` : ""}
                      </p>
                    </div>
                  </div>

                  {isAdmin && !isOwnerRow && (
                    <div className="mt-4 grid grid-cols-2 gap-2 pl-13">
                      <Select value={m.role} onValueChange={(v) => setRole(m.user_id, v)}>
                        <SelectTrigger className="h-9 text-[12.5px] rounded-lg"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {ROLES.map(r => <SelectItem key={r} value={r} className="text-[12.5px] capitalize">{r.replace("_", " ")}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        placeholder="Monthly limit"
                        defaultValue={m.monthly_limit ?? ""}
                        onBlur={(e) => updateLimit(m.id, e.target.value)}
                        className="h-9 text-[12.5px] rounded-lg"
                      />
                      <Button size="sm" variant="outline" onClick={() => toggleSuspend(m.user_id, !suspended)} className="text-[12px] rounded-lg h-9">
                        {suspended ? <><Play className="w-3.5 h-3.5 mr-1.5" /> Unsuspend</> : <><Pause className="w-3.5 h-3.5 mr-1.5" /> Suspend</>}
                      </Button>
                      {isOwner ? (
                        <Button size="sm" variant="outline" onClick={() => transferOwnership(m.user_id)} className="text-[12px] rounded-lg h-9">
                          <Crown className="w-3.5 h-3.5 mr-1.5" /> Make owner
                        </Button>
                      ) : <div />}
                      <Button size="sm" variant="ghost" onClick={() => removeMember(m.id, m.user_id)} className="text-[12px] rounded-lg h-9 col-span-2 text-destructive hover:bg-destructive/10 hover:text-destructive">
                        <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Remove from workspace
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
