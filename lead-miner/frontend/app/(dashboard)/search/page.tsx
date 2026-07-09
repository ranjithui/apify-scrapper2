'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface Actor {
  id: string;
  source: string;
  name: string;
  status: string;
  priority: number;
}
interface Project {
  id: string;
  name: string;
}

const SOURCES = ['google_maps', 'apollo', 'linkedin', 'website'];

export default function SearchPage() {
  const router = useRouter();
  const [actors, setActors] = useState<Actor[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [source, setSource] = useState('google_maps');
  const [projectId, setProjectId] = useState('');
  const [actorId, setActorId] = useState('');
  const [form, setForm] = useState({
    keyword: '',
    industry: '',
    country: '',
    city: '',
    company_name: '',
    website: '',
    linkedin_url: '',
    limit: 25,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<{ actors: Actor[] }>('/actors').then((r) => setActors(r.actors));
    api.get<{ projects: Project[] }>('/projects').then((r) => setProjects(r.projects));
  }, []);

  const sourceActors = actors.filter((a) => a.source === source && a.status !== 'disabled');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const params: Record<string, unknown> = { limit: Number(form.limit) };
      for (const [k, v] of Object.entries(form)) {
        if (k !== 'limit' && v) params[k] = v;
      }
      const res = await api.post<{ job_id: string }>('/search', {
        source,
        project_id: projectId || null,
        actor_id: actorId || undefined,
        params,
      });
      router.push(`/jobs/${res.job_id}`);
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">New Search</h1>
        <p className="text-sm text-slate-500">
          Submit a normalized search — the platform maps it to the selected actor.
        </p>
      </div>

      <form onSubmit={submit} className="card grid gap-5 md:grid-cols-2">
        <div>
          <label className="label">Source</label>
          <select
            className="input"
            value={source}
            onChange={(e) => {
              setSource(e.target.value);
              setActorId('');
            }}
          >
            {SOURCES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Actor (optional — defaults to active)</label>
          <select
            className="input"
            value={actorId}
            onChange={(e) => setActorId(e.target.value)}
          >
            <option value="">Auto (active actor)</option>
            {sourceActors.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} · {a.status} · p{a.priority}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Project (optional)</label>
          <select
            className="input"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
          >
            <option value="">None</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <Field label="Keyword" value={form.keyword} onChange={(v) => setForm({ ...form, keyword: v })} />
        <Field label="Industry" value={form.industry} onChange={(v) => setForm({ ...form, industry: v })} />
        <Field label="Country" value={form.country} onChange={(v) => setForm({ ...form, country: v })} />
        <Field label="City" value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
        <Field label="Company Name" value={form.company_name} onChange={(v) => setForm({ ...form, company_name: v })} />
        <Field label="Website" value={form.website} onChange={(v) => setForm({ ...form, website: v })} />
        <Field label="LinkedIn URL" value={form.linkedin_url} onChange={(v) => setForm({ ...form, linkedin_url: v })} />
        <div>
          <label className="label">Limit</label>
          <input
            type="number"
            className="input"
            min={1}
            max={1000}
            value={form.limit}
            onChange={(e) => setForm({ ...form, limit: Number(e.target.value) })}
          />
        </div>

        {error && (
          <div className="md:col-span-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="md:col-span-2">
          <button className="btn-primary" disabled={submitting}>
            {submitting ? 'Launching…' : 'Run search'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input className="input" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
