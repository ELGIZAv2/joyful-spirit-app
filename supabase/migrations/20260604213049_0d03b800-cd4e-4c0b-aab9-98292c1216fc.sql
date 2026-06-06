-- 1) Unified credit-spending RPC: auto-routes workspace vs personal
CREATE OR REPLACE FUNCTION public.spend_credits_auto(
  p_user_id uuid,
  p_amount numeric,
  p_action_type text,
  p_description text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ws uuid;
  v_is_member boolean := false;
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
    SELECT EXISTS(
      SELECT 1 FROM public.workspace_members
      WHERE workspace_id = v_ws AND user_id = p_user_id
    ) INTO v_is_member;
  END IF;

  IF v_ws IS NOT NULL AND v_is_member THEN
    v_result := public.workspace_deduct_credits(v_ws, p_amount, p_action_type, p_description);
    RETURN COALESCE(v_result, '{}'::jsonb) || jsonb_build_object('source', 'workspace');
  END IF;

  v_result := public.deduct_credits(p_user_id, p_amount, p_action_type, p_description);
  RETURN COALESCE(v_result, '{}'::jsonb) || jsonb_build_object('source', 'personal');
END;
$$;

GRANT EXECUTE ON FUNCTION public.spend_credits_auto(uuid, numeric, text, text) TO authenticated, service_role;

-- 2) Notify invitee in-app when they already have an account
CREATE OR REPLACE FUNCTION public.workspace_create_invite(
  p_workspace_id uuid,
  p_email text,
  p_role workspace_role DEFAULT 'member'::workspace_role
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_token text;
  v_id uuid;
  v_ws_name text;
  v_email text := lower(trim(p_email));
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'auth_required'); END IF;
  IF NOT public.is_workspace_admin(p_workspace_id, v_user) THEN
    RETURN jsonb_build_object('success', false, 'error', 'forbidden');
  END IF;

  INSERT INTO public.workspace_invites (workspace_id, invited_by, invite_email, role)
  VALUES (p_workspace_id, v_user, v_email, p_role)
  RETURNING id, invite_token INTO v_id, v_token;

  SELECT name INTO v_ws_name FROM public.workspaces WHERE id = p_workspace_id;

  -- In-app notification for existing users (no external email service required)
  INSERT INTO public.notifications (user_id, type, title, message, metadata)
  SELECT u.id,
         'workspace_invite',
         'Workspace invitation',
         COALESCE('You have been invited to join ' || v_ws_name, 'You have been invited to a workspace'),
         jsonb_build_object(
           'workspace_id', p_workspace_id,
           'workspace_name', v_ws_name,
           'invite_id', v_id,
           'invite_token', v_token,
           'invited_by', v_user,
           'role', p_role
         )
  FROM auth.users u
  WHERE lower(u.email) = v_email
  ON CONFLICT DO NOTHING;

  RETURN jsonb_build_object('success', true, 'invite_id', v_id, 'token', v_token);
END;
$$;