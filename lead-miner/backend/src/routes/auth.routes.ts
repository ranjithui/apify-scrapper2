import { Router } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../config/supabase.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { badRequest, unauthorized } from '../utils/errors.js';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

/** POST /login — email/password → Supabase session (access + refresh token). */
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });
    if (error || !data.session) throw unauthorized(error?.message ?? 'Login failed');
    res.json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user: data.user,
    });
  }),
);

/** POST /signup — convenience for creating the first users. */
router.post(
  '/signup',
  asyncHandler(async (req, res) => {
    const schema = loginSchema.extend({
      full_name: z.string().optional(),
      role: z.enum(['admin', 'manager', 'operator', 'viewer']).optional(),
    });
    const body = schema.parse(req.body);
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true,
      user_metadata: { full_name: body.full_name },
    });
    if (error || !data.user) throw badRequest(error?.message ?? 'Signup failed');
    // set role (trigger inserts default 'viewer')
    await supabaseAdmin
      .from('users')
      .update({ role: body.role ?? 'viewer', full_name: body.full_name })
      .eq('id', data.user.id);
    res.status(201).json({ user: data.user });
  }),
);

/** POST /logout — best-effort session revoke. */
router.post(
  '/logout',
  requireAuth,
  asyncHandler(async (req, res) => {
    await supabaseAdmin.auth.admin.signOut(req.user!.accessToken).catch(() => {});
    res.json({ ok: true });
  }),
);

/** POST /password-reset — sends a reset email. */
router.post(
  '/password-reset',
  asyncHandler(async (req, res) => {
    const { email } = z.object({ email: z.string().email() }).parse(req.body);
    await supabaseAdmin.auth.resetPasswordForEmail(email);
    res.json({ ok: true });
  }),
);

/** GET /me — current profile. */
router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({ user: req.user });
  }),
);

export default router;
