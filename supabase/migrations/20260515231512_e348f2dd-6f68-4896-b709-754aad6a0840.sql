
-- Create workspace-assets bucket for logos/covers/avatars uploaded by workspace admins
INSERT INTO storage.buckets (id, name, public)
VALUES ('workspace-assets', 'workspace-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Public read
CREATE POLICY "Workspace assets are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'workspace-assets');

-- Workspace admins/owners can upload to their workspace folder (folder name = workspace_id)
CREATE POLICY "Workspace admins can upload assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'workspace-assets'
  AND EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id::text = (storage.foldername(name))[1]
      AND wm.user_id = auth.uid()
      AND wm.role IN ('owner','admin')
  )
);

CREATE POLICY "Workspace admins can update assets"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'workspace-assets'
  AND EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id::text = (storage.foldername(name))[1]
      AND wm.user_id = auth.uid()
      AND wm.role IN ('owner','admin')
  )
);

CREATE POLICY "Workspace admins can delete assets"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'workspace-assets'
  AND EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id::text = (storage.foldername(name))[1]
      AND wm.user_id = auth.uid()
      AND wm.role IN ('owner','admin')
  )
);
