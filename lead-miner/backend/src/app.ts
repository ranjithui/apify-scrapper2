import express from 'express';
import cors from 'cors';
import api from './routes/index.js';
import { env, isConfigured } from './config/env.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  // CORS: "*" (or empty) → reflect any origin; otherwise an allow-list.
  // Trailing slashes are normalized so "https://x/" and "https://x" both match.
  const norm = (s: string) => s.trim().replace(/\/+$/, '');
  const allow = env.corsOrigin.split(',').map(norm).filter(Boolean);
  const allowAll = allow.length === 0 || allow.includes('*');
  app.use(
    cors({
      origin: allowAll
        ? true
        : (origin, cb) => {
            // Non-browser clients (curl, health checks) send no Origin — allow.
            if (!origin || allow.includes(norm(origin))) cb(null, true);
            else cb(null, false);
          },
    }),
  );
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
