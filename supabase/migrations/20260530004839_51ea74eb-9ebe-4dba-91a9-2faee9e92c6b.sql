ALTER TABLE public.megsy_code_skills DROP CONSTRAINT IF EXISTS megsy_code_skills_category_check;
ALTER TABLE public.megsy_code_skills ADD CONSTRAINT megsy_code_skills_category_check
  CHECK (category = ANY (ARRAY['templates','components','assets','design','skills','landing','backgrounds']));