
-- 1. Extend code_agent_runs
ALTER TABLE public.code_agent_runs
  ADD COLUMN IF NOT EXISTS v0_chat_id text,
  ADD COLUMN IF NOT EXISTS table_name text NOT NULL DEFAULT 'code_projects',
  ADD COLUMN IF NOT EXISTS assistant_message_id uuid,
  ADD COLUMN IF NOT EXISTS last_poll_at timestamptz,
  ADD COLUMN IF NOT EXISTS preview_url text,
  ADD COLUMN IF NOT EXISTS v0_version_id text;

CREATE INDEX IF NOT EXISTS idx_code_agent_runs_status_chat
  ON public.code_agent_runs (status, v0_chat_id)
  WHERE status = 'running';

-- 2. Tasks table (v0 task list streamed/polled into UI)
CREATE TABLE IF NOT EXISTS public.code_v0_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES public.code_agent_runs(id) ON DELETE CASCADE,
  project_id uuid NOT NULL,
  external_id text,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  sequence int NOT NULL DEFAULT 0,
  detail text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (run_id, external_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.code_v0_tasks TO authenticated;
GRANT ALL ON public.code_v0_tasks TO service_role;

ALTER TABLE public.code_v0_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tasks for their runs"
ON public.code_v0_tasks FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.code_agent_runs r
  WHERE r.id = code_v0_tasks.run_id AND r.user_id = auth.uid()
));

CREATE INDEX IF NOT EXISTS idx_code_v0_tasks_run ON public.code_v0_tasks (run_id, sequence);
CREATE INDEX IF NOT EXISTS idx_code_v0_tasks_project ON public.code_v0_tasks (project_id, created_at DESC);

-- 3. Update trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_code_v0_tasks_updated ON public.code_v0_tasks;
CREATE TRIGGER trg_code_v0_tasks_updated
BEFORE UPDATE ON public.code_v0_tasks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Realtime
ALTER TABLE public.code_v0_tasks REPLICA IDENTITY FULL;
ALTER TABLE public.code_agent_runs REPLICA IDENTITY FULL;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.code_v0_tasks;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.code_agent_runs;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 5. Extensions for background polling
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
