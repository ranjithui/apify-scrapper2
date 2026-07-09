-- =====================================================================
-- Row Level Security policies
-- Run AFTER schema.sql. These assume access via the service-role key on
-- the backend (which bypasses RLS) OR authenticated users via anon key.
-- =====================================================================

alter table public.users            enable row level security;
alter table public.projects         enable row level security;
alter table public.search_requests  enable row level security;
alter table public.jobs             enable row level security;
alter table public.leads            enable row level security;
alter table public.exports          enable row level security;

-- Helper: current user's role
create or replace function public.current_role()
returns user_role language sql stable as $$
  select role from public.users where id = auth.uid();
$$;

-- users: a user can read/update own row; admins read all
drop policy if exists users_self_read on public.users;
create policy users_self_read on public.users
  for select using (id = auth.uid() or public.current_role() = 'admin');

drop policy if exists users_self_update on public.users;
create policy users_self_update on public.users
  for update using (id = auth.uid() or public.current_role() = 'admin');

-- projects: owner or admin/manager
drop policy if exists projects_rw on public.projects;
create policy projects_rw on public.projects
  for all using (
    owner_id = auth.uid()
    or public.current_role() in ('admin', 'manager')
  ) with check (
    owner_id = auth.uid()
    or public.current_role() in ('admin', 'manager')
  );

-- search_requests / jobs / leads / exports: scoped to owned projects or elevated roles
drop policy if exists search_requests_rw on public.search_requests;
create policy search_requests_rw on public.search_requests
  for all using (
    user_id = auth.uid() or public.current_role() in ('admin','manager','operator')
  ) with check (
    user_id = auth.uid() or public.current_role() in ('admin','manager','operator')
  );

drop policy if exists jobs_read on public.jobs;
create policy jobs_read on public.jobs
  for select using (
    public.current_role() in ('admin','manager','operator','viewer')
  );

drop policy if exists leads_read on public.leads;
create policy leads_read on public.leads
  for select using (
    public.current_role() in ('admin','manager','operator','viewer')
  );

drop policy if exists exports_rw on public.exports;
create policy exports_rw on public.exports
  for all using (
    user_id = auth.uid() or public.current_role() in ('admin','manager')
  ) with check (
    user_id = auth.uid() or public.current_role() in ('admin','manager')
  );

-- NOTE: providers, adapters, actors, actor_mapping, settings are managed by
-- the backend via the service-role key and are not exposed to the anon key.
