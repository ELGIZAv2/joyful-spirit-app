-- Table to store master API keys for external sites
CREATE TABLE public.external_subscription_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  key_hash text NOT NULL UNIQUE,
  key_prefix text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  usage_count bigint NOT NULL DEFAULT 0,
  last_used_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.external_subscription_api_keys TO service_role;

ALTER TABLE public.external_subscription_api_keys ENABLE ROW LEVEL SECURITY;

-- No anon/authenticated policies — service_role only via edge function
CREATE POLICY "service_role_only_select"
  ON public.external_subscription_api_keys FOR SELECT
  TO service_role USING (true);

CREATE TRIGGER update_external_api_keys_updated_at
  BEFORE UPDATE ON public.external_subscription_api_keys
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Verify key by hash and return key id; bumps usage stats
CREATE OR REPLACE FUNCTION public.verify_external_api_key(p_key_hash text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  UPDATE public.external_subscription_api_keys
    SET usage_count = usage_count + 1,
        last_used_at = now()
    WHERE key_hash = p_key_hash AND is_active = true
    RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- Lookup subscription status by email or user_id
CREATE OR REPLACE FUNCTION public.get_user_subscription_status(
  p_email text DEFAULT NULL,
  p_user_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid;
  v_email text;
  v_plan text;
  v_sub record;
  v_status text;
  v_renews_at timestamptz;
BEGIN
  IF p_user_id IS NOT NULL THEN
    v_uid := p_user_id;
    SELECT email INTO v_email FROM auth.users WHERE id = v_uid;
  ELSIF p_email IS NOT NULL THEN
    SELECT id, email INTO v_uid, v_email FROM auth.users WHERE lower(email) = lower(trim(p_email)) LIMIT 1;
  ELSE
    RETURN jsonb_build_object('found', false, 'error', 'email_or_user_id_required');
  END IF;

  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('found', false, 'error', 'user_not_found');
  END IF;

  SELECT plan INTO v_plan FROM public.profiles WHERE id = v_uid;
  v_plan := COALESCE(v_plan, 'free');

  -- Most recent subscription record
  SELECT * INTO v_sub
    FROM public.subscriptions
    WHERE user_id = v_uid
    ORDER BY created_at DESC
    LIMIT 1;

  IF v_sub.id IS NOT NULL THEN
    v_renews_at := COALESCE(v_sub.current_period_end, v_sub.next_billing_date);
    IF v_sub.status IN ('active','trialing') AND (v_renews_at IS NULL OR v_renews_at > now()) THEN
      v_status := 'active';
    ELSE
      v_status := 'expired';
    END IF;
  ELSE
    v_status := CASE WHEN v_plan = 'free' THEN 'active' ELSE 'expired' END;
  END IF;

  RETURN jsonb_build_object(
    'found', true,
    'user_id', v_uid,
    'email', v_email,
    'plan', v_plan,
    'status', v_status,
    'renews_at', v_renews_at
  );
END;
$$;
