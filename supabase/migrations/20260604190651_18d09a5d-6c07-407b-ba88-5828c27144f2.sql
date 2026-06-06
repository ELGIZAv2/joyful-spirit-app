
-- 1. Allow link-only invites: when invite_email is NULL, anyone signed in can accept.
--    When invite_email is set, enforce email match.
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
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'auth_required');
  END IF;

  SELECT id, workspace_id, invite_email, role, status, expires_at
    INTO v_invite
    FROM public.workspace_invites
    WHERE invite_token = p_token;

  IF v_invite.id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'not_found'); END IF;
  IF v_invite.status <> 'pending' THEN RETURN jsonb_build_object('success', false, 'error', 'already_used'); END IF;
  IF v_invite.expires_at IS NOT NULL AND v_invite.expires_at < now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'expired');
  END IF;

  -- If invite was addressed to a specific email, enforce it.
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

  RETURN jsonb_build_object('success', true, 'workspace_id', v_invite.workspace_id);
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.workspace_accept_invite(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.workspace_accept_invite(text) TO authenticated;

-- 2. Safe RPC for reading invite details by token (no token leak; SECURITY DEFINER).
CREATE OR REPLACE FUNCTION public.get_workspace_invite_details(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_invite record;
  v_ws record;
  v_inviter record;
BEGIN
  SELECT id, workspace_id, invited_by, invite_email, role, status, expires_at, created_at
    INTO v_invite
    FROM public.workspace_invites
    WHERE invite_token = p_token;

  IF v_invite.id IS NULL THEN
    RETURN jsonb_build_object('error', 'not_found');
  END IF;
  IF v_invite.status <> 'pending' THEN
    RETURN jsonb_build_object('error', 'already_used');
  END IF;
  IF v_invite.expires_at IS NOT NULL AND v_invite.expires_at < now() THEN
    RETURN jsonb_build_object('error', 'expired');
  END IF;

  SELECT id, name, avatar_url INTO v_ws FROM public.workspaces WHERE id = v_invite.workspace_id;
  SELECT display_name, avatar_url INTO v_inviter FROM public.profiles WHERE id = v_invite.invited_by;

  RETURN jsonb_build_object(
    'workspace_id', v_invite.workspace_id,
    'workspace_name', COALESCE(v_ws.name, 'Workspace'),
    'workspace_avatar', v_ws.avatar_url,
    'role', v_invite.role,
    'invite_email', v_invite.invite_email,
    'inviter_name', v_inviter.display_name,
    'inviter_avatar', v_inviter.avatar_url,
    'is_link_invite', (v_invite.invite_email IS NULL OR length(trim(v_invite.invite_email)) = 0)
  );
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.get_workspace_invite_details(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_workspace_invite_details(text) TO authenticated;

-- 3. Trigger to lock immutable invite columns (token, email, role, workspace_id, invited_by).
--    Only `status`, `accepted_by`, `accepted_at` may change after creation.
CREATE OR REPLACE FUNCTION public.protect_workspace_invite_columns()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF current_setting('role', true) = 'service_role'
     OR current_setting('request.jwt.claim.role', true) = 'service_role'
     OR current_user IN ('postgres', 'supabase_admin') THEN
    RETURN NEW;
  END IF;

  IF NEW.invite_token IS DISTINCT FROM OLD.invite_token THEN
    RAISE EXCEPTION 'Cannot modify invite_token';
  END IF;
  IF NEW.invite_email IS DISTINCT FROM OLD.invite_email THEN
    RAISE EXCEPTION 'Cannot modify invite_email';
  END IF;
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Cannot modify role';
  END IF;
  IF NEW.workspace_id IS DISTINCT FROM OLD.workspace_id THEN
    RAISE EXCEPTION 'Cannot modify workspace_id';
  END IF;
  IF NEW.invited_by IS DISTINCT FROM OLD.invited_by THEN
    RAISE EXCEPTION 'Cannot modify invited_by';
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS protect_workspace_invite_columns_trg ON public.workspace_invites;
CREATE TRIGGER protect_workspace_invite_columns_trg
  BEFORE UPDATE ON public.workspace_invites
  FOR EACH ROW EXECUTE FUNCTION public.protect_workspace_invite_columns();
