CREATE TABLE public.code_project_sandboxes (
  project_id uuid PRIMARY KEY REFERENCES public.code_projects(id) ON DELETE CASCADE,
  sandbox_id text NOT NULL,
  preview_url text,
  manager_url text,
  status text NOT NULL DEFAULT 'pending',
  last_error text,
  last_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.code_project_sandboxes TO authenticated;
GRANT ALL ON public.code_project_sandboxes TO service_role;

ALTER TABLE public.code_project_sandboxes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners read sandbox"
ON public.code_project_sandboxes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.code_projects p
    WHERE p.id = code_project_sandboxes.project_id
      AND p.owner_id = auth.uid()
  )
);

CREATE TRIGGER trg_code_project_sandboxes_updated_at
BEFORE UPDATE ON public.code_project_sandboxes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();