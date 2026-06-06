
-- 1) Clean up all image & video rows
DELETE FROM public.model_pricing WHERE kind IN ('image', 'video');

-- 2) Insert canonical IMAGE models (23)
INSERT INTO public.model_pricing (id, provider, kind, label, endpoint, unit, credits_per_unit, icon, badge, enabled, sort_order) VALUES
('flux2-klein-4b',                              'deapi', 'image', 'FLUX.2 Klein 4B',           'flux2-klein-4b',                              'image', 1,  '/model-logos/bfl.png',         'FREE',   true, 1),
('qwen-image-edit-plus',                        'deapi', 'image', 'Qwen Image Edit Plus',      'qwen-image-edit-plus',                        'image', 1,  '/model-logos/qwen.png',        'FREE',   true, 2),
('megsy-image',                                 'megsy', 'image', 'Megsy Image',               'fal-ai/nano-banana',                          'image', 4,  '/model-logos/megsy.png',       'FLAGSHIP', true, 3),
('fal-ai/nano-banana-2',                        'fal',   'image', 'Nano Banana 2',             'fal-ai/nano-banana-2',                        'image', 6,  '/model-logos/nano-banana.png', 'NEW',    true, 10),
('fal-ai/nano-banana-2/edit',                   'fal',   'image', 'Nano Banana 2 Edit',        'fal-ai/nano-banana-2/edit',                   'image', 6,  '/model-logos/nano-banana.png', 'EDIT',   true, 11),
('fal-ai/nano-banana',                          'fal',   'image', 'Nano Banana',               'fal-ai/nano-banana',                          'image', 4,  '/model-logos/nano-banana.png', 'EDIT',   true, 12),
('fal-ai/nano-banana/edit',                     'fal',   'image', 'Nano Banana Edit',          'fal-ai/nano-banana/edit',                     'image', 4,  '/model-logos/nano-banana.png', 'EDIT',   true, 13),
('fal-ai/flux-2/pro',                           'fal',   'image', 'FLUX.2 Pro',                'fal-ai/flux-2/pro',                           'image', 10, '/model-logos/bfl.png',         'TOP',    true, 20),
('fal-ai/flux-2/flex',                          'fal',   'image', 'FLUX.2 Flex',               'fal-ai/flux-2/flex',                          'image', 5,  '/model-logos/bfl.png',         'NEW',    true, 21),
('fal-ai/flux-pro/v1.1-ultra',                  'fal',   'image', 'FLUX Pro 1.1 Ultra',        'fal-ai/flux-pro/v1.1-ultra',                  'image', 8,  '/model-logos/bfl.png',         'PRO',    true, 22),
('fal-ai/flux-pro/kontext-max',                 'fal',   'image', 'FLUX Kontext Max',          'fal-ai/flux-pro/kontext-max',                 'image', 8,  '/model-logos/bfl.png',         'EDIT',   true, 23),
('fal-ai/flux-pro/kontext',                     'fal',   'image', 'FLUX Kontext',              'fal-ai/flux-pro/kontext',                     'image', 6,  '/model-logos/bfl.png',         'EDIT',   true, 24),
('fal-ai/flux/dev',                             'fal',   'image', 'FLUX.1 Dev',                'fal-ai/flux/dev',                             'image', 3,  '/model-logos/bfl.png',         'FAST',   true, 25),
('fal-ai/bytedance/seedream/v4/text-to-image',  'fal',   'image', 'Seedream 4.0',              'fal-ai/bytedance/seedream/v4/text-to-image',  'image', 5,  '/model-logos/bytedance.png',   'PHOTO',  true, 30),
('fal-ai/bytedance/seedream/v4/edit',           'fal',   'image', 'Seedream 4.0 Edit',         'fal-ai/bytedance/seedream/v4/edit',           'image', 5,  '/model-logos/bytedance.png',   'EDIT',   true, 31),
('fal-ai/imagen4/preview/ultra',                'fal',   'image', 'Imagen 4 Ultra',            'fal-ai/imagen4/preview/ultra',                'image', 8,  '/model-logos/google.png',      'TOP',    true, 32),
('fal-ai/gpt-image-1/text-to-image',            'fal',   'image', 'GPT Image 1',               'fal-ai/gpt-image-1/text-to-image',            'image', 7,  '/model-logos/openai.png',      'PRO',    true, 33),
('fal-ai/recraft-v3',                           'fal',   'image', 'Recraft V3',                'fal-ai/recraft-v3',                           'image', 5,  '/model-logos/recraft.png',     'DESIGN', true, 34),
('fal-ai/ideogram/v3',                          'fal',   'image', 'Ideogram V3',               'fal-ai/ideogram/v3',                          'image', 4,  '/model-logos/ideogram.png',    'TEXT',   true, 35),
('fal-ai/qwen-image',                           'fal',   'image', 'Qwen Image',                'fal-ai/qwen-image',                           'image', 3,  '/model-logos/qwen.png',        NULL,     true, 36),
('fal-ai/hidream-i1-full',                      'fal',   'image', 'HiDream I1 Full',           'fal-ai/hidream-i1-full',                      'image', 4,  '/model-logos/hidream.png',     NULL,     true, 37),
('fal-ai/luma-photon',                          'fal',   'image', 'Luma Photon',               'fal-ai/luma-photon',                          'image', 4,  '/model-logos/luma.png',        'FAST',   true, 38),
('fal-ai/stable-diffusion-v35-large',           'fal',   'image', 'Stable Diffusion 3.5 Large','fal-ai/stable-diffusion-v35-large',           'image', 3,  '/model-logos/stability.png',   'OPEN',   true, 39);

