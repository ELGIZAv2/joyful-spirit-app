CREATE OR REPLACE FUNCTION public.spend_credits_auto(
  p_user_id uuid,
  p_amount numeric,
  p_action_type text,
  p_description text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_ws uuid;
  v_member record;
  v_ws_row record;
  v_new_credits numeric;
  v_result jsonb;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'auth_required');
  END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_amount');
  END IF;

  SELECT active_workspace_id INTO v_ws
  FROM public.profiles
  WHERE id = p_user_id;

  IF v_ws IS NOT NULL THEN
    SELECT * INTO v_member FROM public.workspace_members
      WHERE workspace_id = v_ws AND user_id = p_user_id
      FOR UPDATE;

    IF v_member.id IS NOT NULL THEN
      -- reset monthly counter if new month
      IF date_trunc('month', now()) > date_trunc('month', v_member.monthly_period_start) THEN
        UPDATE public.workspace_members
          SET monthly_used = 0, monthly_period_start = date_trunc('month', now())
          WHERE id = v_member.id;
        v_member.monthly_used := 0;
      END IF;

      IF v_member.monthly_limit IS NOT NULL
         AND (v_member.monthly_used + p_amount) > v_member.monthly_limit THEN
        RETURN jsonb_build_object(
          'success', false,
          'error', 'monthly_limit_exceeded',
          'source', 'workspace',
          'limit', v_member.monthly_limit,
          'used', v_member.monthly_used
        );
      END IF;

      SELECT * INTO v_ws_row FROM public.workspaces WHERE id = v_ws FOR UPDATE;
      IF v_ws_row.credits < p_amount THEN
        RETURN jsonb_build_object(
          'success', false,
          'error', 'insufficient_workspace_credits',
          'source', 'workspace',
          'credits', v_ws_row.credits
        );
      END IF;

      v_new_credits := v_ws_row.credits - p_amount;
      UPDATE public.workspaces SET credits = v_new_credits, updated_at = now() WHERE id = v_ws;
      UPDATE public.workspace_members SET monthly_used = monthly_used + p_amount WHERE id = v_member.id;
      INSERT INTO public.workspace_usage (workspace_id, user_id, amount, action_type, description)
        VALUES (v_ws, p_user_id, p_amount, p_action_type, p_description);

      RETURN jsonb_build_object(
        'success', true,
        'source', 'workspace',
        'credits', v_new_credits,
        'monthly_used', v_member.monthly_used + p_amount
      );
    END IF;
  END IF;

  -- Fall back to personal credits
  v_result := public.deduct_credits(p_user_id, p_amount, p_action_type, p_description);
  RETURN COALESCE(v_result, '{}'::jsonb) || jsonb_build_object('source', 'personal');
END;
$$;

REVOKE ALL ON FUNCTION public.spend_credits_auto(uuid, numeric, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.spend_credits_auto(uuid, numeric, text, text) TO service_role;