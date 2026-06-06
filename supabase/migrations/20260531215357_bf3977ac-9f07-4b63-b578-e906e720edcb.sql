CREATE TABLE public.promo_deadlines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  promo_key TEXT NOT NULL DEFAULT 'megsy_pro_50',
  deadline_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.promo_deadlines TO authenticated;
GRANT ALL ON public.promo_deadlines TO service_role;

ALTER TABLE public.promo_deadlines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own promo deadline"
ON public.promo_deadlines FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own promo deadline"
ON public.promo_deadlines FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own promo deadline"
ON public.promo_deadlines FOR UPDATE
USING (auth.uid() = user_id);

CREATE TRIGGER update_promo_deadlines_updated_at
BEFORE UPDATE ON public.promo_deadlines
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();