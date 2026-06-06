
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_referral_conversion() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_admin_new_signup() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.on_new_profile_welcome() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.tg_marketing_set_updated_at() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.trigger_referral_notification() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.trigger_welcome_email() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.trigger_withdrawal_email() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.workspace_add_owner_member() FROM anon, PUBLIC;
