'use client';

import { ReactNode } from 'react';

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <div className="card">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="mt-2 text-3xl font-bold text-slate-900">{value}</div>
      {hint && <div className="mt-1 text-xs text-slate-400">{hint}</div>}
    </div>
  );
}

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  completed: 'bg-green-100 text-green-700',
  standby: 'bg-amber-100 text-amber-700',
  running: 'bg-blue-100 text-blue-700',
  queued: 'bg-slate-100 text-slate-600',
  retried: 'bg-purple-100 text-purple-700',
  disabled: 'bg-slate-100 text-slate-500',
  failed: 'bg-red-100 text-red-700',
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`badge ${STATUS_STYLES[status] ?? 'bg-slate-100 text-slate-600'}`}>
      {status}
    </span>
  );
}

export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return <div className="p-6 text-sm text-slate-400">{label}</div>;
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-400">
      {children}
    </div>
  );
}
