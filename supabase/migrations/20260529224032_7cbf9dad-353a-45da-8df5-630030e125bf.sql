
-- =========================================================
-- code_projects
-- =========================================================
CREATE TABLE public.code_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  name TEXT NOT NULL DEFAULT 'مشروع جديد',
  description TEXT,
  initial_prompt TEXT,
  template TEXT NOT NULL DEFAULT 'blank',
  entry_file TEXT NOT NULL DEFAULT 'src/App.tsx',
  accent_color TEXT DEFAULT '#ffffff',
  slug TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_code_projects_owner ON public.code_projects(owner_id, updated_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.code_projects TO authenticated;
GRANT ALL ON public.code_projects TO service_role;

ALTER TABLE public.code_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can view own projects"
  ON public.code_projects FOR SELECT TO authenticated
  USING (auth.uid() = owner_id);
CREATE POLICY "Owner can insert own projects"
  ON public.code_projects FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owner can update own projects"
  ON public.code_projects FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id);
CREATE POLICY "Owner can delete own projects"
  ON public.code_projects FOR DELETE TO authenticated
  USING (auth.uid() = owner_id);

-- =========================================================
-- code_project_files
-- =========================================================
CREATE TABLE public.code_project_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.code_projects(id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, path)
);

CREATE INDEX idx_code_files_project ON public.code_project_files(project_id, path);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.code_project_files TO authenticated;
GRANT ALL ON public.code_project_files TO service_role;

ALTER TABLE public.code_project_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can view files"
  ON public.code_project_files FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.code_projects p WHERE p.id = project_id AND p.owner_id = auth.uid()));
CREATE POLICY "Owner can insert files"
  ON public.code_project_files FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.code_projects p WHERE p.id = project_id AND p.owner_id = auth.uid()));
CREATE POLICY "Owner can update files"
  ON public.code_project_files FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.code_projects p WHERE p.id = project_id AND p.owner_id = auth.uid()));
CREATE POLICY "Owner can delete files"
  ON public.code_project_files FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.code_projects p WHERE p.id = project_id AND p.owner_id = auth.uid()));

-- =========================================================
-- code_messages
-- =========================================================
CREATE TABLE public.code_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.code_projects(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user','assistant','system','tool')),
  content TEXT,
  tool_calls JSONB,
  tool_results JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_code_messages_project ON public.code_messages(project_id, created_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.code_messages TO authenticated;
GRANT ALL ON public.code_messages TO service_role;

ALTER TABLE public.code_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can view messages"
  ON public.code_messages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.code_projects p WHERE p.id = project_id AND p.owner_id = auth.uid()));
CREATE POLICY "Owner can insert messages"
  ON public.code_messages FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.code_projects p WHERE p.id = project_id AND p.owner_id = auth.uid()));
CREATE POLICY "Owner can delete messages"
  ON public.code_messages FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.code_projects p WHERE p.id = project_id AND p.owner_id = auth.uid()));

-- =========================================================
-- code_publishes
-- =========================================================
CREATE TABLE public.code_publishes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.code_projects(id) ON DELETE CASCADE,
  version INT NOT NULL DEFAULT 1,
  public_url TEXT,
  bundle_path TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_code_publishes_project ON public.code_publishes(project_id, created_at DESC);

GRANT SELECT ON public.code_publishes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.code_publishes TO authenticated;
GRANT ALL ON public.code_publishes TO service_role;

ALTER TABLE public.code_publishes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view publishes"
  ON public.code_publishes FOR SELECT TO anon, authenticated
  USING (true);
CREATE POLICY "Owner can insert publishes"
  ON public.code_publishes FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.code_projects p WHERE p.id = project_id AND p.owner_id = auth.uid()));
CREATE POLICY "Owner can delete publishes"
  ON public.code_publishes FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.code_projects p WHERE p.id = project_id AND p.owner_id = auth.uid()));

-- =========================================================
-- updated_at triggers
-- =========================================================
CREATE OR REPLACE FUNCTION public.code_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_code_projects_updated
  BEFORE UPDATE ON public.code_projects
  FOR EACH ROW EXECUTE FUNCTION public.code_touch_updated_at();

CREATE TRIGGER trg_code_files_updated
  BEFORE UPDATE ON public.code_project_files
  FOR EACH ROW EXECUTE FUNCTION public.code_touch_updated_at();

-- =========================================================
-- Storage bucket for publishes (public)
-- =========================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('code-publishes', 'code-publishes', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read for code-publishes"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'code-publishes');

CREATE POLICY "Authenticated upload to code-publishes"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'code-publishes');

CREATE POLICY "Authenticated update own code-publishes"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'code-publishes' AND owner = auth.uid());

CREATE POLICY "Authenticated delete own code-publishes"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'code-publishes' AND owner = auth.uid());
