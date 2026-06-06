
-- Revoke EXECUTE from anon (and PUBLIC) on sensitive SECURITY DEFINER functions.
-- Authenticated users keep access; functions that need it still check auth.uid() internally.
-- Triggers (handle_new_user, on_new_profile_welcome, trigger_*, rls_auto_enable, tg_*, ws_task_completed_at,
-- workspace_add_owner_member, protect_profile_columns) don't need EXECUTE grants to fire.

REVOKE EXECUTE ON FUNCTION public.add_credits(uuid, numeric, text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.deduct_credits(uuid, numeric, text, text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.process_polar_order(text, uuid, text, text, numeric) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_notification(uuid, text, text, text, jsonb) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.mark_notifications_read(uuid, uuid[]) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_profile_safe(uuid, text, text, boolean) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.check_profile_update_safe_policy(public.profiles) FROM anon, PUBLIC;

REVOKE EXECUTE ON FUNCTION public.accept_conversation_invite(text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.bump_conversation(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_conversation_member(uuid, uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_invite_for_current_user(text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.owns_conversation(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.search_attachment_chunks(uuid, uuid, vector, integer) FROM anon, PUBLIC;

REVOKE EXECUTE ON FUNCTION public.create_workspace(text, text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.workspace_accept_invite(text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.workspace_apply_topup(uuid, numeric, numeric, text, uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.workspace_approve_request(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.workspace_archive(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.workspace_create_api_key(uuid, text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.workspace_create_invite(uuid, text, public.workspace_role) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.workspace_deduct_credits(uuid, numeric, text, text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.workspace_export_gdpr(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.workspace_log(uuid, text, text, text, jsonb) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.workspace_reject_request(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.workspace_revoke_api_key(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.workspace_role_of(uuid, uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.workspace_set_member_role(uuid, uuid, public.workspace_role) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.workspace_set_member_status(uuid, uuid, boolean, text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.workspace_transfer_ownership(uuid, uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.workspace_transfer_project(uuid, uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_workspace_admin(uuid, uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_workspace_member(uuid, uuid) FROM anon, PUBLIC;

REVOKE EXECUTE ON FUNCTION public.has_unlimited_plan(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_referrer_commission_rate(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_referral_tier(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.claim_promo_slot() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_research_reports() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cleanup_rate_limits() FROM anon, PUBLIC;

-- get_invite_details and get_today_promo_slots intentionally remain callable by anon
-- (public-facing invite preview + public promo widget).
