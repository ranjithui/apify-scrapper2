import ExcelJS from 'exceljs';
import { supabaseAdmin } from '../config/supabase.js';
import type { ExportFormat } from '../types/index.js';
import { badRequest } from '../utils/errors.js';

/**
 * Export Service. Phase 1: CSV / JSON / Excel.
 * Google Sheets & CRM API are Phase 3 (stubs raise a clear error).
 */
const COLUMNS = [
  'first_name',
  'last_name',
  'title',
  'company',
  'email',
  'phone',
  'website',
  'linkedin',
  'industry',
  'country',
  'employee_count',
  'revenue',
  'source',
  'provider',
  'actor',
  'confidence_score',
] as const;

export interface ExportFilters {
  projectId?: string;
  jobId?: string;
  source?: string;
  minConfidence?: number;
}

export interface ExportResult {
  filename: string;
  contentType: string;
  body: Buffer | string;
  rowCount: number;
}

async function fetchLeads(
  filters: ExportFilters,
): Promise<Record<string, unknown>[]> {
  let q = supabaseAdmin
    .from('leads')
    .select(COLUMNS.join(','))
    .order('confidence_score', { ascending: false })
    .limit(50000);
  if (filters.projectId) q = q.eq('project_id', filters.projectId);
  if (filters.jobId) q = q.eq('job_id', filters.jobId);
  if (filters.source) q = q.eq('source', filters.source);
  if (filters.minConfidence != null)
    q = q.gte('confidence_score', filters.minConfidence);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as Record<string, unknown>[];
}

export async function exportLeads(
  format: ExportFormat,
  filters: ExportFilters,
): Promise<ExportResult> {
  const rows = await fetchLeads(filters);
  const stamp = new Date().toISOString().slice(0, 10);

  switch (format) {
    case 'json':
      return {
        filename: `leads-${stamp}.json`,
        contentType: 'application/json',
        body: JSON.stringify(rows, null, 2),
        rowCount: rows.length,
      };
    case 'csv':
      return {
        filename: `leads-${stamp}.csv`,
        contentType: 'text/csv',
        body: toCsv(rows),
        rowCount: rows.length,
      };
    case 'excel':
      return {
        filename: `leads-${stamp}.xlsx`,
        contentType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        body: await toXlsx(rows),
        rowCount: rows.length,
      };
    case 'google_sheets':
    case 'crm':
      throw badRequest(
        `Export format "${format}" is a Phase 3 feature and not yet implemented`,
      );
    default:
      throw badRequest(`Unknown export format "${format}"`);
  }
}

function toCsv(rows: Record<string, unknown>[]): string {
  const header = COLUMNS.join(',');
  const lines = rows.map((r) =>
    COLUMNS.map((c) => csvCell(r[c])).join(','),
  );
  return [header, ...lines].join('\r\n');
}

function csvCell(v: unknown): string {
  if (v == null) return '';
  const s = String(v);
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

async function toXlsx(rows: Record<string, unknown>[]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Leads');
  ws.columns = COLUMNS.map((c) => ({
    header: c,
    key: c,
    width: Math.max(14, c.length + 2),
  }));
  ws.getRow(1).font = { bold: true };
  for (const r of rows) ws.addRow(r);
  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}

/** Record the export in the DB (audit trail). */
export async function recordExport(
  userId: string,
  format: ExportFormat,
  filters: ExportFilters,
  rowCount: number,
): Promise<void> {
  await supabaseAdmin.from('exports').insert({
    user_id: userId,
    project_id: filters.projectId ?? null,
    format,
    filters,
    row_count: rowCount,
  });
}
