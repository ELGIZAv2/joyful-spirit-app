
-- =====================================================
-- fal_image_models
-- =====================================================
CREATE TABLE public.fal_image_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  display_name text NOT NULL,
  provider text NOT NULL,
  description text,
  thumbnail_url text,

  endpoint_text_to_image text,
  endpoint_image_to_image text,
  endpoint_multi_reference text,

  unit text NOT NULL DEFAULT 'image' CHECK (unit IN ('image','megapixel')),
  fal_unit_cost_usd numeric(10,5) NOT NULL DEFAULT 0,
  credits integer NOT NULL DEFAULT 1,

  supports_multi_image boolean NOT NULL DEFAULT false,
  max_input_images integer NOT NULL DEFAULT 1,

  supported_aspects jsonb NOT NULL DEFAULT '["1:1","3:2","2:3","16:9","9:16"]'::jsonb,
  supported_resolutions jsonb NOT NULL DEFAULT '["1K"]'::jsonb,
  default_aspect text NOT NULL DEFAULT '1:1',
  default_resolution text NOT NULL DEFAULT '1K',

  is_premium boolean NOT NULL DEFAULT false,
  is_new boolean NOT NULL DEFAULT false,
  is_featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 100,
  is_active boolean NOT NULL DEFAULT true,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.fal_image_models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fal_image_models_read_authenticated"
  ON public.fal_image_models FOR SELECT
  TO authenticated USING (is_active = true);

CREATE INDEX idx_fal_image_models_sort ON public.fal_image_models(is_active, sort_order);

CREATE TRIGGER trg_fal_image_models_updated_at
  BEFORE UPDATE ON public.fal_image_models
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- fal_video_models
-- =====================================================
CREATE TABLE public.fal_video_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  display_name text NOT NULL,
  provider text NOT NULL,
  description text,
  thumbnail_url text,

  endpoint_text_to_video text,
  endpoint_image_to_video text,
  endpoint_reference_to_video text,
  endpoint_start_end_frame text,

  unit text NOT NULL DEFAULT 'second' CHECK (unit IN ('second','video')),
  cost_per_second_usd numeric(10,5),
  cost_per_video_usd numeric(10,5),
  credits_per_second integer,
  credits_per_video integer,

  supports_multi_image boolean NOT NULL DEFAULT false,
  max_input_images integer NOT NULL DEFAULT 1,
  supports_start_end_frame boolean NOT NULL DEFAULT false,
  supports_audio boolean NOT NULL DEFAULT false,

  supported_aspects jsonb NOT NULL DEFAULT '["16:9","9:16","1:1"]'::jsonb,
  supported_resolutions jsonb NOT NULL DEFAULT '["720p"]'::jsonb,
  supported_durations jsonb NOT NULL DEFAULT '[5]'::jsonb,
  default_aspect text NOT NULL DEFAULT '16:9',
  default_resolution text NOT NULL DEFAULT '720p',
  default_duration integer NOT NULL DEFAULT 5,

  is_premium boolean NOT NULL DEFAULT false,
  is_new boolean NOT NULL DEFAULT false,
  is_featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 100,
  is_active boolean NOT NULL DEFAULT true,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.fal_video_models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fal_video_models_read_authenticated"
  ON public.fal_video_models FOR SELECT
  TO authenticated USING (is_active = true);

CREATE INDEX idx_fal_video_models_sort ON public.fal_video_models(is_active, sort_order);

CREATE TRIGGER trg_fal_video_models_updated_at
  BEFORE UPDATE ON public.fal_video_models
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
