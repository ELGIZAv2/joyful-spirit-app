-- Storage bucket for Plus AI generated PPTX presentations.
-- Public read so the PPTX URLs work in download links and Office Online preview iframe.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'presentations',
  'presentations',
  true,
  104857600, -- 100 MB
  ARRAY['application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Anyone can read (download / preview) presentations from this bucket.
CREATE POLICY "Public read presentations bucket"
ON storage.objects
FOR SELECT
USING (bucket_id = 'presentations');

-- Only the edge function (service role) writes here.
CREATE POLICY "Service role writes presentations bucket"
ON storage.objects
FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'presentations');