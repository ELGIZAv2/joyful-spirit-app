
-- ========== media_assets ==========
CREATE TABLE IF NOT EXISTS public.media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid,
  kind text NOT NULL CHECK (kind IN ('image','video','audio')),
  provider text NOT NULL,
  model text NOT NULL,
  prompt text,
  storage_path text NOT NULL,
  public_url text NOT NULL,
  cost_credits numeric NOT NULL DEFAULT 0,
  duration_seconds integer,
  width integer,
  height integer,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS media_assets_user_created_idx
  ON public.media_assets(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS media_assets_kind_idx
  ON public.media_assets(user_id, kind, created_at DESC);

ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "media_assets_select_own"
  ON public.media_assets FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "media_assets_insert_own"
  ON public.media_assets FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "media_assets_delete_own"
  ON public.media_assets FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "media_assets_update_own"
  ON public.media_assets FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- ========== model_pricing ==========
CREATE TABLE IF NOT EXISTS public.model_pricing (
  id text PRIMARY KEY,
  provider text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('image','video','chat','audio')),
  label text NOT NULL,
  endpoint text NOT NULL,
  unit text NOT NULL,
  credits_per_unit numeric,
  in_price_per_m numeric,
  out_price_per_m numeric,
  icon text,
  badge text,
  enabled boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 100,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.model_pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "model_pricing_read_all_authenticated"
  ON public.model_pricing FOR SELECT TO authenticated
  USING (true);

-- بيانات الأسعار (1 credit = $0.10 — هامش 50%)
INSERT INTO public.model_pricing (id, provider, kind, label, endpoint, unit, credits_per_unit, icon, badge, sort_order, metadata) VALUES
  -- ===== Images: Fal =====
  ('fal/nano-banana-pro',     'fal', 'image', 'Nano Banana Pro',  'fal-ai/gemini-3-pro-image',     'image', 2,  '/model-logos/google.ico',     'NEW', 1,  '{"description":"Google Gemini 3 Pro Image - أعلى جودة"}'),
  ('fal/nano-banana',         'fal', 'image', 'Nano Banana',      'fal-ai/gemini-25-flash-image',  'image', 1,  '/model-logos/google.ico',     NULL,  2,  '{"description":"Gemini 2.5 Flash Image - سريع"}'),
  ('fal/flux-2-pro',          'fal', 'image', 'Flux 2 Pro',       'fal-ai/flux-2-pro',             'image', 1,  '/model-logos/bfl.png',        'PRO', 3,  '{"description":"FLUX.2 Pro - أعلى جودة"}'),
  ('fal/flux-2-flex',         'fal', 'image', 'Flux 2 Flex',      'fal-ai/flux-2-flex',            'image', 1,  '/model-logos/bfl.png',        NULL,  4,  '{}'),
  ('fal/flux-2-turbo',        'fal', 'image', 'Flux 2 Turbo',     'fal-ai/flux-2/turbo',           'image', 1,  '/model-logos/bfl.png',        'FAST',5,  '{}'),
  ('fal/flux-2-flash',        'fal', 'image', 'Flux 2 Flash',     'fal-ai/flux-2/flash',           'image', 1,  '/model-logos/bfl.png',        NULL,  6,  '{}'),
  ('fal/ideogram-v3',         'fal', 'image', 'Ideogram V3',      'fal-ai/ideogram/v3',            'image', 2,  '/model-logos/ideogram.png',   NULL,  7,  '{"description":"ممتاز للنصوص داخل الصور"}'),
  ('fal/recraft-v3',          'fal', 'image', 'Recraft V3',       'fal-ai/recraft-v3',             'image', 2,  '/model-logos/recraft.png',    NULL,  8,  '{"description":"رسومات وأيقونات SVG"}'),
  ('fal/seedream-4',          'fal', 'image', 'Seedream 4',       'fal-ai/bytedance/seedream/v4',  'image', 2,  '/model-logos/bytedance.ico',  'NEW', 9,  '{"description":"ByteDance Seedream 4"}'),

  -- ===== Images: Runware =====
  ('runware/gpt-image-2',     'runware','image','GPT Image 2',    'openai:gpt-image-2',            'image', 3,  '/model-logos/openai.svg',     'PRO',10, '{}'),
  ('runware/flux-dev',        'runware','image','FLUX Dev',       'runware:101@1',                 'image', 1,  '/model-logos/bfl.png',        NULL, 11, '{}'),
  ('runware/sd3-5-large',     'runware','image','SD 3.5 Large',   'civitai:1086025@1219804',       'image', 1,  '/model-logos/megsy.png',      NULL, 12, '{}'),

  -- ===== Videos =====
  ('fal/veo-3.1',             'fal', 'video', 'Veo 3.1 (with audio)',   'fal-ai/veo3.1',                'second', 6,  '/model-logos/google.ico',     'NEW', 1, '{"audio":true,"resolution":"1080p"}'),
  ('fal/veo-3.1-silent',      'fal', 'video', 'Veo 3.1 (silent)',       'fal-ai/veo3.1',                'second', 3,  '/model-logos/google.ico',     NULL,  2, '{"audio":false,"resolution":"1080p"}'),
  ('fal/veo-3.1-4k',          'fal', 'video', 'Veo 3.1 4K',             'fal-ai/veo3.1',                'second', 9,  '/model-logos/google.ico',     'PRO', 3, '{"audio":true,"resolution":"4k"}'),
  ('fal/kling-3.0-pro',       'fal', 'video', 'Kling 3.0 Pro',          'fal-ai/kling-video/v3/pro',    'second', 3,  '/model-logos/kling.png',      'PRO', 4, '{}'),
  ('fal/kling-3.0',           'fal', 'video', 'Kling 3.0',              'fal-ai/kling-video/v3/standard','second', 2,  '/model-logos/kling.png',      NULL,  5, '{}'),
  ('fal/seedance-pro',        'fal', 'video', 'Seedance Pro',           'fal-ai/bytedance/seedance/v1/pro', 'second', 2,  '/model-logos/bytedance.ico', 'NEW', 6, '{}'),
  ('fal/hunyuan-video',       'fal', 'video', 'Hunyuan Video',          'fal-ai/hunyuan-video',         'second', 1,  '/model-logos/megsy.png',      NULL,  7, '{}'),
  ('fal/wan-2.2',             'fal', 'video', 'Wan 2.2',                'fal-ai/wan/v2.2-5b/text-to-video','second', 2,  '/model-logos/megsy.png',     NULL,  8, '{}'),
  ('fal/luma-dream-machine',  'fal', 'video', 'Luma Dream Machine',     'fal-ai/luma-dream-machine',    'second', 3,  '/model-logos/luma.png',       NULL,  9, '{}'),
  ('fal/pika-2.2',            'fal', 'video', 'Pika 2.2',               'fal-ai/pika/v2.2/text-to-video','second', 2,  '/model-logos/pika.png',       NULL, 10, '{}'),

  -- ===== Chat / Code (V0 + OpenRouter) =====
  ('v0/v0-1.5-md',            'v0',        'chat', 'V0 Code (Medium)',    'v0-1.5-md',                 'token', NULL, '/model-logos/openai.svg', 'CODE', 1, '{"in_price_per_m":3,"out_price_per_m":15,"min_credits":0.5,"max_credits":8}'),
  ('v0/v0-1.5-lg',            'v0',        'chat', 'V0 Code (Large)',     'v0-1.5-lg',                 'token', NULL, '/model-logos/openai.svg', 'CODE', 2, '{"in_price_per_m":6,"out_price_per_m":30,"min_credits":0.5,"max_credits":8}'),
  ('openrouter/gemini-omni',  'openrouter','chat', 'Gemini Omni',         'google/gemini-omni',        'token', NULL, '/model-logos/google.ico', 'NEW',  3, '{"in_price_per_m":1.25,"out_price_per_m":5,"free":true}'),
  ('openrouter/gemini-3-pro', 'openrouter','chat', 'Gemini 3 Pro',        'google/gemini-3-pro',       'token', NULL, '/model-logos/google.ico', 'NEW',  4, '{"in_price_per_m":2,"out_price_per_m":12,"free":true}'),
  ('openrouter/gpt-5',        'openrouter','chat', 'GPT-5',               'openai/gpt-5',              'token', NULL, '/model-logos/openai.svg', NULL,   5, '{"in_price_per_m":1.25,"out_price_per_m":10,"free":true}'),
  ('openrouter/claude-opus-4','openrouter','chat', 'Claude Opus 4',       'anthropic/claude-opus-4',   'token', NULL, '/model-logos/megsy.png',  NULL,   6, '{"in_price_per_m":15,"out_price_per_m":75,"free":true}')
ON CONFLICT (id) DO UPDATE SET
  label = EXCLUDED.label,
  endpoint = EXCLUDED.endpoint,
  credits_per_unit = EXCLUDED.credits_per_unit,
  icon = EXCLUDED.icon,
  badge = EXCLUDED.badge,
  sort_order = EXCLUDED.sort_order,
  metadata = EXCLUDED.metadata,
  enabled = EXCLUDED.enabled;

-- ========== Storage bucket ==========
INSERT INTO storage.buckets (id, name, public)
  VALUES ('media-studio', 'media-studio', true)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "media_studio_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'media-studio');

CREATE POLICY "media_studio_user_upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'media-studio'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "media_studio_user_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'media-studio'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
