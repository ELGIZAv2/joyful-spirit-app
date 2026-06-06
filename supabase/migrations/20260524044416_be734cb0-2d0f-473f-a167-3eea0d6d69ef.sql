-- Tighten admin_error_log INSERT policy so users cannot spoof user_id
DROP POLICY IF EXISTS "Users insert own error log" ON public.admin_error_log;
DROP POLICY IF EXISTS "Authenticated insert error log" ON public.admin_error_log;
DROP POLICY IF EXISTS "authenticated insert error log" ON public.admin_error_log;

DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'admin_error_log' AND cmd = 'INSERT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.admin_error_log', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Users insert own error log"
ON public.admin_error_log
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- Tighten slide-images storage bucket: only allow uploads into a user's own folder
DROP POLICY IF EXISTS "Authenticated upload slide images" ON storage.objects;

CREATE POLICY "Authenticated upload slide images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'slide-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
