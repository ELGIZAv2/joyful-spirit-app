import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface WorkspaceCtx {
  id: string;
  name: string;
  owner_id: string;
  credits: number;
  default_member_monthly_limit: number | null;
  avatar_url: string | null;
  plan: string | null;
  archived_at: string | null;
}

export function useWorkspaceContext(id: string | undefined) {
  const [ws, setWs] = useState<WorkspaceCtx | null>(null);
  const [me, setMe] = useState<string | null>(null);
  const [myRole, setMyRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setMe(user?.id ?? null);
      const { data: w } = await supabase.from("workspaces").select("*").eq("id", id).maybeSingle();
      setWs(w as any);
      if (user) {
        const { data: mem } = await supabase.from("workspace_members").select("role").eq("workspace_id", id).eq("user_id", user.id).maybeSingle();
        setMyRole((mem as any)?.role ?? null);
      }
      setLoading(false);
    })();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const channelName = `ws-ctx-${id}-${Math.random().toString(36).slice(2, 10)}`;
    const ch = supabase
      .channel(channelName)
      .on("postgres_changes", { event: "*", schema: "public", table: "workspaces", filter: `id=eq.${id}` }, (p) => p.new && setWs(p.new as any))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id]);

  const isOwner = !!ws && me === ws.owner_id;
  const isAdmin = isOwner || myRole === "admin";
  const canBilling = isAdmin || myRole === "billing_manager";

  return { ws, me, myRole, isOwner, isAdmin, canBilling, loading, refresh: async () => {
    if (!id) return;
    const { data: w } = await supabase.from("workspaces").select("*").eq("id", id).maybeSingle();
    setWs(w as any);
  }};
}
