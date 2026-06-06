-- 1) Drop overly-permissive policies on public.messages
DROP POLICY IF EXISTS "authenticated_can_receive" ON public.messages;
DROP POLICY IF EXISTS "authenticated_can_send" ON public.messages;

-- 2) Ensure world-readable SELECT on memories is gone
DROP POLICY IF EXISTS "Authenticated can read memories" ON public.memories;

-- 3) Tighten admin_error_log INSERT to authenticated users only
DROP POLICY IF EXISTS "Anyone can report errors" ON public.admin_error_log;
CREATE POLICY "Authenticated users can report errors"
  ON public.admin_error_log
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);