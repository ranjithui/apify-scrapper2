import { createApp } from './app.js';
import { env, isConfigured } from './config/env.js';
import { logger } from './utils/logger.js';

const app = createApp();

app.listen(env.port, () => {
  logger.info(`Lead Mining Platform API listening on :${env.port}`);
  if (!isConfigured) {
    logger.warn(
      'Supabase is NOT configured — set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env',
    );
  }
  if (!env.apifyToken) {
    logger.warn('APIFY_TOKEN is not set — live scraping will fail until configured');
  }
});