-- 3) Insert canonical VIDEO models (22 — includes deapi LTX free models + 20 fal.ai)
INSERT INTO public.model_pricing (id, provider, kind, label, endpoint, unit, credits_per_unit, icon, badge, enabled, sort_order) VALUES
('ltx-2-19b',                                          'deapi', 'video', 'LTX-2 19B Distilled FP8',     'ltx-2-19b',                                          'second', 1,  '/model-logos/lightricks.png',  'FREE',   true, 1),
('ltx-2.3-22b',                                        'deapi', 'video', 'LTX-2.3 22B Distilled INT8',  'ltx-2.3-22b',                                        'second', 1,  '/model-logos/lightricks.png',  'FREE',   true, 2),
('fal-ai/veo3',                                        'fal',   'video', 'Veo 3',                       'fal-ai/veo3',                                        'second', 40, '/model-logos/google.png',      'TOP',    true, 10),
('fal-ai/veo3/fast',                                   'fal',   'video', 'Veo 3 Fast',                  'fal-ai/veo3/fast',                                   'second', 20, '/model-logos/google.png',      'FAST',   true, 11),
('fal-ai/veo3/image-to-video',                         'fal',   'video', 'Veo 3 Image-to-Video',        'fal-ai/veo3/image-to-video',                         'second', 40, '/model-logos/google.png',      'IMG2VID',true, 12),
('fal-ai/kling-video/v2.5-turbo/pro/text-to-video',    'fal',   'video', 'Kling 2.5 Turbo Pro',         'fal-ai/kling-video/v2.5-turbo/pro/text-to-video',    'second', 25, '/model-logos/kling.png',       'NEW',    true, 20),
('fal-ai/kling-video/v2.5-turbo/pro/image-to-video',   'fal',   'video', 'Kling 2.5 Turbo Pro I2V',     'fal-ai/kling-video/v2.5-turbo/pro/image-to-video',   'second', 25, '/model-logos/kling.png',       'IMG2VID',true, 21),
('fal-ai/kling-video/v2.1/master/text-to-video',       'fal',   'video', 'Kling 2.1 Master',            'fal-ai/kling-video/v2.1/master/text-to-video',       'second', 30, '/model-logos/kling.png',       'MASTER', true, 22),
('fal-ai/kling-video/v2.1/master/image-to-video',      'fal',   'video', 'Kling 2.1 Master I2V',        'fal-ai/kling-video/v2.1/master/image-to-video',      'second', 30, '/model-logos/kling.png',       'IMG2VID',true, 23),
('fal-ai/bytedance/seedance/v1/pro/text-to-video',     'fal',   'video', 'Seedance 1.0 Pro',            'fal-ai/bytedance/seedance/v1/pro/text-to-video',     'second', 20, '/model-logos/bytedance.png',   'CINEMA', true, 30),
('fal-ai/bytedance/seedance/v1/pro/image-to-video',    'fal',   'video', 'Seedance 1.0 Pro I2V',        'fal-ai/bytedance/seedance/v1/pro/image-to-video',    'second', 20, '/model-logos/bytedance.png',   'IMG2VID',true, 31),
('fal-ai/minimax/hailuo-02/pro/text-to-video',         'fal',   'video', 'MiniMax Hailuo 02 Pro',       'fal-ai/minimax/hailuo-02/pro/text-to-video',         'second', 18, '/model-logos/minimax.png',     '1080P',  true, 40),
('fal-ai/minimax/hailuo-02/pro/image-to-video',        'fal',   'video', 'Hailuo 02 Pro I2V',           'fal-ai/minimax/hailuo-02/pro/image-to-video',        'second', 18, '/model-logos/minimax.png',     'IMG2VID',true, 41),
('fal-ai/wan/v2.5/text-to-video',                      'fal',   'video', 'Wan 2.5',                     'fal-ai/wan/v2.5/text-to-video',                      'second', 10, '/model-logos/qwen.png',        'NEW',    true, 50),
('fal-ai/wan/v2.5/image-to-video',                     'fal',   'video', 'Wan 2.5 I2V',                 'fal-ai/wan/v2.5/image-to-video',                     'second', 10, '/model-logos/qwen.png',        'IMG2VID',true, 51),
('fal-ai/luma-dream-machine/ray-2',                    'fal',   'video', 'Luma Ray 2',                  'fal-ai/luma-dream-machine/ray-2',                    'second', 22, '/model-logos/luma.png',        'PHOTO',  true, 60),
('fal-ai/luma-dream-machine/ray-2-flash',              'fal',   'video', 'Luma Ray 2 Flash',            'fal-ai/luma-dream-machine/ray-2-flash',              'second', 12, '/model-logos/luma.png',        'FAST',   true, 61),
('fal-ai/pika/v2.2/text-to-video',                     'fal',   'video', 'Pika 2.2',                    'fal-ai/pika/v2.2/text-to-video',                     'second', 15, '/model-logos/pika.png',        'STYLIZED',true,70),
('fal-ai/pika/v2.2/image-to-video',                    'fal',   'video', 'Pika 2.2 I2V',                'fal-ai/pika/v2.2/image-to-video',                    'second', 15, '/model-logos/pika.png',        'IMG2VID',true, 71),
('fal-ai/runway-gen4/turbo/image-to-video',            'fal',   'video', 'Runway Gen-4 Turbo I2V',      'fal-ai/runway-gen4/turbo/image-to-video',            'second', 22, '/model-logos/runway.png',      'TURBO',  true, 80),
('fal-ai/ltx-video-2/text-to-video',                   'fal',   'video', 'LTX Video 2',                 'fal-ai/ltx-video-2/text-to-video',                   'second', 6,  '/model-logos/lightricks.png',  'OPEN',   true, 90),
('fal-ai/hunyuan-video',                               'fal',   'video', 'Hunyuan Video',               'fal-ai/hunyuan-video',                               'second', 14, '/model-logos/tencent.png',     'OPEN',   true, 91);
