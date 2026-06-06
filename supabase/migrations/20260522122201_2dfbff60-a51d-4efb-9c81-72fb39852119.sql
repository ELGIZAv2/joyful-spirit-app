-- 1. Make storage buckets private
UPDATE storage.buckets SET public = false WHERE id IN ('docs-uploads','operator-files');

-- 2. Replace public read policies with owner-folder policies
DROP POLICY IF EXISTS "docs_uploads_public_read" ON storage.objects;
DROP POLICY IF EXISTS "operator_files_public_read" ON storage.objects;

CREATE POLICY "docs_uploads_owner_read" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'docs-uploads' AND (storage.foldername(name))[1] = (auth.uid())::text);

CREATE POLICY "operator_files_owner_read" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'operator-files' AND (storage.foldername(name))[1] = (auth.uid())::text);

-- 3. Tighten memories table - require authenticated read
DROP POLICY IF EXISTS "Anyone can read memories" ON public.memories;
CREATE POLICY "Authenticated can read memories" ON public.memories
FOR SELECT TO authenticated USING (true);

-- 4. Restrict access to operator_runs.user_jwt column
REVOKE SELECT (user_jwt) ON public.operator_runs FROM anon, authenticated;
REVOKE UPDATE (user_jwt), INSERT (user_jwt) ON public.operator_runs FROM anon, authenticated;

-- 5. Exclude user_jwt from realtime broadcasts by re-publishing with column list
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='operator_runs') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.operator_runs';
  END IF;
  EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.operator_runs (id, user_id, goal, status, current_phase, project_id, published_url, result, metadata, error, last_tick_at, created_at, updated_at, mode, chat_response, browser_session_id, live_view_url)';
END $$;

-- 6. Realtime channel authorization - require authenticated subscriptions
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_can_receive" ON realtime.messages;
CREATE POLICY "authenticated_can_receive" ON realtime.messages
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_can_send" ON realtime.messages;
CREATE POLICY "authenticated_can_send" ON realtime.messages
FOR INSERT TO authenticated WITH CHECK (true);