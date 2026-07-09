# Deployment Guide

**Recommended stack:** Frontend → **Vercel**, Backend → **Render**, Database →
**Supabase** (already hosted). All three have free tiers.

```
Browser → Vercel (Next.js frontend) → Render (Express backend) → Supabase (DB)
                                              │
                                          Apify API
```

---

## 0. Push the repo to GitHub

Both Vercel and Render deploy from a Git repo.

```bash
cd lead-miner
git init
git add .
git commit -m "Lead Mining Platform"
git branch -M main
git remote add origin https://github.com/<you>/lead-miner.git
git push -u origin main
```

> `.env`, `.env.local`, and `node_modules/` are gitignored — your secrets are
> NOT pushed. You'll set them in each host's dashboard instead.
> ⚠️ Make sure `backend/.env.example` does **not** contain real keys before
> pushing (it's committed). Reset it to placeholders if needed.

---

## 1. Backend → Render

1. Go to [render.com](https://render.com) → **New → Blueprint**.
2. Connect your GitHub repo. Render reads [`render.yaml`](../render.yaml) and
   creates the `lead-miner-backend` web service (Docker).
3. When prompted, fill in the secret env vars:
   - `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
   - `APIFY_TOKEN`
   - `CORS_ORIGIN` → leave as `*` for now; update to your Vercel URL after step 2.
4. Deploy. Your API will be at something like
   `https://lead-miner-backend.onrender.com`.
   Verify: open `…/health` → `{"status":"ok","configured":true}`.

> Free Render services sleep after ~15 min idle and cold-start on the next
> request (~30s). Fine for demos; upgrade for always-on.

---

## 2. Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New → Project** → import the
   same repo.
2. Set **Root Directory** to `frontend`. Vercel auto-detects Next.js
   (see [`frontend/vercel.json`](../frontend/vercel.json)).
3. Add an environment variable:
   - `NEXT_PUBLIC_API_URL` = your Render backend URL (e.g.
     `https://lead-miner-backend.onrender.com`)
4. Deploy. You'll get a URL like `https://lead-miner.vercel.app`.

---

## 3. Connect them (CORS)

Back in **Render → lead-miner-backend → Environment**, set:

- `CORS_ORIGIN` = your Vercel URL (e.g. `https://lead-miner.vercel.app`)

Save → Render redeploys. Done.

---

## 4. Post-deploy checklist

- [ ] Supabase SQL ran: `schema.sql`, `rls.sql`, `seed.sql`
- [ ] Render `/health` shows `configured: true`
- [ ] Vercel site loads and login works
- [ ] Create your admin user against the **deployed** backend:
  ```bash
  curl -X POST https://lead-miner-backend.onrender.com/signup \
    -H "Content-Type: application/json" \
    -d '{"email":"you@example.com","password":"secret123","role":"admin"}'
  ```

---

## Alternatives

| Host | Backend | Notes |
|------|---------|-------|
| **Railway** | ✅ | Great DX, uses the same Dockerfile; no perpetual free tier. |
| **Fly.io** | ✅ | Global, persistent; slightly more setup. |
| **Vercel (backend too)** | ⚠️ | Requires refactor to serverless functions + BullMQ/Redis for the job queue (Phase 2). Not recommended as-is. |
