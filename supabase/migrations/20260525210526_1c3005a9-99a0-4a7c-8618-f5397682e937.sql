-- 1) Add feature column to daily_free_usage so we can track multiple features per day
ALTER TABLE public.daily_free_usage
  ADD COLUMN IF NOT EXISTS feature text NOT NULL DEFAULT 'premium_slides';

-- Update unique constraint to include feature
ALTER TABLE public.daily_free_usage
  DROP CONSTRAINT IF EXISTS daily_free_usage_user_id_usage_date_key;
ALTER TABLE public.daily_free_usage
  ADD CONSTRAINT daily_free_usage_user_date_feature_key
  UNIQUE (user_id, usage_date, feature);

-- 2) Add age gate ack to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS age_gate_acked_at timestamptz;

-- 3) Project publish settings (replaces localStorage `publish:${projectId}`)
CREATE TABLE IF NOT EXISTS public.project_publish_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  project_id text NOT NULL,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, project_id)
);

ALTER TABLE public.project_publish_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pps_owner_select" ON public.project_publish_settings;
DROP POLICY IF EXISTS "pps_owner_insert" ON public.project_publish_settings;
DROP POLICY IF EXISTS "pps_owner_update" ON public.project_publish_settings;
DROP POLICY IF EXISTS "pps_owner_delete" ON public.project_publish_settings;

CREATE POLICY "pps_owner_select" ON public.project_publish_settings
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "pps_owner_insert" ON public.project_publish_settings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "pps_owner_update" ON public.project_publish_settings
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "pps_owner_delete" ON public.project_publish_settings
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_pps_user_project ON public.project_publish_settings(user_id, project_id);

CREATE TRIGGER update_pps_updated_at
  BEFORE UPDATE ON public.project_publish_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();