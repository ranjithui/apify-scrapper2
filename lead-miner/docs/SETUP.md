# Setup Guide

## 1. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** and run, in order:
   - [`database/schema.sql`](../database/schema.sql)
   - [`database/rls.sql`](../database/rls.sql)
   - [`database/seed.sql`](../database/seed.sql)
3. From **Project Settings → API**, copy:
   - `Project URL` → `SUPABASE_URL`
   - `anon public` key → `SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (backend only!)

> A DB trigger auto-creates a `public.users` row (role `viewer`) whenever an
> auth user is created.

## 2. Apify

1. Sign up at [apify.com](https://apify.com) (the free plan works for Phase 1).
2. **Console → Settings → Integrations → API tokens** → copy your token to
   `APIFY_TOKEN`.
3. The seed data references real public Google Maps actors and *placeholder*
   Apollo/LinkedIn actor refs (`your-org/...`). Replace those with actors you
   have access to, or edit them in the **Actors** page after login.

## 3. Backend

```bash
cd backend
cp .env.example .env      # fill values from steps 1 & 2
npm install
npm run dev               # http://localhost:4000/health
```

Create your first (admin) user:

```bash
curl -X POST http://localhost:4000/signup \
  -H 'Content-Type: application/json' \
  -d '{"email":"you@example.com","password":"secret123","full_name":"You","role":"admin"}'
```

## 4. Frontend

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev               # http://localhost:3000
```

Sign in with the user you created, then:

- **Search** → pick a source (start with `google_maps`), enter a keyword +
  city, and run. You'll be redirected to the live job view.
- **Actors** → promote/disable actors, or **Test** an actor with sample input.
- **Leads / Jobs** → browse and **Export** to CSV / Excel / JSON.

## 5. Docker (optional)

```bash
cd docker
cp .env.example .env      # fill Supabase + Apify keys
docker compose up --build
```

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `Supabase is NOT configured` on boot | Set `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` in `backend/.env`. |
| Search job fails with `provider_not_ready` | `APIFY_TOKEN` missing/invalid. |
| Job fails `no_actor` | No non-disabled actor for that source — add one in **Actors**. |
| `all_actors_failed` | The actor ref is wrong or the Apify run errored — check the job **Logs**. |
