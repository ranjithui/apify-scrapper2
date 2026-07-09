import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from './env.js';

// createClient() throws on an empty/invalid URL. Fall back to a syntactically
// valid placeholder so the server can still boot and report `configured:false`
// on /health — real requests then fail with a clear network error until the
// operator sets SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.
const PLACEHOLDER_URL = 'https://placeholder.supabase.co';

/**
 * Service-role client — bypasses RLS. Used for all backend data access and
 * for verifying user JWTs. NEVER expose this key to the browser.
 */
export const supabaseAdmin: SupabaseClient = createClient(
  env.supabaseUrl || PLACEHOLDER_URL,
  env.supabaseServiceRoleKey || 'placeholder-key',
  { auth: { persistSession: false, autoRefreshToken: false } },
);

/**
 * Returns a client scoped to a specific user's access token so that RLS is
 * enforced on their behalf when we want per-user isolation.
 */
export function supabaseForToken(accessToken: string): SupabaseClient {
  return createClient(env.supabaseUrl || PLACEHOLDER_URL, env.supabaseAnonKey || 'placeholder-key', {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
