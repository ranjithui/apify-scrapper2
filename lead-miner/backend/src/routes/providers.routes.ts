import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { listProviders } from '../providers/index.js';

const router = Router();
router.use(requireAuth);

/** GET /providers — DB-registered providers annotated with runtime readiness. */
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const runtime = new Map(listProviders().map((p) => [p.key, p.isReady()]));
    const { data, error } = await supabaseAdmin
      .from('providers')
      .select('*')
      .order('name');
    if (error) throw error;
    const providers = (data ?? []).map((p) => ({
      ...p,
      ready: runtime.get((p as { key: string }).key) ?? false,
    }));
    res.json({ providers });
  }),
);

export default router;
