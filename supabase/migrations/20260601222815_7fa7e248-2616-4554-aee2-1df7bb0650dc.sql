-- Reset v0-key-2 window (its 24h window has elapsed and v0 daily limit reset)
UPDATE public.v0_api_keys
SET messages_used = 0, window_started_at = now(), is_blocked = false, last_error = NULL
WHERE name = 'v0-key-2';

-- Block v0-key-env: v0 server still reports daily limit reached for this key
UPDATE public.v0_api_keys
SET is_blocked = true, last_error = 'v0 daily message limit reached (manual block)'
WHERE name = 'v0-key-env';