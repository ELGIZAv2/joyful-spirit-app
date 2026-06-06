ALTER TABLE public.code_projects
  ADD COLUMN IF NOT EXISTS v0_project_id TEXT,
  ADD COLUMN IF NOT EXISTS v0_latest_version_id TEXT,
  ADD COLUMN IF NOT EXISTS model_tier TEXT NOT NULL DEFAULT 'smart';

CREATE INDEX IF NOT EXISTS idx_code_projects_v0_project_id ON public.code_projects(v0_project_id);