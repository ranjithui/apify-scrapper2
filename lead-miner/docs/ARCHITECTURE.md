# Architecture

## Request flow

```
POST /search
   │
   ▼
jobService.createSearchJob
   ├─ persists search_requests row (normalized SearchParams)
   ├─ creates jobs row (status=queued)
   └─ enqueues executeJob (in-memory queue; sync if SYNC_JOBS=true)
        │
        ▼
   executeJob (status→running)
        │
        ▼
   actorManager.runSource(source, params)
        ├─ actorRegistry.selectChain(source)   → [active, standby…] by priority
        ├─ inputMapper.mapInput(actor, params) → provider-specific JSON
        ├─ providers.getProvider('apify').run(actor, input)   ← Provider Abstraction Layer
        ├─ outputMapper.mapOutput(...)         → NormalizedLead[]
        ├─ recordHealth(...)                   → actor_health
        └─ on failure + FAILOVER_ENABLED       → next actor in chain
        │
        ▼
   leadProcessor.processLeads()  → dedupe, clean email/phone/company/country
        │
        ▼
   persist leads (status→completed) | on error (status→failed)
```

## Key seams (why this is provider-agnostic)

| Seam | File | Extends to |
|------|------|-----------|
| **Provider Abstraction Layer** | `providers/Provider.ts` | Playwright, Custom API, REST (Phase 3) — implement `Provider`, register in `providers/index.ts`. |
| **Actor Registry** | `services/actorRegistry.ts` | Any number of interchangeable actors per source, ordered by priority/status. |
| **Input Mapper** | `mappers/inputMapper.ts` | New actors need only an `input_schema` template — no code. |
| **Output Mapper** | `mappers/outputMapper.ts` | New actors need only an `output_mapping` — no code. |
| **Job Queue** | `services/jobQueue.ts` | Swap in-memory for BullMQ + Redis (Phase 2) behind `enqueue`. |
| **Lead Processor** | `services/leadProcessor.ts` | Add AI enrichment (Phase 3) as another stage. |

## Data model (Supabase)

`users, projects, providers, adapters, actors, actor_mapping, search_requests,
jobs, job_logs, leads, lead_duplicates, actor_health, exports, settings`.

See [`database/schema.sql`](../database/schema.sql). RLS in
[`database/rls.sql`](../database/rls.sql); the backend uses the service-role
key and enforces role checks in `middleware/auth.ts`.

## Failover (Phase 2 ready)

`selectChain` returns the ordered failover chain. With `FAILOVER_ENABLED=true`,
`actorManager` walks the chain until one actor succeeds, recording a health
data point for each attempt. With it disabled (Phase 1 default) only the active
actor runs — switching is manual via `POST /actors/:id/activate`.

## Design principles → implementation

1. **Provider-agnostic** → `Provider` interface + factory.
2. **Actor plug-in model** → DB-driven actor rows + mappers (no code per actor).
3. **Centralized normalization** → `outputMapper` + `leadProcessor`.
4. **Secure backend-managed keys** → Apify/service-role keys live only in the backend env.
5. **Modular & scalable** → clear service boundaries; queue is swappable.
6. **Easy Apify free → paid** → only `APIFY_TOKEN` and actor refs change.
```
