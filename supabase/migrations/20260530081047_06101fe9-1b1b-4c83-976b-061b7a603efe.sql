
GRANT INSERT ON public.referral_clicks TO anon;
GRANT INSERT ON public.referral_clicks TO authenticated;

CREATE POLICY "Anyone can record a click"
ON public.referral_clicks
FOR INSERT
TO anon, authenticated
WITH CHECK (true);
