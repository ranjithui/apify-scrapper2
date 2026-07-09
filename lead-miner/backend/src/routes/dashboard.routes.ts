import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { getDashboard } from '../services/dashboardService.js';

const router = Router();
router.use(requireAuth);

/** GET /dashboard?project_id= */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const projectId = req.query.project_id
      ? String(req.query.project_id)
      : undefined;
    res.json(await getDashboard(projectId));
  }),
);

export default router;
