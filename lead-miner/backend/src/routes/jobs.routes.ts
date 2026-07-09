import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { notFound } from '../utils/errors.js';

const router = Router();
router.use(requireAuth);

/** GET /jobs?project_id=&status= */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    let q = supabaseAdmin
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    if (req.query.project_id) q = q.eq('project_id', String(req.query.project_id));
    if (req.query.status) q = q.eq('status', String(req.query.status));
    const { data, error } = await q;
    if (error) throw error;
    res.json({ jobs: data });
  }),
);

/** GET /jobs/:id — job + logs + a preview of its leads */
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { data: job, error } = await supabaseAdmin
      .from('jobs')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (error || !job) throw notFound('Job not found');

    const [{ data: logs }, { data: leads }] = await Promise.all([
      supabaseAdmin
        .from('job_logs')
        .select('level, message, meta, created_at')
        .eq('job_id', req.params.id)
        .order('created_at', { ascending: true }),
      supabaseAdmin
        .from('leads')
        .select('*')
        .eq('job_id', req.params.id)
        .order('confidence_score', { ascending: false })
        .limit(200),
    ]);

    res.json({ job, logs: logs ?? [], leads: leads ?? [] });
  }),
);

/** GET /jobs/:id/leads — full lead list for a job (paginated). */
router.get(
  '/:id/leads',
  asyncHandler(async (req, res) => {
    const page = Math.max(0, Number(req.query.page ?? 0));
    const size = Math.min(500, Number(req.query.size ?? 100));
    const { data, error, count } = await supabaseAdmin
      .from('leads')
      .select('*', { count: 'exact' })
      .eq('job_id', req.params.id)
      .order('confidence_score', { ascending: false })
      .range(page * size, page * size + size - 1);
    if (error) throw error;
    res.json({ leads: data, total: count, page, size });
  }),
);

export default router;
