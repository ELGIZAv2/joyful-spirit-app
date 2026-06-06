import { supabase } from "@/integrations/supabase/client";
import { getActiveWorkspaceId, hydrateActiveWorkspaceFromDB } from "@/lib/activeWorkspace";

/**
 * Deduct credits — uses workspace credits if user has an active workspace,
 * otherwise falls back to the personal `deduct_credits` RPC.
 */
export async function spendCredits(amount: number, actionType: string, description?: string): Promise<
  { success: true; credits: number; source: "workspace" | "personal"; monthly_used?: number }
  | { success: false; error: string; details?: any }
> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "auth_required" };

  // Active workspace is hydrated from profiles.active_workspace_id (DB).
  let activeWs = getActiveWorkspaceId();
  if (!activeWs) activeWs = await hydrateActiveWorkspaceFromDB();

  if (activeWs) {
    const { data, error } = await supabase.rpc("workspace_deduct_credits" as any, {
      p_workspace_id: activeWs,
      p_amount: amount,
      p_action_type: actionType,
      p_description: description ?? null,
    });
    if (error) return { success: false, error: error.message };
    const r = data as any;
    if (!r?.success) return { success: false, error: r?.error || "unknown", details: r };
    return { success: true, credits: Number(r.credits), source: "workspace", monthly_used: Number(r.monthly_used) };
  }

  const { data, error } = await supabase.rpc("deduct_credits" as any, {
    p_user_id: user.id,
    p_amount: amount,
    p_action_type: actionType,
    p_description: description ?? null,
  });
  if (error) return { success: false, error: error.message };
  const r = data as any;
  if (!r?.success) return { success: false, error: r?.error || "unknown", details: r };
  return { success: true, credits: Number(r.credits), source: "personal" };
}
