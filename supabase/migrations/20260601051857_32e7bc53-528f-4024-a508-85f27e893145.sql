do $$
begin perform cron.unschedule('admin-hourly-stats'); exception when others then null; end $$;

select cron.schedule(
  'admin-hourly-stats',
  '0 * * * *',
  $$
  select net.http_post(
    url:='https://ltgampdtawuefwwayncx.supabase.co/functions/v1/telegram-webhook',
    headers:='{"Content-Type": "application/json", "X-Internal-Secret": "mgs_notify_7K9pQ2rV4nL8wX3cF6tY1bN5jH0aZ_v1", "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0Z2FtcGR0YXd1ZWZ3d2F5bmN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3Njk5ODAsImV4cCI6MjA4ODM0NTk4MH0.5ZOzuxCrm-TO4zzRDJ68LrCLH3f0itiznUxhbEupvGg"}'::jsonb,
    body:='{"action":"stats"}'::jsonb
  );
  $$
);