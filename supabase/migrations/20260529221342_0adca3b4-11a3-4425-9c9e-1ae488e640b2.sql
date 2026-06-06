-- Drop programming-page tables (CASCADE removes policies, triggers, FKs)
DROP TABLE IF EXISTS public.ai_project_files CASCADE;
DROP TABLE IF EXISTS public.ai_project_messages CASCADE;
DROP TABLE IF EXISTS public.ai_project_snapshots CASCADE;
DROP TABLE IF EXISTS public.ai_project_usage CASCADE;
DROP TABLE IF EXISTS public.ai_project_versions CASCADE;
DROP TABLE IF EXISTS public.ai_inspiration_cache CASCADE;
DROP TABLE IF EXISTS public.build_templates CASCADE;
DROP TABLE IF EXISTS public.code_integrations CASCADE;
DROP TABLE IF EXISTS public.project_custom_domains CASCADE;
DROP TABLE IF EXISTS public.project_drafts CASCADE;
DROP TABLE IF EXISTS public.project_publish_settings CASCADE;
DROP TABLE IF EXISTS public.project_sandboxes CASCADE;
DROP TABLE IF EXISTS public.project_visits CASCADE;
DROP TABLE IF EXISTS public.agent_artifacts CASCADE;
DROP TABLE IF EXISTS public.agent_tool_calls CASCADE;
DROP TABLE IF EXISTS public.agent_steps CASCADE;
DROP TABLE IF EXISTS public.agent_runs CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;

-- Drop related functions
DROP FUNCTION IF EXISTS public.clone_build_template(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.match_project_files(uuid, vector, integer) CASCADE;
DROP FUNCTION IF EXISTS public.get_project_visit_count(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.tg_agent_runs_updated_at() CASCADE;

-- Remove code_build from background_jobs kind constraint
ALTER TABLE public.background_jobs DROP CONSTRAINT IF EXISTS background_jobs_kind_check;
DELETE FROM public.background_jobs WHERE kind = 'code_build';
ALTER TABLE public.background_jobs ADD CONSTRAINT background_jobs_kind_check
  CHECK (kind IN ('chat','docs','slides','deep_research','image','video'));