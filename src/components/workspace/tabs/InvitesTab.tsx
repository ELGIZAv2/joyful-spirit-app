import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Copy, Trash2, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import type { WorkspaceCtx } from "@/hooks/useWorkspaceContext";

export default function InvitesTab() {
  const { ws, isAdmin } = useOutletContext<{ ws: WorkspaceCtx; isAdmin: boolean }>();
  const [invites, setInvites] = useState<any[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("member");
  const [sending, setSending] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("workspace_invites").select("*").eq("workspace_id", ws.id).order("created_at", { ascending: false });
    setInvites((data as any) ?? []);
  };
  useEffect(() => { load(); }, [ws.id]);

  const send = async () => {
    const e = email.trim().toLowerCase();
    if (!e) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) { toast.error("Invalid email address"); return; }
    setSending(true);
    const { data, error } = await supabase.rpc("workspace_create_invite" as any, { p_workspace_id: ws.id, p_email: e, p_role: role });
    setSending(false);
    if (error || !(data as any)?.success) { toast.error((data as any)?.error || error?.message || "Failed to send invite"); return; }
    const link = `${window.location.origin}/invite/workspace/${(data as any).token}`;
    try {
      await supabase.functions.invoke("workspace-notify", { body: { type: "invite", workspace_id: ws.id, workspace_name: ws.name, to: e, link } });
    } catch {}
    toast.success(`Invite sent to ${e}`);
    setEmail(""); load();
  };

  const copy = (t: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/invite/workspace/${t}`).then(
      () => toast.success("Invite link copied"),
      () => toast.error("Failed to copy"),
    );
  };
  const revoke = async (id: string) => {
    if (!confirm("Revoke this invite? The link will stop working.")) return;
    const { error } = await supabase.from("workspace_invites").update({ status: "revoked" } as any).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Invite revoked");
    load();
  };
  const resend = async (inv: any) => {
    const link = `${window.location.origin}/invite/workspace/${inv.invite_token}`;
    try {
      await supabase.functions.invoke("workspace-notify", { body: { type: "invite", workspace_id: ws.id, workspace_name: ws.name, to: inv.invite_email, link } });
      toast.success("Resent");
    } catch { toast.error("Failed to resend"); }
  };

  if (!isAdmin) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div>
          <h2 className="text-[22px] font-semibold tracking-tight text-foreground">Invites</h2>
          <p className="text-[13px] text-muted-foreground mt-1">Only workspace admins can manage invites.</p>
        </div>
        <div className="p-10 rounded-2xl border border-dashed border-border/60 bg-card/40 text-center">
          <Mail className="w-5 h-5 text-muted-foreground/60 mx-auto mb-2" />
          <p className="text-[13px] text-muted-foreground">Ask an admin to invite teammates.</p>
        </div>
      </div>
    );
  }

  const statusTint = (status: string) => {
    if (status === "pending") return "bg-amber-500/10 text-amber-600 border-amber-500/20";
    if (status === "accepted") return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
    if (status === "revoked") return "bg-muted text-muted-foreground border-border";
    return "bg-muted text-muted-foreground border-border";
  };

  return (
    <div className="space-y-10 animate-fade-in">
      <div>
        <h2 className="text-[22px] font-semibold tracking-tight text-foreground">Invites</h2>
        <p className="text-[13px] text-muted-foreground mt-1">Bring teammates into this workspace by email.</p>
      </div>

      <section className="space-y-3">
        <h3 className="text-[14px] font-semibold tracking-tight">Invite teammate</h3>
        <div className="p-4 rounded-2xl border border-border/60 bg-card">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              type="email"
              placeholder="teammate@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !sending && email.trim()) send(); }}
              className="flex-1 h-10 rounded-lg"
            />
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="w-full sm:w-36 h-10 rounded-lg"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
                <SelectItem value="billing_manager">Billing</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={send} disabled={sending || !email.trim()} className="h-10 rounded-lg">
              {sending ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Send className="w-4 h-4 mr-1.5" />}
              Send invite
            </Button>
          </div>
          <p className="text-[11.5px] text-muted-foreground mt-2.5 px-0.5">They'll get an email with a secure link to join.</p>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[14px] font-semibold tracking-tight">All invites</h3>
          <span className="text-[11.5px] tabular-nums text-muted-foreground">{invites.length}</span>
        </div>
        {invites.length === 0 ? (
          <div className="p-10 rounded-2xl border border-dashed border-border/60 bg-card/40 text-center">
            <Mail className="w-5 h-5 text-muted-foreground/60 mx-auto mb-2" />
            <p className="text-[13px] text-muted-foreground">No invites yet.</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-border/60 bg-card divide-y divide-border/60 overflow-hidden">
            {invites.map(inv => (
              <div key={inv.id} className="flex items-center gap-3 px-4 py-3 hover:bg-foreground/[0.02] transition-colors">
                <div className="w-9 h-9 rounded-xl bg-foreground/[0.04] grid place-items-center shrink-0">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] font-medium truncate">{inv.invite_email}</p>
                  <p className="text-[11.5px] text-muted-foreground mt-0.5 capitalize">
                    {inv.role}
                    {inv.expires_at && <> <span className="text-muted-foreground/40">·</span> expires {new Date(inv.expires_at).toLocaleDateString()}</>}
                  </p>
                </div>
                <span className={`text-[10.5px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-md border ${statusTint(inv.status)}`}>
                  {inv.status}
                </span>
                {inv.status === "pending" && (
                  <div className="flex gap-0.5 ml-1">
                    <Button size="sm" variant="ghost" onClick={() => copy(inv.invite_token)} className="h-8 w-8 p-0 rounded-lg" title="Copy link"><Copy className="w-3.5 h-3.5" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => resend(inv)} className="h-8 w-8 p-0 rounded-lg" title="Resend"><Send className="w-3.5 h-3.5" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => revoke(inv.id)} className="h-8 w-8 p-0 rounded-lg hover:bg-destructive/10 hover:text-destructive" title="Revoke"><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
