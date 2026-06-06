CREATE TABLE IF NOT EXISTS public.user_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  kind TEXT NOT NULL DEFAULT 'other',
  storage_key TEXT NOT NULL UNIQUE,
  public_url TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT,
  width INTEGER,
  height INTEGER,
  original_filename TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_assets_user ON public.user_assets(user_id);
CREATE INDEX IF NOT EXISTS idx_user_assets_kind ON public.user_assets(kind);
CREATE INDEX IF NOT EXISTS idx_user_assets_created ON public.user_assets(created_at DESC);

GRANT SELECT, DELETE ON public.user_assets TO authenticated;
GRANT ALL ON public.user_assets TO service_role;

ALTER TABLE public.user_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own assets" ON public.user_assets;
CREATE POLICY "Users view own assets"
ON public.user_assets FOR SELECT TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users delete own assets" ON public.user_assets;
CREATE POLICY "Users delete own assets"
ON public.user_assets FOR DELETE TO authenticated
USING (user_id = auth.uid());