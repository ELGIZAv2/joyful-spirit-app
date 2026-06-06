
-- Drop broad SELECT policies on public buckets. Files remain reachable via the
-- public CDN URL (bucket.public=true), but listing via the storage API is denied.
DROP POLICY IF EXISTS "Public read access to avatars" ON storage.objects;
DROP POLICY IF EXISTS "Build assets public read" ON storage.objects;
DROP POLICY IF EXISTS "Public read for code-publishes" ON storage.objects;
DROP POLICY IF EXISTS "Public read media-studio" ON storage.objects;
DROP POLICY IF EXISTS "Public read model media" ON storage.objects;
DROP POLICY IF EXISTS "Public read presentations bucket" ON storage.objects;
DROP POLICY IF EXISTS "Public read published sites" ON storage.objects;
DROP POLICY IF EXISTS "Public read slide images by path" ON storage.objects;
DROP POLICY IF EXISTS "agent_artifacts_public_read" ON storage.objects;
DROP POLICY IF EXISTS "showcase_media_public_read" ON storage.objects;
DROP POLICY IF EXISTS "users_read_own_generated_files" ON storage.objects;
DROP POLICY IF EXISTS "Users read their own music" ON storage.objects;

-- Re-create the per-user scoped policies (these were correct, just role=public was wrong).
CREATE POLICY "Users read own generated files"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'generated-files' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Users read own music"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'user-music' AND (auth.uid())::text = (storage.foldername(name))[1]);
