import type { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { unauthorized, forbidden } from '../utils/errors.js';
import type { AuthUser, UserRole } from '../types/index.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/**
 * Verifies the Supabase JWT from the Authorization header and loads the user's
 * role from public.users.
 */
export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const header = req.headers.authorization ?? '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    if (!token) throw unauthorized('Missing bearer token');

    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user) throw unauthorized('Invalid or expired token');

    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('role, email')
      .eq('id', data.user.id)
      .single();

    req.user = {
      id: data.user.id,
      email: profile?.email ?? data.user.email ?? '',
      role: (profile?.role as UserRole) ?? 'viewer',
      accessToken: token,
    };
    next();
  } catch (err) {
    next(err);
  }
}

/** Role gate. Usage: requireRole('admin', 'manager') */
export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(unauthorized());
    if (!roles.includes(req.user.role)) {
      return next(forbidden(`Requires role: ${roles.join(' or ')}`));
    }
    next();
  };
}
