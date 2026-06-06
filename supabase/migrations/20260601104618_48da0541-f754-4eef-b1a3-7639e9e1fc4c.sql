
CREATE TABLE IF NOT EXISTS public.code_agent_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  user_id UUID NOT NULL,
  user_prompt TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'running',
  error TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.code_agent_runs TO authenticated;
GRANT ALL ON public.code_agent_runs TO service_role;

ALTER TABLE public.code_agent_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own runs" ON public.code_agent_runs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users insert own runs" ON public.code_agent_runs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.code_agent_events (
  id BIGSERIAL PRIMARY KEY,
  run_id UUID NOT NULL REFERENCES public.code_agent_runs(id) ON DELETE CASCADE,
  agent_name TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_code_agent_events_run ON public.code_agent_events(run_id, id);

GRANT SELECT ON public.code_agent_events TO authenticated;
GRANT ALL ON public.code_agent_events TO service_role;

ALTER TABLE public.code_agent_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read events of own runs" ON public.code_agent_events FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.code_agent_runs r WHERE r.id = run_id AND r.user_id = auth.uid()));

ALTER PUBLICATION supabase_realtime ADD TABLE public.code_agent_events;
ALTER TABLE public.code_agent_events REPLICA IDENTITY FULL;
