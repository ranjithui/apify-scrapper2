'use client';

import { EmptyState } from './ui';

const COLS: { key: string; label: string }[] = [
  { key: 'first_name', label: 'First' },
  { key: 'last_name', label: 'Last' },
  { key: 'title', label: 'Title' },
  { key: 'company', label: 'Company' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'country', label: 'Country' },
  { key: 'industry', label: 'Industry' },
  { key: 'source', label: 'Source' },
  { key: 'confidence_score', label: 'Conf.' },
];

export function LeadsTable({ leads }: { leads: Record<string, unknown>[] }) {
  if (leads.length === 0)
    return (
      <div className="p-5">
        <EmptyState>No leads.</EmptyState>
      </div>
    );

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-100">
            {COLS.map((c) => (
              <th key={c.key} className="th">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {leads.map((lead, i) => (
            <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
              {COLS.map((c) => (
                <td key={c.key} className="td max-w-[180px] truncate">
                  {c.key === 'confidence_score'
                    ? fmtConf(lead[c.key])
                    : (lead[c.key] as string) || '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function fmtConf(v: unknown) {
  const n = Number(v);
  if (Number.isNaN(n)) return '—';
  const pct = Math.round(n * 100);
  const color =
    pct >= 70 ? 'text-green-600' : pct >= 40 ? 'text-amber-600' : 'text-slate-400';
  return <span className={color}>{pct}%</span>;
}
