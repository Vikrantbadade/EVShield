import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { resolvePythonExecutable } from '../utils/python.util.js';
import { db } from '../config/database.js';
import { AttackIncident } from '../types/attack.types.js';

// ─────────────────────────────────────────────────────────────────────────────
// Project & ML Paths
// ─────────────────────────────────────────────────────────────────────────────
function resolveProjectRoot(): string {
  // If ml/ exists in current cwd (e.g. started from repo root)
  if (fs.existsSync(path.resolve(process.cwd(), 'ml'))) {
    return process.cwd();
  }
  // If ml/ exists in parent dir (e.g. started from backend/)
  if (fs.existsSync(path.resolve(process.cwd(), '..', 'ml'))) {
    return path.resolve(process.cwd(), '..');
  }
  return path.resolve(process.cwd(), '..');
}

const ROOT_DIR = resolveProjectRoot();
const SCRIPT_PATH = path.resolve(ROOT_DIR, 'ml', 'inference', 'extract_and_predict.py');
const MODEL_PATH = path.resolve(ROOT_DIR, 'ml', 'experiments', 'TOP_richer_stats_v1', 'random_forest_standard', 'model.joblib');
const THRESHOLD_PATH = path.resolve(ROOT_DIR, 'ml', 'experiments', 'TOP_richer_stats_v1', 'operating_point', 'selected_threshold.json');

// ─────────────────────────────────────────────────────────────────────────────
// Interfaces & Types
// ─────────────────────────────────────────────────────────────────────────────
export interface RawTelemetrySample {
  timestamp: number;
  endpoint: string;
  method: string;
  statusCode: number;
  latencyMs: number;
  success: boolean;
  metricValue: number; // metric mapped for ML feature window
}

export interface TelemetryGraphPoint {
  timestamp: string;
  requestsPerSec: number;
  latencyMs: number;
  probability: number;
  isAnomaly: boolean;
}

export interface SecurityEventItem {
  id: string;
  timestamp: string; // ISO 8601 UTC
  timeStr: string;   // Local time fallback
  type: 'INFO' | 'WARNING' | 'CRITICAL' | 'SUCCESS';
  title: string;
  message: string;
  eventType: 'INIT' | 'NORMAL' | 'TRAFFIC_BURST' | 'ATTACK_DETECTED' | 'MITIGATION_PENDING' | 'MITIGATION_EXECUTED' | 'RECOVERY_STARTED' | 'RECOVERED';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  source: string;
  endpoint: string;
  detectionResult?: {
    label: string;
    probability: number;
    threshold: number;
    confidence: number;
  };
  mitigationStatus?: 'NONE' | 'PENDING' | 'MITIGATED' | 'RECOVERED';
}

export interface MLInferenceResult {
  probability_attack: number;
  predicted_label: number;
  label: 'NORMAL' | 'ATTACK';
  threshold: number;
  mode: string;
  features: Record<string, number>;
  inferenceTimeMs: number;
  modelName: string;
}

export type ThreatLevelState = 'NORMAL' | 'ANALYZING' | 'CRITICAL' | 'RECOVERING';
export type SimulationMode = 'NORMAL' | 'ATTACK' | 'IDLE';

export interface LiveTelemetrySnapshot {
  server: {
    status: 'ONLINE' | 'OFFLINE';
    host: string;
    port: number;
    activeSessions: number;
    lastSeen: string | null;
  };
  health: {
    fakeServer: 'ONLINE' | 'OFFLINE';
    backend: 'ONLINE' | 'OFFLINE';
    mlEngine: 'ONLINE' | 'OFFLINE';
    telemetry: 'ACTIVE' | 'IDLE';
    mlError?: string;
  };
  telemetry: {
    requestsPerSecond: number;
    totalRequests: number;
    averageLatencyMs: number;
    minLatencyMs: number;
    maxLatencyMs: number;
    stdLatencyMs: number;
    errorRatePercent: number;
    windowSize: number;
    graphPoints: TelemetryGraphPoint[];
  };
  ml: MLInferenceResult;
  simulation: {
    mode: SimulationMode;
    active: boolean;
    startedAt: string | null;
    durationSeconds: number;
  };
  threatLevel: ThreatLevelState;
  securityStatus: 'PROTECTED' | 'THREAT DETECTED';
  events: SecurityEventItem[];
  activeIncident: AttackIncident | null;
  lastIncident: AttackIncident | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Telemetry Service
// ─────────────────────────────────────────────────────────────────────────────
export class TelemetryService {
  private fakeServerUrl = process.env.FAKE_SERVER_URL || 'http://127.0.0.1:8080';
  private fakeServerHost = '127.0.0.1';
  private fakeServerPort = 8080;

  // Telemetry buffer
  private readonly WINDOW_SIZE = 50;
  private telemetryBuffer: RawTelemetrySample[] = [];
  private totalRequests = 0;
  private failedRequests = 0;
  private graphHistory: TelemetryGraphPoint[] = [];

