import { supabase } from "@/integrations/supabase/client";
import { invokeFunction } from "@/lib/supabaseFunction";
import { WORKSPACE_PRODUCT_MAP, type WorkspacePaidPlan } from "@/lib/workspacePlans";

export async function openWorkspaceCheckout(
  plan: WorkspacePaidPlan,
  interval: "monthly" | "yearly" = "monthly",
  opts: { trial?: boolean } = {},
) {
  const product_id = WORKSPACE_PRODUCT_MAP[plan][interval];

  let { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    const { data: refreshed } = await supabase.auth.refreshSession();
    session = refreshed.session;
  }

  if (!session?.access_token) {
    return { ok: false as const, reason: "auth_required" };
  }

  const { data, error } = await invokeFunction("dodo-checkout", {
    body: {
      product_id,
      plan,
      trial: opts.trial === true,
      metadata: {
        flow: "workspace_create",
        workspace_name: typeof window !== "undefined" ? sessionStorage.getItem("megsy_pending_workspace_name") : null,
      },
    },
    headers: { Authorization: `Bearer ${session.access_token}` },
  });

  if (error) {
    const message = (error as any)?.message || "checkout_failed";
    return { ok: false as const, reason: message };
  }

  if (!data?.url) {
    return { ok: false as const, reason: data?.error || "checkout_failed" };
  }

  return { ok: true as const, url: data.url };
}