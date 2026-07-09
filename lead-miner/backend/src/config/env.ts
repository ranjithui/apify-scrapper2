import dotenv from 'dotenv';

dotenv.config();

function required(name: string): string {
  const v = process.env[name];
  if (!v) {
    // Do not throw at import time in dev so the server can boot and report
    // a clear health error; individual services validate on use.
    console.warn(`[config] Missing required env var: ${name}`);
    return '';
  }
  return v;
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',

  supabaseUrl: required('SUPABASE_URL'),
  supabaseAnonKey: required('SUPABASE_ANON_KEY'),
  supabaseServiceRoleKey: required('SUPABASE_SERVICE_ROLE_KEY'),

  apifyToken: process.env.APIFY_TOKEN ?? '',

  failoverEnabled:
    (process.env.FAILOVER_ENABLED ?? 'false').toLowerCase() === 'true',
  syncJobs: (process.env.SYNC_JOBS ?? 'false').toLowerCase() === 'true',
};

export const isConfigured = Boolean(
  env.supabaseUrl && env.supabaseServiceRoleKey,
);
