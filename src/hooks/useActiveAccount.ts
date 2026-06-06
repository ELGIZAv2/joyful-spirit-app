// Returns the active "account" identity to show in headers/sidebars.
// When a workspace is active → workspace name, avatar, credits.
// When personal mode → user profile name, avatar, credits.
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useActiveWorkspaceId, WORKSPACE_CHANGED_EVENT } from "@/lib/activeWorkspace";

export interface ActiveAccount {
  kind: "personal" | "workspace";
  id: string | null;
  name: string;
  avatarUrl: string | null;
  credits: number;
  loading: boolean;
}

export function useActiveAccount(): ActiveAccount & { refresh: () => void } {
  const wsId = useActiveWorkspaceId();
  const [state, setState] = useState<ActiveAccount>({
    kind: "personal",
    id: null,
    name: "",
    avatarUrl: null,
    credits: 0,
    loading: true,
  });

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }));
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setState((s) => ({ ...s, loading: false })); return; }

    if (wsId) {
      const { data: ws } = await supabase
        .from("workspaces")
        .select("id, name, avatar_url, credits")
        .eq("id", wsId)
        .maybeSingle();
      if (ws) {
        setState({
          kind: "workspace",
          id: ws.id,
          name: ws.name || "Workspace",
          avatarUrl: (ws as any).avatar_url || null,
          credits: Number((ws as any).credits) || 0,
          loading: false,
        });
        return;
      }
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, avatar_url, credits")
      .eq("id", user.id)
      .maybeSingle();
    setState({
      kind: "personal",
      id: user.id,
      name:
        profile?.display_name ||
        user.user_metadata?.full_name ||
        user.email?.split("@")[0] ||
        "User",
      avatarUrl: profile?.avatar_url || user.user_metadata?.avatar_url || null,
      credits: Number(profile?.credits) || 0,
      loading: false,
    });
  }, [wsId]);

  useEffect(() => { load(); }, [load]);

  // React to workspace changes elsewhere in the app
  useEffect(() => {
    const onChange = () => load();
    window.addEventListener(WORKSPACE_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(WORKSPACE_CHANGED_EVENT, onChange);
  }, [load]);

  // Realtime: refresh when this workspace's credits change.
  useEffect(() => {
    if (!wsId) return;
    const name = `acct-ws-${wsId}-${Math.random().toString(36).slice(2, 8)}`;
    const ch = supabase.channel(name);
    ch.on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "workspaces", filter: `id=eq.${wsId}` },
      () => load(),
    ).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [wsId, load]);

  return { ...state, refresh: load };
}
