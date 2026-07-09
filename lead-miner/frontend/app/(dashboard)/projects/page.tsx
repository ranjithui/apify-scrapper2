'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Spinner, EmptyState } from '@/components/ui';

interface Project {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function load() {
    const r = await api.get<{ projects: Project[] }>('/projects');
    setProjects(r.projects);
  }
  useEffect(() => {
    load().catch((e) => setError((e as Error).message));
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/projects', { name, description });
      setName('');
      setDescription('');
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm('Delete this project?')) return;
    await api.del(`/projects/${id}`);
    await load();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Projects</h1>

      <form onSubmit={create} className="card flex flex-wrap items-end gap-3">
        <div className="flex-1">
          <label className="label">Name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="flex-[2]">
          <label className="label">Description</label>
          <input
            className="input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <button className="btn-primary" disabled={saving}>
          {saving ? 'Saving…' : 'Create'}
        </button>
      </form>

      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
      )}

      {!projects ? (
        <Spinner />
      ) : projects.length === 0 ? (
        <EmptyState>No projects yet. Create your first one above.</EmptyState>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <div key={p.id} className="card">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-slate-900">{p.name}</h3>
                <button
                  onClick={() => remove(p.id)}
                  className="text-xs text-slate-400 hover:text-red-500"
                >
                  Delete
                </button>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {p.description || 'No description'}
              </p>
              <p className="mt-3 text-xs text-slate-400">
                {new Date(p.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
