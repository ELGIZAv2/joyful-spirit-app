ALTER TABLE public.code_projects
  ADD COLUMN IF NOT EXISTS instructions TEXT;

CREATE TABLE IF NOT EXISTS public.code_project_deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.code_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  v0_deployment_id TEXT,
  v0_chat_id TEXT,
  v0_version_id TEXT,
  url TEXT,
  inspector_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.code_project_deployments TO authenticated;
GRANT ALL ON public.code_project_deployments TO service_role;

ALTER TABLE public.code_project_deployments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners read deployments"
  ON public.code_project_deployments FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "owners insert deployments"
  ON public.code_project_deployments FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "owners update deployments"
  ON public.code_project_deployments FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "owners delete deployments"
  ON public.code_project_deployments FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_code_deployments_project ON public.code_project_deployments(project_id, created_at DESC);

CREATE TRIGGER set_code_deployments_updated_at
  BEFORE UPDATE ON public.code_project_deployments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();