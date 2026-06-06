GRANT SELECT ON public.fal_image_models TO authenticated, anon;
GRANT SELECT ON public.fal_video_models TO authenticated, anon;
GRANT ALL ON public.fal_image_models TO service_role;
GRANT ALL ON public.fal_video_models TO service_role;