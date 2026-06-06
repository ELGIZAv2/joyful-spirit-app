ALTER TABLE public.research_jobs
  ADD COLUMN IF NOT EXISTS outline jsonb,
  ADD COLUMN IF NOT EXISTS report_sections jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS context_excerpts jsonb DEFAULT '[]'::jsonb;