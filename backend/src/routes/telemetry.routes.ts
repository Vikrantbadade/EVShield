import { Router } from 'express';
import {
  getLiveTelemetry,
  ingestTelemetry,
  startNormalTraffic,
  startAttackSimulation,
  stopTraffic,
  resetDemo,
  executeMitigation,
  getActiveIncident,
  triggerScenario,
  setSimulationIntensity,
  getBaseline,
  resetBaseline,
  getThresholds,
  updateThresholds,
  getAnomalyAlerts,
  enableAutoDemo,
  disableAutoDemo,
  getAutoDemoStatus,
  selectDetector,
  getActiveDetector,
} from '../controllers/telemetry.controller.js';

const router = Router();

// Live Telemetry Endpoint
router.get('/live', getLiveTelemetry);
router.get('/incident', getActiveIncident);

// Ingestion Endpoint for real charging server telemetry stream
router.post('/ingest', ingestTelemetry);
router.post('/sample', ingestTelemetry);

// Baseline Endpoints
router.get('/baseline', getBaseline);
router.post('/baseline/reset', resetBaseline);

// Thresholds & Sensitivity Endpoints
router.get('/thresholds', getThresholds);
router.post('/thresholds', updateThresholds);

// Anomaly Alerts History Endpoint
router.get('/alerts', getAnomalyAlerts);

// Mitigation Endpoint
router.post('/mitigate', executeMitigation);

// Demo & Simulation Action Endpoints
router.post('/start-normal', startNormalTraffic);
router.post('/start-attack', startAttackSimulation);
router.post('/stop', stopTraffic);
router.post('/reset', resetDemo);
router.post('/simulate/intensity', setSimulationIntensity);
router.post('/simulate/:scenario', triggerScenario);

// Automatic Demo Simulation Endpoints
router.post('/auto-demo/enable', enableAutoDemo);
router.post('/auto-demo/disable', disableAutoDemo);
router.get('/auto-demo/status', getAutoDemoStatus);

// Detector Selection Endpoints
router.post('/select-detector', selectDetector);
router.get('/active-detector', getActiveDetector);

export default router;
