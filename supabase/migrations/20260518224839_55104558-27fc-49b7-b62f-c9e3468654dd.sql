insert into storage.buckets (id, name, public)
values ('docs-uploads', 'docs-uploads', true)
on conflict (id) do update set public = true;

create policy "docs_uploads_public_read"
on storage.objects for select
using (bucket_id = 'docs-uploads');

create policy "docs_uploads_user_insert"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'docs-uploads'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "docs_uploads_user_delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'docs-uploads'
  and (storage.foldername(name))[1] = auth.uid()::text
);