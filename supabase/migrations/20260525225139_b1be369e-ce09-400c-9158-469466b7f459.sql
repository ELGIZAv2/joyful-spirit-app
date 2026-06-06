
-- 1) Extend api_keys with credit tracking
ALTER TABLE public.api_keys
  ADD COLUMN IF NOT EXISTS credit_used_usd numeric(10,4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS credit_limit_usd numeric(10,4) NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS provider_meta jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_api_keys_pool
  ON public.api_keys (service, is_active, is_blocked, last_used_at NULLS FIRST, credit_used_usd);

-- Make sure RLS is on and there are NO public policies
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT polname FROM pg_policy WHERE polrelid = 'public.api_keys'::regclass LOOP
    EXECUTE format('DROP POLICY %I ON public.api_keys', r.polname);
  END LOOP;
END$$;

-- 2) Bot pending input state
CREATE TABLE IF NOT EXISTS public.bot_admin_pending (
  telegram_chat_id bigint PRIMARY KEY,
  awaiting_service text NOT NULL CHECK (awaiting_service IN ('serper','firecrawl','leonardo')),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '10 minutes'),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.bot_admin_pending ENABLE ROW LEVEL SECURITY;

-- 3) pick_api_key
CREATE OR REPLACE FUNCTION public.pick_api_key(p_service text)
RETURNS TABLE(id uuid, api_key text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT k.id, k.api_key
  FROM public.api_keys k
  WHERE k.service = p_service
    AND k.is_active = true
    AND k.is_blocked = false
    AND k.credit_used_usd < k.credit_limit_usd
  ORDER BY k.last_used_at NULLS FIRST, k.credit_used_usd ASC
  LIMIT 1;
$$;

-- 4) record_api_key_usage
CREATE OR REPLACE FUNCTION public.record_api_key_usage(
  p_id uuid,
  p_cost_usd numeric DEFAULT 0,
  p_ok boolean DEFAULT true,
  p_error text DEFAULT NULL,
  p_status_code int DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  k record;
BEGIN
  SELECT * INTO k FROM public.api_keys WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN RETURN; END IF;

  UPDATE public.api_keys
  SET usage_count    = usage_count + 1,
      credit_used_usd = credit_used_usd + COALESCE(p_cost_usd, 0),
      last_used_at   = now(),
      error_count    = error_count + CASE WHEN p_ok THEN 0 ELSE 1 END,
      last_error_at  = CASE WHEN p_ok THEN last_error_at ELSE now() END,
      is_blocked     = CASE
                          WHEN credit_used_usd + COALESCE(p_cost_usd, 0) >= credit_limit_usd THEN true
                          WHEN p_status_code IN (401, 402, 403) THEN true
                          WHEN p_status_code = 429 AND COALESCE(p_error, '') ILIKE '%quota%' THEN true
                          ELSE is_blocked
                       END,
      block_reason   = CASE
                          WHEN credit_used_usd + COALESCE(p_cost_usd, 0) >= credit_limit_usd THEN 'credit_exhausted'
                          WHEN p_status_code IN (401, 402, 403) THEN 'auth_or_payment'
                          WHEN p_status_code = 429 AND COALESCE(p_error, '') ILIKE '%quota%' THEN 'quota_exhausted'
                          ELSE block_reason
                       END
  WHERE id = p_id;
END;
$$;

-- 5) admin_add_api_key: callable only via service role (edge functions)
CREATE OR REPLACE FUNCTION public.admin_add_api_key(
  p_service text,
  p_key text,
  p_label text DEFAULT NULL,
  p_credit_limit numeric DEFAULT 5
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id uuid;
BEGIN
  IF p_service NOT IN ('serper','firecrawl','leonardo') THEN
    RAISE EXCEPTION 'unsupported service: %', p_service;
  END IF;
  IF p_key IS NULL OR length(trim(p_key)) < 8 THEN
    RAISE EXCEPTION 'invalid key';
  END IF;

  INSERT INTO public.api_keys (service, api_key, label, is_active, is_blocked, credit_limit_usd)
  VALUES (p_service, trim(p_key), COALESCE(p_label, p_service || ' key'), true, false, COALESCE(p_credit_limit, 5))
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

-- 6) has_unlimited_plan: active subscription with amount >= $29
CREATE OR REPLACE FUNCTION public.has_unlimited_plan(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions s
    WHERE s.user_id = p_user_id
      AND s.status = 'active'
      AND COALESCE(s.amount_cents, 0) >= 2900
      AND (s.current_period_end IS NULL OR s.current_period_end > now())
  );
$$;

REVOKE ALL ON FUNCTION public.pick_api_key(text) FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.record_api_key_usage(uuid, numeric, boolean, text, int) FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_add_api_key(text, text, text, numeric) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_unlimited_plan(uuid) TO authenticated;
