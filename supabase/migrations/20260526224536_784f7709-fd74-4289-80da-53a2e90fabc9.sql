DROP POLICY IF EXISTS "Authenticated users can view profile display info" ON public.profiles;
CREATE POLICY "Authenticated users can view profile display info"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);