GRANT SELECT, INSERT ON public.referral_codes TO authenticated;
GRANT ALL ON public.referral_codes TO service_role;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'referral_codes_user_id_key') THEN
    ALTER TABLE public.referral_codes ADD CONSTRAINT referral_codes_user_id_key UNIQUE (user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'referral_codes_code_key') THEN
    ALTER TABLE public.referral_codes ADD CONSTRAINT referral_codes_code_key UNIQUE (code);
  END IF;
END $$;

DROP POLICY IF EXISTS "Users view their own referral code" ON public.referral_codes;
CREATE POLICY "Users view their own referral code"
ON public.referral_codes FOR SELECT TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users create their own referral code" ON public.referral_codes;
CREATE POLICY "Users create their own referral code"
ON public.referral_codes FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

GRANT SELECT ON public.referrals TO authenticated;
GRANT ALL ON public.referrals TO service_role;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'referrals_referred_id_key') THEN
    ALTER TABLE public.referrals ADD CONSTRAINT referrals_referred_id_key UNIQUE (referred_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON public.referrals(referred_id);

DROP POLICY IF EXISTS "Users view their referrals" ON public.referrals;
CREATE POLICY "Users view their referrals"
ON public.referrals FOR SELECT TO authenticated
USING (referrer_id = auth.uid() OR referred_id = auth.uid());

GRANT SELECT ON public.referral_earnings TO authenticated;
GRANT ALL ON public.referral_earnings TO service_role;

CREATE INDEX IF NOT EXISTS idx_referral_earnings_referrer ON public.referral_earnings(referrer_id);

DROP POLICY IF EXISTS "Users view their earnings" ON public.referral_earnings;
CREATE POLICY "Users view their earnings"
ON public.referral_earnings FOR SELECT TO authenticated
USING (referrer_id = auth.uid());

GRANT SELECT, INSERT ON public.withdrawal_requests TO authenticated;
GRANT ALL ON public.withdrawal_requests TO service_role;

CREATE INDEX IF NOT EXISTS idx_withdrawal_user ON public.withdrawal_requests(user_id);

DROP POLICY IF EXISTS "Users view their withdrawals" ON public.withdrawal_requests;
CREATE POLICY "Users view their withdrawals"
ON public.withdrawal_requests FOR SELECT TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users request their own withdrawals" ON public.withdrawal_requests;
CREATE POLICY "Users request their own withdrawals"
ON public.withdrawal_requests FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND status = 'pending');

CREATE OR REPLACE FUNCTION public.handle_referral_conversion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.converted_user_id IS NOT NULL
     AND NEW.referrer_user_id IS NOT NULL
     AND NEW.referrer_user_id <> NEW.converted_user_id
     AND (TG_OP = 'INSERT' OR OLD.converted_user_id IS DISTINCT FROM NEW.converted_user_id)
  THEN
    INSERT INTO public.referrals (referrer_id, referred_id, referral_code, status)
    VALUES (NEW.referrer_user_id, NEW.converted_user_id, NEW.code, 'active')
    ON CONFLICT (referred_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_referral_conversion ON public.referral_clicks;
CREATE TRIGGER trg_referral_conversion
AFTER INSERT OR UPDATE OF converted_user_id ON public.referral_clicks
FOR EACH ROW EXECUTE FUNCTION public.handle_referral_conversion();

INSERT INTO public.referrals (referrer_id, referred_id, referral_code, status)
SELECT DISTINCT ON (rc.converted_user_id)
       rc.referrer_user_id, rc.converted_user_id, rc.code, 'active'
FROM public.referral_clicks rc
WHERE rc.converted_user_id IS NOT NULL
  AND rc.referrer_user_id IS NOT NULL
  AND rc.referrer_user_id <> rc.converted_user_id
ORDER BY rc.converted_user_id, rc.converted_at ASC NULLS LAST
ON CONFLICT (referred_id) DO NOTHING;