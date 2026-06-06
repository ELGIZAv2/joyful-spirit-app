
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Trigger function: notify admin via Telegram when a profile is created (new signup)
CREATE OR REPLACE FUNCTION public.notify_admin_new_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email text;
BEGIN
  SELECT email INTO user_email FROM auth.users WHERE id = NEW.id;

  PERFORM net.http_post(
    url := 'https://ltgampdtawuefwwayncx.supabase.co/functions/v1/telegram-admin-notify',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Internal-Secret', 'mgs_notify_7K9pQ2rV4nL8wX3cF6tY1bN5jH0aZ_v1'
    ),
    body := jsonb_build_object(
      'action', 'signup',
      'user_id', NEW.id::text,
      'email', COALESCE(user_email, ''),
      'name', COALESCE(NEW.display_name, split_part(COALESCE(user_email, ''), '@', 1))
    )
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_new_profile_admin_telegram ON public.profiles;
CREATE TRIGGER on_new_profile_admin_telegram
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.notify_admin_new_signup();

-- Hourly stats cron
SELECT cron.unschedule('telegram-admin-hourly-stats')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'telegram-admin-hourly-stats');

SELECT cron.schedule(
  'telegram-admin-hourly-stats',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://ltgampdtawuefwwayncx.supabase.co/functions/v1/telegram-admin-notify',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Internal-Secret', 'mgs_notify_7K9pQ2rV4nL8wX3cF6tY1bN5jH0aZ_v1'
    ),
    body := jsonb_build_object('action', 'stats')
  );
  $$
);
