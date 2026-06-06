-- Background-job table for Deep Research (Phase 2)
CREATE TABLE public.research_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  conversation_id UUID,
  query TEXT NOT NULL,
  language TEXT,
  status TEXT NOT NULL DEFAULT 'queued', -- queued | planning | searching | synthesizing | succeeded | failed | cancelled
  progress INTEGER NOT NULL DEFAULT 0,   -- 0-100
  stage TEXT,                             -- human-readable stage label
  plan JSONB NOT NULL DEFAULT '[]'::jsonb,
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  sources JSONB NOT NULL DEFAULT '[]'::jsonb,
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  report TEXT,
  error TEXT,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX research_jobs_user_idx ON public.research_jobs(user_id, created_at DESC);
CREATE INDEX research_jobs_status_idx ON public.research_jobs(status) WHERE status IN ('queued','planning','searching','synthesizing');

ALTER TABLE public.research_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own research jobs"
ON public.research_jobs FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own research jobs"
ON public.research_jobs FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own research jobs"
ON public.research_jobs FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users delete own research jobs"
ON public.research_jobs FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER trg_research_jobs_updated_at
BEFORE UPDATE ON public.research_jobs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for live progress streaming to the client
ALTER PUBLICATION supabase_realtime ADD TABLE public.research_jobs;
ALTER TABLE public.research_jobs REPLICA IDENTITY FULL;