'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Spinner, StatusBadge } from '@/components/ui';
import { LeadsTable } from '@/components/LeadsTable';
import { ExportButton } from '@/components/ExportButton';

interface JobDetail {
  job: {
    id: string;
    status: string;
    leads_count: number;
    attempts: number;
    error: string | null;
    external_run_id: string | null;
    created_at: string;
  };
  logs: Array<{ level: string; message: string; created_at: string }>;
  leads: Record<string, unknown>[];
}

const ACTIVE = ['queued', 'running'];

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<JobDetail | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const load = async () => {
      const d = await api.get<JobDetail>(`/jobs/${id}`);
      setData(d);
      if (ACTIVE.includes(d.job.status)) {
        timer = setTimeout(load, 3000);
      }
    };
    load();
    return () => clearTimeout(timer);
  }, [id]);

  if (!data) return <Spinner />;
  const { job, logs, leads } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Job <span className="font-mono text-lg text-slate-400">{job.id.slice(0, 8)}</span>
          </h1>
          <div className="mt-2 flex items-center gap-3">
            <StatusBadge status={job.status} />
            <span className="text-sm text-slate-500">{job.leads_count} leads</span>
            {ACTIVE.includes(job.status) && (
              <span className="text-xs text-brand-600">● live — auto-refreshing</span>
            )}
          </div>
        </div>
        <ExportButton jobId={job.id} disabled={leads.length === 0} />
      </div>

      {job.error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {job.error}
        </div>
      )}

      <div className="card">
        <h2 className="mb-3 font-semibold text-slate-900">Logs</h2>
        <div className="max-h-56 space-y-1 overflow-auto font-mono text-xs">
          {logs.length === 0 && <p className="text-slate-400">No logs yet.</p>}
          {logs.map((l, i) => (
            <div key={i} className="flex gap-2">
              <span className="text-slate-400">
                {new Date(l.created_at).toLocaleTimeString()}
              </span>
              <span
                className={
                  l.level === 'error'
                    ? 'text-red-600'
                    : l.level === 'warn'
                      ? 'text-amber-600'
                      : 'text-slate-700'
                }
              >
                {l.message}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-0">
        <h2 className="border-b border-slate-100 px-5 py-3 font-semibold text-slate-900">
          Leads preview ({leads.length})
        </h2>
        <LeadsTable leads={leads} />
      </div>
    </div>
  );
}
