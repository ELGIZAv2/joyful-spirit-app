
-- ============================================================
-- WORKSPACE SECURITY HARDENING — closes 7 critical/high vulns
-- ============================================================

-- 1) workspaces: protect credits/plan/owner_id from direct UPDATE.
--    Force credits=0 on INSERT (no self-granted free credits).
CREATE OR REPLACE FUNCTION public.protect_workspace_columns()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  -- service_role and superuser bypass (edge functions, RPCs)
  IF current_setting('role', true) = 'service_role'
     OR current_setting('request.jwt.claim.role', true) = 'service_role'
     OR current_user IN ('postgres','supabase_admin') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    -- Block any non-zero credit grant at creation
    NEW.credits := 0;
    -- Plan must be NULL on create; set via verified topup flow
    NEW.plan := NULL;
    NEW.archived_at := NULL;
    RETURN NEW;
  END IF;

  -- UPDATE: forbid changing critical columns from client
  IF NEW.credits IS DISTINCT FROM OLD.credits THEN
    RAISE EXCEPTION 'workspace.credits is read-only (use topup flow)';
  END IF;
  IF NEW.plan IS DISTINCT FROM OLD.plan THEN
    RAISE EXCEPTION 'workspace.plan is read-only (use billing flow)';
  END IF;
  IF NEW.owner_id IS DISTINCT FROM OLD.owner_id THEN
    RAISE EXCEPTION 'workspace.owner_id is read-only (use workspace_transfer_ownership)';
  END IF;
  IF NEW.id IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION 'workspace.id is immutable';
  END IF;
  IF NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'workspace.created_at is immutable';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_workspace_columns_trg ON public.workspaces;
CREATE TRIGGER protect_workspace_columns_trg
  BEFORE INSERT OR UPDATE ON public.workspaces
  FOR EACH ROW EXECUTE FUNCTION public.protect_workspace_columns();


-- 2) workspace_members: prevent direct role-escalation to owner & quota tampering.
CREATE OR REPLACE FUNCTION public.protect_workspace_member_columns()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF current_setting('role', true) = 'service_role'
     OR current_setting('request.jwt.claim.role', true) = 'service_role'
     OR current_user IN ('postgres','supabase_admin') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    -- Never let client insert an 'owner' row directly; owner is set by the
    -- workspace_add_owner_member trigger (SECURITY DEFINER) at workspace creation.
    IF NEW.role = 'owner' THEN
      RAISE EXCEPTION 'cannot assign owner role directly (use workspace_transfer_ownership)';
    END IF;
    -- Force monthly counters to safe defaults on insert
    NEW.monthly_used := 0;
    NEW.monthly_period_start := date_trunc('month', now());
    RETURN NEW;
  END IF;

  -- UPDATE
  IF NEW.workspace_id IS DISTINCT FROM OLD.workspace_id
     OR NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'workspace_members identity is immutable';
  END IF;
  -- Block direct promotion to owner; must go through workspace_transfer_ownership RPC
  IF NEW.role = 'owner' AND OLD.role <> 'owner' THEN
    RAISE EXCEPTION 'use workspace_transfer_ownership to assign owner role';
  END IF;
  -- Block monthly_used tampering from client (only deduct_credits RPC may change it)
  IF NEW.monthly_used IS DISTINCT FROM OLD.monthly_used THEN
    RAISE EXCEPTION 'workspace_members.monthly_used is read-only (use workspace_deduct_credits)';
  END IF;
  IF NEW.monthly_period_start IS DISTINCT FROM OLD.monthly_period_start THEN
    RAISE EXCEPTION 'workspace_members.monthly_period_start is read-only';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_workspace_member_columns_trg ON public.workspace_members;
CREATE TRIGGER protect_workspace_member_columns_trg
  BEFORE INSERT OR UPDATE ON public.workspace_members
  FOR EACH ROW EXECUTE FUNCTION public.protect_workspace_member_columns();


-- 3) Close workspace_apply_topup to clients — only service_role (Dodo webhook) may call it.
REVOKE EXECUTE ON FUNCTION public.workspace_apply_topup(uuid, numeric, numeric, text, uuid) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.workspace_apply_topup(uuid, numeric, numeric, text, uuid) TO service_role;


-- 4) workspace_accept_invite: require auth user email to match invite email.
CREATE OR REPLACE FUNCTION public.workspace_accept_invite(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_email text;
  v_invite record;
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'auth_required');
  END IF;

  SELECT lower(email) INTO v_email FROM auth.users WHERE id = v_user;

  SELECT * INTO v_invite FROM public.workspace_invites WHERE invite_token = p_token;
  IF v_invite.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_found');
  END IF;
  IF v_invite.status <> 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_used');
  END IF;
  IF v_invite.expires_at < now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'expired');
  END IF;
  -- Hardened: invite is bound to the email address it was sent to.
  IF lower(v_invite.invite_email) <> v_email THEN
    RETURN jsonb_build_object('success', false, 'error', 'email_mismatch');
  END IF;

  INSERT INTO public.workspace_members (workspace_id, user_id, role)
    VALUES (v_invite.workspace_id, v_user,
            CASE WHEN v_invite.role = 'owner' THEN 'admin'::workspace_role ELSE v_invite.role END)
    ON CONFLICT DO NOTHING;
  UPDATE public.workspace_invites
    SET status = 'accepted', accepted_by = v_user
    WHERE id = v_invite.id;

  PERFORM public.workspace_log(v_invite.workspace_id, 'invite_accepted', 'user', v_user::text, '{}'::jsonb);
  RETURN jsonb_build_object('success', true, 'workspace_id', v_invite.workspace_id);
END $$;


-- 5) workspace_usage: enforce user_id = auth.uid() on insert (no spoofing attribution).
DROP POLICY IF EXISTS "Server/members insert usage" ON public.workspace_usage;
CREATE POLICY "Members insert own usage"
  ON public.workspace_usage
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND public.is_workspace_member(workspace_id, auth.uid())
  );


-- 6) Performance + lookup-by-token (was a sequential scan)
CREATE INDEX IF NOT EXISTS idx_workspace_invites_token ON public.workspace_invites(invite_token);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON public.workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_usage_ws_created ON public.workspace_usage(workspace_id, created_at DESC);


-- 7) Tighten workspace_set_member_role — already blocks 'owner' assignment, also
--    block self-modification (admin can't change their own role to 'owner' via this path).
CREATE OR REPLACE FUNCTION public.workspace_set_member_role(p_ws uuid, p_user uuid, p_role workspace_role)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'auth_required');
  END IF;
  IF NOT public.is_workspace_admin(p_ws, v_uid) THEN
    RETURN jsonb_build_object('success', false, 'error', 'forbidden');
  END IF;
  IF p_role = 'owner' THEN
    RETURN jsonb_build_object('success', false, 'error', 'use_transfer_ownership');
  END IF;
  -- Can't change an existing owner's role (only transfer_ownership does)
  IF EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = p_ws AND user_id = p_user AND role = 'owner'
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'cannot_demote_owner');
  END IF;
  UPDATE public.workspace_members SET role = p_role
    WHERE workspace_id = p_ws AND user_id = p_user;
  PERFORM public.workspace_log(p_ws, 'role_changed', 'user', p_user::text,
    jsonb_build_object('role', p_role));
  RETURN jsonb_build_object('success', true);
END $$;
