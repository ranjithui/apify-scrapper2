# REST API Reference

Base URL: `http://localhost:4000` (routes also mounted under `/api`).
All endpoints except `/health`, `/login`, `/signup`, `/password-reset` require
`Authorization: Bearer <access_token>`.

## Auth

| Method | Endpoint | Body | Notes |
|--------|----------|------|-------|
| POST | `/login` | `{ email, password }` | → `{ access_token, refresh_token, user }` |
| POST | `/signup` | `{ email, password, full_name?, role? }` | admin bootstrap |
| POST | `/logout` | — | revoke session |
| POST | `/password-reset` | `{ email }` | sends reset email |
| GET | `/me` | — | current profile + role |

## Projects

| Method | Endpoint | Notes |
|--------|----------|-------|
| GET | `/projects` | list (scoped by role) |
| GET | `/projects/:id` | project + search history |
| POST | `/projects` | `{ name, description? }` |
| DELETE | `/projects/:id` | admin/manager |

## Search & Jobs

| Method | Endpoint | Notes |
|--------|----------|-------|
| POST | `/search` | `{ source, params, project_id?, actor_id? }` → `202 { job_id }` |
| GET | `/jobs` | `?project_id=&status=` |
| GET | `/jobs/:id` | job + logs + lead preview |
| GET | `/jobs/:id/leads` | `?page=&size=` |

`params` (all optional): `keyword, industry, country, city, employee_count,
revenue, technologies[], company_name, website, linkedin_url, limit`.

## Actors (Registry)

| Method | Endpoint | Notes |
|--------|----------|-------|
| GET | `/actors` | `?source=` |
| GET | `/actors/:id` | |
| POST | `/actors` | create (admin/manager) |
| PUT | `/actors/:id` | update |
| DELETE | `/actors/:id` | |
| POST | `/actors/:id/activate` | manual switching — promote to `active` |
| POST | `/actors/test` | `{ actor_id, params }` → preview, does not store |

## Leads, Export, Dashboard, Providers

| Method | Endpoint | Notes |
|--------|----------|-------|
| GET | `/leads` | `?project_id=&source=&min_confidence=&page=&size=` |
| POST | `/export` | `{ format: csv\|excel\|json, project_id?, job_id?, source?, min_confidence? }` → file download |
| GET | `/dashboard` | `?project_id=` aggregated metrics |
| GET | `/providers` | registered providers + runtime readiness |

## Error shape

```json
{ "error": "bad_request", "message": "…", "details": { } }
```

Status codes: `400` validation, `401` auth, `403` role, `404` not found,
`502` provider/actor failure, `500` unexpected.
