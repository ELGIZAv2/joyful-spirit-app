ALTER TABLE public.api_keys DROP CONSTRAINT api_keys_service_check;
ALTER TABLE public.api_keys ADD CONSTRAINT api_keys_service_check CHECK (service = ANY (ARRAY['agentrouter','serper','wavespeed','deepgram','lemondata','hyperbrowser','leonardo']));
INSERT INTO public.api_keys (service, api_key, label, is_active) VALUES ('leonardo', '6951e842-5540-476d-a67c-7aee1f66f496', 'main', true);