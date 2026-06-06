-- Connector enable/disable state per user
CREATE TABLE IF NOT EXISTS public.user_connector_state (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connector_id text NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, connector_id)
);
ALTER TABLE public.user_connector_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ucs_own_select" ON public.user_connector_state FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "ucs_own_insert" ON public.user_connector_state FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ucs_own_update" ON public.user_connector_state FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ucs_own_delete" ON public.user_connector_state FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Per-message thumbs up/down feedback
CREATE TABLE IF NOT EXISTS public.message_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id text NOT NULL,
  message_id text NOT NULL,
  value text NOT NULL CHECK (value IN ('up','down')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, project_id, message_id)
);
ALTER TABLE public.message_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mf_own_select" ON public.message_feedback FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "mf_own_insert" ON public.message_feedback FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "mf_own_update" ON public.message_feedback FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "mf_own_delete" ON public.message_feedback FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_message_feedback_user_project ON public.message_feedback(user_id, project_id);