INSERT INTO storage.buckets (id, name, public) VALUES ('operator-files', 'operator-files', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "operator_files_public_read" ON storage.objects;
CREATE POLICY "operator_files_public_read" ON storage.objects FOR SELECT
USING (bucket_id = 'operator-files');

DROP POLICY IF EXISTS "operator_files_user_write" ON storage.objects;
CREATE POLICY "operator_files_user_write" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'operator-files' AND auth.uid()::text = (storage.foldername(name))[1]);