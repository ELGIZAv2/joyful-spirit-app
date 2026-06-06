
-- 1) Add workspace_id columns (nullable = "Personal mode")
ALTER TABLE public.skills
  ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE;

ALTER TABLE public.user_chat_settings
  ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE;

ALTER TABLE public.user_memory_entries
  ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE;

ALTER TABLE public.user_memory_profiles
  ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE;

ALTER TABLE public.notification_preferences
  ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- 2) Indexes for fast (user_id, workspace_id) filtering
CREATE INDEX IF NOT EXISTS idx_skills_user_ws ON public.skills(user_id, workspace_id);
CREATE INDEX IF NOT EXISTS idx_chat_settings_user_ws ON public.user_chat_settings(user_id, workspace_id);
CREATE INDEX IF NOT EXISTS idx_memory_entries_user_ws ON public.user_memory_entries(user_id, workspace_id);
CREATE INDEX IF NOT EXISTS idx_memory_profiles_user_ws ON public.user_memory_profiles(user_id, workspace_id);
CREATE INDEX IF NOT EXISTS idx_notif_prefs_user_ws ON public.notification_preferences(user_id, workspace_id);

-- 3) Drop unique-on-user-only constraints that would block per-workspace rows
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT c.conname, t.relname
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname IN ('user_chat_settings','notification_preferences','user_memory_profiles')
      AND c.contype = 'u'
  LOOP
    EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT IF EXISTS %I', r.relname, r.conname);
  END LOOP;
END $$;

-- 4) Composite uniqueness: one row per (user, workspace_or_personal)
CREATE UNIQUE INDEX IF NOT EXISTS uq_chat_settings_user_ws
  ON public.user_chat_settings(user_id, COALESCE(workspace_id, '00000000-0000-0000-0000-000000000000'::uuid));
CREATE UNIQUE INDEX IF NOT EXISTS uq_notif_prefs_user_ws
  ON public.notification_preferences(user_id, COALESCE(workspace_id, '00000000-0000-0000-0000-000000000000'::uuid));
CREATE UNIQUE INDEX IF NOT EXISTS uq_memory_profiles_user_ws
  ON public.user_memory_profiles(user_id, COALESCE(workspace_id, '00000000-0000-0000-0000-000000000000'::uuid));
