-- 1. Dynamic agents spawned by the orchestrator (e.g. "Marketing Agent")
CREATE TABLE IF NOT EXISTS public.operator_dynamic_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  key TEXT NOT NULL, -- e.g. "marketing", "designer"
  label TEXT NOT NULL, -- display name e.g. "وكيل الماركتينج"
  color TEXT NOT NULL DEFAULT '#ec4899', -- hex color for AgentStar
  system_prompt TEXT NOT NULL,
  description TEXT,
  icon TEXT, -- optional lucide icon name
  spawned_from_run_id UUID,
  usage_count INTEGER NOT NULL DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, key)
);

ALTER TABLE public.operator_dynamic_agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own dynamic agents" ON public.operator_dynamic_agents
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own dynamic agents" ON public.operator_dynamic_agents
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own dynamic agents" ON public.operator_dynamic_agents
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own dynamic agents" ON public.operator_dynamic_agents
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_operator_dynamic_agents_user ON public.operator_dynamic_agents(user_id);

-- 2. Per-user Megsy Operator settings
CREATE TABLE IF NOT EXISTS public.operator_user_settings (
  user_id UUID PRIMARY KEY,
  ask_before_sensitive BOOLEAN NOT NULL DEFAULT true,
  ask_before_anything BOOLEAN NOT NULL DEFAULT false,
  allow_free_shell BOOLEAN NOT NULL DEFAULT false,
  allow_browser_automation BOOLEAN NOT NULL DEFAULT true,
  allow_dynamic_agents BOOLEAN NOT NULL DEFAULT true,
  max_parallel_agents INTEGER NOT NULL DEFAULT 3,
  budget_cap_cents INTEGER NOT NULL DEFAULT 500,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.operator_user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own operator settings" ON public.operator_user_settings
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own operator settings" ON public.operator_user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own operator settings" ON public.operator_user_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- 3. Audit log: every command/action the AI executes
CREATE TABLE IF NOT EXISTS public.operator_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  run_id UUID,
  agent TEXT NOT NULL, -- ceo, coo, cto, executor, or dynamic agent key
  action TEXT NOT NULL, -- tool_call, shell, browser_click, file_write...
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  result JSONB,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.operator_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own audit log" ON public.operator_audit_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE INDEX idx_operator_audit_user_created ON public.operator_audit_log(user_id, created_at DESC);
CREATE INDEX idx_operator_audit_run ON public.operator_audit_log(run_id);

-- 4. Long-term memory (simple key/value with importance — pgvector can be added later)
CREATE TABLE IF NOT EXISTS public.operator_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  fact TEXT NOT NULL,
  category TEXT, -- preference, experience, fact
  importance INTEGER NOT NULL DEFAULT 5,
  source_run_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_accessed_at TIMESTAMPTZ
);

ALTER TABLE public.operator_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own memory" ON public.operator_memory
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own memory" ON public.operator_memory
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own memory" ON public.operator_memory
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_operator_memory_user_importance ON public.operator_memory(user_id, importance DESC);

-- 5. Auto-update timestamp trigger for settings
CREATE OR REPLACE FUNCTION public.touch_operator_settings()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_operator_settings_touch ON public.operator_user_settings;
CREATE TRIGGER trg_operator_settings_touch
  BEFORE UPDATE ON public.operator_user_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_operator_settings();