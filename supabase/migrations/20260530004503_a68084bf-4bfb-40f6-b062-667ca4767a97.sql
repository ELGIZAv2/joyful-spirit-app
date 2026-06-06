ALTER TABLE public.background_jobs DROP CONSTRAINT IF EXISTS background_jobs_kind_check;
ALTER TABLE public.background_jobs ADD CONSTRAINT background_jobs_kind_check
  CHECK (kind = ANY (ARRAY['chat','docs','slides','deep_research','image','video','code_build']));