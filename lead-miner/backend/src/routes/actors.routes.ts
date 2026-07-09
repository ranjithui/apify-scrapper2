import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { actorSchema, actorUpdateSchema, actorTestSchema } from './validators.js';
import {
  listActors,
  getActor,
  createActor,
  updateActor,
  deleteActor,
  activateActor,
} from '../services/actorRegistry.js';
import { runSource } from '../services/actorManager.js';

const router = Router();
router.use(requireAuth);

/** GET /actors?source= */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const actors = await listActors(
      req.query.source ? String(req.query.source) : undefined,
    );
    res.json({ actors });
  }),
);

/** GET /actors/:id */
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    res.json({ actor: await getActor(req.params.id) });
  }),
);

/** POST /actors */
router.post(
  '/',
  requireRole('admin', 'manager'),
  asyncHandler(async (req, res) => {
    const body = actorSchema.parse(req.body);
    res.status(201).json({ actor: await createActor(body) });
  }),
);

/** PUT /actors/:id */
router.put(
  '/:id',
  requireRole('admin', 'manager'),
  asyncHandler(async (req, res) => {
    const body = actorUpdateSchema.parse(req.body);
    res.json({ actor: await updateActor(req.params.id, body) });
  }),
);

/** DELETE /actors/:id */
router.delete(
  '/:id',
  requireRole('admin', 'manager'),
  asyncHandler(async (req, res) => {
    await deleteActor(req.params.id);
    res.json({ ok: true });
  }),
);

/** POST /actors/:id/activate — manual actor switching (Phase 1). */
router.post(
  '/:id/activate',
  requireRole('admin', 'manager'),
  asyncHandler(async (req, res) => {
    res.json({ actor: await activateActor(req.params.id) });
  }),
);

/**
 * POST /actors/test — run a specific actor with sample params WITHOUT storing
 * leads. Returns a small preview so operators can validate mappings.
 */
router.post(
  '/test',
  requireRole('admin', 'manager', 'operator'),
  asyncHandler(async (req, res) => {
    const { actor_id, params } = actorTestSchema.parse(req.body);
    const actor = await getActor(actor_id);
    const outcome = await runSource(actor.source, params, {
      forceActorId: actor_id,
      failover: false,
    });
    res.json({
      actor: outcome.actor.name,
      provider: outcome.providerKey,
      latency_ms: outcome.latencyMs,
      total: outcome.leads.length,
      preview: outcome.leads.slice(0, 10),
    });
  }),
);

export default router;
