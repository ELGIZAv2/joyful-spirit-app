CREATE TABLE public.composio_auth_configs (
  app_slug TEXT PRIMARY KEY,
  auth_config_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT ALL ON public.composio_auth_configs TO service_role;

ALTER TABLE public.composio_auth_configs ENABLE ROW LEVEL SECURITY;

-- Only service_role can read/write (edge functions). No client access needed.
CREATE POLICY "service_role_only_select" ON public.composio_auth_configs FOR SELECT TO service_role USING (true);
CREATE POLICY "service_role_only_insert" ON public.composio_auth_configs FOR INSERT TO service_role WITH CHECK (true);

CREATE TABLE public.composio_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  app_slug TEXT NOT NULL,
  connected_account_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, app_slug)
);

GRANT SELECT ON public.composio_connections TO authenticated;
GRANT ALL ON public.composio_connections TO service_role;

ALTER TABLE public.composio_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_view_own_connections" ON public.composio_connections
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_composio_connections_user ON public.composio_connections(user_id);