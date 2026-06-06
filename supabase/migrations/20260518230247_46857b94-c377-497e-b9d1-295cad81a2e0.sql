-- Unified background jobs table
CREATE TABLE IF NOT EXISTS public.background_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  conversation_id uuid,
  message_id text,
  kind text NOT NULL CHECK (kind IN ('chat','docs','slides','deep_research','code_build','image','video')),
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','running','needs_input','done','error','canceled')),
  phase text,
  progress int NOT NULL DEFAULT 0,
  status_text text,
  input jsonb NOT NULL DEFAULT '{}'::jsonb,
  output jsonb NOT NULL DEFAULT '{}'::jsonb,
  stream_text text NOT NULL DEFAULT '',
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  clarify jsonb,
  error text,
  tokens_used int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_heartbeat_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);

CREATE INDEX IF NOT EXISTS background_jobs_user_idx ON public.background_jobs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS background_jobs_conv_idx ON public.background_jobs (conversation_id) WHERE conversation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS background_jobs_status_idx ON public.background_jobs (status, last_heartbeat_at) WHERE status IN ('queued','running');

ALTER TABLE public.background_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own background jobs"
  ON public.background_jobs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users insert own background jobs"
  ON public.background_jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users update own background jobs"
  ON public.background_jobs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "users delete own background jobs"
  ON public.background_jobs FOR DELETE
  USING (auth.uid() = user_id);

-- updated_at trigger
CREATE TRIGGER bg_jobs_updated_at
  BEFORE UPDATE ON public.background_jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Realtime
ALTER TABLE public.background_jobs REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.background_jobs;