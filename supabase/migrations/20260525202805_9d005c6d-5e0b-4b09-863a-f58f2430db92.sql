ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS chat_greeted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS agents_onboarding_seen boolean NOT NULL DEFAULT false;

-- Allow users to update their own profile. Trigger protect_profile_columns
-- still blocks plan / credits / id / created_at mutations.
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);