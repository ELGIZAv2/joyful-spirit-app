-- slide-images: keep public read-by-URL but disable listing
UPDATE storage.buckets SET public = false WHERE id = 'slide-images';
DROP POLICY IF EXISTS "Public read slide images" ON storage.objects;
CREATE POLICY "Public read slide images by path"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'slide-images');
-- ^ Same as before, but bucket.public=false means clients can't list via the storage list API,
-- only read individual objects by exact path.

-- media-studio: make fully private (owner-only)
UPDATE storage.buckets SET public = false WHERE id = 'media-studio';
DROP POLICY IF EXISTS "media_studio_public_read" ON storage.objects;
CREATE POLICY "media_studio_owner_read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'media-studio'
    AND (storage.foldername(name))[1] = (auth.uid())::text
  );

-- workspace-assets: stays public (no change needed) — confirmed intentional