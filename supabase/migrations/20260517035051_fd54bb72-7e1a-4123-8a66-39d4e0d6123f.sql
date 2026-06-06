ALTER TABLE operator_runs ADD COLUMN IF NOT EXISTS browser_session_id text;
ALTER TABLE operator_runs ADD COLUMN IF NOT EXISTS live_view_url text;