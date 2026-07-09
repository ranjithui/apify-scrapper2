'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { Spinner } from '@/components/ui';
import { LeadsTable } from '@/components/LeadsTable';
import { ExportButton } from '@/components/ExportButton';

export default function LeadsPage() {
  const [leads, setLeads] = useState<Record<string, unknown>[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [source, setSource] = useState('');
  const size = 50;

  const load = useCallback(async () => {
    const q = new URLSearchParams({ page: String(page), size: String(size) });
    if (source) q.set('source', source);
    const r = await api.get<{ leads: Record<string, unknown>[]; total: number }>(
      `/leads?${q.toString()}`,
    );
    setLeads(r.leads);
    setTotal(r.total);
  }, [page, source]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Leads</h1>
        <ExportButton disabled={(leads?.length ?? 0) === 0} />
      </div>

      <div className="flex items-center gap-3">
        <select
          className="input max-w-xs"
          value={source}
          onChange={(e) => {
            setPage(0);
            setSource(e.target.value);
          }}
        >
          <option value="">All sources</option>
          <option value="google_maps">google_maps</option>
          <option value="apollo">apollo</option>
          <option value="linkedin">linkedin</option>
          <option value="website">website</option>
        </select>
        <span className="text-sm text-slate-500">{total} total</span>
      </div>

      {!leads ? (
        <Spinner />
      ) : (
        <div className="card p-0">
          <LeadsTable leads={leads} />
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-sm">
            <button
              className="btn-ghost"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Previous
            </button>
            <span className="text-slate-500">Page {page + 1}</span>
            <button
              className="btn-ghost"
              disabled={(page + 1) * size >= total}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
