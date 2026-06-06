
CREATE TABLE public.letta_user_agents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  letta_agent_id TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.letta_user_agents TO authenticated;
GRANT ALL ON public.letta_user_agents TO service_role;

ALTER TABLE public.letta_user_agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own letta agent" ON public.letta_user_agents
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own letta agent" ON public.letta_user_agents
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own letta agent" ON public.letta_user_agents
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own letta agent" ON public.letta_user_agents
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER trg_letta_user_agents_updated_at
  BEFORE UPDATE ON public.letta_user_agents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
