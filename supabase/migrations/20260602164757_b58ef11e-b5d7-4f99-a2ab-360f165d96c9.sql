-- Table to track anonymous (unauthenticated) chat usage
-- Each (ip_hash, fingerprint_hash) pair gets ONE free chat message
CREATE TABLE public.anonymous_chat_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_hash TEXT NOT NULL,
  fingerprint_hash TEXT NOT NULL,
  user_agent TEXT,
  used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (ip_hash, fingerprint_hash)
);

CREATE INDEX idx_anon_chat_usage_lookup ON public.anonymous_chat_usage(ip_hash, fingerprint_hash);

-- Only the service_role (edge function with admin key) can read/write this table.
-- No anon or authenticated access — this is internal abuse-prevention data.
GRANT ALL ON public.anonymous_chat_usage TO service_role;

ALTER TABLE public.anonymous_chat_usage ENABLE ROW LEVEL SECURITY;

-- No policies for anon/authenticated => no direct access from clients.
-- The edge function uses service_role and bypasses RLS.