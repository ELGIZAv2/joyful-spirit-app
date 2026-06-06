-- Pipedream connections per user
CREATE TABLE IF NOT EXISTS public.pipedream_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  app_slug TEXT NOT NULL,
  account_id TEXT NOT NULL,
  external_user_id TEXT NOT NULL,
  account_name TEXT,
  healthy BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, app_slug, account_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pipedream_accounts TO authenticated;
GRANT ALL ON public.pipedream_accounts TO service_role;

ALTER TABLE public.pipedream_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own pipedream accounts"
  ON public.pipedream_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own pipedream accounts"
  ON public.pipedream_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own pipedream accounts"
  ON public.pipedream_accounts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own pipedream accounts"
  ON public.pipedream_accounts FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_pipedream_accounts_user_app
  ON public.pipedream_accounts (user_id, app_slug);

CREATE TRIGGER update_pipedream_accounts_updated_at
  BEFORE UPDATE ON public.pipedream_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();