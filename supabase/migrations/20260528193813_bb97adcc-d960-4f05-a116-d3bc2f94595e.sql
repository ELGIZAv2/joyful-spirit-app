
-- ============= VIDEO MODELS =============
INSERT INTO public.fal_video_models
(slug, display_name, provider, description, api_version,
 endpoint_text_to_video, endpoint_image_to_video,
 unit, cost_per_second_usd, credits_per_second,
 supports_multi_image, max_input_images, supports_start_end_frame, supports_audio,
 supported_aspects, supported_resolutions, supported_durations,
 default_aspect, default_resolution, default_duration,
 is_premium, is_new, is_featured, sort_order, is_active)
VALUES
-- Veo 3 family
('veo-3', 'Veo 3', 'leonardo', 'Realistic, cinematic videos with superior quality and audio.', 'v1-i2v',
 NULL, 'VEO3', 'second', 0.40, 5,
 false, 1, false, true,
 '["16:9","9:16"]'::jsonb, '["720p","1080p"]'::jsonb, '[4,8]'::jsonb,
 '16:9', '1080p', 8, true, false, true, 11, true),

('veo-3-fast', 'Veo 3 Fast', 'leonardo', 'Quick video concepts and fast visualizations.', 'v1-i2v',
 NULL, 'VEO3_FAST', 'second', 0.25, 3,
 false, 1, false, true,
 '["16:9","9:16"]'::jsonb, '["720p"]'::jsonb, '[4,8]'::jsonb,
 '16:9', '720p', 4, false, false, true, 12, true),

('veo-3-1-fast', 'Veo 3.1 Fast', 'leonardo', 'Fast-turnaround Veo 3.1 video concepts.', 'v1-i2v',
 NULL, 'VEO3_1_FAST', 'second', 0.28, 4,
 false, 1, true, true,
 '["16:9","9:16","1:1"]'::jsonb, '["720p","1080p"]'::jsonb, '[4,8]'::jsonb,
 '16:9', '720p', 4, true, true, true, 9, true),

-- Kling family
('kling-2-6', 'Kling 2.6', 'leonardo', 'Superb visuals with natural voiceovers and sound effects.', 'v2',
 'kling-2.6', 'kling-2.6', 'second', 0.15, 2,
 false, 1, true, true,
 '["16:9","9:16","1:1"]'::jsonb, '["720p","1080p"]'::jsonb, '[5,10]'::jsonb,
 '16:9', '1080p', 5, false, true, true, 21, true),

('kling-o1', 'Kling O1', 'leonardo', 'Exceptional accuracy and multi-instruction prompt adherence.', 'v2',
 'kling-video-o-1', 'kling-video-o-1', 'second', 0.18, 3,
 false, 1, true, true,
 '["16:9","9:16","1:1"]'::jsonb, '["720p","1080p"]'::jsonb, '[5,10]'::jsonb,
 '16:9', '1080p', 5, false, true, false, 22, true),

('kling-o3-omni', 'Kling O3 Omni', 'leonardo', 'Longer videos with audio and image references.', 'v2',
 'kling-video-o-3', 'kling-video-o-3', 'second', 0.22, 4,
 false, 4, true, true,
 '["16:9","9:16","1:1"]'::jsonb, '["720p","1080p"]'::jsonb, '[5,10]'::jsonb,
 '16:9', '1080p', 5, true, true, true, 19, true),

('kling-2-5-turbo', 'Kling 2.5 Turbo', 'leonardo', 'Precise narrative and action control with start frames.', 'v1-i2v',
 NULL, 'Kling2_5', 'second', 0.12, 2,
 false, 1, false, false,
 '["16:9","9:16","1:1"]'::jsonb, '["720p","1080p"]'::jsonb, '[5,10]'::jsonb,
 '16:9', '720p', 5, false, false, false, 25, true),

('kling-2-1-pro', 'Kling 2.1 Pro', 'leonardo', 'Seamless transitions with start and end frame support.', 'v1-i2v',
 NULL, 'KLING2_1', 'second', 0.14, 2,
 false, 1, true, false,
 '["16:9","9:16","1:1"]'::jsonb, '["720p","1080p"]'::jsonb, '[5,10]'::jsonb,
 '16:9', '720p', 5, false, false, false, 28, true),

-- Seedance family
('seedance-1-0-pro', 'Seedance 1.0 Pro', 'leonardo', 'Precise motion & aesthetics, optimised for consistency.', 'v2',
 'seedance-1.0-pro', 'seedance-1.0-pro', 'second', 0.12, 2,
 false, 1, true, false,
 '["16:9","9:16","1:1"]'::jsonb, '["720p","1080p"]'::jsonb, '[4,8]'::jsonb,
 '16:9', '1080p', 4, false, false, false, 31, true),

('seedance-1-0-pro-fast', 'Seedance 1.0 Pro Fast', 'leonardo', 'Strong prompt following with rich details and stylistic range.', 'v2',
 'seedance-1.0-pro-fast', 'seedance-1.0-pro-fast', 'second', 0.08, 2,
 false, 1, true, false,
 '["16:9","9:16","1:1"]'::jsonb, '["720p","1080p"]'::jsonb, '[4,8]'::jsonb,
 '16:9', '720p', 4, false, false, false, 32, true),

-- LTX family
('ltx-2-pro', 'LTX-2 Pro', 'leonardo', 'Polished visuals with quick turnaround.', 'v2',
 'ltxv-2.0-pro', 'ltxv-2.0-pro', 'second', 0.09, 2,
 false, 1, false, true,
 '["16:9","9:16","1:1"]'::jsonb, '["480p","720p","1080p"]'::jsonb, '[4,6,8]'::jsonb,
 '16:9', '720p', 4, false, false, false, 41, true),

