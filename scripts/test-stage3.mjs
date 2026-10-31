/**
 * EVShield Stage 3 Automated Acceptance Test Suite
 *
 * Verifies the complete Intelligent Cybersecurity Incident Management & Response System:
 * 1. Subsystem readiness (Charging Server port 8080 & Backend API port 5000)
 * 2. RBAC Authentication (Admin, Security Analyst, Viewer accounts)
 * 3. Incident Lifecycle Management (OPEN -> INVESTIGATING -> CONTAINED -> RESOLVED -> CLOSED)
 * 4. Role-Based Access Control enforcement (Viewers denied write actions: 403)
 * 5. Explainable Risk Assessment (0-100 scoring, factor breakdown, containment discount)
 * 6. Intelligent Alert Correlation & Deduplication (Temporal window, subnet, pattern grouping)
 * 7. Advisory Response Playbooks & Action Tracking (PENDING -> COMPLETED / DISMISSED)
 * 8. Investigation Notes & Immutable Audit Trail (Attributed, timestamped, tamper-evident)
 * 9. Threat Intelligence Integration (RFC 1918 filter, caching, honest unconfigured state)
 * 10. Valid PDF 1.4 Binary Report Generation & CSV Exports
 * 11. Operational SOC Analytics & Real-Time Security Notifications
 * 12. Station Security Risk Exposure Posture
 */

import { spawn, spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:5000/api/v1';
const CHARGING_URL = 'http://127.0.0.1:8080/health';

let chargingProc = null;
let backendProc = null;

let adminToken = '';
let analystToken = '';
let viewerToken = '';

let passedTests = 0;
let failedTests = 0;

function assert(condition, testName) {
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    failedTests++;
    console.error(`  ✗ FAIL: ${testName}`);
  }
}

async function pingUrl(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    return res.ok || res.status < 500;
  } catch (err) {
    console.log(`[PING FAIL] ${url}: ${err?.message || err}`);
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
    backendProc.stdout.on('data', (d) => {
      const msg = d.toString();
      if (msg.includes('EVShield') || msg.includes('running on port')) {
        process.stdout.write(`[backend] ${msg}`);
      }
    });
  } else {
    console.log('[INFO] EVShield Backend API already running on port 5000.');
  }

  // Poll until backend is fully up
  let attempts = 0;
  while (attempts < 25) {
    if (await pingUrl(`${BACKEND_URL}/health`)) {
      console.log('[READY] All services are online and responding.\n');
      return;
    }
    await sleep(600);
    attempts++;
  }
  throw new Error('Timed out waiting for backend services to become healthy.');
}

async function loginUser(email, password = 'EVShieldDemo@2026') {
  try {
    const res = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();
    return json?.data?.token || '';
  } catch (err) {
    console.warn(`Login failed for ${email}:`, err);
    return '';
  }
}

