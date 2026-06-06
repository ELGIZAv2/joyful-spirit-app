create policy "Users can upload own book files"
on storage.objects for insert to authenticated
with check (bucket_id = 'books' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can update own book files"
on storage.objects for update to authenticated
using (bucket_id = 'books' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can delete own book files"
on storage.objects for delete to authenticated
using (bucket_id = 'books' and (storage.foldername(name))[1] = auth.uid()::text);