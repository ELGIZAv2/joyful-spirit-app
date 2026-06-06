
-- 1) Add deny-all (service-role-only) policies for tables with RLS enabled but no policies
CREATE POLICY "Service role manages api_keys" ON public.api_keys
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role manages github_oauth_states" ON public.github_oauth_states
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role manages bot_admin_pending" ON public.bot_admin_pending
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role manages rate_limit_buckets" ON public.rate_limit_buckets
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 2) Tighten pptx_jobs: replace public-insert policy with auth-scoped one
DROP POLICY IF EXISTS pptx_jobs_insert_all ON public.pptx_jobs;

CREATE POLICY "Users can insert their own pptx jobs" ON public.pptx_jobs
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
