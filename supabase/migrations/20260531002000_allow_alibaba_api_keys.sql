ALTER TABLE public.api_keys DROP CONSTRAINT IF EXISTS api_keys_service_check;

ALTER TABLE public.api_keys
  ADD CONSTRAINT api_keys_service_check
  CHECK (service = ANY (ARRAY[
    'agentrouter',
    'serper',
    'firecrawl',
    'wavespeed',
    'deepgram',
    'lemondata',
    'hyperbrowser',
    'leonardo',
    'openrouter',
    'open_router',
    'open router',
    'Open Router',
    'OPENROUTER',
    'alibaba',
    'dashscope',
    'qwen',
    'aliyun',
    'ali',
    'qwen-dashscope',
    'alibaba-qwen',
    'alibaba_cloud'
  ]));

CREATE OR REPLACE FUNCTION public.admin_add_api_key(
  p_service text,
  p_key text,
  p_label text DEFAULT NULL,
  p_credit_limit numeric DEFAULT 5
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id uuid;
BEGIN
  IF p_service NOT IN (
    'serper', 'firecrawl', 'leonardo',
    'openrouter', 'open_router', 'open router', 'Open Router', 'OPENROUTER',
    'alibaba', 'dashscope', 'qwen', 'aliyun', 'ali', 'qwen-dashscope', 'alibaba-qwen', 'alibaba_cloud'
  ) THEN
    RAISE EXCEPTION 'unsupported service: %', p_service;
  END IF;
  IF p_key IS NULL OR length(trim(p_key)) < 8 THEN
    RAISE EXCEPTION 'invalid key';
  END IF;

  INSERT INTO public.api_keys (service, api_key, label, is_active, is_blocked, credit_limit_usd)
  VALUES (p_service, trim(p_key), COALESCE(p_label, p_service || ' key'), true, false, COALESCE(p_credit_limit, 5))
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_add_api_key(text, text, text, numeric) FROM public, anon, authenticated;
