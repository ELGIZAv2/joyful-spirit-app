
-- 1) Reset tier table to the new scheme: Bronze/Silver/Gold/Diamond by # active referrals
DELETE FROM public.referral_tiers;
INSERT INTO public.referral_tiers (tier_name, min_conversions, commission_rate, sort_order) VALUES
  ('Bronze',  0,   0.15, 1),
  ('Silver',  10,  0.20, 2),
  ('Gold',    50,  0.25, 3),
  ('Diamond', 200, 0.30, 4);

-- 2) Anti-fraud columns on referrals: ip + fingerprint hashes, unique referred user
ALTER TABLE public.referrals
  ADD COLUMN IF NOT EXISTS ip_hash text,
  ADD COLUMN IF NOT EXISTS fingerprint_hash text;

-- a single user can only be referred once, by one referrer
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'referrals_referred_id_unique'
  ) THEN
    ALTER TABLE public.referrals
      ADD CONSTRAINT referrals_referred_id_unique UNIQUE (referred_id);
  END IF;
END $$;

-- 3) Prevent self-referrals at the DB level
CREATE OR REPLACE FUNCTION public.prevent_self_referral()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.referrer_id = NEW.referred_id THEN
    RAISE EXCEPTION 'self_referral_not_allowed';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_self_referral ON public.referrals;
CREATE TRIGGER trg_prevent_self_referral
BEFORE INSERT OR UPDATE ON public.referrals
FOR EACH ROW EXECUTE FUNCTION public.prevent_self_referral();

-- Block reusing the same (ip_hash, fingerprint_hash) for a different referred user
CREATE UNIQUE INDEX IF NOT EXISTS referrals_device_unique_idx
  ON public.referrals (ip_hash, fingerprint_hash)
  WHERE ip_hash IS NOT NULL AND fingerprint_hash IS NOT NULL;

-- 4) Helper: current commission rate for a referrer based on # of active referrals
CREATE OR REPLACE FUNCTION public.get_referrer_commission_rate(_user_id uuid)
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT t.commission_rate
  FROM public.referral_tiers t
  WHERE t.min_conversions <= (
    SELECT COUNT(*) FROM public.referrals
    WHERE referrer_id = _user_id AND status = 'active'
  )
  ORDER BY t.min_conversions DESC
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_referrer_commission_rate(uuid) TO authenticated, service_role;
