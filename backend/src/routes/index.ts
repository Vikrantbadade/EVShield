import { Router } from 'express';
import healthRoutes from './health.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import attackRoutes from './attack.routes.js';
import stationRoutes from './station.routes.js';
import alertRoutes from './alert.routes.js';
import analyticsRoutes from './analytics.routes.js';
import mlRoutes from './ml.routes.js';
import telemetryRoutes from './telemetry.routes.js';
import authRoutes from './auth.routes.js';

const router = Router();

// Version 1 API Endpoints
router.use('/auth', authRoutes);
router.use('/health', healthRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/attacks', attackRoutes);
router.use('/stations', stationRoutes);
router.use('/alerts', alertRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/ml', mlRoutes);
router.use('/telemetry', telemetryRoutes);
router.use('/demo', telemetryRoutes);

export default router;
