'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Spinner, EmptyState, StatusBadge } from '@/components/ui';

interface Job {
  id: string;
  status: string;
  leads_count: number;
  attempts: number;
  error: string | null;
  created_at: string;
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[] | null>(null);

  useEffect(() => {
    const load = () =>
      api.get<{ jobs: Job[] }>('/jobs').then((r) => setJobs(r.jobs));
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, []);

  if (!jobs) return <Spinner />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Jobs</h1>
      {jobs.length === 0 ? (
        <EmptyState>No jobs yet. Run a search to create one.</EmptyState>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="th">Job</th>
                <th className="th">Status</th>
                <th className="th">Leads</th>
                <th className="th">Attempts</th>
                <th className="th">Created</th>
                <th className="th"></th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((j) => (
                <tr key={j.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="td font-mono text-xs">{j.id.slice(0, 8)}</td>
                  <td className="td">
                    <StatusBadge status={j.status} />
                  </td>
                  <td className="td">{j.leads_count}</td>
                  <td className="td">{j.attempts}</td>
                  <td className="td text-slate-400">
                    {new Date(j.created_at).toLocaleString()}
                  </td>
                  <td className="td">
                    <Link href={`/jobs/${j.id}`} className="text-brand-600 hover:underline">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
