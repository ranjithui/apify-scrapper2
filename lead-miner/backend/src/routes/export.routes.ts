import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { exportSchema } from './validators.js';
import { exportLeads, recordExport } from '../services/exportService.js';

const router = Router();
router.use(requireAuth);

/**
 * POST /export — stream a leads file (csv | excel | json) matching filters.
 */
router.post(
  '/',
  requireRole('admin', 'manager', 'operator'),
  asyncHandler(async (req, res) => {
    const body = exportSchema.parse(req.body);
    const result = await exportLeads(body.format, {
      projectId: body.project_id,
      jobId: body.job_id,
      source: body.source,
      minConfidence: body.min_confidence,
    });

    await recordExport(
      req.user!.id,
      body.format,
      { projectId: body.project_id, jobId: body.job_id, source: body.source },
      result.rowCount,
    );

    res.setHeader('Content-Type', result.contentType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${result.filename}"`,
    );
    res.setHeader('X-Row-Count', String(result.rowCount));
    res.send(result.body);
  }),
);

export default router;
