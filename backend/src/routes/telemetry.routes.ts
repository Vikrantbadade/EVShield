import { Router } from 'express';
import {
  getLiveTelemetry,
  startNormalTraffic,
  startAttackSimulation,
  stopTraffic,
  resetDemo,
} from '../controllers/telemetry.controller.js';

const router = Router();

// Live Telemetry Endpoint
router.get('/live', getLiveTelemetry);

// Demo Action Endpoints
router.post('/start-normal', startNormalTraffic);
router.post('/start-attack', startAttackSimulation);
router.post('/stop', stopTraffic);
router.post('/reset', resetDemo);

export default router;
