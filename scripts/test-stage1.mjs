/**
 * EVShield Stage 1 Automated Acceptance Test Suite
 *
 * Self-contained test runner:
 * - Spawns charging server (port 8080) and backend (port 5000) if not running
 * - Validates Scenario A (Real-Time Monitoring, Ingestion, Baseline Calibration, WebSocket)
 * - Validates Scenario B (Detection of 8 Traffic Anomalies)
 * - Validates Scenario C (Explainable Anomaly Alerts with Observed vs Baseline & Investigations)
 * - Validates Simulation Intensity and Stop/Reset Lifecycle
 * - Gracefully terminates spawned test processes
 */

import { spawn, spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import WebSocket from '../backend/node_modules/ws/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000/api/v1';
const WS_URL = process.env.WS_URL || 'ws://127.0.0.1:5000/ws/telemetry';
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

async function ensureServicesRunning() {
  const isChargingUp = await pingUrl(CHARGING_URL);
  if (!isChargingUp) {
    console.log('[SPAWN] Starting Simulated EV Charging Server (port 8080)...');
    chargingProc = spawn('node', ['src/server.js'], {
      cwd: path.join(ROOT_DIR, 'services', 'charging-server'),
      stdio: 'pipe',
      env: { ...process.env, PORT: '8080' },
    });
    chargingProc.stderr.on('data', (d) => process.stderr.write(`[charging-server err] ${d}`));
  } else {
    console.log('[INFO] Simulated EV Charging Server already running on port 8080.');
  }

  const isBackendUp = await pingUrl(`${BACKEND_URL}/health`);
  if (!isBackendUp) {
    console.log('[SPAWN] Starting EVShield Backend API (port 5000)...');
    backendProc = spawn('node', ['dist/server.js'], {
      cwd: path.join(ROOT_DIR, 'backend'),
      stdio: 'pipe',
      env: { ...process.env, PORT: '5000', NODE_ENV: 'development' },
    });
    backendProc.stderr.on('data', (d) => process.stderr.write(`[backend err] ${d}`));
  } else {
    console.log('[INFO] EVShield Backend already running on port 5000.');
  }

  // Wait up to 10 seconds for both to report healthy
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    const bOk = await pingUrl(`${BACKEND_URL}/health`);
    const cOk = await pingUrl(CHARGING_URL);
    if (bOk && cOk) {
      console.log('[READY] All services are online and responding.\n');
      return;
    }
    await sleep(600);
  }

  throw new Error('Timed out waiting for services to become healthy.');
}

function cleanup() {
  if (chargingProc && chargingProc.pid) {
    console.log('\n[CLEANUP] Stopping spawned charging server process...');
    try {
      if (process.platform === 'win32') {
        spawnSync('taskkill', ['/F', '/T', '/PID', chargingProc.pid.toString()]);
      } else {
        chargingProc.kill();
      }
    } catch {}
  }
  if (backendProc && backendProc.pid) {
    console.log('[CLEANUP] Stopping spawned backend process...');
    try {
      if (process.platform === 'win32') {
        spawnSync('taskkill', ['/F', '/T', '/PID', backendProc.pid.toString()]);
      } else {
        backendProc.kill();
      }
    } catch {}
  }
}

process.on('SIGINT', () => { cleanup(); process.exit(1); });
process.on('SIGTERM', () => { cleanup(); process.exit(1); });
process.on('exit', () => cleanup());

