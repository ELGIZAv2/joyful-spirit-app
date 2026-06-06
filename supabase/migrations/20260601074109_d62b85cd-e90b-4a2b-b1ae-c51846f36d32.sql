-- ============================================
-- Megsy Agents Platform
-- ============================================

-- 1) Catalog of agent presets (400+ agents)
CREATE TABLE public.agents_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  name_ar TEXT,
  description TEXT NOT NULL,
  description_ar TEXT,
  category TEXT NOT NULL,
  subcategory TEXT,
  icon TEXT NOT NULL DEFAULT 'Bot',
  color TEXT DEFAULT 'primary',
  model TEXT NOT NULL DEFAULT 'qwen-plus',
  system_prompt TEXT NOT NULL,
  default_tools JSONB NOT NULL DEFAULT '[]'::jsonb,
  capabilities JSONB NOT NULL DEFAULT '[]'::jsonb,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_premium BOOLEAN NOT NULL DEFAULT false,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  credits_per_message NUMERIC NOT NULL DEFAULT 1,
  install_count INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.agents_catalog TO anon;
GRANT SELECT ON public.agents_catalog TO authenticated;
GRANT ALL ON public.agents_catalog TO service_role;

ALTER TABLE public.agents_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agents_catalog_public_read"
ON public.agents_catalog FOR SELECT
USING (is_active = true);

CREATE INDEX idx_agents_catalog_category ON public.agents_catalog(category) WHERE is_active = true;
CREATE INDEX idx_agents_catalog_featured ON public.agents_catalog(is_featured) WHERE is_active = true;
CREATE INDEX idx_agents_catalog_tags ON public.agents_catalog USING GIN(tags);

CREATE TRIGGER update_agents_catalog_updated_at
BEFORE UPDATE ON public.agents_catalog
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Agent sessions
CREATE TABLE public.agent_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  agent_slug TEXT NOT NULL,
  title TEXT,
  sandbox_id TEXT,
  sandbox_status TEXT DEFAULT 'idle',
  status TEXT NOT NULL DEFAULT 'active',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_message_at TIMESTAMPTZ DEFAULT now(),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_sessions TO authenticated;
GRANT ALL ON public.agent_sessions TO service_role;

ALTER TABLE public.agent_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agent_sessions_owner_all"
ON public.agent_sessions FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_agent_sessions_user ON public.agent_sessions(user_id, last_message_at DESC);

CREATE TRIGGER update_agent_sessions_updated_at
BEFORE UPDATE ON public.agent_sessions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Agent messages
CREATE TABLE public.agent_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.agent_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL,
  content TEXT,
  tool_calls JSONB,
  tool_results JSONB,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_messages TO authenticated;
GRANT ALL ON public.agent_messages TO service_role;

ALTER TABLE public.agent_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agent_messages_owner_all"
ON public.agent_messages FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_agent_messages_session ON public.agent_messages(session_id, created_at);

-- 4) Agent squads
CREATE TABLE public.agent_squads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  agent_slugs TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  orchestrator_prompt TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_squads TO authenticated;
GRANT ALL ON public.agent_squads TO service_role;

ALTER TABLE public.agent_squads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agent_squads_owner_all"
ON public.agent_squads FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "agent_squads_public_read"
ON public.agent_squads FOR SELECT
TO authenticated
USING (is_public = true);

CREATE TRIGGER update_agent_squads_updated_at
BEFORE UPDATE ON public.agent_squads
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5) Agent artifacts (files produced by sandbox)
CREATE TABLE public.agent_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.agent_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT,
  storage_url TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_artifacts TO authenticated;
GRANT ALL ON public.agent_artifacts TO service_role;

ALTER TABLE public.agent_artifacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agent_artifacts_owner_all"
ON public.agent_artifacts FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_agent_artifacts_session ON public.agent_artifacts(session_id);

-- 6) User installed agents (quick launch)
CREATE TABLE public.user_installed_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  agent_slug TEXT NOT NULL,
  pinned BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  installed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, agent_slug)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_installed_agents TO authenticated;
GRANT ALL ON public.user_installed_agents TO service_role;

ALTER TABLE public.user_installed_agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_installed_agents_owner_all"
ON public.user_installed_agents FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 7) Storage bucket for agent artifacts
INSERT INTO storage.buckets (id, name, public)
VALUES ('agent-artifacts', 'agent-artifacts', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "agent_artifacts_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'agent-artifacts');

CREATE POLICY "agent_artifacts_user_upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'agent-artifacts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "agent_artifacts_user_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'agent-artifacts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "agent_artifacts_user_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'agent-artifacts' AND auth.uid()::text = (storage.foldername(name))[1]);