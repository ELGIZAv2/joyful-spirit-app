ALTER TABLE public.code_projects 
  ADD COLUMN IF NOT EXISTS preview_url TEXT,
  ADD COLUMN IF NOT EXISTS published_url TEXT;