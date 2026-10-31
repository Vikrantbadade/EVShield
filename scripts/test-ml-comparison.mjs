/**
 * EVShield Multi-Detector & Model Comparison Acceptance Test Suite
 *
 * Verifies:
 * 1. Subsystem health: Charging Server, Backend, Python Daemon, and ML Models.
 * 2. Model Comparison API (/api/v1/ml/comparison):
 *    - Threshold Detection, Random Forest, Isolation Forest benchmark metrics.
 *    - 2x2 and 7x7 confusion matrices.
 *    - Feature importance and outlier score distributions.
 * 3. Unified Inference API (/api/v1/ml/predict):
 *    - Normal and anomalous network-flow prediction across all 3 methods + ensemble.
 * 4. Active Detector Selector (/api/v1/telemetry/select-detector):
 *    - Switching between THRESHOLD, RANDOM_FOREST, ISOLATION_FOREST, and ENSEMBLE.
 *    - Synchronizing active detector into live snapshots and telemetry alerts.
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000/api/v1';
const CHARGING_URL = 'http://localhost:8080/health';

let chargingProc = null;
let backendProc = null;

async function pingUrl(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(1200) });
    return res.ok || res.status < 500;
  } catch {
    return false;
  }
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function ensureServicesRunning() {
  const isChargingUp = await pingUrl(CHARGING_URL);
  if (!isChargingUp) {
    console.log('[SPAWN] Starting Simulated EV Charging Server (port 8080)...');
    chargingProc = spawn('node', ['src/server.js'], {
      cwd: path.join(ROOT_DIR, 'services', 'charging-server'),
      stdio: 'pipe',
      env: { ...process.env, PORT: '8080' },
    });
    chargingProc.stderr?.on('data', (d) => process.stderr.write(`[charging-server err] ${d}`));
  } else {
    console.log('[INFO] Simulated EV Charging Server running on port 8080.');
  }

  const isBackendUp = await pingUrl(`${BACKEND_URL}/health`);
  if (!isBackendUp) {
    console.log('[SPAWN] Starting EVShield Backend API (port 5000)...');
    backendProc = spawn('node', ['dist/server.js'], {
      cwd: path.join(ROOT_DIR, 'backend'),
      stdio: 'pipe',
      env: { ...process.env, PORT: '5000', NODE_ENV: 'development' },
    });
    backendProc.stderr?.on('data', (d) => process.stderr.write(`[backend err] ${d}`));
  } else {
    console.log('[INFO] EVShield Backend API already running on port 5000.');
  }

  // Poll until backend is healthy
  let retries = 35;
  while (retries-- > 0) {
    if (await pingUrl(`${BACKEND_URL}/health`)) {
      console.log('[READY] Backend API is up and healthy.');
      return;
    }
    await sleep(400);
  }
  throw new Error('Backend failed to respond within timeout window.');
}

function cleanup() {
  if (backendProc) {
    console.log('[CLEANUP] Stopping spawned backend process...');
    backendProc.kill();
  }
  if (chargingProc) {
    console.log('[CLEANUP] Stopping spawned charging-server process...');
    chargingProc.kill();
  }
}

async function runTestSuite() {
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    await ensureServicesRunning();

    console.log('\n======================================================');
    console.log('TEST SUITE 1: ML Model Status & Daemon Verification');
    console.log('======================================================');

    const statusRes = await fetch(`${BACKEND_URL}/ml/status`);
    assert(statusRes.ok, 'GET /ml/status returns HTTP 200');
    const statusData = (await statusRes.json()).data;

    assert(statusData.status === 'READY', `ML Status is READY (got ${statusData.status})`);
    assert(statusData.modelsLoaded.threshold === true, 'Threshold Detector model loaded');
    assert(statusData.modelsLoaded.random_forest === true, 'Random Forest model loaded');
    assert(statusData.modelsLoaded.isolation_forest === true, 'Isolation Forest model loaded');
    assert(statusData.availableDetectors.includes('ENSEMBLE'), 'Ensemble method is available');

    console.log('\n======================================================');
    console.log('TEST SUITE 2: Model Comparison & Benchmark Report');
    console.log('======================================================');

    const compRes = await fetch(`${BACKEND_URL}/ml/comparison`);
    assert(compRes.ok, 'GET /ml/comparison returns HTTP 200');
    const comp = (await compRes.json()).data;

    assert(comp.dataset.total_test_samples === 600, `Held-out test set has 600 samples (got ${comp.dataset.total_test_samples})`);
    assert(comp.models.threshold !== undefined, 'Threshold model details present');
    assert(comp.models.random_forest !== undefined, 'Random Forest model details present');
    assert(comp.models.isolation_forest !== undefined, 'Isolation Forest model details present');

    // Threshold metrics
    assert(comp.models.threshold.metrics.accuracy >= 0.95, `Threshold accuracy >= 95% (got ${(comp.models.threshold.metrics.accuracy * 100).toFixed(1)}%)`);
    assert(comp.models.threshold.metrics.latency_ms <= 0.5, `Threshold latency ultra-fast (got ${comp.models.threshold.metrics.latency_ms} ms)`);

    // Random forest metrics
    assert(comp.models.random_forest.metrics.accuracy >= 0.98, `Random Forest accuracy >= 98% (got ${(comp.models.random_forest.metrics.accuracy * 100).toFixed(1)}%)`);
    assert(comp.models.random_forest.metrics.false_positive_rate <= 0.02, `Random Forest FPR <= 2% (got ${(comp.models.random_forest.metrics.false_positive_rate * 100).toFixed(2)}%)`);
    assert(comp.models.random_forest.feature_importance !== undefined, 'Random forest feature importance ranking present');
    assert(comp.models.random_forest.metrics.multi_class !== undefined, 'Random Forest 7x7 multi-class confusion matrix present');

    // Isolation forest metrics
    assert(comp.models.isolation_forest.metrics.recall >= 0.95, `Isolation Forest recall >= 95% (got ${(comp.models.isolation_forest.metrics.recall * 100).toFixed(1)}%)`);
    assert(comp.models.isolation_forest.score_distribution !== undefined, 'Isolation forest outlier score distribution present');
    assert(comp.models.isolation_forest.score_distribution.normal.median > 0, `Normal median score is positive (got ${comp.models.isolation_forest.score_distribution.normal.median})`);
    assert(comp.models.isolation_forest.score_distribution.anomalous.median < 0, `Anomalous median score is negative (got ${comp.models.isolation_forest.score_distribution.anomalous.median})`);

    console.log('\n======================================================');
    console.log('TEST SUITE 3: Unified Network-Flow Prediction (Inference)');
    console.log('======================================================');

    // 1. Normal Sample Prediction
    const normalPayload = {
      packet_rate: 48,
      request_rate: 12,
      new_connection_rate: 10,
      active_connections: 6,
      data_transfer_volume: 6144,
      connection_duration: 14,
      request_frequency: 1.2,
      method: 'ALL',
    };

    const normalPredRes = await fetch(`${BACKEND_URL}/ml/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(normalPayload),
    });
    assert(normalPredRes.ok, 'POST /ml/predict for normal sample returns HTTP 200');
    const normalPred = (await normalPredRes.json()).data;
    assert(normalPred.classification === 'NORMAL', `Normal sample classified NORMAL (got ${normalPred.classification})`);
    assert(normalPred.all_results?.threshold?.is_anomaly === false, 'Threshold detector predicted normal');
    assert(normalPred.all_results?.random_forest?.is_anomaly === false, 'Random Forest detector predicted normal');
    assert(normalPred.all_results?.isolation_forest?.is_anomaly === false, 'Isolation Forest detector predicted normal');

    // 2. High Burst Anomaly Sample Prediction
    const burstPayload = {
      packet_rate: 750,
      request_rate: 180,
      new_connection_rate: 85,
      active_connections: 45,
      data_transfer_volume: 98000,
      connection_duration: 25,
      request_frequency: 8.5,
      method: 'ALL',
    };

    const burstPredRes = await fetch(`${BACKEND_URL}/ml/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(burstPayload),
    });
    assert(burstPredRes.ok, 'POST /ml/predict for burst anomaly returns HTTP 200');
    const burstPred = (await burstPredRes.json()).data;
    assert(burstPred.classification === 'ATTACK', `Burst sample classified ATTACK (got ${burstPred.classification})`);
    assert(burstPred.all_results?.threshold?.is_anomaly === true, 'Threshold detector flagged anomaly');
    assert(burstPred.all_results?.random_forest?.is_anomaly === true, 'Random Forest flagged anomaly');
    assert(burstPred.all_results?.isolation_forest?.is_anomaly === true, 'Isolation Forest flagged anomaly');

    console.log('\n======================================================');
    console.log('TEST SUITE 4: Active Detector Selection & Live Sync');
    console.log('======================================================');

    const testDetectors = ['THRESHOLD', 'RANDOM_FOREST', 'ISOLATION_FOREST', 'ENSEMBLE'];

    for (const det of testDetectors) {
      const selectRes = await fetch(`${BACKEND_URL}/telemetry/select-detector`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ detector: det }),
      });
      assert(selectRes.ok, `POST /telemetry/select-detector (${det}) returns HTTP 200`);

      const getActiveRes = await fetch(`${BACKEND_URL}/telemetry/active-detector`);
      const getActiveData = (await getActiveRes.json()).data;
      assert(getActiveData.activeDetector === det, `GET /telemetry/active-detector reflects ${det} (got ${getActiveData.activeDetector})`);

      const liveRes = await fetch(`${BACKEND_URL}/telemetry/live`);
      const liveData = (await liveRes.json()).data;
      assert(liveData.activeDetector === det, `Live snapshot activeDetector is ${det} (got ${liveData.activeDetector})`);
    }

    console.log('\n======================================================');
    console.log('TEST SUITE 5: Ingestion & Explainable Alert Generation');
    console.log('======================================================');

    // Switch active detector to RANDOM_FOREST
    await fetch(`${BACKEND_URL}/telemetry/select-detector`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ detector: 'RANDOM_FOREST' }),
    });

    // Ingest burst anomaly sample
    const ingestRes = await fetch(`${BACKEND_URL}/telemetry/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sample: {
          timestamp: Date.now(),
          endpoint: '/ocpp/v16/charge',
          durationMs: 16,
          status: 200,
          packetCount: 50,
          bytesTransferred: 32768,
          activeConnections: 12,
          newConnections: 8,
          isAnomaly: true,
          anomalyType: 'TRAFFIC_BURST',
        },
      }),
    });
    assert(ingestRes.ok, 'POST /telemetry/ingest returns HTTP 200');

    // Trigger traffic burst scenario to confirm alert pipeline
    const triggerRes = await fetch(`${BACKEND_URL}/telemetry/simulate/burst`, { method: 'POST' });
    assert(triggerRes.ok, 'POST /telemetry/simulate/burst returns HTTP 200');

    await sleep(1200);

    const alertsRes = await fetch(`${BACKEND_URL}/telemetry/alerts`);
    assert(alertsRes.ok, 'GET /telemetry/alerts returns HTTP 200');
    const alertsData = (await alertsRes.json()).data;
    assert(alertsData.items.length > 0, `Explainable anomaly alerts recorded (count: ${alertsData.items.length})`);

    const latestAlert = alertsData.items[0];
    assert(latestAlert.observedValues !== undefined, 'Alert has observed feature values');
    assert(latestAlert.baselineValues !== undefined, 'Alert has baseline comparison values');
    assert(latestAlert.deviations !== undefined, 'Alert has calculated deviations');
    assert(latestAlert.recommendedInvestigation?.length > 0, 'Alert has SOC investigation playbook steps');

    // Return to normal
    await fetch(`${BACKEND_URL}/telemetry/simulate/return-to-normal`, { method: 'POST' });
    console.log('[RESTORE] Telemetry returned to nominal baseline.');

    console.log('\n======================================================');
    console.log(`SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('======================================================\n');

    if (failed > 0) {
      process.exitCode = 1;
    }
  } catch (err) {
    console.error('[ERROR] Acceptance test suite exception:', err);
    process.exitCode = 1;
  } finally {
    cleanup();
  }
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

runTestSuite();
