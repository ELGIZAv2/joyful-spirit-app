UPDATE public.fal_video_models
SET supported_durations = '[4,6,8]'::jsonb,
    default_duration = 8
WHERE slug = 'ltx-2-3-pro';