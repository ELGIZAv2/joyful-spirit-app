
-- 1) Rate limit buckets (sliding window per user per bucket)
CREATE TABLE IF NOT EXISTS public.rate_limit_buckets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  ip_hash TEXT,
  bucket TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL DEFAULT date_trunc('minute', now()),
  count INTEGER NOT NULL DEFAULT 0,
  hour_count INTEGER NOT NULL DEFAULT 0,
  hour_start TIMESTAMPTZ NOT NULL DEFAULT date_trunc('hour', now()),
  blocked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_rate_limit_user_bucket
  ON public.rate_limit_buckets(user_id, bucket) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_rate_limit_ip_bucket
  ON public.rate_limit_buckets(ip_hash, bucket) WHERE user_id IS NULL AND ip_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_rate_limit_cleanup ON public.rate_limit_buckets(updated_at);

ALTER TABLE public.rate_limit_buckets ENABLE ROW LEVEL SECURITY;

-- Only the service role can read/write (no public policies = deny all for clients).
-- This table is only touched by edge functions via SECURITY DEFINER RPC.

-- 2) check_rate_limit RPC
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_user_id UUID,
  p_ip_hash TEXT,
  p_bucket TEXT,
  p_per_minute INTEGER DEFAULT 30,
  p_per_hour INTEGER DEFAULT 500,
  p_block_seconds INTEGER DEFAULT 60
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.rate_limit_buckets;
  v_now TIMESTAMPTZ := now();
  v_min TIMESTAMPTZ := date_trunc('minute', v_now);
  v_hour TIMESTAMPTZ := date_trunc('hour', v_now);
BEGIN
  IF p_user_id IS NOT NULL THEN
    SELECT * INTO v_row FROM public.rate_limit_buckets
      WHERE user_id = p_user_id AND bucket = p_bucket FOR UPDATE;
  ELSIF p_ip_hash IS NOT NULL THEN
    SELECT * INTO v_row FROM public.rate_limit_buckets
      WHERE ip_hash = p_ip_hash AND user_id IS NULL AND bucket = p_bucket FOR UPDATE;
  ELSE
    RETURN jsonb_build_object('allowed', true);
  END IF;

  IF v_row.id IS NULL THEN
    INSERT INTO public.rate_limit_buckets(user_id, ip_hash, bucket, window_start, count, hour_start, hour_count)
    VALUES (p_user_id, p_ip_hash, p_bucket, v_min, 1, v_hour, 1);
    RETURN jsonb_build_object('allowed', true, 'remaining_minute', p_per_minute - 1);
  END IF;

  -- Currently blocked?
  IF v_row.blocked_until IS NOT NULL AND v_row.blocked_until > v_now THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'blocked',
      'retry_after', EXTRACT(EPOCH FROM (v_row.blocked_until - v_now))::int
    );
  END IF;

  -- Reset minute window
  IF v_row.window_start < v_min THEN
    v_row.window_start := v_min;
    v_row.count := 0;
  END IF;
  IF v_row.hour_start < v_hour THEN
    v_row.hour_start := v_hour;
    v_row.hour_count := 0;
  END IF;

  v_row.count := v_row.count + 1;
  v_row.hour_count := v_row.hour_count + 1;

  IF v_row.count > p_per_minute OR v_row.hour_count > p_per_hour THEN
    v_row.blocked_until := v_now + make_interval(secs => p_block_seconds);
    UPDATE public.rate_limit_buckets
      SET window_start = v_row.window_start, count = v_row.count,
          hour_start = v_row.hour_start, hour_count = v_row.hour_count,
          blocked_until = v_row.blocked_until, updated_at = v_now
      WHERE id = v_row.id;
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', CASE WHEN v_row.count > p_per_minute THEN 'minute_exceeded' ELSE 'hour_exceeded' END,
      'retry_after', p_block_seconds
    );
  END IF;

  UPDATE public.rate_limit_buckets
    SET window_start = v_row.window_start, count = v_row.count,
        hour_start = v_row.hour_start, hour_count = v_row.hour_count,
        blocked_until = NULL, updated_at = v_now
    WHERE id = v_row.id;

  RETURN jsonb_build_object(
    'allowed', true,
    'remaining_minute', p_per_minute - v_row.count,
    'remaining_hour', p_per_hour - v_row.hour_count
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.check_rate_limit(UUID, TEXT, TEXT, INTEGER, INTEGER, INTEGER) FROM PUBLIC, anon, authenticated;

-- 3) Cleanup
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  DELETE FROM public.rate_limit_buckets
    WHERE updated_at < now() - interval '24 hours'
      AND (blocked_until IS NULL OR blocked_until < now());
$$;

-- 4) user_preferences (replaces localStorage for app data)
CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id UUID PRIMARY KEY,
  ai_personalization JSONB NOT NULL DEFAULT '{}'::jsonb,
  notification_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  memory JSONB NOT NULL DEFAULT '[]'::jsonb,
  language TEXT,
  customization JSONB NOT NULL DEFAULT '{}'::jsonb,
  page_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  active_workspace_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_prefs_select_own" ON public.user_preferences
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "user_prefs_insert_own" ON public.user_preferences
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "user_prefs_update_own" ON public.user_preferences
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TRIGGER trg_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5) user_drafts (replaces localStorage project drafts)
CREATE TABLE IF NOT EXISTS public.user_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  draft_key TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, draft_key)
);

ALTER TABLE public.user_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_drafts_all_own" ON public.user_drafts
  FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TRIGGER trg_user_drafts_updated_at
  BEFORE UPDATE ON public.user_drafts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6) Index helps lookups
CREATE INDEX IF NOT EXISTS idx_user_drafts_user ON public.user_drafts(user_id, updated_at DESC);