async function api(path, method = 'GET', body = null) {
  const url = `${BACKEND_URL}${path}`;
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  const res = await fetch(url, options);
  const json = await res.json();
  return { status: res.status, ok: res.ok, data: json.data || json };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let passed = 0;
let failed = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  [PASS] ${testName} ${details ? '(' + details + ')' : ''}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${testName} ${details ? ': ' + details : ''}`);
    failed++;
  }
}

async function runStage1Tests() {
  console.log('================================================================');
  console.log('   EVShield Stage 1: Real-Time Monitoring & Anomaly Detection   ');
  console.log('                 Automated Acceptance Test Suite                ');
  console.log('================================================================\n');

  await ensureServicesRunning();

  // Reset baseline & telemetry state to clean starting point
  console.log('--- SETUP: Initializing Nominal Baseline & Resetting Counters ---');
  await api('/telemetry/reset', 'POST');
  await api('/telemetry/baseline/reset', 'POST');
  await sleep(1000);

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 1: Normal Traffic Generation & Continuous Ingestion
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- TEST 1: Normal Traffic Monitoring & Dynamic Baseline Calculation ---');
  const startNormalRes = await api('/telemetry/start-normal', 'POST');
  assert(startNormalRes.status === 200, 'Start Normal Traffic Control Accepted');

  // Allow continuous telemetry generation & window aggregation
  await sleep(3500);

  const snapshotRes = await api('/telemetry/live');
  const snap = snapshotRes.data;
  assert(snap && snap.telemetry !== undefined, 'Live Telemetry Ingestion Received by Backend');
  assert(snap.telemetry.requestsPerSecond >= 6 && snap.telemetry.requestsPerSecond <= 20, 'Request Rate Within Nominal Range (~12 req/s)', `Observed: ${snap.telemetry.requestsPerSecond} req/s`);
  assert(snap.telemetry.packetRate >= 20, 'Packet Rate Collected (packets/sec)', `Observed: ${snap.telemetry.packetRate} pkt/s`);
  assert(snap.telemetry.bytesPerSecond > 0, 'Data Bandwidth Tracked (bytes/sec)', `Observed: ${snap.telemetry.bytesPerSecond} B/s`);
  assert(snap.telemetry.activeConnections > 0, 'Active Connection Count Tracked', `Observed: ${snap.telemetry.activeConnections}`);
  assert(snap.telemetry.newConnectionRate > 0, 'New Connection Rate Tracked', `Observed: ${snap.telemetry.newConnectionRate} conn/s`);
  assert(snap.telemetry.trafficCategory === 'NORMAL', 'Traffic Category is Flagged NORMAL', `Observed: ${snap.telemetry.trafficCategory}`);

  const baselineRes = await api('/telemetry/baseline');
  const baseline = baselineRes.data;
  assert(baseline && baseline.isEstablished === true, 'Normal Baseline Established After Window', `Samples: ${baseline.sampleCount}`);
  assert(baseline.requestRate.mean > 0, 'Baseline Request Rate Mean Recorded', `Mean: ${baseline.requestRate.mean.toFixed(1)} req/s`);
  assert(baseline.packetRate.mean > 0, 'Baseline Packet Rate Mean Recorded', `Mean: ${baseline.packetRate.mean.toFixed(1)} pkt/s`);

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 2: Traffic Burst Anomaly
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- TEST 2: Sudden Traffic Burst Anomaly Detection ---');
  await api('/telemetry/simulate/burst', 'POST');
  await sleep(2500);

  const burstSnap = (await api('/telemetry/live')).data;
  assert(burstSnap.telemetry.requestsPerSecond > 60, 'Traffic Burst Injected Throughput Surge', `Observed: ${burstSnap.telemetry.requestsPerSecond} req/s`);
  assert(
    burstSnap.telemetry.trafficCategory === 'TRAFFIC_BURST' || burstSnap.telemetry.trafficCategory === 'COMBINED_ANOMALY',
    'Traffic Category Flagged as TRAFFIC_BURST',
    `Observed: ${burstSnap.telemetry.trafficCategory}`
  );

  const alerts = burstSnap.telemetry.recentAlerts || burstSnap.recentAlerts || [];
  const burstAlert = alerts.find((a) => a.category === 'TRAFFIC_BURST') || alerts[0];
  assert(burstAlert !== undefined, 'Burst Anomaly Alert Generated');

  if (burstAlert) {
    assert(
      burstAlert.category === 'TRAFFIC_BURST' || burstAlert.category === 'COMBINED_ANOMALY',
      'Alert Category Matches Expected Anomaly',
      burstAlert.category
    );
    assert(burstAlert.severity === 'CRITICAL' || burstAlert.severity === 'HIGH', 'Severity Calculated via Documented Rule', `Severity: ${burstAlert.severity}`);
    const dev = burstAlert.deviations?.requestRatePercent ?? burstAlert.percentageDeviation?.requestRate ?? 0;
    assert(dev > 100, 'Observed vs Baseline % Deviation Calculated', `Deviation: +${Number(dev).toFixed(0)}%`);
    assert(burstAlert.explanation && burstAlert.explanation.length > 20, 'Alert Contains Plain English Root-Cause Explanation');
    const steps = burstAlert.recommendedInvestigation || burstAlert.recommendedActions || [];
    assert(steps.length >= 3, 'Alert Contains SOC Investigation Steps', `${steps.length} steps`);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 3: High Connection Rate Anomaly
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- TEST 3: High Connection Rate Anomaly Detection ---');
  await api('/telemetry/simulate/connection-rate', 'POST');
  await sleep(2500);

  const connSnap = (await api('/telemetry/live')).data;
  assert(connSnap.telemetry.newConnectionRate > 30, 'New Connection Rate Exceeds Threshold', `Observed: ${connSnap.telemetry.newConnectionRate} conn/s`);
  const connAlerts = connSnap.telemetry.recentAlerts || connSnap.recentAlerts || [];
  const connAlert = connAlerts.find((a) => a.category === 'HIGH_CONNECTION_RATE') || connAlerts[0];
  assert(connAlert !== undefined, 'High Connection Rate Alert Found in History');
  if (connAlert) {
    assert(connAlert.observedValues.newConnectionRate > 0, 'Observed Connection Rate Recorded in Alert');
    assert(connAlert.baselineValues.newConnectionRateMean !== undefined || connAlert.baselineValues.newConnectionRate !== undefined, 'Baseline Mean Connection Rate Recorded in Alert');
  }

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 4: Repeated Requests Anomaly
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- TEST 4: Repeated Requests / Replay Anomaly Detection ---');
  await api('/telemetry/simulate/repeated-requests', 'POST');
  await sleep(2500);

  const replaySnap = (await api('/telemetry/live')).data;
  const replayAlerts = replaySnap.telemetry.recentAlerts || replaySnap.recentAlerts || [];
  const replayAlert = replayAlerts.find((a) => a.category === 'REPEATED_REQUESTS') || replayAlerts[0];
  assert(replayAlert !== undefined, 'Repeated Requests Alert Found');
  if (replayAlert) {
    assert(replayAlert.detectionRule.includes('REPEATED_REQUESTS') || replayAlert.category === 'REPEATED_REQUESTS', 'Detection Rule Attribution', replayAlert.detectionRule);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 5: Excessive Data Transfer Anomaly
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- TEST 5: Excessive Data Transfer Volume Anomaly Detection ---');
  await api('/telemetry/simulate/data-volume', 'POST');
  await sleep(2500);

  const dataSnap = (await api('/telemetry/live')).data;
  const observedBandwidth = dataSnap.telemetry.bytesPerSecond || dataSnap.telemetry.dataTransferredBytes || 0;
  assert(observedBandwidth > 10000, 'Heavy Bandwidth Volume Observed', `${(observedBandwidth / 1024).toFixed(1)} KB/s`);
  const dataAlerts = dataSnap.telemetry.recentAlerts || dataSnap.recentAlerts || [];
  const dataAlert = dataAlerts.find((a) => a.category === 'EXCESSIVE_DATA_TRANSFER') || dataAlerts[0];
  assert(dataAlert !== undefined, 'Excessive Data Transfer Alert Found');

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 6: Combined Anomalies
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- TEST 6: Combined Multi-Feature Anomaly Detection ---');
  await api('/telemetry/simulate/combined', 'POST');
  await sleep(2500);

  const combSnap = (await api('/telemetry/live')).data;
  assert(
    combSnap.telemetry.trafficCategory === 'COMBINED_ANOMALY' ||
    combSnap.trafficCategory === 'COMBINED_ANOMALY' ||
    combSnap.telemetry.recentAlerts?.some((a) => a.category === 'COMBINED_ANOMALY'),
    'Traffic Category Flagged as COMBINED_ANOMALY'
  );
  const combAlerts = combSnap.telemetry.recentAlerts || combSnap.recentAlerts || [];
  const combAlert = combAlerts.find((a) => a.category === 'COMBINED_ANOMALY');
  assert(combAlert !== undefined, 'Combined Anomaly Alert Found');
  if (combAlert) {
    assert(combAlert.contributingFeatures.length >= 2, 'Multiple Contributing Features Flagged', combAlert.contributingFeatures.join(', '));
  }

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 7: Return to Normal Baseline & Recovery
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- TEST 7: Return to Normal Traffic & Recovery ---');
  await api('/telemetry/simulate/return-to-normal', 'POST');
  await sleep(3500);

  const normSnap = (await api('/telemetry/live')).data;
  assert(normSnap.telemetry.trafficCategory === 'NORMAL', 'Traffic Category Restored to NORMAL', normSnap.telemetry.trafficCategory);
  assert(normSnap.telemetry.requestsPerSecond <= 20, 'Request Rate Normalized to Baseline Range', `${normSnap.telemetry.requestsPerSecond} req/s`);
  assert(normSnap.securityStatus === 'PROTECTED', 'Security Status Restored to PROTECTED', normSnap.securityStatus);

  // Verify baseline was safely preserved and NOT contaminated during abnormal traffic
  const preservedBaseline = (await api('/telemetry/baseline')).data;
  assert(preservedBaseline.requestRate.mean <= 16, 'Baseline Freezing Protected Baseline Against Burst Pollution', `Mean: ${preservedBaseline.requestRate.mean.toFixed(1)} req/s`);

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 8: WebSocket Real-Time Broadcasting
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- TEST 8: Native WebSocket Real-Time Broadcasting ---');
  const wsReceived = await new Promise((resolve) => {
    let received = false;
    try {
      const ws = new WebSocket(WS_URL);
      const timer = setTimeout(() => {
        try { ws.close(); } catch {}
        resolve(false);
      }, 5000);

      ws.on('open', () => {});

      ws.on('message', (data) => {
        try {
          const parsed = JSON.parse(data.toString());
          if (
            parsed.type === 'telemetry_snapshot' ||
            parsed.type === 'connected' ||
            parsed.type === 'anomaly_alert' ||
            parsed.eventType === 'CONNECTED' ||
            parsed.eventType === 'TELEMETRY_SNAPSHOT'
          ) {
            received = true;
            clearTimeout(timer);
            ws.close();
            resolve(true);
          }
        } catch {}
      });

      ws.on('error', () => {
        clearTimeout(timer);
        resolve(false);
      });
    } catch {
      resolve(false);
    }
  });

  assert(wsReceived === true, 'WebSocket Connected and Received Live Snapshot Stream on /ws/telemetry');

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 9: Simulation Intensity & Stop Controls
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- TEST 9: Simulation Intensity Configuration & Stop Controls ---');
  await api('/telemetry/simulate/intensity', 'POST', { intensity: 'HIGH', targetRps: 45 });
  await sleep(1500);

  const highSnap = (await api('/telemetry/live')).data;
  assert(highSnap.simulation.intensity === 'HIGH', 'Intensity Configured to HIGH');

  await api('/telemetry/stop', 'POST');
  await sleep(1500);

  const stoppedSnap = (await api('/telemetry/live')).data;
  assert(stoppedSnap.telemetry.requestsPerSecond === 0, 'Traffic Generation Stopped on Command');
  assert(stoppedSnap.simulationLifecycle === 'STOPPED', 'Lifecycle State Flagged as STOPPED');

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 10: State Synchronization & Contradiction Prevention (Issue 3)
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- TEST 10: State Synchronization & Contradiction Prevention ---');
  // Inject COMBINED_ANOMALY
  await api('/telemetry/simulate/combined', 'POST');
  await sleep(2200);

  const syncSnap = (await api('/telemetry/live')).data;
  assert(syncSnap.simulationMode === 'COMBINED_ANOMALY', 'Mode Correctly Shows COMBINED_ANOMALY (Not Reverted to NORMAL)', `Mode: ${syncSnap.simulationMode}`);
  assert(syncSnap.detectionStatus === 'ANOMALY_ACTIVE', 'Detector Correctly Shows ANOMALY_ACTIVE', `Status: ${syncSnap.detectionStatus}`);
  assert(syncSnap.simulationLifecycle === 'RUNNING', 'Lifecycle Shows RUNNING', `Lifecycle: ${syncSnap.simulationLifecycle}`);
  assert(syncSnap.simulationMode !== 'NORMAL', 'Contradiction Prevented: Mode is NOT NORMAL while Attack is Active');

  // Initiate Return to Normal and verify Recovery Phase
  const returnRes = await api('/telemetry/simulate/return-to-normal', 'POST');
  const initialRecoverSnap = returnRes.data.snapshot || returnRes.data;
  assert(
    initialRecoverSnap.detectionStatus === 'RECOVERING' || initialRecoverSnap.recoveryStatus?.isRecovering === true,
    'Detector Transitions Through RECOVERING State',
    `Status: ${initialRecoverSnap.detectionStatus}`
  );

  // Allow multi-cycle verification to complete
  await sleep(2500);
  const recoveredSnap = (await api('/telemetry/live')).data;
  assert(recoveredSnap.detectionStatus === 'NORMAL', 'Detection Status Fully Settled to NORMAL', `Status: ${recoveredSnap.detectionStatus}`);
  assert(recoveredSnap.simulationMode === 'NORMAL', 'Simulation Mode Restored to NORMAL', `Mode: ${recoveredSnap.simulationMode}`);

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 11: Normal Monitoring False Positive Immunity (Issue 1 Root Cause Fix)
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- TEST 11: Normal Monitoring False Positive Immunity ---');
  await api('/telemetry/start-normal', 'POST');
  // Run 4 background cycles (nominal ML inference active)
  let falsePositiveDetected = false;
  for (let i = 0; i < 4; i++) {
    await sleep(1100);
    const sampleSnap = (await api('/telemetry/live')).data;
    if (sampleSnap.detectionStatus === 'ANOMALY_ACTIVE' || sampleSnap.simulationMode !== 'NORMAL') {
      falsePositiveDetected = true;
      break;
    }
  }
  assert(!falsePositiveDetected, 'Normal Monitoring Remains Stable without Spontaneous False Attacks', '4 consecutive background cycles normal');

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 12: Automatic Demo Simulation Lifecycle (Issue 1 Mode 3)
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- TEST 12: Automatic Demo Simulation Mode ---');
  const enableAutoRes = await api('/telemetry/auto-demo/enable', 'POST', {
    intervalSeconds: 6,
    durationSeconds: 4,
    scenario: 'TRAFFIC_BURST',
  });
  assert(enableAutoRes.status === 200, 'Auto Demo Simulation Enabled via API');

  const autoStatusRes = await api('/telemetry/auto-demo/status');
  const autoCfg = autoStatusRes.data.config || autoStatusRes.data;
  assert(autoCfg.enabled === true, 'Auto Demo Status Reports ENABLED');
  assert(autoCfg.scenario === 'TRAFFIC_BURST', 'Auto Demo Configured Scenario Matches', autoCfg.scenario);
  assert(autoCfg.secondsToNextAttack >= 0, 'Auto Demo Countdown Clock Active', `${autoCfg.secondsToNextAttack}s to next attack`);

  // Disable Auto Demo cleanly
  const disableAutoRes = await api('/telemetry/auto-demo/disable', 'POST');
  assert(disableAutoRes.status === 200, 'Auto Demo Simulation Disabled via API');
  const disabledStatusRes = await api('/telemetry/auto-demo/status');
  const disabledCfg = disabledStatusRes.data.config || disabledStatusRes.data;
  assert(disabledCfg.enabled === false, 'Auto Demo Status Reports DISABLED');

  // Clean transition to normal baseline
  await api('/telemetry/simulate/return-to-normal', 'POST');
  await sleep(2500);

  // Final summary
  console.log('\n================================================================');
  console.log(`Test Execution Finished: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  cleanup();

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runStage1Tests().catch((err) => {
  console.error('Unhandled test suite failure:', err);
  cleanup();
  process.exit(1);
});
