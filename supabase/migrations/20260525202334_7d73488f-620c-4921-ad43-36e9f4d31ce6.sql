-- Fix books bucket: remove public anon read access; keep only owner-read
DROP POLICY IF EXISTS "Public can read book files" ON storage.objects;
-- Mark bucket as private so listing is also blocked
UPDATE storage.buckets SET public = false WHERE id = 'books';