'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Spinner, StatusBadge } from '@/components/ui';

interface Actor {
  id: string;
  source: string;
  name: string;
  actor_ref: string;
  priority: number;
  status: 'active' | 'standby' | 'disabled';
}

export default function ActorsPage() {
  const [actors, setActors] = useState<Actor[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState('');

  async function load() {
    const r = await api.get<{ actors: Actor[] }>('/actors');
    setActors(r.actors);
  }
  useEffect(() => {
    load().catch((e) => setError((e as Error).message));
  }, []);

  async function activate(id: string) {
    setBusy(id);
    setError('');
    try {
      await api.post(`/actors/${id}/activate`);
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function setStatus(id: string, status: Actor['status']) {
    setBusy(id);
    try {
      await api.put(`/actors/${id}`, { status });
      await load();
    } finally {
      setBusy(null);
    }
  }

  async function test(id: string) {
    setBusy(id);
    setTestResult(null);
    setError('');
    try {
      const r = await api.post<Record<string, unknown>>('/actors/test', {
        actor_id: id,
        params: { keyword: 'coffee shop', city: 'Austin', country: 'US', limit: 3 },
      });
      setTestResult(r);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  if (!actors) return <Spinner />;

  // group by source
  const bySource = actors.reduce<Record<string, Actor[]>>((acc, a) => {
    (acc[a.source] ??= []).push(a);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Actor Registry</h1>
        <p className="text-sm text-slate-500">
          Interchangeable actors per source. Promote a standby to active for manual switching.
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
      )}

      {Object.entries(bySource).map(([source, list]) => (
        <div key={source} className="card p-0">
          <div className="border-b border-slate-100 px-5 py-3 font-semibold capitalize text-slate-900">
            {source.replace('_', ' ')}
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="th">Priority</th>
                <th className="th">Name</th>
                <th className="th">Actor ref</th>
                <th className="th">Status</th>
                <th className="th">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list
                .sort((a, b) => a.priority - b.priority)
                .map((a) => (
                  <tr key={a.id} className="border-b border-slate-50">
                    <td className="td">{a.priority}</td>
                    <td className="td font-medium text-slate-900">{a.name}</td>
                    <td className="td font-mono text-xs text-slate-500">{a.actor_ref}</td>
                    <td className="td">
                      <StatusBadge status={a.status} />
                    </td>
                    <td className="td space-x-2">
                      {a.status !== 'active' && (
                        <button
                          onClick={() => activate(a.id)}
                          disabled={busy === a.id}
                          className="text-xs text-brand-600 hover:underline"
                        >
                          Activate
                        </button>
                      )}
                      {a.status !== 'disabled' ? (
                        <button
                          onClick={() => setStatus(a.id, 'disabled')}
                          disabled={busy === a.id}
                          className="text-xs text-slate-400 hover:text-red-500"
                        >
                          Disable
                        </button>
                      ) : (
                        <button
                          onClick={() => setStatus(a.id, 'standby')}
                          disabled={busy === a.id}
                          className="text-xs text-slate-500 hover:underline"
                        >
                          Enable
                        </button>
                      )}
                      <button
                        onClick={() => test(a.id)}
                        disabled={busy === a.id}
                        className="text-xs text-slate-500 hover:underline"
                      >
                        {busy === a.id ? 'Testing…' : 'Test'}
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      ))}

      {testResult && (
        <div className="card">
          <h2 className="mb-2 font-semibold text-slate-900">Test result</h2>
          <pre className="max-h-80 overflow-auto rounded-lg bg-slate-900 p-4 text-xs text-slate-100">
            {JSON.stringify(testResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
