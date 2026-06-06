-- IMAGE MODEL CREDITS (1 credit = $0.10 user-side)
UPDATE public.fal_image_models SET credits = 1 WHERE slug = 'nano-banana-2';
UPDATE public.fal_image_models SET credits = 2 WHERE slug = 'nano-banana-pro';
UPDATE public.fal_image_models SET credits = 2 WHERE slug = 'gpt-image-2';
UPDATE public.fal_image_models SET credits = 1 WHERE slug = 'seedream-4-5';
UPDATE public.fal_image_models SET credits = 2 WHERE slug = 'flux-2-pro';
UPDATE public.fal_image_models SET credits = 1 WHERE slug = 'flux-kontext-pro';
UPDATE public.fal_image_models SET credits = 1 WHERE slug = 'ideogram-3';
UPDATE public.fal_image_models SET credits = 1 WHERE slug = 'lucid-origin';
UPDATE public.fal_image_models SET credits = 1 WHERE slug = 'phoenix-1';
UPDATE public.fal_image_models SET credits = 1 WHERE slug = 'flux-dev';

-- VIDEO MODEL CREDITS PER SECOND
UPDATE public.fal_video_models SET credits_per_second = 5 WHERE slug = 'veo-3-1';
UPDATE public.fal_video_models SET credits_per_second = 2 WHERE slug = 'kling-3-0';
UPDATE public.fal_video_models SET credits_per_second = 2 WHERE slug = 'seedance-2-0';
UPDATE public.fal_video_models SET credits_per_second = 1 WHERE slug = 'seedance-2-0-fast';
UPDATE public.fal_video_models SET credits_per_second = 2 WHERE slug = 'hailuo-2-3';
UPDATE public.fal_video_models SET credits_per_second = 1 WHERE slug = 'ltx-2-3-pro';