
-- Megsy Corn: autonomous multi-agent system tables

CREATE TABLE IF NOT EXISTS public.corn_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  conversation_id UUID,
  goal TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'planning',
  plan JSONB,
  approved_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.corn_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES public.corn_runs(id) ON DELETE CASCADE,
  agent_key TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  progress INT NOT NULL DEFAULT 0,
  current_task TEXT,
  result JSONB,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.corn_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES public.corn_runs(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES public.corn_agents(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_corn_runs_user ON public.corn_runs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_corn_agents_run ON public.corn_agents(run_id);
CREATE INDEX IF NOT EXISTS idx_corn_events_run ON public.corn_events(run_id, created_at);

ALTER TABLE public.corn_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corn_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corn_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users view own runs" ON public.corn_runs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users insert own runs" ON public.corn_runs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users update own runs" ON public.corn_runs
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "users delete own runs" ON public.corn_runs
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "users view agents of own runs" ON public.corn_agents
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.corn_runs r WHERE r.id = run_id AND r.user_id = auth.uid()));

CREATE POLICY "users view events of own runs" ON public.corn_events
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.corn_runs r WHERE r.id = run_id AND r.user_id = auth.uid()));

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.corn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_corn_runs_updated ON public.corn_runs;
CREATE TRIGGER trg_corn_runs_updated BEFORE UPDATE ON public.corn_runs
  FOR EACH ROW EXECUTE FUNCTION public.corn_set_updated_at();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.corn_runs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.corn_agents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.corn_events;
ALTER TABLE public.corn_runs REPLICA IDENTITY FULL;
ALTER TABLE public.corn_agents REPLICA IDENTITY FULL;
ALTER TABLE public.corn_events REPLICA IDENTITY FULL;
