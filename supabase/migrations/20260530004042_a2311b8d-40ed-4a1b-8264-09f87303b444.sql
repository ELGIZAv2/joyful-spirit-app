-- ============================================================
-- Megsy PR programming pages backend
-- ============================================================

-- 1) projects (the main projects table the imported UI expects)
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL DEFAULT 'Untitled',
  description text,
  status text NOT NULL DEFAULT 'active',
  thumbnail_url text,
  preview_url text,
  published_url text,
  custom_domain text,
  workspace_id uuid,
  linked_supabase_project_ref text,
  linked_supabase_project_name text,
  github_repo text,
  visibility text NOT NULL DEFAULT 'private',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "projects_select_own" ON public.projects FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "projects_insert_own" ON public.projects FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "projects_update_own" ON public.projects FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "projects_delete_own" ON public.projects FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS projects_user_updated_idx ON public.projects (user_id, updated_at DESC);

CREATE TRIGGER projects_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) ai_project_files
CREATE TABLE IF NOT EXISTS public.ai_project_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  path text NOT NULL,
  content text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, path)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_project_files TO authenticated;
GRANT ALL ON public.ai_project_files TO service_role;

ALTER TABLE public.ai_project_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_project_files_own" ON public.ai_project_files FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid()));

CREATE INDEX IF NOT EXISTS ai_project_files_project_idx ON public.ai_project_files (project_id);

CREATE TRIGGER ai_project_files_updated_at BEFORE UPDATE ON public.ai_project_files
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) ai_project_messages
CREATE TABLE IF NOT EXISTS public.ai_project_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user','assistant','system','tool')),
  content text NOT NULL DEFAULT '',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_project_messages TO authenticated;
GRANT ALL ON public.ai_project_messages TO service_role;

ALTER TABLE public.ai_project_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_project_messages_own" ON public.ai_project_messages FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid()));

CREATE INDEX IF NOT EXISTS ai_project_messages_project_created_idx
  ON public.ai_project_messages (project_id, created_at);

-- 4) ai_project_snapshots (versions)
CREATE TABLE IF NOT EXISTS public.ai_project_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  label text,
  files jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_project_snapshots TO authenticated;
GRANT ALL ON public.ai_project_snapshots TO service_role;

ALTER TABLE public.ai_project_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_project_snapshots_own" ON public.ai_project_snapshots FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid()));

CREATE INDEX IF NOT EXISTS ai_project_snapshots_project_created_idx
  ON public.ai_project_snapshots (project_id, created_at DESC);

-- 5) security_memory (per project)
CREATE TABLE IF NOT EXISTS public.security_memory (
  project_id uuid PRIMARY KEY REFERENCES public.projects(id) ON DELETE CASCADE,
  content text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.security_memory TO authenticated;
GRANT ALL ON public.security_memory TO service_role;

ALTER TABLE public.security_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "security_memory_own" ON public.security_memory FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid()));

CREATE TRIGGER security_memory_updated_at BEFORE UPDATE ON public.security_memory
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();