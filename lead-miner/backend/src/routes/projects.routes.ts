import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { projectSchema } from './validators.js';
import { notFound } from '../utils/errors.js';

const router = Router();
router.use(requireAuth);

/** GET /projects */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    // admins/managers see all; others see their own
    let q = supabaseAdmin
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });
    if (!['admin', 'manager'].includes(req.user!.role)) {
      q = q.eq('owner_id', req.user!.id);
    }
    const { data, error } = await q;
    if (error) throw error;
    res.json({ projects: data });
  }),
);

/** GET /projects/:id  (with search history) */
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { data: project, error } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (error || !project) throw notFound('Project not found');

    const { data: history } = await supabaseAdmin
      .from('search_requests')
      .select('id, source, params, created_at')
      .eq('project_id', req.params.id)
      .order('created_at', { ascending: false })
      .limit(50);

    res.json({ project, search_history: history ?? [] });
  }),
);

/** POST /projects */
router.post(
  '/',
  requireRole('admin', 'manager', 'operator'),
  asyncHandler(async (req, res) => {
    const body = projectSchema.parse(req.body);
    const { data, error } = await supabaseAdmin
      .from('projects')
      .insert({
        name: body.name,
        description: body.description ?? null,
        owner_id: body.owner_id ?? req.user!.id,
      })
      .select('*')
      .single();
    if (error) throw error;
    res.status(201).json({ project: data });
  }),
);

/** DELETE /projects/:id */
router.delete(
  '/:id',
  requireRole('admin', 'manager'),
  asyncHandler(async (req, res) => {
    const { error } = await supabaseAdmin
      .from('projects')
      .delete()
      .eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  }),
);

export default router;
