ALTER TABLE public.megsy_code_skills
  ADD COLUMN category text NOT NULL DEFAULT 'skills'
  CHECK (category IN ('templates','components','assets','design','skills'));

CREATE INDEX idx_megsy_code_skills_category ON public.megsy_code_skills(user_id, category);