-- v0 API keys pool with per-key rate limiting (7 messages / 24h sliding window)
CREATE TABLE public.v0_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  api_key text NOT NULL UNIQUE,
  messages_used integer NOT NULL DEFAULT 0,
  message_limit integer NOT NULL DEFAULT 7,
  window_started_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  is_blocked boolean NOT NULL DEFAULT false,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- service_role only (managed entirely from edge functions)
GRANT ALL ON public.v0_api_keys TO service_role;

ALTER TABLE public.v0_api_keys ENABLE ROW LEVEL SECURITY;

-- No public/auth policies; only service_role accesses this table.

-- Atomically pick an available key, resetting windows older than 24h.
CREATE OR REPLACE FUNCTION public.pick_v0_key()
RETURNS TABLE(id uuid, api_key text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_key text;
BEGIN
  UPDATE public.v0_api_keys
    SET messages_used = 0, window_started_at = now()
    WHERE is_active
      AND NOT is_blocked
      AND window_started_at < now() - interval '24 hours';

  SELECT k.id, k.api_key INTO v_id, v_key
  FROM public.v0_api_keys k
  WHERE k.is_active
    AND NOT k.is_blocked
    AND k.messages_used < k.message_limit
  ORDER BY k.messages_used ASC, COALESCE(k.last_used_at, k.created_at) ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF v_id IS NULL THEN
    RETURN;
  END IF;

  UPDATE public.v0_api_keys
    SET messages_used = messages_used + 1,
        last_used_at = now()
    WHERE public.v0_api_keys.id = v_id;

  RETURN QUERY SELECT v_id, v_key;
END;
$$;

REVOKE ALL ON FUNCTION public.pick_v0_key() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.pick_v0_key() TO service_role;

-- Mark a key as blocked (e.g. 401/402/quota errors).
CREATE OR REPLACE FUNCTION public.block_v0_key(p_id uuid, p_reason text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.v0_api_keys
    SET is_blocked = true, last_error = p_reason
    WHERE id = p_id;
$$;

REVOKE ALL ON FUNCTION public.block_v0_key(uuid, text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.block_v0_key(uuid, text) TO service_role;

-- Seed the new key provided by the user.
INSERT INTO public.v0_api_keys (name, api_key)
VALUES ('v0-key-2', 'v1:rVRIJFTHs5gkeOaKQDLQbI6m:vcp_8lSNl1L6unsP5K7MvJBtGnO6RaYycNWar2wpIafmRD5E7zgTrN3A7UVV')
ON CONFLICT (api_key) DO NOTHING;