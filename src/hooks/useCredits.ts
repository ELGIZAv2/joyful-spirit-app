import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useActiveWorkspaceId, WORKSPACE_CHANGED_EVENT } from "@/lib/activeWorkspace";

// Workspace-aware credits hook. When a workspace is active, returns workspace credits.
// In personal mode, returns the user's profile credits. Used for display in headers.
export function useCredits() {
  const wsId = useActiveWorkspaceId();
  const [credits, setCredits] = useState<number | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCredits = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    setUserId(user.id);

    if (wsId) {
      const { data } = await supabase
        .from("workspaces")
        .select("credits")
        .eq("id", wsId)
        .maybeSingle();
      setCredits(data ? Number((data as any).credits) : 0);
    } else {
      const { data } = await supabase
        .from("profiles")
        .select("credits")
        .eq("id", user.id)
        .single();
      if (data) setCredits(Number(data.credits));
    }
    setLoading(false);
  }, [wsId]);

  useEffect(() => { fetchCredits(); }, [fetchCredits]);

  useEffect(() => {
    const onChange = () => fetchCredits();
    window.addEventListener(WORKSPACE_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(WORKSPACE_CHANGED_EVENT, onChange);
  }, [fetchCredits]);

  const hasEnoughCredits = (cost: number) => {
    if (credits === null) return false;
    return credits >= cost;
  };

  return { credits, userId, loading, hasEnoughCredits, refreshCredits: fetchCredits };
}
