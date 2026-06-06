CREATE TABLE public.project_drafts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_id TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, project_id)
);

ALTER TABLE public.project_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own drafts" ON public.project_drafts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own drafts" ON public.project_drafts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own drafts" ON public.project_drafts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own drafts" ON public.project_drafts FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_project_drafts_user_project ON public.project_drafts(user_id, project_id);

CREATE TRIGGER update_project_drafts_updated_at
BEFORE UPDATE ON public.project_drafts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();