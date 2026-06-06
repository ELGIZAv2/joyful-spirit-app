
-- Admin error log: captures all user-facing errors for admin review
CREATE TABLE IF NOT EXISTS public.admin_error_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NULL,
  user_email TEXT NULL,
  source TEXT NOT NULL,
  route TEXT NULL,
  message TEXT NOT NULL,
  raw_error TEXT NULL,
  context JSONB NULL DEFAULT '{}'::jsonb,
  user_agent TEXT NULL,
  notified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_error_log_created_at ON public.admin_error_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_error_log_user_id ON public.admin_error_log (user_id);

ALTER TABLE public.admin_error_log ENABLE ROW LEVEL SECURITY;

-- Anyone (incl. anon) can insert their own error report; service role bypasses RLS for the edge function.
DROP POLICY IF EXISTS "Anyone can report errors" ON public.admin_error_log;
CREATE POLICY "Anyone can report errors"
  ON public.admin_error_log
  FOR INSERT
  WITH CHECK (true);

-- Only admins can read. Reuses public.has_role(uuid, app_role) if it exists; otherwise locked down.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'has_role'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admins can read error log" ON public.admin_error_log';
    EXECUTE $p$CREATE POLICY "Admins can read error log"
      ON public.admin_error_log
      FOR SELECT
      USING (public.has_role(auth.uid(), 'admin'::public.app_role))$p$;
  END IF;
END $$;
