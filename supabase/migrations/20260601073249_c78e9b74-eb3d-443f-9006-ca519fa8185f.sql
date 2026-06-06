-- Allow public (anon) read access to active models so visitors can browse them
GRANT SELECT ON public.fal_image_models TO anon;
GRANT SELECT ON public.fal_video_models TO anon;
GRANT SELECT ON public.model_pricing TO anon;

CREATE POLICY "fal_image_models_read_anon"
ON public.fal_image_models
FOR SELECT
TO anon
USING (is_active = true);

CREATE POLICY "fal_video_models_read_anon"
ON public.fal_video_models
FOR SELECT
TO anon
USING (is_active = true);

CREATE POLICY "model_pricing_read_anon"
ON public.model_pricing
FOR SELECT
TO anon
USING (enabled = true);