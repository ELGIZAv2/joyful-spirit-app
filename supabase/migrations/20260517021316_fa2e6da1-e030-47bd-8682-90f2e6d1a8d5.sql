
-- =========================================
-- Megsy Operator: multi-agent system tables
-- =========================================

CREATE TABLE public.operator_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  goal text NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- pending | running | paused | done | failed | needs_input
  current_phase text, -- ceo | coo | cto | executing | done
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  published_url text,
  result jsonb DEFAULT '{}'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb, -- {bb_session_id, model_budget, ...}
  error text,
  last_tick_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_operator_runs_user ON public.operator_runs(user_id, created_at DESC);
CREATE INDEX idx_operator_runs_status ON public.operator_runs(status) WHERE status IN ('running', 'pending', 'paused');

ALTER TABLE public.operator_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own runs" ON public.operator_runs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own runs" ON public.operator_runs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own runs" ON public.operator_runs
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own runs" ON public.operator_runs
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER trg_operator_runs_updated
  BEFORE UPDATE ON public.operator_runs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================

CREATE TABLE public.operator_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES public.operator_runs(id) ON DELETE CASCADE,
  step_no integer NOT NULL,
  agent text NOT NULL DEFAULT 'executor', -- ceo | coo | cto | executor
  title text NOT NULL,
  description text,
  tool text,
  tool_input jsonb DEFAULT '{}'::jsonb,
  tool_output jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending', -- pending | running | done | failed | skipped
  retries integer NOT NULL DEFAULT 0,
  error text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_operator_steps_run ON public.operator_steps(run_id, step_no);

ALTER TABLE public.operator_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own run steps" ON public.operator_steps
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.operator_runs r WHERE r.id = run_id AND r.user_id = auth.uid()));
CREATE POLICY "Users insert own run steps" ON public.operator_steps
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.operator_runs r WHERE r.id = run_id AND r.user_id = auth.uid()));
CREATE POLICY "Users update own run steps" ON public.operator_steps
  FOR UPDATE USING (EXISTS (SELECT 1 FROM public.operator_runs r WHERE r.id = run_id AND r.user_id = auth.uid()));

-- =========================================

CREATE TABLE public.operator_agent_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES public.operator_runs(id) ON DELETE CASCADE,
  agent text NOT NULL, -- ceo | coo | cto | executor | system
  role text NOT NULL DEFAULT 'assistant', -- system | assistant | tool | user
  content text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_operator_agent_msgs_run ON public.operator_agent_messages(run_id, created_at);

ALTER TABLE public.operator_agent_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own agent msgs" ON public.operator_agent_messages
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.operator_runs r WHERE r.id = run_id AND r.user_id = auth.uid()));
CREATE POLICY "Users insert own agent msgs" ON public.operator_agent_messages
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.operator_runs r WHERE r.id = run_id AND r.user_id = auth.uid()));

-- =========================================

CREATE TABLE public.operator_artifacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES public.operator_runs(id) ON DELETE CASCADE,
  step_id uuid REFERENCES public.operator_steps(id) ON DELETE SET NULL,
  kind text NOT NULL, -- screenshot | file | url | code | data | report
  url text,
  content text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_operator_artifacts_run ON public.operator_artifacts(run_id, created_at DESC);

ALTER TABLE public.operator_artifacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own artifacts" ON public.operator_artifacts
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.operator_runs r WHERE r.id = run_id AND r.user_id = auth.uid()));
CREATE POLICY "Users insert own artifacts" ON public.operator_artifacts
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.operator_runs r WHERE r.id = run_id AND r.user_id = auth.uid()));

-- =========================================
-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.operator_runs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.operator_steps;
ALTER PUBLICATION supabase_realtime ADD TABLE public.operator_agent_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.operator_artifacts;

ALTER TABLE public.operator_runs REPLICA IDENTITY FULL;
ALTER TABLE public.operator_steps REPLICA IDENTITY FULL;
ALTER TABLE public.operator_agent_messages REPLICA IDENTITY FULL;
ALTER TABLE public.operator_artifacts REPLICA IDENTITY FULL;
