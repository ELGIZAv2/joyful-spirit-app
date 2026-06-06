ALTER TABLE public.operator_runs
  ADD COLUMN IF NOT EXISTS mode text NOT NULL DEFAULT 'task',
  ADD COLUMN IF NOT EXISTS user_jwt text,
  ADD COLUMN IF NOT EXISTS chat_response text;