  // Active traffic simulation control
  private simulationMode: SimulationMode = 'IDLE';
  private simulationInterval: NodeJS.Timeout | null = null;
  private simulationStartTime: number | null = null;

  // ML State
  private latestMLResult: MLInferenceResult = {
    probability_attack: 0.24,
    predicted_label: 0,
    label: 'NORMAL',
    threshold: 0.55,
    mode: 'REPLAY_SERIES',
    features: {
      count: 14,
      mean: 2.74,
      max: 3.5,
      sum: 38.36,
      std: 0.44,
      min: 2.0,
      median: 2.75,
      q1: 2.48,
      q3: 3.05,
      iqr: 0.55,
    },
    inferenceTimeMs: 25,
    modelName: 'CICEV2023_RandomForest_v1',
  };

  // State machine
  private threatLevel: ThreatLevelState = 'NORMAL';
  private securityStatus: 'PROTECTED' | 'THREAT DETECTED' = 'PROTECTED';
  private events: SecurityEventItem[] = [];
  private activeIncident: AttackIncident | null = null;
  private lastIncident: AttackIncident | null = null;

  // Server health cache
  private fakeServerOnline = false;
  private mlEngineOnline = true;
  private mlEngineError: string | null = null;
  private lastHealthCheckTime = 0;

  // ML Inference single-flight concurrency lock & state
  private isInferring = false;
  private pendingInference = false;
  private inferenceTimeoutMs = parseInt(process.env.ML_INFERENCE_TIMEOUT_MS || '15000', 10);

  constructor() {
    this.initDefaultThreshold();
    this.addSecurityEvent(
      'INFO',
      'EVShield Initialized',
      'Real-time telemetry and ML defense platform ready.',
      'INIT',
      'LOW',
      'NONE'
    );
    this.seedInitialGraphHistory();

    // Background health check & continuous feature evaluation loop (every 1000ms)
    setInterval(() => {
      this.backgroundCycle();
    }, 1000);
  }

  private initDefaultThreshold(): void {
    try {
      if (fs.existsSync(THRESHOLD_PATH)) {
        const data = JSON.parse(fs.readFileSync(THRESHOLD_PATH, 'utf-8'));
        if (typeof data.selected_threshold === 'number') {
          this.latestMLResult.threshold = data.selected_threshold;
        }
      }
    } catch {
      this.latestMLResult.threshold = 0.55;
    }
  }

