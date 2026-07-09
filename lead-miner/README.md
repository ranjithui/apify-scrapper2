# Lead Mining Platform (LMP)

A modular, **provider-agnostic** lead-generation platform. It collects business
leads from multiple sources without depending on a single Apify actor, and
supports interchangeable actor plugins, automatic failover, normalized output,
and future expansion to non-Apify providers.

> This repository implements **Phase 1 (MVP)** of the
> [Technical Specification](../Lead_Mining_Platform_Technical_Specification.md)
> with an architecture designed so Phase 2 & 3 slot in without rewrites.

## Architecture

```
User → Web Dashboard (Next.js) → Backend API (Express)
                                        │
   ┌────────────────────────────────────────────────────────┐
   │ Search Engine · Actor Manager · Job Queue               │
   │ Lead Processor · Export Service                          │
   └────────────────────────────────────────────────────────┘
                                        │
                       Provider Abstraction Layer
                                        │
              ┌──────────────┬──────────────────┐
            Apify        Playwright(future)   Custom API(future)
              │
          Actor Plugins  (Apollo · LinkedIn · Google Maps · Website ...)
              │
        Normalized Leads → Supabase (PostgreSQL)
```

## Repository layout

```
lead-miner/
├── frontend/     Next.js dashboard
├── backend/      Node.js + TypeScript API, providers, actors, mappers
├── database/     Supabase SQL schema, RLS policies, seed data
├── config/       Shared config / actor mapping examples
├── docker/       Dockerfiles + docker-compose
└── docs/         Architecture, API reference, setup guides
```

## Quick start

1. **Database** — create a Supabase project, then run the SQL in
   [`database/schema.sql`](database/schema.sql) and
   [`database/seed.sql`](database/seed.sql) in the SQL editor.
2. **Backend**
   ```bash
   cd backend
   cp .env.example .env      # fill in Supabase + Apify keys
   npm install
   npm run dev               # http://localhost:4000
   ```
3. **Frontend**
   ```bash
   cd frontend
   cp .env.local.example .env.local
   npm install
   npm run dev               # http://localhost:3000
   ```
4. **Or run everything with Docker**
   ```bash
   cd docker
   docker compose up --build
   ```

See [`docs/SETUP.md`](docs/SETUP.md) for the full walkthrough and
[`docs/API.md`](docs/API.md) for the REST reference.

## Phase status

| Phase | Scope | Status |
|-------|-------|--------|
| 1 (MVP) | Supabase, Auth, Apify provider, Actor registry, manual switching, CSV export, Dashboard | ✅ implemented |
| 2 | Automatic failover, health monitoring, scheduling, retry, notifications | 🟡 hooks in place |
| 3 | Multiple providers, AI actor selection, CRM, cost analytics, teams | ⚪ architected for |
```
