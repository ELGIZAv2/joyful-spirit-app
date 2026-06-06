CREATE TABLE public.megsy_code_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.megsy_code_skills TO authenticated;
GRANT ALL ON public.megsy_code_skills TO service_role;

ALTER TABLE public.megsy_code_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own select" ON public.megsy_code_skills FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own insert" ON public.megsy_code_skills FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own update" ON public.megsy_code_skills FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own delete" ON public.megsy_code_skills FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER trg_megsy_code_skills_updated BEFORE UPDATE ON public.megsy_code_skills
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_megsy_code_skills_user ON public.megsy_code_skills(user_id, sort_order);