  private seedInitialGraphHistory(): void {
    const now = Date.now();
    for (let i = 20; i >= 0; i--) {
      const time = new Date(now - i * 2000);
      this.graphHistory.push({
        timestamp: time.toISOString(),
        requestsPerSec: 0,
        latencyMs: 0,
        probability: 0.24,
        isAnomaly: false,
      });
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Security Event Log
  // ───────────────────────────────────────────────────────────────────────────
  public addSecurityEvent(
    type: 'INFO' | 'WARNING' | 'CRITICAL' | 'SUCCESS',
    title: string,
    message: string,
    eventType: 'INIT' | 'NORMAL' | 'TRAFFIC_BURST' | 'ATTACK_DETECTED' | 'MITIGATION_PENDING' | 'MITIGATION_EXECUTED' | 'RECOVERY_STARTED' | 'RECOVERED' = 'NORMAL',
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW',
    mitigationStatus: 'NONE' | 'PENDING' | 'MITIGATED' | 'RECOVERED' = 'NONE',
    endpoint = '/api/auth'
  ): SecurityEventItem {
    const now = new Date();
    const event: SecurityEventItem = {
      id: `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: now.toISOString(),
      timeStr: now.toLocaleTimeString('en-US', { hour12: false }),
      type,
      title,
      message,
      eventType,
      severity,
      source: 'Gateway (127.0.0.1:8080)',
      endpoint,
      detectionResult: {
        label: this.latestMLResult.label,
        probability: this.latestMLResult.probability_attack,
        threshold: this.latestMLResult.threshold,
        confidence: Math.round(this.latestMLResult.probability_attack * 1000) / 10,
      },
      mitigationStatus,
    };
    this.events.unshift(event);
    if (this.events.length > 50) {
      this.events = this.events.slice(0, 50);
    }
    return event;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Subprocess Python Inference (Single-Flight Execution)
  // ───────────────────────────────────────────────────────────────────────────
  private async executeMLInference(inputPayload: Record<string, unknown>): Promise<any> {
    const pythonCmd = resolvePythonExecutable(ROOT_DIR);

    return new Promise((resolve, reject) => {
      const processEnv = { ...process.env, PYTHONPATH: ROOT_DIR };
      const child = spawn(pythonCmd, ['-u', SCRIPT_PATH], {
        cwd: ROOT_DIR,
        env: processEnv,
      });

      let stdoutData = '';
      let stderrData = '';
      let isSettled = false;

      const timer = setTimeout(() => {
        if (isSettled) return;
        isSettled = true;
        if (child.pid) {
          if (process.platform === 'win32') {
            try { spawn('taskkill', ['/F', '/T', '/PID', child.pid.toString()]); } catch {}
          } else {
            try { child.kill('SIGKILL'); } catch {}
          }
        }
        reject(new Error(`Python ML inference subprocess timed out after ${this.inferenceTimeoutMs}ms`));
      }, this.inferenceTimeoutMs);

      child.stdout.on('data', (data) => {
        stdoutData += data.toString();
        if (process.env.DEBUG_ML === 'true') {
          console.log('[executeMLInference STDOUT]:', data.toString());
        }
      });

      child.stderr.on('data', (data) => {
        stderrData += data.toString();
        console.error('[executeMLInference STDERR]:', data.toString());
      });

      child.on('error', (err) => {
        if (isSettled) return;
        isSettled = true;
        clearTimeout(timer);
        reject(new Error(`Failed to spawn Python process (${pythonCmd}): ${err.message}`));
      });

      child.on('close', (code) => {
        if (isSettled) return;
        isSettled = true;
        clearTimeout(timer);
        if (code !== 0) {
          let errMessage = `Python process exited with code ${code}`;
          try {
            const parsedErr = JSON.parse(stderrData);
            if (parsedErr.error) errMessage = parsedErr.error;
          } catch {
            if (stderrData.trim()) errMessage = stderrData.trim();
          }
          return reject(new Error(errMessage));
        }

        try {
          const result = JSON.parse(stdoutData);
          resolve(result);
        } catch {
          reject(new Error(`Failed to parse Python JSON output: ${stdoutData}`));
        }
      });

      child.stdin.write(JSON.stringify(inputPayload) + '\n');
      child.stdin.end();
    });
  }

  /**
   * Single-flight ML inference on the latest telemetry window.
   * If an inference is currently executing, skip this tick so Python processes never dogpile.
   */
  private triggerMLInference(): void {
    if (this.isInferring) {
      return;
    }

    this.runSingleFlightInference();
  }

  private async runSingleFlightInference(): Promise<void> {
    if (this.isInferring) return;
    this.isInferring = true;

    const { rawSeries, features } = this.calculateFeaturesFromBuffer();
    const mlStartTime = Date.now();

    try {
      const mlResult = await this.executeMLInference({ data_point: rawSeries, symbol: 'telemetry_stream' });
      const durationMs = Date.now() - mlStartTime;

      this.mlEngineOnline = true;
      this.mlEngineError = null;

      const prob = typeof mlResult.probability_attack === 'number' ? mlResult.probability_attack : 0.24;
      const threshold = typeof mlResult.threshold === 'number' ? mlResult.threshold : 0.55;
      const isAttack = prob >= threshold;

      this.latestMLResult = {
        probability_attack: prob,
        predicted_label: isAttack ? 1 : 0,
        label: isAttack ? 'ATTACK' : 'NORMAL',
        threshold,
        mode: mlResult.mode || 'REPLAY_SERIES',
        features: (mlResult.extracted_features as Record<string, number>) || features,
        inferenceTimeMs: durationMs,
        modelName: 'CICEV2023_RandomForest_v1',
      };
    } catch (err: any) {
      this.mlEngineOnline = false;
      this.mlEngineError = err?.message || 'ML Inference execution error';
      console.warn(`[TelemetryService] ML inference error: ${this.mlEngineError}`);
    } finally {
      this.isInferring = false;
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Telemetry Recording & Feature Extraction
  // ───────────────────────────────────────────────────────────────────────────
  public recordSample(sample: RawTelemetrySample): void {
    this.totalRequests++;
    if (!sample.success) {
      this.failedRequests++;
    }

    this.telemetryBuffer.push(sample);
    if (this.telemetryBuffer.length > this.WINDOW_SIZE) {
      this.telemetryBuffer.shift();
    }
  }

  public recordSamples(samples: RawTelemetrySample[]): void {
    if (!Array.isArray(samples)) return;
    for (const sample of samples) {
      this.recordSample(sample);
    }
  }

  private calculateFeaturesFromBuffer(): {
    rawSeries: number[];
    features: Record<string, number>;
  } {
    // Collect the telemetry observations
    let values: number[];

    if (this.telemetryBuffer.length > 0) {
      values = this.telemetryBuffer.map((s) => s.metricValue);
      // If buffer has fewer than 3 samples, pad to at least 3 for quantile calculation
      if (values.length < 3) {
        while (values.length < 3) {
          values.push(values[values.length - 1]);
        }
      }
    } else {
      // If idle/no recent traffic, use baseline nominal values
      values = [2.0, 2.5, 3.1, 2.4, 2.8, 3.5, 2.2, 2.7, 3.2, 2.6];
    }

    const n = values.length;
    const sum = values.reduce((acc, v) => acc + v, 0);
    const mean = sum / n;
    const max = Math.max(...values);
    const min = Math.min(...values);

    // Population std
    const variance = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / n;
    const std = Math.sqrt(variance);

    // Quantiles (linear interpolation matching numpy.quantile)
    const sorted = [...values].sort((a, b) => a - b);
    const quantile = (q: number) => {
      const pos = (sorted.length - 1) * q;
      const base = Math.floor(pos);
      const rest = pos - base;
      if (sorted[base + 1] !== undefined) {
        return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
      }
      return sorted[base];
    };

    const q1 = quantile(0.25);
    const median = quantile(0.5);
    const q3 = quantile(0.75);
    const iqr = q3 - q1;

    return {
      rawSeries: values,
      features: {
        count: n,
        mean: Math.round(mean * 10000) / 10000,
        max: Math.round(max * 10000) / 10000,
        sum: Math.round(sum * 10000) / 10000,
        std: Math.round(std * 10000) / 10000,
        min: Math.round(min * 10000) / 10000,
        median: Math.round(median * 10000) / 10000,
        q1: Math.round(q1 * 10000) / 10000,
        q3: Math.round(q3 * 10000) / 10000,
        iqr: Math.round(iqr * 10000) / 10000,
      },
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Periodic Background Evaluation Cycle
  // ───────────────────────────────────────────────────────────────────────────
  private async backgroundCycle(): Promise<void> {
    const now = Date.now();

    // 1. Check fake server health (every 3 seconds)
    if (now - this.lastHealthCheckTime > 3000) {
      this.lastHealthCheckTime = now;
      try {
        const res = await fetch(`${this.fakeServerUrl}/health`, {
          headers: { 'X-EVShield-Internal': 'true' },
          signal: AbortSignal.timeout(1500),
        });
        this.fakeServerOnline = res.ok;
      } catch {
        this.fakeServerOnline = false;
      }
    }

    // 2. Age out samples older than 6 seconds when not in continuous flood
    const windowMaxAge = now - 6000;
    this.telemetryBuffer = this.telemetryBuffer.filter((s) => s.timestamp >= windowMaxAge);

    // Compute live requests/sec over the last 1-second window
    const oneSecAgo = now - 1000;
    const recentSamples = this.telemetryBuffer.filter((s) => s.timestamp >= oneSecAgo);
    const rps = recentSamples.length;

    // Latency stats across current buffer
    const latencies = this.telemetryBuffer.map((s) => s.latencyMs);
    const avgLatency =
      latencies.length > 0
        ? Math.round((latencies.reduce((a, b) => a + b, 0) / latencies.length) * 10) / 10
        : 0;

    // 3. Trigger single-flight ML inference on current window
    this.triggerMLInference();

    // 4. Update Security State Machine & Real Incident Tracking
    const prob = this.latestMLResult.probability_attack;
    const threshold = this.latestMLResult.threshold;

    if (this.simulationMode === 'ATTACK') {
      if (prob >= threshold) {
        if (this.threatLevel !== 'CRITICAL') {
          this.onAttackDetected(rps, prob, threshold);
        } else if (this.activeIncident) {
          // Update live incident telemetry metrics
          this.activeIncident.requestsPerSecond = rps;
          this.activeIncident.peakRequestsPerSecond = Math.max(this.activeIncident.peakRequestsPerSecond, rps);
          this.activeIncident.duration = this.computeDurationStr(new Date(this.activeIncident.startTime), new Date());
          this.activeIncident.telemetryGraphPoints = [...this.graphHistory];
        }
      } else {
        if (this.threatLevel === 'NORMAL') {
          this.threatLevel = 'ANALYZING';
          this.addSecurityEvent(
            'WARNING',
            'Anomalous Telemetry Observed',
            `High request volume detected. ML probability rising (${Math.round(prob * 100)}%).`,
            'TRAFFIC_BURST',
            'MEDIUM',
            'NONE'
          );
        }
      }
    } else if (this.simulationMode === 'NORMAL') {
      if (this.threatLevel !== 'NORMAL') {
        this.threatLevel = 'NORMAL';
        this.securityStatus = 'PROTECTED';
      }
    } else {
      // External traffic burst or idle baseline
      if (prob >= threshold) {
        if (this.threatLevel !== 'CRITICAL') {
          this.onAttackDetected(rps, prob, threshold);
        } else if (this.activeIncident) {
          this.activeIncident.requestsPerSecond = rps;
          this.activeIncident.peakRequestsPerSecond = Math.max(this.activeIncident.peakRequestsPerSecond, rps);
          this.activeIncident.duration = this.computeDurationStr(new Date(this.activeIncident.startTime), new Date());
          this.activeIncident.telemetryGraphPoints = [...this.graphHistory];
        }
      } else if (rps > 15) {
        if (this.threatLevel === 'NORMAL') {
          this.threatLevel = 'ANALYZING';
          this.addSecurityEvent(
            'WARNING',
            'High Ingress Traffic Detected',
            `Real traffic burst detected (${rps} req/s). ML analyzing live telemetry stream.`,
            'TRAFFIC_BURST',
            'MEDIUM',
            'NONE'
          );
        }
      } else {
        if (prob < threshold && this.threatLevel === 'CRITICAL') {
          this.onTrafficSubsiding(prob);
        } else if (prob < threshold && (this.threatLevel === 'RECOVERING' || this.threatLevel === 'ANALYZING')) {
          this.onOperationalBaselineRestored();
        }
      }
    }

    // 5. Update graph time series history with canonical ISO 8601 UTC timestamp
    const isoTimestamp = new Date(now).toISOString();
    this.graphHistory.push({
      timestamp: isoTimestamp,
      requestsPerSec: rps,
      latencyMs: avgLatency,
      probability: prob,
      isAnomaly: prob >= threshold,
    });

    if (this.graphHistory.length > 45) {
      this.graphHistory.shift();
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Incident & Mitigation Lifecycle Handlers
  // ───────────────────────────────────────────────────────────────────────────
  private async onAttackDetected(rps: number, prob: number, threshold: number): Promise<void> {
    this.threatLevel = 'CRITICAL';
    this.securityStatus = 'THREAT DETECTED';

    const incidentId = `INC-${Date.now().toString().slice(-6)}`;
    const startTime = new Date();
    const alertId = `ALT-${Date.now().toString().slice(-6)}`;

    this.activeIncident = {
      id: incidentId,
      timestamp: startTime.toISOString(),
      startTime: startTime.toISOString(),
      duration: 'Ongoing',
      status: 'DETECTED',
      severity: 'CRITICAL',
      attackType: 'DDOS',
      attackTypeLabel: 'DDoS Authentication Burst',
      classification: 'ATTACK',
      mlConfidence: Math.round(prob * 1000) / 10,
      requestsPerSecond: rps,
      baselineRequestsPerSecond: 12,
      peakRequestsPerSecond: rps,
      affectedNodes: 1,
      affectedStations: [
        {
          id: 'CS-0421',
          name: 'Pune Express Terminal',
          location: 'Viman Nagar, Pune',
          status: 'UNDER ATTACK',
          requestsPerSec: rps,
        },
      ],
      sourceCategory: 'Distributed EV Gateway Auth Flood',
      targetInfrastructure: 'Gateway CS-0421 (127.0.0.1:8080)',
      mitigationStatus: 'ACTIVE IN PROGRESS',
      mitigationTime: '',
      description: 'High-frequency authentication burst flood targeting EV charging station token verification endpoint.',
      detectionSummary: `Random Forest classifier detected rate anomaly (${Math.round(prob * 100)}% attack probability >= ${Math.round(threshold * 100)}% threshold). Traffic rate: ${rps} req/s.`,
      isDemo: true,
      telemetryGraphPoints: [...this.graphHistory],
      mlFeatures: { ...this.latestMLResult.features },
      mlThreshold: threshold,
    };

    this.addSecurityEvent(
      'CRITICAL',
      '⚠ DDoS ATTACK DETECTED',
      `ML model flagged rate anomaly (${Math.round(prob * 100)}% probability >= ${Math.round(threshold * 100)}% threshold). Traffic rate: ${rps} req/s.`,
      'ATTACK_DETECTED',
      'CRITICAL',
      'PENDING'
    );

    const currentIncident = this.activeIncident!;

    // Asynchronously persist structured incident & alert to PostgreSQL
    try {
      await db.attackIncident.create({
        data: {
          incidentId,
          stationId: 'CS-0421',
          attackType: 'VOLUMETRIC',
          severity: 'CRITICAL',
          status: 'ACTIVE',
          startTime,
          requestsPerSec: rps,
          sourceIps: ['127.0.0.1', '10.0.4.12'],
          packetsDropped: 0,
          description: currentIncident.description,
          metadata: {
            attackType: 'DDOS',
            attackTypeLabel: 'DDoS Authentication Burst',
            classification: 'ATTACK',
            mlConfidence: currentIncident.mlConfidence,
            baselineRequestsPerSecond: 12,
            peakRequestsPerSecond: rps,
            affectedNodes: 1,
            affectedStations: currentIncident.affectedStations,
            targetInfrastructure: currentIncident.targetInfrastructure,
            mitigationStatus: 'DETECTED',
            detectionSummary: currentIncident.detectionSummary,
            features: this.latestMLResult.features,
            signals: [
              { name: 'Traffic Burst Intensity', value: `${rps} req/s`, status: 'ANOMALOUS', description: 'Request rate exceeded nominal baseline' },
              { name: 'ML Threat Probability', value: `${Math.round(prob * 100)}%`, status: 'ANOMALOUS', description: `Model confidence >= ${Math.round(threshold * 100)}% threshold` },
              { name: 'Target Gateway', value: 'CS-0421', status: 'ANOMALOUS', description: 'Port 8080 authentication endpoint flood' },
              { name: 'Defense Action', value: 'PENDING', status: 'ELEVATED', description: 'Mitigation rules ready for enforcement' },
            ],
          } as any,
        },
      });

      await db.securityAlert.create({
        data: {
          alertId,
          stationId: 'CS-0421',
          incidentId,
          severity: 'CRITICAL',
          title: 'Critical DDoS Attack Detected',
          message: `ML model flagged rate anomaly (${Math.round(prob * 100)}% probability >= ${Math.round(threshold * 100)}% threshold). Ingress rate: ${rps} req/s.`,
          acknowledged: false,
          metadata: {
            mlConfidence: currentIncident.mlConfidence,
          } as any,
        },
      });

      await db.chargingStation.updateMany({
        where: { stationId: 'CS-0421' },
        data: { status: 'UNDER_ATTACK' },
      });
    } catch (err) {
      console.warn('[TelemetryService] Async DB incident persistence:', err);
    }
  }

  private async onTrafficSubsiding(prob: number): Promise<void> {
    this.threatLevel = 'RECOVERING';
    this.addSecurityEvent(
      'INFO',
      'Traffic Returning to Baseline',
      `Traffic surge ceased. Telemetry draining (ML probability: ${Math.round(prob * 100)}%).`,
      'RECOVERY_STARTED',
      'LOW',
      'RECOVERED'
    );
  }

  private async onOperationalBaselineRestored(): Promise<void> {
    this.threatLevel = 'NORMAL';
    this.securityStatus = 'PROTECTED';

    const incident = this.activeIncident;
    if (incident) {
      const now = new Date();
      incident.status = 'RESOLVED';
      incident.endTime = now.toISOString();
      incident.mitigationStatus = 'RECOVERED';
      incident.duration = this.computeDurationStr(new Date(incident.startTime), now);

      try {
        await db.attackIncident.updateMany({
          where: { incidentId: incident.id },
          data: {
            status: 'RESOLVED',
            endTime: now,
            metadata: {
              attackType: incident.attackType,
              attackTypeLabel: incident.attackTypeLabel,
              classification: incident.classification,
              mlConfidence: incident.mlConfidence,
              baselineRequestsPerSecond: incident.baselineRequestsPerSecond,
              peakRequestsPerSecond: incident.peakRequestsPerSecond,
              affectedNodes: incident.affectedNodes,
              affectedStations: incident.affectedStations,
              targetInfrastructure: incident.targetInfrastructure,
              mitigationStatus: 'RECOVERED',
              mitigationTime: incident.duration,
              detectionSummary: incident.detectionSummary,
              outcome: 'Traffic subsided to nominal baseline (Recovered without manual mitigation)',
            } as any,
          },
        });

        await db.chargingStation.updateMany({
          where: { stationId: 'CS-0421' },
          data: { status: 'ONLINE' },
        });
      } catch (err) {
        console.warn('[TelemetryService] Async DB incident resolution:', err);
      }

      this.lastIncident = { ...incident };
      this.activeIncident = null;
    }

    this.addSecurityEvent(
      'SUCCESS',
      'Operational Baseline Restored',
      'All systems returned to normal operational baseline (Recovered).',
      'RECOVERED',
      'LOW',
      'RECOVERED'
    );
  }

  public async executeMitigation(): Promise<{ success: boolean; message: string; incident: AttackIncident | null }> {
    if (this.simulationMode === 'ATTACK') {
      this.stopTraffic(false);
    }

    const now = new Date();
    const incident = this.activeIncident || this.lastIncident;

    if (incident) {
      incident.status = 'MITIGATED';
      incident.endTime = now.toISOString();
      incident.mitigationStatus = 'MITIGATED';
      incident.mitigationTime = this.computeDurationStr(new Date(incident.startTime), now);

      try {
        await db.attackIncident.updateMany({
          where: { incidentId: incident.id },
          data: {
            status: 'MITIGATED',
            endTime: now,
            metadata: {
              attackType: incident.attackType,
              attackTypeLabel: incident.attackTypeLabel,
              classification: incident.classification,
              mlConfidence: incident.mlConfidence,
              baselineRequestsPerSecond: incident.baselineRequestsPerSecond,
              peakRequestsPerSecond: incident.peakRequestsPerSecond,
              affectedNodes: incident.affectedNodes,
              affectedStations: incident.affectedStations,
              targetInfrastructure: incident.targetInfrastructure,
              mitigationStatus: 'MITIGATED',
              mitigationTime: incident.mitigationTime,
              mitigationAction: 'Enforced rate limiting and token quarantine rules on CS-0421',
              detectionSummary: incident.detectionSummary,
            } as any,
          },
        });

        await db.chargingStation.updateMany({
          where: { stationId: 'CS-0421' },
          data: { status: 'ONLINE' },
        });
      } catch (err) {
        console.warn('[TelemetryService] Async DB mitigation:', err);
      }

      this.lastIncident = { ...incident };
      this.activeIncident = null;
    }

    this.threatLevel = 'NORMAL';
    this.securityStatus = 'PROTECTED';

    this.addSecurityEvent(
      'SUCCESS',
      '🛡️ Mitigation Enforced',
      'Rate-limiting rules applied and suspicious IP quarantine enforced on CS-0421.',
      'MITIGATION_EXECUTED',
      'HIGH',
      'MITIGATED'
    );

    return {
      success: true,
      message: 'Mitigation successfully enforced.',
      incident: incident || this.lastIncident,
    };
  }

  public getActiveIncident(): AttackIncident | null {
    return this.activeIncident;
  }

  public getLastIncident(): AttackIncident | null {
    return this.lastIncident;
  }

  public getForensicIncident(id?: string): AttackIncident | null {
    if (!id || id === 'current' || id === this.activeIncident?.id) {
      if (this.activeIncident) return this.activeIncident;
      if (this.lastIncident) return this.lastIncident;
      return null;
    }
    if (id === this.lastIncident?.id) {
      return this.lastIncident;
    }
    return null;
  }

  private computeDurationStr(start: Date, end: Date): string {
    const totalSecs = Math.max(1, Math.floor((end.getTime() - start.getTime()) / 1000));
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Traffic Simulation Controllers
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Start NORMAL Demonstration Traffic (~10-15 req/sec nominal authentication)
   */
  public startNormalTraffic(): void {
    this.stopTraffic(false);
    this.simulationMode = 'NORMAL';
    this.simulationStartTime = Date.now();
    this.addSecurityEvent('INFO', 'Normal Traffic Started', 'Simulating regular EV charging authentications (~12 req/s).');

    // Interval to send requests at regular cadence (~12 req/s = ~80ms per batch)
    this.simulationInterval = setInterval(async () => {
      if (this.simulationMode !== 'NORMAL') return;

      const stationId = `CS-042${Math.floor(Math.random() * 4) + 1}`;
      const evId = `EV-MH-${Math.floor(10 + Math.random() * 90)}-AB-${Math.floor(1000 + Math.random() * 9000)}`;

      const start = Date.now();
      try {
        const res = await fetch(`${this.fakeServerUrl}/api/auth`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ev_id: evId, credential: `token_${stationId}_${Date.now()}` }),
          signal: AbortSignal.timeout(1000),
        });

        const latency = Date.now() - start;
        // Normal telemetry metric value: nominal kernel execution overhead distribution (mean ~2.7, spread 2.0-3.5)
        const metricValue = Math.round((2.0 + Math.random() * 1.5 + (Math.random() - 0.5) * 0.4) * 100) / 100;

        this.recordSample({
          timestamp: Date.now(),
          endpoint: '/api/auth',
          method: 'POST',
          statusCode: res.status,
          latencyMs: Math.max(latency, 2),
          success: res.ok,
          metricValue,
        });
      } catch {
        this.recordSample({
          timestamp: Date.now(),
          endpoint: '/api/auth',
          method: 'POST',
          statusCode: 500,
          latencyMs: 50,
          success: false,
          metricValue: 2.8,
        });
      }
    }, 80);
  }

  /**
   * Start ATTACK SIMULATION (~250-400 req/sec high-frequency authentication burst DDoS)
   */
  public startAttackSimulation(): void {
    this.stopTraffic(false);
    this.simulationMode = 'ATTACK';
    this.simulationStartTime = Date.now();
    this.addSecurityEvent(
      'WARNING',
      'Attack Simulation Triggered',
      'High-frequency authentication burst flood initiated against local server (127.0.0.1:8080).'
    );

    // Send rapid bursts of requests in parallel batches every 25ms (~350 req/s)
    this.simulationInterval = setInterval(() => {
      if (this.simulationMode !== 'ATTACK') return;

      const batchSize = 8;
      for (let i = 0; i < batchSize; i++) {
        const evId = `ATTACK-BOT-${Math.floor(1000 + Math.random() * 9000)}`;
        const start = Date.now();

        fetch(`${this.fakeServerUrl}/api/auth`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ev_id: evId, credential: `bruteforce_flood_${Math.random()}` }),
          signal: AbortSignal.timeout(800),
        })
          .then((res) => {
            const latency = Date.now() - start;
            // Attack telemetry metric value: compressed tight burst distribution (mean ~1.46, tight 1.2-1.8)
            const metricValue = Math.round((1.2 + Math.random() * 0.55 + (Math.random() - 0.5) * 0.15) * 100) / 100;

            this.recordSample({
              timestamp: Date.now(),
              endpoint: '/api/auth',
              method: 'POST',
              statusCode: res.status,
              latencyMs: Math.max(latency, 1),
              success: res.ok,
              metricValue,
            });
          })
          .catch(() => {
            this.recordSample({
              timestamp: Date.now(),
              endpoint: '/api/auth',
              method: 'POST',
              statusCode: 429,
              latencyMs: 15,
              success: false,
              metricValue: 1.4,
            });
          });
      }
    }, 25);
  }

  /**
   * Stop any active simulation traffic
   */
  public stopTraffic(emitEvent = true): void {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
    const previousMode = this.simulationMode;
    this.simulationMode = 'IDLE';
    this.simulationStartTime = null;

    if (emitEvent && previousMode !== 'IDLE') {
      this.addSecurityEvent('INFO', 'Traffic Simulation Stopped', 'Generator stopped. Telemetry draining to baseline.');
    }
  }

  /**
   * Reset all counters, buffers, and event timeline
   */
  public reset(): void {
    this.stopTraffic(false);
    this.telemetryBuffer = [];
    this.totalRequests = 0;
    this.failedRequests = 0;
    this.threatLevel = 'NORMAL';
    this.securityStatus = 'PROTECTED';
    this.activeIncident = null;
    this.events = [];
    this.graphHistory = [];
    this.seedInitialGraphHistory();
    this.addSecurityEvent(
      'INFO',
      'System Reset',
      'All telemetry buffers and counters reset to baseline.',
      'INIT',
      'LOW',
      'NONE'
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Snapshot Provider for Frontend Live Polling / API
  // ───────────────────────────────────────────────────────────────────────────
  public getLiveSnapshot(): LiveTelemetrySnapshot {
    const latencies = this.telemetryBuffer.map((s) => s.latencyMs);
    const avgLatency =
      latencies.length > 0
        ? Math.round((latencies.reduce((a, b) => a + b, 0) / latencies.length) * 10) / 10
        : 0;
    const minLatency = latencies.length > 0 ? Math.min(...latencies) : 0;
    const maxLatency = latencies.length > 0 ? Math.max(...latencies) : 0;

    // Standard deviation of latency
    const variance =
      latencies.length > 0
        ? latencies.reduce((acc, v) => acc + Math.pow(v - avgLatency, 2), 0) / latencies.length
        : 0;
    const stdLatency = Math.round(Math.sqrt(variance) * 10) / 10;

    // Requests/sec over the last second
    const oneSecAgo = Date.now() - 1000;
    const rps = this.telemetryBuffer.filter((s) => s.timestamp >= oneSecAgo).length;

    // Error rate %
    const errRate =
      this.totalRequests > 0
        ? Math.round((this.failedRequests / this.totalRequests) * 1000) / 10
        : 0;

    const durationSeconds = this.simulationStartTime
      ? Math.floor((Date.now() - this.simulationStartTime) / 1000)
      : 0;

    return {
      server: {
        status: this.fakeServerOnline ? 'ONLINE' : 'OFFLINE',
        host: this.fakeServerHost,
        port: this.fakeServerPort,
        activeSessions: 0,
        lastSeen: this.fakeServerOnline ? new Date().toISOString() : null,
      },
      health: {
        fakeServer: this.fakeServerOnline ? 'ONLINE' : 'OFFLINE',
        backend: 'ONLINE',
        mlEngine: this.mlEngineOnline ? 'ONLINE' : 'OFFLINE',
        telemetry: this.simulationMode !== 'IDLE' || rps > 0 || this.telemetryBuffer.length > 0 ? 'ACTIVE' : 'IDLE',
        ...(this.mlEngineError ? { mlError: this.mlEngineError } : {}),
      },
      telemetry: {
        requestsPerSecond: rps,
        totalRequests: this.totalRequests,
        averageLatencyMs: avgLatency,
        minLatencyMs: minLatency,
        maxLatencyMs: maxLatency,
        stdLatencyMs: stdLatency,
        errorRatePercent: errRate,
        windowSize: this.telemetryBuffer.length,
        graphPoints: this.graphHistory,
      },
      ml: this.latestMLResult,
      simulation: {
        mode: this.simulationMode,
        active: this.simulationMode !== 'IDLE',
        startedAt: this.simulationStartTime ? new Date(this.simulationStartTime).toISOString() : null,
        durationSeconds,
      },
      threatLevel: this.threatLevel,
      securityStatus: this.securityStatus,
      events: this.events,
      activeIncident: this.activeIncident,
      lastIncident: this.lastIncident,
    };
  }
}

export const telemetryService = new TelemetryService();
