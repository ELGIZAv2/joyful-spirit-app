-- One sandbox per project (latest one wins)
create table if not exists public.project_sandboxes (
  project_id uuid primary key references public.projects(id) on delete cascade,
  sandbox_id text,
  dev_url text,
  status text not null default 'stopped' check (status in ('starting','running','stopped','error')),
  last_error text,
  last_sync_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.project_sandboxes enable row level security;

-- Owners (via projects.user_id) can fully manage their project's sandbox row
create policy "Owners can view their project sandbox"
  on public.project_sandboxes for select
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_sandboxes.project_id and p.user_id = auth.uid()
    )
  );

create policy "Owners can insert their project sandbox"
  on public.project_sandboxes for insert
  with check (
    exists (
      select 1 from public.projects p
      where p.id = project_sandboxes.project_id and p.user_id = auth.uid()
    )
  );

create policy "Owners can update their project sandbox"
  on public.project_sandboxes for update
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_sandboxes.project_id and p.user_id = auth.uid()
    )
  );

create policy "Owners can delete their project sandbox"
  on public.project_sandboxes for delete
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_sandboxes.project_id and p.user_id = auth.uid()
    )
  );

-- Bump updated_at
create trigger update_project_sandboxes_updated_at
  before update on public.project_sandboxes
  for each row execute function public.update_updated_at_column();

-- Enable realtime for live status updates on the Code page
alter publication supabase_realtime add table public.project_sandboxes;