import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, Check, X, Users } from "lucide-react";
import { toast } from "sonner";

export default function AcceptWorkspaceInvitePage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [invite, setInvite] = useState<any>(null);
  const [workspace, setWorkspace] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!token) { setError("Invalid link"); setLoading(false); return; }
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (!user) {
        navigate(`/auth?redirect=${encodeURIComponent(`/invite/workspace/${token}`)}`, { replace: true });
        return;
      }
      const { data, error: rpcErr } = await supabase.rpc("get_workspace_invite_details" as any, { p_token: token });
      if (rpcErr) { setError(rpcErr.message); setLoading(false); return; }
      const r = data as any;
      if (!r || r.error) {
        const msg = r?.error === "expired" ? "This invite has expired"
          : r?.error === "already_used" ? "This invite has already been used"
          : "Invite not found";
        setError(msg); setLoading(false); return;
      }
      setInvite({ role: r.role, invite_email: r.invite_email, is_link_invite: r.is_link_invite, inviter_name: r.inviter_name });
      setWorkspace({ id: r.workspace_id, name: r.workspace_name, avatar_url: r.workspace_avatar });
      setLoading(false);
    })();
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;
    if (!user) { navigate(`/auth?redirect=${encodeURIComponent(`/invite/workspace/${token}`)}`); return; }
    setAccepting(true);
    const { data, error } = await supabase.rpc("workspace_accept_invite" as any, { p_token: token });
    setAccepting(false);
    if (error) { toast.error(error.message); return; }
    const r = data as any;
    if (!r?.success) { toast.error(r?.error || "Failed"); return; }
    toast.success("Joined workspace!");
    try {
      await supabase.from("profiles").update({ active_workspace_id: r.workspace_id } as any).eq("id", user.id);
      const { setActiveWorkspaceId } = await import("@/lib/activeWorkspace");
      setActiveWorkspaceId(r.workspace_id);
    } catch { /* ignore */ }
    navigate(`/settings/workspaces/${r.workspace_id}`);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  if (error || !invite) return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-full bg-muted flex items-center justify-center"><X className="w-6 h-6" /></div>
        <h1 className="text-xl font-semibold">Invite unavailable</h1>
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button onClick={() => navigate("/")} variant="outline">Go home</Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="max-w-md w-full bg-card border border-border/60 rounded-2xl p-8 shadow-sm space-y-6 text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-foreground text-background flex items-center justify-center text-2xl font-semibold">
          {workspace?.name?.[0]?.toUpperCase() ?? "W"}
        </div>
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">Join {workspace?.name ?? "workspace"}</h1>
          <p className="text-sm text-muted-foreground">You're invited as {invite.role}</p>
        </div>
        <div className="bg-muted/40 rounded-xl p-3 text-xs text-muted-foreground flex items-center justify-center gap-2">
          <Users className="w-3.5 h-3.5" /> Shared credits, projects & tasks
        </div>
        {!user && <p className="text-xs text-muted-foreground">You'll need to sign in to join.</p>}
        <div className="flex gap-2">
          <Button onClick={() => navigate("/")} variant="outline" className="flex-1" disabled={accepting}>Decline</Button>
          <Button onClick={handleAccept} disabled={accepting} className="flex-1 bg-foreground text-background hover:bg-foreground/90">
            {accepting ? <Loader2 className="w-4 h-4 animate-spin" /> : user ? <><Check className="w-4 h-4 mr-1" /> Accept</> : "Sign in to join"}
          </Button>
        </div>
      </div>
    </div>
  );
}
