'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

type Format = 'csv' | 'excel' | 'json';

export function ExportButton({
  jobId,
  projectId,
  disabled,
}: {
  jobId?: string;
  projectId?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function run(format: Format) {
    setBusy(true);
    setOpen(false);
    try {
      const { blob, filename } = await api.download('/export', {
        format,
        job_id: jobId,
        project_id: projectId,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(`Export failed: ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative">
      <button
        className="btn-primary"
        disabled={disabled || busy}
        onClick={() => setOpen((o) => !o)}
      >
        {busy ? 'Exporting…' : 'Export ▾'}
      </button>
      {open && (
        <div className="absolute right-0 z-10 mt-1 w-32 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          {(['csv', 'excel', 'json'] as Format[]).map((f) => (
            <button
              key={f}
              onClick={() => run(f)}
              className="block w-full px-3 py-1.5 text-left text-sm capitalize hover:bg-slate-50"
            >
              {f}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
