-- Wipe all gallery templates
DELETE FROM public.showcase_items;

-- Create public bucket for telegram-uploaded webp templates
INSERT INTO storage.buckets (id, name, public)
VALUES ('showcase-media', 'showcase-media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Public read
DROP POLICY IF EXISTS "showcase_media_public_read" ON storage.objects;
CREATE POLICY "showcase_media_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'showcase-media');