ALTER TABLE public.research_jobs
  ADD COLUMN IF NOT EXISTS depth text NOT NULL DEFAULT 'medium';