('ltx-2-fast', 'LTX-2 Fast', 'leonardo', 'Enhanced textures and motion realism at top speed.', 'v2',
 'ltxv-2.0-fast', 'ltxv-2.0-fast', 'second', 0.05, 1,
 false, 1, false, true,
 '["16:9","9:16","1:1"]'::jsonb, '["480p","720p"]'::jsonb, '[4,6,8]'::jsonb,
 '16:9', '480p', 4, false, false, false, 42, true),

('ltx-2-3-fast', 'LTX-2.3 Fast', 'leonardo', 'Faster generation with built-in audio for creative flexibility.', 'v2',
 'ltxv-2.3-fast', 'ltxv-2.3-fast', 'second', 0.07, 1,
 false, 1, true, true,
 '["16:9","9:16","1:1"]'::jsonb, '["480p","720p","1080p"]'::jsonb, '[4,8]'::jsonb,
 '16:9', '720p', 4, false, true, false, 38, true)
ON CONFLICT (slug) DO NOTHING;

-- ============= IMAGE MODELS =============
INSERT INTO public.fal_image_models
(slug, display_name, provider, description, api_version,
 endpoint_text_to_image, endpoint_image_to_image,
 unit, fal_unit_cost_usd, credits,
 supports_multi_image, max_input_images,
 supported_aspects, supported_resolutions,
 default_aspect, default_resolution,
 is_premium, is_new, is_featured, sort_order, is_active)
VALUES
('gpt-image-1-5', 'GPT Image-1.5', 'leonardo',
 'Superior editing control, image integrity and detail preservation.', 'v2',
 'gpt-image-1.5', 'gpt-image-1.5', 'image', 0.060, 2,
 true, 4,
 '["1:1","16:9","9:16","4:3","3:4"]'::jsonb, '["1K","2K"]'::jsonb,
 '1:1', '1K', true, false, true, 25, true),

('recraft-v4', 'Recraft V4', 'leonardo',
 'Polished, production-ready visuals with precise text rendering.', 'v2',
 'recraft-v4', 'recraft-v4', 'image', 0.040, 1,
 false, 1,
 '["1:1","16:9","9:16","4:3","3:4","3:2","2:3"]'::jsonb, '["1K","2K"]'::jsonb,
 '1:1', '1K', false, true, true, 35, true),

('recraft-v4-pro', 'Recraft V4 Pro', 'leonardo',
 'High-resolution output for production-ready visuals with precise text rendering.', 'v2',
 'recraft-v4-pro', 'recraft-v4-pro', 'image', 0.080, 3,
 false, 1,
 '["1:1","16:9","9:16","4:3","3:4","3:2","2:3"]'::jsonb, '["1K","2K","4K"]'::jsonb,
 '1:1', '2K', true, true, true, 36, true),

('seedream-4-0', 'Seedream 4.0', 'leonardo',
 'Ultra-high quality for consistent image generation and editing.', 'v2',
 'seedream-4.0', 'seedream-4.0', 'image', 0.020, 1,
 true, 4,
 '["1:1","16:9","9:16","4:3","3:4","3:2","2:3"]'::jsonb, '["1K","2K"]'::jsonb,
 '1:1', '1K', false, false, false, 55, true),

('nano-banana', 'Nano Banana', 'leonardo',
 'Smart, context-aware edits and consistent, high-quality visuals.', 'v2',
 'nano-banana', 'nano-banana', 'image', 0.010, 1,
 true, 4,
 '["1:1","16:9","9:16","4:3","3:4"]'::jsonb, '["1K"]'::jsonb,
 '1:1', '1K', false, false, false, 60, true),

('lucid-realism', 'Lucid Realism', 'leonardo',
 'Cinematic shots — ideal for pairing with video generation.', 'v1',
 '05ce0082-2d80-4a2d-8653-4d1c85e2418e', '05ce0082-2d80-4a2d-8653-4d1c85e2418e',
 'image', 0.010, 1,
 false, 1,
 '["1:1","16:9","9:16","4:3","3:4","3:2","2:3"]'::jsonb, '["1K","2K"]'::jsonb,
 '16:9', '1K', false, false, false, 75, true),

('flux-1-kontext', 'FLUX.1 Kontext', 'leonardo',
 'Precise, controllable image generation and editing.', 'v1',
 '28aeddf8-bd19-4803-80fc-79602d1a9989', '28aeddf8-bd19-4803-80fc-79602d1a9989',
 'image', 0.040, 1,
 false, 1,
 '["1:1","16:9","9:16","4:3","3:4"]'::jsonb, '["1K","2K"]'::jsonb,
 '1:1', '1K', false, false, false, 80, true),

('flux-schnell', 'FLUX Schnell', 'leonardo',
 'High-speed model for fast, quality outputs.', 'v1',
 '1dd50843-d653-4516-a8e3-f0238ee453ff', '1dd50843-d653-4516-a8e3-f0238ee453ff',
 'image', 0.003, 1,
 false, 1,
 '["1:1","16:9","9:16","4:3","3:4"]'::jsonb, '["1K"]'::jsonb,
 '1:1', '1K', false, false, false, 95, true),

('phoenix-0-9', 'Phoenix 0.9', 'leonardo',
 'Preview of the foundational Phoenix model.', 'v1',
 '6b645e3a-d64f-4341-a6d8-7a3690fbf042', '6b645e3a-d64f-4341-a6d8-7a3690fbf042',
 'image', 0.008, 1,
 false, 1,
 '["1:1","16:9","9:16","4:3","3:4"]'::jsonb, '["1K"]'::jsonb,
 '1:1', '1K', false, false, false, 110, true)
ON CONFLICT (slug) DO NOTHING;
