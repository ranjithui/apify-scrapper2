'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { StatCard, StatusBadge, Spinner } from '@/components/ui';

interface Dashboard {
  totals: { leads: number; jobs: number; projects: number; actors: number };
  jobsByStatus: Record<string, number>;
  leadsBySource: Record<string, number>;
  recentJobs: Array<{
    id: string;
    status: string;
    leads_count: number;
    created_at: string;
  }>;
}

export default function DashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get<Dashboard>('/dashboard')
      .then(setData)
      .catch((e) => setError((e as Error).message));
  }, []);

  if (error)
    return (
      <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">{error}</div>
    );
  if (!data) return <Spinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">Platform overview</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Leads" value={data.totals.leads.toLocaleString()} />
        <StatCard label="Jobs" value={data.totals.jobs} />
        <StatCard label="Projects" value={data.totals.projects} />
        <StatCard label="Actors" value={data.totals.actors} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-4 font-semibold text-slate-900">Jobs by status</h2>
          <BarList data={data.jobsByStatus} />
        </div>
        <div className="card">
          <h2 className="mb-4 font-semibold text-slate-900">Leads by source</h2>
          <BarList data={data.leadsBySource} />
        </div>
      </div>

      <div className="card">
        <h2 className="mb-4 font-semibold text-slate-900">Recent jobs</h2>
        {data.recentJobs.length === 0 ? (
          <p className="text-sm text-slate-400">No jobs yet.</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="th">Job</th>
                <th className="th">Status</th>
                <th className="th">Leads</th>
                <th className="th">Created</th>
              </tr>
            </thead>
            <tbody>
              {data.recentJobs.map((j) => (
                <tr key={j.id} className="border-b border-slate-50">
                  <td className="td font-mono text-xs">{j.id.slice(0, 8)}</td>
                  <td className="td">
                    <StatusBadge status={j.status} />
                  </td>
                  <td className="td">{j.leads_count}</td>
                  <td className="td text-slate-400">
                    {new Date(j.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function BarList({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data);
  const max = Math.max(1, ...entries.map(([, v]) => v));
  if (entries.length === 0)
    return <p className="text-sm text-slate-400">No data.</p>;
  return (
    <div className="space-y-3">
      {entries.map(([k, v]) => (
        <div key={k}>
          <div className="mb-1 flex justify-between text-xs">
            <span className="capitalize text-slate-600">{k}</span>
            <span className="font-medium text-slate-900">{v}</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100">
            <div
              className="h-2 rounded-full bg-brand-500"
              style={{ width: `${(v / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
