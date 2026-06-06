-- =============================================================
-- Referral System Upgrade: tiers, milestones, shortlinks, cooldown
-- =============================================================

-- 1) Tier configuration (hidden thresholds — very hard to reach)
CREATE TABLE IF NOT EXISTS public.referral_tiers (
  id SERIAL PRIMARY KEY,
  tier_name TEXT NOT NULL UNIQUE,
  min_conversions BIGINT NOT NULL,
  commission_rate NUMERIC NOT NULL DEFAULT 0.20,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.referral_tiers TO authenticated, service_role;
GRANT ALL ON public.referral_tiers TO service_role;

ALTER TABLE public.referral_tiers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tiers readable by authed" ON public.referral_tiers;
CREATE POLICY "Tiers readable by authed"
ON public.referral_tiers FOR SELECT TO authenticated
USING (true);

INSERT INTO public.referral_tiers (tier_name, min_conversions, commission_rate, sort_order) VALUES
  ('Bronze',          0, 0.20, 1),
  ('Silver',    1000000, 0.22, 2),
  ('Gold',      5000000, 0.25, 3),
  ('Platinum', 10000000, 0.30, 4)
ON CONFLICT (tier_name) DO UPDATE
SET min_conversions = EXCLUDED.min_conversions,
    commission_rate = EXCLUDED.commission_rate,
    sort_order = EXCLUDED.sort_order;

-- 2) Personal milestones (private badges per user — no leaderboard)
CREATE TABLE IF NOT EXISTS public.referral_milestones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  milestone_key TEXT NOT NULL,
  achieved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, milestone_key)
);

CREATE INDEX IF NOT EXISTS idx_milestones_user ON public.referral_milestones(user_id);

GRANT SELECT ON public.referral_milestones TO authenticated;
GRANT ALL ON public.referral_milestones TO service_role;

ALTER TABLE public.referral_milestones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own milestones" ON public.referral_milestones;
CREATE POLICY "Users view own milestones"
ON public.referral_milestones FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- 3) Branded short links: megsyai.com/r/<slug>
CREATE TABLE IF NOT EXISTS public.referral_shortlinks (
  slug TEXT PRIMARY KEY,
  user_id UUID NOT NULL,
  code TEXT NOT NULL,
  target_path TEXT NOT NULL DEFAULT '/',
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  clicks BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shortlinks_user ON public.referral_shortlinks(user_id);

GRANT SELECT, INSERT ON public.referral_shortlinks TO authenticated;
GRANT ALL ON public.referral_shortlinks TO service_role;

ALTER TABLE public.referral_shortlinks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own shortlinks" ON public.referral_shortlinks;
CREATE POLICY "Users view own shortlinks"
ON public.referral_shortlinks FOR SELECT TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users create own shortlinks" ON public.referral_shortlinks;
CREATE POLICY "Users create own shortlinks"
ON public.referral_shortlinks FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- 4) Add cooldown column to earnings (fraud protection: 7 days)
ALTER TABLE public.referral_earnings
  ADD COLUMN IF NOT EXISTS available_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days');

CREATE INDEX IF NOT EXISTS idx_earnings_available_at ON public.referral_earnings(available_at);

-- 5) Helper: get user's tier (called by edge function via service role)
CREATE OR REPLACE FUNCTION public.get_user_referral_tier(_user_id UUID)
RETURNS TABLE (tier_name TEXT, commission_rate NUMERIC, conversions BIGINT)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH stats AS (
    SELECT COUNT(*)::bigint AS c
    FROM public.referrals
    WHERE referrer_id = _user_id AND status = 'active'
  )
  SELECT t.tier_name, t.commission_rate, s.c
  FROM public.referral_tiers t, stats s
  WHERE t.min_conversions <= s.c
  ORDER BY t.min_conversions DESC
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_referral_tier(UUID) TO authenticated, service_role;