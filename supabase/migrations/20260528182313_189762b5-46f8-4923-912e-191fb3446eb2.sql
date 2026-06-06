UPDATE storage.buckets SET public = true WHERE id = 'media-studio';

CREATE POLICY "Public read media-studio"
ON storage.objects FOR SELECT
USING (bucket_id = 'media-studio');