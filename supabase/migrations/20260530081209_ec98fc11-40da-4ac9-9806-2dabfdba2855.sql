
GRANT UPDATE (converted_user_id, converted_at) ON public.referral_clicks TO authenticated;

CREATE POLICY "User marks their own conversion"
ON public.referral_clicks
FOR UPDATE
TO authenticated
USING (converted_user_id IS NULL)
WITH CHECK (converted_user_id = auth.uid());
