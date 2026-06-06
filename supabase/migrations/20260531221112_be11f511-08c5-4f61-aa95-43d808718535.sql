
CREATE TABLE public.daily_promo_slots (
  date DATE PRIMARY KEY DEFAULT CURRENT_DATE,
  total_slots INTEGER NOT NULL DEFAULT 50,
  claimed_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.daily_promo_slots TO anon, authenticated;
GRANT ALL ON public.daily_promo_slots TO service_role;

ALTER TABLE public.daily_promo_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read promo slots"
ON public.daily_promo_slots FOR SELECT
USING (true);

-- Get (and lazily create) today's row
CREATE OR REPLACE FUNCTION public.get_today_promo_slots()
RETURNS TABLE(date DATE, total_slots INTEGER, claimed_count INTEGER, remaining INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.daily_promo_slots (date)
  VALUES (CURRENT_DATE)
  ON CONFLICT (date) DO NOTHING;

  RETURN QUERY
  SELECT s.date, s.total_slots, s.claimed_count, GREATEST(s.total_slots - s.claimed_count, 0)
  FROM public.daily_promo_slots s
  WHERE s.date = CURRENT_DATE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_today_promo_slots() TO anon, authenticated;

-- Atomically claim one slot. Returns remaining after claim, or -1 if sold out.
CREATE OR REPLACE FUNCTION public.claim_promo_slot()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_remaining INTEGER;
BEGIN
  INSERT INTO public.daily_promo_slots (date)
  VALUES (CURRENT_DATE)
  ON CONFLICT (date) DO NOTHING;

  UPDATE public.daily_promo_slots
  SET claimed_count = claimed_count + 1,
      updated_at = now()
  WHERE date = CURRENT_DATE
    AND claimed_count < total_slots
  RETURNING (total_slots - claimed_count) INTO v_remaining;

  IF v_remaining IS NULL THEN
    RETURN -1;
  END IF;

  RETURN v_remaining;
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_promo_slot() TO anon, authenticated;
