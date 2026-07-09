import { Router } from 'express';
import authRoutes from './auth.routes.js';
import projectRoutes from './projects.routes.js';
import searchRoutes from './search.routes.js';
import jobRoutes from './jobs.routes.js';
import actorRoutes from './actors.routes.js';
import exportRoutes from './export.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import leadRoutes from './leads.routes.js';
import providerRoutes from './providers.routes.js';

const api = Router();

// auth endpoints are mounted at root (/login, /signup, /logout, /me ...)
api.use('/', authRoutes);
api.use('/projects', projectRoutes);
api.use('/search', searchRoutes);
api.use('/jobs', jobRoutes);
api.use('/actors', actorRoutes);
api.use('/leads', leadRoutes);
api.use('/providers', providerRoutes);
api.use('/export', exportRoutes);
api.use('/dashboard', dashboardRoutes);

export default api;
