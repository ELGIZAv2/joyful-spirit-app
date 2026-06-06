
CREATE TABLE IF NOT EXISTS public.pipedream_tool_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  app_slug TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, app_slug)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pipedream_tool_settings TO authenticated;
GRANT ALL ON public.pipedream_tool_settings TO service_role;

ALTER TABLE public.pipedream_tool_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own_tool_settings" ON public.pipedream_tool_settings
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users_insert_own_tool_settings" ON public.pipedream_tool_settings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_update_own_tool_settings" ON public.pipedream_tool_settings
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users_delete_own_tool_settings" ON public.pipedream_tool_settings
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_pd_tool_settings_user ON public.pipedream_tool_settings(user_id);
