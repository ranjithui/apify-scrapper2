-- =====================================================================
-- Lead Mining Platform — Supabase (PostgreSQL) schema
-- Phase 1 (MVP). Run this in the Supabase SQL editor.
-- Tables: users, projects, providers, adapters, actors, search_requests,
--         jobs, job_logs, leads, lead_duplicates, actor_health,
--         actor_mapping, exports, settings
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------
do $$ begin
  create type user_role as enum ('admin', 'manager', 'operator', 'viewer');
exception when duplicate_object then null; end $$;

do $$ begin
  create type actor_status as enum ('active', 'standby', 'disabled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type job_status as enum ('queued', 'running', 'completed', 'failed', 'retried');
exception when duplicate_object then null; end $$;

do $$ begin
  create type export_format as enum ('csv', 'excel', 'json', 'google_sheets', 'crm');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- users  (profile row mirrored from Supabase auth.users)
-- ---------------------------------------------------------------------
create table if not exists public.users (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text unique not null,
  full_name   text,
  role        user_role not null default 'viewer',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- projects
-- ---------------------------------------------------------------------
create table if not exists public.projects (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  owner_id    uuid not null references public.users (id) on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_projects_owner on public.projects (owner_id);

-- ---------------------------------------------------------------------
-- providers  (Apify, Playwright, Custom API, REST ...)
-- ---------------------------------------------------------------------
create table if not exists public.providers (
  id          uuid primary key default gen_random_uuid(),
  key         text unique not null,          -- 'apify', 'playwright', 'custom'
  name        text not null,
  type        text not null default 'scraper',
  enabled     boolean not null default true,
  config      jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- adapters  (implementation binding a provider to a source)
-- ---------------------------------------------------------------------
create table if not exists public.adapters (
  id          uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers (id) on delete cascade,
  source      text not null,                 -- 'apollo', 'linkedin', 'google_maps', 'website'
  name        text not null,
  enabled     boolean not null default true,
  created_at  timestamptz not null default now()
);
create index if not exists idx_adapters_provider on public.adapters (provider_id);

-- ---------------------------------------------------------------------
-- actors  (interchangeable Apify actors per source, with priority)
-- ---------------------------------------------------------------------
create table if not exists public.actors (
  id            uuid primary key default gen_random_uuid(),
  provider_id   uuid not null references public.providers (id) on delete cascade,
  source        text not null,                       -- 'apollo', 'linkedin' ...
  name          text not null,
  actor_ref     text not null,                       -- Apify actorId e.g. 'user/actor'
  priority      integer not null default 1,          -- 1 = highest
  status        actor_status not null default 'standby',
  input_schema  jsonb not null default '{}'::jsonb,  -- template for Input Mapper
  output_mapping jsonb not null default '{}'::jsonb, -- field map for Output Mapper
  default_input jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists idx_actors_source_priority on public.actors (source, priority);

-- ---------------------------------------------------------------------
-- actor_mapping  (named field maps reusable across actors)
-- ---------------------------------------------------------------------
create table if not exists public.actor_mapping (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid not null references public.actors (id) on delete cascade,
  direction   text not null check (direction in ('input', 'output')),
  mapping     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists idx_actor_mapping_actor on public.actor_mapping (actor_id);

-- ---------------------------------------------------------------------
-- search_requests  (a normalized search submitted by a user)
-- ---------------------------------------------------------------------
create table if not exists public.search_requests (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid references public.projects (id) on delete set null,
  user_id     uuid not null references public.users (id) on delete cascade,
  source      text not null,
  params      jsonb not null default '{}'::jsonb,   -- keyword, industry, country ...
  created_at  timestamptz not null default now()
);
create index if not exists idx_search_requests_project on public.search_requests (project_id);

-- ---------------------------------------------------------------------
-- jobs  (execution of a search request against an actor)
-- ---------------------------------------------------------------------
create table if not exists public.jobs (
  id                 uuid primary key default gen_random_uuid(),
  search_request_id  uuid not null references public.search_requests (id) on delete cascade,
  project_id         uuid references public.projects (id) on delete set null,
  provider_id        uuid references public.providers (id) on delete set null,
  actor_id           uuid references public.actors (id) on delete set null,
  status             job_status not null default 'queued',
  external_run_id    text,                              -- Apify run id
  attempts           integer not null default 0,
  leads_count        integer not null default 0,
  error              text,
  started_at         timestamptz,
  finished_at        timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index if not exists idx_jobs_status on public.jobs (status);
create index if not exists idx_jobs_project on public.jobs (project_id);

-- ---------------------------------------------------------------------
-- job_logs
-- ---------------------------------------------------------------------
create table if not exists public.job_logs (
  id          uuid primary key default gen_random_uuid(),
  job_id      uuid not null references public.jobs (id) on delete cascade,
  level       text not null default 'info',       -- info, warn, error
  message     text not null,
  meta        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists idx_job_logs_job on public.job_logs (job_id);

-- ---------------------------------------------------------------------
-- leads  (normalized lead schema)
-- ---------------------------------------------------------------------
create table if not exists public.leads (
  id             uuid primary key default gen_random_uuid(),
  project_id     uuid references public.projects (id) on delete set null,
  job_id         uuid references public.jobs (id) on delete set null,
  first_name     text,
  last_name      text,
  title          text,
  company        text,
  email          text,
  phone          text,
  website        text,
  linkedin       text,
  industry       text,
  country        text,
  employee_count text,
  revenue        text,
  source         text,
  provider       text,
  actor          text,
  confidence_score numeric(4,3) not null default 0.5,
  dedupe_key     text,                              -- normalized email/company key
  raw            jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now()
);
create index if not exists idx_leads_project on public.leads (project_id);
create index if not exists idx_leads_job on public.leads (job_id);
create index if not exists idx_leads_dedupe on public.leads (dedupe_key);

-- ---------------------------------------------------------------------
-- lead_duplicates
-- ---------------------------------------------------------------------
create table if not exists public.lead_duplicates (
  id            uuid primary key default gen_random_uuid(),
  lead_id       uuid not null references public.leads (id) on delete cascade,
  duplicate_of  uuid not null references public.leads (id) on delete cascade,
  reason        text,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- actor_health  (Phase 2 health monitoring; recorded from Phase 1)
-- ---------------------------------------------------------------------
create table if not exists public.actor_health (
  id            uuid primary key default gen_random_uuid(),
  actor_id      uuid not null references public.actors (id) on delete cascade,
  success       boolean not null,
  latency_ms    integer,
  leads_count   integer not null default 0,
  error         text,
  checked_at    timestamptz not null default now()
);
create index if not exists idx_actor_health_actor on public.actor_health (actor_id);

-- ---------------------------------------------------------------------
-- exports
-- ---------------------------------------------------------------------
create table if not exists public.exports (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid references public.projects (id) on delete set null,
  user_id     uuid not null references public.users (id) on delete cascade,
  format      export_format not null default 'csv',
  filters     jsonb not null default '{}'::jsonb,
  row_count   integer not null default 0,
  storage_path text,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- settings  (key/value platform settings)
-- ---------------------------------------------------------------------
create table if not exists public.settings (
  key         text primary key,
  value       jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array['users','projects','actors','jobs'] loop
    execute format(
      'drop trigger if exists trg_%1$s_updated on public.%1$s;
       create trigger trg_%1$s_updated before update on public.%1$s
       for each row execute function public.set_updated_at();', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- Auto-provision a public.users row when an auth user is created
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.users (id, email, full_name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', 'viewer')
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
