ALTER TABLE public.showcase_items
  ADD COLUMN IF NOT EXISTS is_trending boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS trending_at timestamptz,
  ADD COLUMN IF NOT EXISTS thumbnail_url text,
  ADD COLUMN IF NOT EXISTS category text DEFAULT 'All';

CREATE INDEX IF NOT EXISTS idx_showcase_items_trending ON public.showcase_items (is_trending, trending_at DESC);
CREATE INDEX IF NOT EXISTS idx_showcase_items_category ON public.showcase_items (category);