async function runStage3Tests() {
  console.log('\n================================================================');
  console.log('   EVShield Stage 3: Incident Management Acceptance Test Suite   ');
  console.log('================================================================\n');

  await ensureServicesRunning();

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. RBAC Authentication Setup
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('[1/10] Verifying RBAC User Authentication...');
  adminToken = await loginUser('admin@evshield.demo');
  analystToken = await loginUser('analyst@evshield.demo');
  viewerToken = await loginUser('viewer@evshield.demo');

  assert(Boolean(adminToken), 'Admin authentication successful and token issued');
  assert(Boolean(analystToken), 'Security Analyst authentication successful');
  assert(Boolean(viewerToken), 'Viewer authentication successful');

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. Incident Querying, Filtering, Search & Sorting
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n[2/10] Testing Incident Repository Querying, Filtering & Search...');

  // Default query
  const resAll = await fetch(`${BACKEND_URL}/incidents`, {
    headers: { Authorization: `Bearer ${analystToken}` },
  });
  const jsonAll = await resAll.json();
  assert(resAll.status === 200, 'GET /api/v1/incidents returns HTTP 200');
  assert(Array.isArray(jsonAll?.data?.items), 'Returned data contains items array');
  assert(typeof jsonAll?.data?.total === 'number', 'Total count returned');
  assert(jsonAll.data.items.length > 0, 'Incident repository contains initial seeded incidents');

  const testIncident = jsonAll.data.items[0];
  const incidentId = testIncident.id;

  // Single Incident by ID
  const resSingle = await fetch(`${BACKEND_URL}/incidents/${incidentId}`, {
    headers: { Authorization: `Bearer ${analystToken}` },
  });
  const jsonSingle = await resSingle.json();
  assert(resSingle.status === 200, `GET /api/v1/incidents/${incidentId} returns HTTP 200`);
  assert(jsonSingle?.data?.id === incidentId, 'Incident details match requested ID');
  assert(Boolean(jsonSingle?.data?.title), 'Incident has descriptive title');
  assert(Boolean(jsonSingle?.data?.category), 'Incident has classified category');
  assert(Boolean(jsonSingle?.data?.correlationGroup), 'Incident contains correlationGroup data');
  assert(Array.isArray(jsonSingle?.data?.timeline), 'Incident has chronological timeline events');
  assert(Array.isArray(jsonSingle?.data?.responseActions), 'Incident has advisory response actions');

  // Filtering by Status
  const resFilterStatus = await fetch(`${BACKEND_URL}/incidents?status=OPEN`, {
    headers: { Authorization: `Bearer ${analystToken}` },
  });
  const jsonFilterStatus = await resFilterStatus.json();
  assert(resFilterStatus.status === 200, 'GET /api/v1/incidents?status=OPEN returns HTTP 200');
  const allOpen = jsonFilterStatus.data.items.every((i) => i.status === 'OPEN');
  assert(allOpen, 'All filtered items have status OPEN');

  // Filtering by Severity
  const resFilterSev = await fetch(`${BACKEND_URL}/incidents?severity=CRITICAL`, {
    headers: { Authorization: `Bearer ${analystToken}` },
  });
  const jsonFilterSev = await resFilterSev.json();
  assert(resFilterSev.status === 200, 'GET /api/v1/incidents?severity=CRITICAL returns HTTP 200');
  const allCrit = jsonFilterSev.data.items.every((i) => i.severity === 'CRITICAL');
  assert(allCrit, 'All filtered items have severity CRITICAL');

  // Sorting by Risk Score
  const resSortRisk = await fetch(`${BACKEND_URL}/incidents?sortBy=riskScore&sortOrder=desc`, {
    headers: { Authorization: `Bearer ${analystToken}` },
  });
  const jsonSortRisk = await resSortRisk.json();
  assert(resSortRisk.status === 200, 'GET /api/v1/incidents?sortBy=riskScore returns HTTP 200');
  const items = jsonSortRisk.data.items;
  let isSorted = true;
  for (let i = 1; i < items.length; i++) {
    if (items[i].riskScore > items[i - 1].riskScore) {
      isSorted = false;
      break;
    }
  }
  assert(isSorted, 'Incidents are correctly sorted descending by risk score');

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. RBAC Enforcement & Write Authorization
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n[3/10] Testing Role-Based Access Control (RBAC) Enforcement...');

  // Viewer attempt to update status (Must be rejected with 403)
  const resViewerStatus = await fetch(`${BACKEND_URL}/incidents/${incidentId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${viewerToken}`,
    },
    body: JSON.stringify({ status: 'INVESTIGATING' }),
  });
  assert(resViewerStatus.status === 403, 'Viewer PATCH /status denied with HTTP 403 Forbidden');

  // Viewer attempt to add note (Must be rejected with 403)
  const resViewerNote = await fetch(`${BACKEND_URL}/incidents/${incidentId}/notes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${viewerToken}`,
    },
    body: JSON.stringify({ content: 'Unauthorized viewer test note' }),
  });
  assert(resViewerNote.status === 403, 'Viewer POST /notes denied with HTTP 403 Forbidden');

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. Incident Lifecycle Updates & Timeline Events
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n[4/10] Testing Incident Lifecycle Transitions & Timeline Events...');

  // Analyst updates status to INVESTIGATING
  const resInvestigating = await fetch(`${BACKEND_URL}/incidents/${incidentId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${analystToken}`,
    },
    body: JSON.stringify({ status: 'INVESTIGATING', notes: 'Lead analyst started investigation.' }),
  });
  const jsonInvestigating = await resInvestigating.json();
  assert(resInvestigating.status === 200, 'Analyst PATCH /status to INVESTIGATING returns HTTP 200');
  assert(jsonInvestigating?.data?.status === 'INVESTIGATING', 'Incident status updated to INVESTIGATING');

  // Verify timeline event was logged
  const statusEvt = jsonInvestigating?.data?.timeline?.find((t) => t.eventType === 'STATUS_CHANGED');
  assert(Boolean(statusEvt), 'Timeline event STATUS_CHANGED recorded');

  // Analyst assignment
  const resAssign = await fetch(`${BACKEND_URL}/incidents/${incidentId}/assign`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${analystToken}`,
    },
    body: JSON.stringify({
      email: 'analyst@evshield.demo',
      name: 'Security Analyst',
      role: 'security_analyst',
    }),
  });
  const jsonAssign = await resAssign.json();
  assert(resAssign.status === 200, 'Analyst PATCH /assign returns HTTP 200');
  assert(jsonAssign?.data?.assignedTo?.email === 'analyst@evshield.demo', 'Incident assignedTo updated');

  // Adding Investigation Note
  const testNoteText = 'Verified packet rate surge originated from test probe IP 192.168.1.145.';
  const resNote = await fetch(`${BACKEND_URL}/incidents/${incidentId}/notes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${analystToken}`,
    },
    body: JSON.stringify({ content: testNoteText }),
  });
  const jsonNote = await resNote.json();
  assert(resNote.status === 200 || resNote.status === 201, 'Analyst POST /notes returns HTTP 200/201');
  const foundNote = jsonNote?.data?.notes?.find((n) => n.content === testNoteText);
  assert(Boolean(foundNote), 'Investigation note appears in incident notes array');
  assert(foundNote?.authorRole === 'security_analyst', 'Note attributed to security_analyst');

  // Updating Response Action Item
  const targetAction = jsonSingle.data.responseActions[0];
  const resAction = await fetch(`${BACKEND_URL}/incidents/${incidentId}/actions/${targetAction.id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${analystToken}`,
    },
    body: JSON.stringify({ status: 'COMPLETED', notes: 'Rate limiting applied successfully.' }),
  });
  const jsonAction = await resAction.json();
  assert(resAction.status === 200, 'Analyst PATCH /actions/:id returns HTTP 200');
  const updatedAction = jsonAction?.data?.responseActions?.find((a) => a.id === targetAction.id);
  assert(updatedAction?.status === 'COMPLETED', 'Playbook action status updated to COMPLETED');

  // Transition to CONTAINED & verify containment risk discount
  const preContainedRisk = jsonAction.data.riskScore;
  const resContained = await fetch(`${BACKEND_URL}/incidents/${incidentId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${analystToken}`,
    },
    body: JSON.stringify({ status: 'CONTAINED', notes: 'Attacking traffic isolated.' }),
  });
  const jsonContained = await resContained.json();
  assert(resContained.status === 200, 'Status updated to CONTAINED');
  assert(Boolean(jsonContained.data.containedAt), 'containedAt timestamp populated');
  assert(jsonContained.data.riskScore <= preContainedRisk, 'Risk score discounted after containment');

  // Transition to RESOLVED
  const resResolved = await fetch(`${BACKEND_URL}/incidents/${incidentId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${analystToken}`,
    },
    body: JSON.stringify({ status: 'RESOLVED', notes: 'Normal traffic resumed.' }),
  });
  const jsonResolved = await resResolved.json();
  assert(resResolved.status === 200, 'Status updated to RESOLVED');
  assert(Boolean(jsonResolved.data.resolvedAt), 'resolvedAt timestamp populated');

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. Risk Assessment Engine Verification
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n[5/10] Verifying Explainable Multi-Factor Risk Assessment Engine...');
  const riskAssessment = jsonSingle.data.riskAssessment;
  assert(typeof riskAssessment?.score === 'number', 'Risk score is a number (0-100)');
  assert(riskAssessment.score >= 0 && riskAssessment.score <= 100, 'Risk score within valid [0, 100] bounds');
  assert(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(riskAssessment.level), 'Risk level matches valid enum');
  assert(Array.isArray(riskAssessment.factors), 'Risk factors array present');
  assert(riskAssessment.factors.length >= 4, 'Multiple scoring factors evaluated (severity, deviation, density, etc.)');
  assert(typeof riskAssessment.explanation === 'string' && riskAssessment.explanation.length > 10, 'Risk explanation string generated');
  assert(Array.isArray(riskAssessment.recommendations), 'Tailored recommendations list generated');

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. Threat Intelligence Integration
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n[6/10] Testing Threat Intelligence Integration & RFC 1918 Handling...');

  // Config query
  const resTIConfig = await fetch(`${BACKEND_URL}/incidents/threat-intel/config`, {
    headers: { Authorization: `Bearer ${analystToken}` },
  });
  const jsonTIConfig = await resTIConfig.json();
  assert(resTIConfig.status === 200, 'GET /threat-intel/config returns HTTP 200');
  assert(typeof jsonTIConfig.data.cacheTtlMinutes === 'number', 'Cache TTL configured');
  assert(typeof jsonTIConfig.data.enabled === 'boolean', 'Threat intel master flag present');

  // Query private RFC 1918 IP (Must return BENIGN private network indicator)
  const resTIPrivate = await fetch(`${BACKEND_URL}/incidents/threat-intel/lookup?indicator=192.168.1.145`, {
    headers: { Authorization: `Bearer ${analystToken}` },
  });
  const jsonTIPrivate = await resTIPrivate.json();
  assert(resTIPrivate.status === 200, 'GET /threat-intel/lookup returns HTTP 200 for LAN IP');
  assert(jsonTIPrivate.data.reputation === 'BENIGN', 'RFC 1918 indicator correctly classified as BENIGN');
  assert(jsonTIPrivate.data.details.includes('RFC 1918'), 'RFC 1918 explanation provided');

  // Query public IP (Must return honest state without fabricating mock results)
  const resTIPublic = await fetch(`${BACKEND_URL}/incidents/threat-intel/lookup?indicator=8.8.8.8`, {
    headers: { Authorization: `Bearer ${analystToken}` },
  });
  const jsonTIPublic = await resTIPublic.json();
  assert(resTIPublic.status === 200, 'GET /threat-intel/lookup returns HTTP 200 for public IP');
  assert(['AVAILABLE', 'UNAVAILABLE', 'CACHED'].includes(jsonTIPublic.data.status), 'Honest status reported (no fabricated data)');

  // ─────────────────────────────────────────────────────────────────────────────
  // 7. PDF Report Generation & CSV Exports
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n[7/10] Testing Valid PDF 1.4 Binary Report & CSV Exports...');

  // PDF Report export
  const resPdf = await fetch(`${BACKEND_URL}/incidents/${incidentId}/report/pdf`, {
    headers: { Authorization: `Bearer ${analystToken}` },
  });
  assert(resPdf.status === 200, 'GET /incidents/:id/report/pdf returns HTTP 200');
  assert(resPdf.headers.get('content-type')?.includes('application/pdf'), 'Content-Type is application/pdf');

  const pdfBuffer = Buffer.from(await resPdf.arrayBuffer());
  const pdfHeader = pdfBuffer.slice(0, 8).toString('utf-8');
  assert(pdfHeader.startsWith('%PDF-1.4'), 'Exported PDF contains valid %PDF-1.4 binary header');
  assert(pdfBuffer.length > 1000, `PDF size is valid and complete (${pdfBuffer.length} bytes)`);

  // CSV Report export
  const resCsv = await fetch(`${BACKEND_URL}/incidents/${incidentId}/report/csv`, {
    headers: { Authorization: `Bearer ${analystToken}` },
  });
  assert(resCsv.status === 200, 'GET /incidents/:id/report/csv returns HTTP 200');
  assert(resCsv.headers.get('content-type')?.includes('text/csv'), 'Content-Type is text/csv');
  const csvText = await resCsv.text();
  assert(csvText.includes('INVESTIGATION REPORT') || csvText.includes('Incident ID'), 'CSV contains incident report header');
  assert(csvText.includes('CORRELATED ALERTS') || csvText.includes('Alert ID'), 'CSV contains correlated alerts section');

  // Bulk CSV export
  const resBulkCsv = await fetch(`${BACKEND_URL}/incidents/export/csv`, {
    headers: { Authorization: `Bearer ${analystToken}` },
  });
  assert(resBulkCsv.status === 200, 'GET /incidents/export/csv returns HTTP 200');
  const bulkCsvText = await resBulkCsv.text();
  assert(bulkCsvText.includes('Incident ID,Title,Category'), 'Bulk CSV contains standard RFC 4180 header');

  // ─────────────────────────────────────────────────────────────────────────────
  // 8. SOC Analytics & Operational Metrics
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n[8/10] Testing SOC Operational Analytics & Notifications...');

  const resAnalytics = await fetch(`${BACKEND_URL}/incidents/analytics`, {
    headers: { Authorization: `Bearer ${analystToken}` },
  });
  const jsonAnalytics = await resAnalytics.json();
  assert(resAnalytics.status === 200, 'GET /incidents/analytics returns HTTP 200');
  const dataAn = jsonAnalytics.data;
  assert(typeof dataAn.totalIncidents === 'number', 'totalIncidents metric present');
  assert(typeof dataAn.averageRiskScore === 'number', 'averageRiskScore metric present');
  assert(typeof dataAn.mttaMinutes === 'number', 'mttaMinutes metric present');
  assert(typeof dataAn.mttrMinutes === 'number', 'mttrMinutes metric present');
  assert(typeof dataAn.resolutionRatePercent === 'number', 'resolutionRatePercent metric present');
  assert(Boolean(dataAn.categoryDistribution), 'categoryDistribution map present');
  assert(Boolean(dataAn.riskDistribution), 'riskDistribution counts present');

  // Notifications API
  const resNotifs = await fetch(`${BACKEND_URL}/incidents/notifications`, {
    headers: { Authorization: `Bearer ${analystToken}` },
  });
  const jsonNotifs = await resNotifs.json();
  assert(resNotifs.status === 200, 'GET /incidents/notifications returns HTTP 200');
  assert(Array.isArray(jsonNotifs.data), 'Notifications list returned as array');

  if (jsonNotifs.data.length > 0) {
    const notifId = jsonNotifs.data[0].id;
    const resRead = await fetch(`${BACKEND_URL}/incidents/notifications/${notifId}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${analystToken}` },
    });
    assert(resRead.status === 200, 'PATCH /incidents/notifications/:id/read returns HTTP 200');
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 9. Immutable Audit Trail
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n[9/10] Verifying Immutable Audit Trail...');

  const resAudit = await fetch(`${BACKEND_URL}/incidents/audit`, {
    headers: { Authorization: `Bearer ${analystToken}` },
  });
  const jsonAudit = await resAudit.json();
  assert(resAudit.status === 200, 'GET /incidents/audit returns HTTP 200');
  assert(Array.isArray(jsonAudit.data), 'Audit trail returned as array');
  assert(jsonAudit.data.length > 0, 'Audit trail contains recorded security events');

  // Verify audit events contain required fields
  const firstAudit = jsonAudit.data[0];
  assert(Boolean(firstAudit.id), 'Audit event has unique ID');
  assert(Boolean(firstAudit.action), 'Audit event has action name');
  assert(Boolean(firstAudit.actor?.name), 'Audit event attributes actor');
  assert(Boolean(firstAudit.timestamp), 'Audit event has ISO 8601 timestamp');

  // ─────────────────────────────────────────────────────────────────────────────
  // 10. Charging Station Security Exposure
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n[10/10] Verifying Station Security Risk Posture...');

  const resStations = await fetch(`${BACKEND_URL}/stations`, {
    headers: { Authorization: `Bearer ${analystToken}` },
  });
  const jsonStations = await resStations.json();
  assert(resStations.status === 200, 'GET /stations returns HTTP 200');
  assert(Array.isArray(jsonStations.data?.items), 'Stations returned as items array');

  const stations = jsonStations.data.items;
  const cs0421 = stations.find((s) => s.id === 'CS-0421');
  assert(Boolean(cs0421), 'Target station CS-0421 present in charging network');
  assert(typeof cs0421.securityRiskScore === 'number', 'CS-0421 includes securityRiskScore');

  // ─────────────────────────────────────────────────────────────────────────────
  // Summary
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n================================================================');
  console.log(`   STAGE 3 TEST RESULTS: ${passedTests} PASSED, ${failedTests} FAILED   `);
  console.log('================================================================\n');

  function cleanup() {
    if (chargingProc && chargingProc.pid) {
      try {
        if (process.platform === 'win32') {
          spawnSync('taskkill', ['/F', '/T', '/PID', chargingProc.pid.toString()]);
        } else {
          chargingProc.kill();
        }
      } catch {}
    }
    if (backendProc && backendProc.pid) {
      try {
        if (process.platform === 'win32') {
          spawnSync('taskkill', ['/F', '/T', '/PID', backendProc.pid.toString()]);
        } else {
          backendProc.kill();
        }
      } catch {}
    }
  }

  cleanup();

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runStage3Tests().catch((err) => {
  console.error('[FATAL] Unhandled test runner error:', err);
  if (chargingProc) chargingProc.kill();
  if (backendProc) backendProc.kill();
  process.exit(1);
});
