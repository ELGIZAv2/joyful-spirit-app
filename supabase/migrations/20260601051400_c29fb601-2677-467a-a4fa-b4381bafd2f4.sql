-- Unschedule any prior version, then schedule hourly
do $$
begin
  perform cron.unschedule('admin-hourly-stats');
exception when others then null;
end $$;

select cron.schedule(
  'admin-hourly-stats',
  '0 * * * *',
  $$
  select net.http_post(
    url:='https://ltgampdtawuefwwayncx.supabase.co/functions/v1/admin-hourly-stats',
    headers:='{"Content-Type": "application/json", "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0Z2FtcGR0YXd1ZWZ3d2F5bmN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3Njk5ODAsImV4cCI6MjA4ODM0NTk4MH0.5ZOzuxCrm-TO4zzRDJ68LrCLH3f0itiznUxhbEupvGg"}'::jsonb,
    body:=concat('{"triggered_at": "', now(), '"}')::jsonb
  );
  $$
);