// Premium slides quota: free users get 3 free premium slide generations per day,
// then it costs 1 credit per generation.
import { supabase } from "@/integrations/supabase/client";

export const FREE_PREMIUM_SLIDES_PER_DAY = 3;
export const PREMIUM_SLIDES_CREDIT_COST = 1;
const FEATURE = "premium_slides";

function todayYMD(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export async function getPremiumSlidesUsedToday(userId: string): Promise<number> {
  const { data } = await supabase
    .from("daily_free_usage")
    .select("usage_count")
    .eq("user_id", userId)
    .eq("usage_date", todayYMD())
    .eq("feature", FEATURE)
    .maybeSingle();
  return Math.max(0, (data as any)?.usage_count ?? 0);
}

export async function incrementPremiumSlidesUsedToday(userId: string): Promise<void> {
  const today = todayYMD();
  const current = await getPremiumSlidesUsedToday(userId);
  await supabase
    .from("daily_free_usage")
    .upsert(
      { user_id: userId, usage_date: today, feature: FEATURE, usage_count: current + 1 } as any,
      { onConflict: "user_id,usage_date,feature" },
    );
}

/**
 * Authorize one premium slide generation for the user.
 * - If they still have free uses today: allow without charging.
 * - Otherwise: deduct PREMIUM_SLIDES_CREDIT_COST credits server-side.
 * Returns { ok: true, charged: boolean } on success, or { ok: false, reason } on failure.
 */
export async function authorizePremiumSlide(
  userId: string,
): Promise<{ ok: true; charged: boolean; remainingFree: number } | { ok: false; reason: string }> {
  const used = await getPremiumSlidesUsedToday(userId);
  if (used < FREE_PREMIUM_SLIDES_PER_DAY) {
    await incrementPremiumSlidesUsedToday(userId);
    return { ok: true, charged: false, remainingFree: FREE_PREMIUM_SLIDES_PER_DAY - used - 1 };
  }
  // Charge 1 credit
  const { data, error } = await supabase.rpc("deduct_credits", {
    p_user_id: userId,
    p_amount: PREMIUM_SLIDES_CREDIT_COST,
    p_action_type: "premium_slides",
    p_description: "Premium slides generation (over daily free quota)",
  } as never);
  if (error) return { ok: false, reason: "Could not process credit charge" };
  const result = data as { success?: boolean; error?: string } | null;
  if (!result?.success) return { ok: false, reason: result?.error || "Insufficient credits" };
  return { ok: true, charged: true, remainingFree: 0 };
}
