
-- Track all E2B sandbox executions
CREATE TABLE public.e2b_executions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  conversation_id uuid,
  kind text NOT NULL CHECK (kind IN ('execute_code','generate_document','data_analysis')),
  language text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','running','succeeded','failed')),
  input jsonb NOT NULL DEFAULT '{}'::jsonb,
  stdout text,
  stderr text,
  result jsonb,
  files jsonb DEFAULT '[]'::jsonb,
  error text,
  duration_ms integer,
  credits_used numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.e2b_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own_executions" ON public.e2b_executions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_insert_own_executions" ON public.e2b_executions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_update_own_executions" ON public.e2b_executions
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "users_delete_own_executions" ON public.e2b_executions
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_e2b_exec_user_created ON public.e2b_executions(user_id, created_at DESC);
CREATE INDEX idx_e2b_exec_conv ON public.e2b_executions(conversation_id) WHERE conversation_id IS NOT NULL;

CREATE TRIGGER trg_e2b_exec_updated_at
  BEFORE UPDATE ON public.e2b_executions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for generated files
INSERT INTO storage.buckets (id, name, public)
VALUES ('generated-files', 'generated-files', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "users_read_own_generated_files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'generated-files'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
CREATE POLICY "users_upload_own_generated_files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'generated-files'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
CREATE POLICY "users_delete_own_generated_files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'generated-files'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
