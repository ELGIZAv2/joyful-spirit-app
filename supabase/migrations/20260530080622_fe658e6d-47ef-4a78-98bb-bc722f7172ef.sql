
-- Table to track every visit on a referral link (clicks)
CREATE TABLE public.referral_clicks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL,
  referrer_user_id UUID,
  ip_hash TEXT,
  user_agent TEXT,
  referer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  country TEXT,
  landing_path TEXT,
  converted_user_id UUID,
  converted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_referral_clicks_code ON public.referral_clicks(code);
CREATE INDEX idx_referral_clicks_referrer ON public.referral_clicks(referrer_user_id);
CREATE INDEX idx_referral_clicks_created ON public.referral_clicks(created_at DESC);

GRANT SELECT ON public.referral_clicks TO authenticated;
GRANT ALL ON public.referral_clicks TO service_role;

ALTER TABLE public.referral_clicks ENABLE ROW LEVEL SECURITY;

-- Referrers can read their own click rows
CREATE POLICY "Referrers view their clicks"
ON public.referral_clicks
FOR SELECT
TO authenticated
USING (referrer_user_id = auth.uid());
