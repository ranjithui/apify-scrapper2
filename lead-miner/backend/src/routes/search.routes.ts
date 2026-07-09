import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { createSearchSchema } from './validators.js';
import { createSearchJob } from '../services/jobService.js';

const router = Router();
router.use(requireAuth);

/**
 * POST /search — submit a normalized search. Creates a search_request + job,
 * runs it (sync or via the queue) and returns the job id to poll.
 */
router.post(
  '/',
  requireRole('admin', 'manager', 'operator'),
  asyncHandler(async (req, res) => {
    const body = createSearchSchema.parse(req.body);
    const { jobId, searchRequestId } = await createSearchJob({
      userId: req.user!.id,
      projectId: body.project_id ?? null,
      source: body.source,
      params: body.params,
      forceActorId: body.actor_id,
    });
    res.status(202).json({
      job_id: jobId,
      search_request_id: searchRequestId,
      status: 'queued',
      poll: `/jobs/${jobId}`,
    });
  }),
);

export default router;
