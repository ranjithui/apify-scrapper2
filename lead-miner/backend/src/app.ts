import express from 'express';
import cors from 'cors';
import api from './routes/index.js';
import { env, isConfigured } from './config/env.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  // CORS: "*" (or empty) → reflect any origin; otherwise an allow-list.
  const origins = env.corsOrigin
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const corsOrigin =
    origins.length === 0 || origins.includes('*') ? true : origins;
  app.use(cors({ origin: corsOrigin }));
  app.use(express.json({ limit: '2mb' }));

  // Health check
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      configured: isConfigured,
      failover: env.failoverEnabled,
      time: new Date().toISOString(),
    });
  });

  // Versioned + unversioned API mounts
  app.use('/api', api);
  app.use('/', api);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
