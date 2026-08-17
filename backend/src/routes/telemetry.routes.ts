import { Router } from 'express';
import {
  getLiveTelemetry,
  ingestTelemetry,
  startNormalTraffic,
  startAttackSimulation,
  stopTraffic,
  resetDemo,
} from '../controllers/telemetry.controller.js';

const router = Router();

// Live Telemetry Endpoint
router.get('/live', getLiveTelemetry);

// Ingestion Endpoint for real charging server telemetry stream
router.post('/ingest', ingestTelemetry);
router.post('/sample', ingestTelemetry);

// Demo Action Endpoints
router.post('/start-normal', startNormalTraffic);
router.post('/start-attack', startAttackSimulation);
router.post('/stop', stopTraffic);
router.post('/reset', resetDemo);

export default router;
