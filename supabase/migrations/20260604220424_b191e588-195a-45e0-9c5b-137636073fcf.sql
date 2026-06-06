-- Update accept_invite to also notify the inviter
CREATE OR REPLACE FUNCTION public.workspace_accept_invite(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_invite record;
  v_uid uuid := auth.uid();
  v_email text;
  v_ws_name text;
  v_acceptor_name text;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'auth_required');
  END IF;

  SELECT id, workspace_id, invite_email, role, status, expires_at, invited_by
    INTO v_invite
    FROM public.workspace_invites
    WHERE invite_token = p_token;

  IF v_invite.id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'not_found'); END IF;
  IF v_invite.status <> 'pending' THEN RETURN jsonb_build_object('success', false, 'error', 'already_used'); END IF;
  IF v_invite.expires_at IS NOT NULL AND v_invite.expires_at < now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'expired');
  END IF;

  IF v_invite.invite_email IS NOT NULL AND length(trim(v_invite.invite_email)) > 0 THEN
    SELECT email INTO v_email FROM auth.users WHERE id = v_uid;
    IF v_email IS NULL OR lower(v_email) <> lower(v_invite.invite_email) THEN
      RETURN jsonb_build_object('success', false, 'error', 'email_mismatch');
    END IF;
  END IF;

  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (v_invite.workspace_id, v_uid, v_invite.role)
  ON CONFLICT (workspace_id, user_id) DO NOTHING;

  UPDATE public.workspace_invites
    SET status = 'accepted', accepted_by = v_uid, accepted_at = now()
    WHERE id = v_invite.id;

  -- Notify the inviter
  SELECT name INTO v_ws_name FROM public.workspaces WHERE id = v_invite.workspace_id;
  SELECT COALESCE(display_name, 'Someone') INTO v_acceptor_name FROM public.profiles WHERE id = v_uid;

  IF v_invite.invited_by IS NOT NULL AND v_invite.invited_by <> v_uid THEN
    INSERT INTO public.notifications (user_id, type, title, message, metadata)
    VALUES (
      v_invite.invited_by,
      'workspace_invite_accepted',
      'Invite accepted',
      v_acceptor_name || ' joined ' || COALESCE(v_ws_name, 'your workspace'),
      jsonb_build_object(
        'workspace_id', v_invite.workspace_id,
        'workspace_name', v_ws_name,
        'invite_id', v_invite.id,
        'accepted_by', v_uid,
        'accepted_by_name', v_acceptor_name
      )
    );
  END IF;

  -- Mark the original invite notification (if any) as read for the acceptor
  UPDATE public.notifications
    SET read = true
    WHERE user_id = v_uid
      AND type = 'workspace_invite'
      AND (metadata->>'invite_id')::uuid = v_invite.id;

  RETURN jsonb_build_object('success', true, 'workspace_id', v_invite.workspace_id);
END;
$function$;

-- New: decline_invite, callable by the invited user
CREATE OR REPLACE FUNCTION public.workspace_decline_invite(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_invite record;
  v_uid uuid := auth.uid();
  v_email text;
  v_ws_name text;
  v_decliner_name text;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'auth_required');
  END IF;

  SELECT id, workspace_id, invite_email, status, invited_by
    INTO v_invite
    FROM public.workspace_invites
    WHERE invite_token = p_token;

  IF v_invite.id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'not_found'); END IF;
  IF v_invite.status <> 'pending' THEN RETURN jsonb_build_object('success', false, 'error', 'already_used'); END IF;

  -- Only the addressed email can decline
  IF v_invite.invite_email IS NOT NULL AND length(trim(v_invite.invite_email)) > 0 THEN
    SELECT email INTO v_email FROM auth.users WHERE id = v_uid;
    IF v_email IS NULL OR lower(v_email) <> lower(v_invite.invite_email) THEN
      RETURN jsonb_build_object('success', false, 'error', 'email_mismatch');
    END IF;
  END IF;

  UPDATE public.workspace_invites
    SET status = 'declined'
    WHERE id = v_invite.id;

  SELECT name INTO v_ws_name FROM public.workspaces WHERE id = v_invite.workspace_id;
  SELECT COALESCE(display_name, 'A user') INTO v_decliner_name FROM public.profiles WHERE id = v_uid;

  IF v_invite.invited_by IS NOT NULL AND v_invite.invited_by <> v_uid THEN
    INSERT INTO public.notifications (user_id, type, title, message, metadata)
    VALUES (
      v_invite.invited_by,
      'workspace_invite_declined',
      'Invite declined',
      v_decliner_name || ' declined your invite to ' || COALESCE(v_ws_name, 'the workspace'),
      jsonb_build_object(
        'workspace_id', v_invite.workspace_id,
        'workspace_name', v_ws_name,
        'invite_id', v_invite.id,
        'declined_by', v_uid,
        'declined_by_name', v_decliner_name
      )
    );
  END IF;

  -- Mark the original invite notification as read for the decliner
  UPDATE public.notifications
    SET read = true
    WHERE user_id = v_uid
      AND type = 'workspace_invite'
      AND (metadata->>'invite_id')::uuid = v_invite.id;

  RETURN jsonb_build_object('success', true);
END;
$function$;

REVOKE ALL ON FUNCTION public.workspace_decline_invite(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.workspace_decline_invite(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.workspace_accept_invite(text) TO authenticated, service_role;