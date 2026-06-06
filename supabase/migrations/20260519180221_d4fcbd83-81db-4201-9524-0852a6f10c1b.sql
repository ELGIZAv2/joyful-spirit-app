-- Lock down OAuth tokens and raw JWTs from client-side reads.
-- The columns remain readable by service_role (edge functions) but
-- are hidden from the `anon` and `authenticated` API roles.

-- 1) operator_runs.user_jwt — never expose raw user JWT to the client
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='operator_runs' AND column_name='user_jwt') THEN
    REVOKE SELECT (user_jwt) ON public.operator_runs FROM anon, authenticated;
  END IF;
END $$;

-- 2) calendar_connections OAuth tokens
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='calendar_connections' AND column_name='access_token') THEN
    REVOKE SELECT (access_token) ON public.calendar_connections FROM anon, authenticated;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='calendar_connections' AND column_name='refresh_token') THEN
    REVOKE SELECT (refresh_token) ON public.calendar_connections FROM anon, authenticated;
  END IF;
END $$;

-- 3) user_github_connections access_token
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='user_github_connections' AND column_name='access_token') THEN
    REVOKE SELECT (access_token) ON public.user_github_connections FROM anon, authenticated;
  END IF;
END $$;

-- 4) user_supabase_connections OAuth tokens
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='user_supabase_connections' AND column_name='access_token') THEN
    REVOKE SELECT (access_token) ON public.user_supabase_connections FROM anon, authenticated;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='user_supabase_connections' AND column_name='refresh_token') THEN
    REVOKE SELECT (refresh_token) ON public.user_supabase_connections FROM anon, authenticated;
  END IF;
END $$;

-- 5) project_custom_domains — hide infra identifiers from public routing reads
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='project_custom_domains' AND column_name='cloudflare_hostname_id') THEN
    REVOKE SELECT (cloudflare_hostname_id) ON public.project_custom_domains FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='project_custom_domains' AND column_name='verification_records') THEN
    REVOKE SELECT (verification_records) ON public.project_custom_domains FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='project_custom_domains' AND column_name='user_id') THEN
    REVOKE SELECT (user_id) ON public.project_custom_domains FROM anon;
  END IF;
END $$;
