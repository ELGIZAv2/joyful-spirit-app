
CREATE TABLE IF NOT EXISTS public.user_integrations (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email_enabled boolean NOT NULL DEFAULT false,
  email_address text,
  telegram_chat_id text,
  telegram_username text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_integrations TO authenticated;
GRANT ALL ON public.user_integrations TO service_role;

ALTER TABLE public.user_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own integrations"
  ON public.user_integrations FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "users insert own integrations"
  ON public.user_integrations FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "users update own integrations"
  ON public.user_integrations FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "users delete own integrations"
  ON public.user_integrations FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE TRIGGER trg_user_integrations_updated_at
  BEFORE UPDATE ON public.user_integrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
