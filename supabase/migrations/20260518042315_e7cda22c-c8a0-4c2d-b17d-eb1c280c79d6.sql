CREATE TABLE IF NOT EXISTS public.marketing_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid NULL,
  name text NOT NULL,
  product_name text,
  product_description text,
  target_audience text,
  tone text,
  brief jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.marketing_ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.marketing_campaigns(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  headline text NOT NULL,
  subheadline text,
  cta text,
  body_copy text,
  visual_prompt text NOT NULL,
  color_mood text,
  image_url text,
  aspect_ratio text DEFAULT '1:1',
  platform text,
  status text NOT NULL DEFAULT 'pending',
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS marketing_campaigns_user_idx ON public.marketing_campaigns(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS marketing_ads_campaign_idx ON public.marketing_ads(campaign_id, created_at DESC);

ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_ads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "campaigns_select_own" ON public.marketing_campaigns FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "campaigns_insert_own" ON public.marketing_campaigns FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "campaigns_update_own" ON public.marketing_campaigns FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "campaigns_delete_own" ON public.marketing_campaigns FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "ads_select_own" ON public.marketing_ads FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "ads_insert_own" ON public.marketing_ads FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ads_update_own" ON public.marketing_ads FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "ads_delete_own" ON public.marketing_ads FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.tg_marketing_set_updated_at()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS marketing_campaigns_updated_at ON public.marketing_campaigns;
CREATE TRIGGER marketing_campaigns_updated_at
  BEFORE UPDATE ON public.marketing_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.tg_marketing_set_updated_at();