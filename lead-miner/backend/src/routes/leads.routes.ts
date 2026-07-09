import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

/** GET /leads?project_id=&source=&min_confidence=&page=&size= */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const page = Math.max(0, Number(req.query.page ?? 0));
    const size = Math.min(500, Number(req.query.size ?? 50));
    let q = supabaseAdmin
      .from('leads')
      .select('*', { count: 'exact' })
      .order('confidence_score', { ascending: false })
      .range(page * size, page * size + size - 1);
    if (req.query.project_id) q = q.eq('project_id', String(req.query.project_id));
    if (req.query.source) q = q.eq('source', String(req.query.source));
    if (req.query.min_confidence)
      q = q.gte('confidence_score', Number(req.query.min_confidence));
    const { data, error, count } = await q;
    if (error) throw error;
    res.json({ leads: data, total: count, page, size });
  }),
);

export default router;
