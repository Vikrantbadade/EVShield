import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

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
  timestamp: string;
  timeStr: string;
  type: 'INFO' | 'WARNING' | 'CRITICAL' | 'SUCCESS';
  title: string;
  message: string;
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

  // Server health cache
  private fakeServerOnline = false;
  private mlEngineOnline = true;
  private mlEngineError: string | null = null;
  private lastHealthCheckTime = 0;

  constructor() {
    this.initDefaultThreshold();
    this.addSecurityEvent('INFO', 'EVShield Initialized', 'Real-time telemetry and ML defense platform ready.');
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
    for (let i = 15; i >= 0; i--) {
      const time = new Date(now - i * 3000);
      const timeStr = time.toLocaleTimeString('en-US', { hour12: false });
      this.graphHistory.push({
        timestamp: timeStr,
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
    message: string
  ): void {
    const now = new Date();
    const event: SecurityEventItem = {
      id: `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: now.toISOString(),
      timeStr: now.toLocaleTimeString('en-US', { hour12: false }),
      type,
      title,
      message,
    };
    this.events.unshift(event);
    if (this.events.length > 50) {
      this.events = this.events.slice(0, 50);
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Subprocess Python Inference
  // ───────────────────────────────────────────────────────────────────────────
  private async executeMLInference(inputPayload: Record<string, unknown>): Promise<any> {
    const pythonCmd = process.env.PYTHON_EXECUTABLE || (process.platform === 'win32' ? 'py' : 'python3');

    return new Promise((resolve, reject) => {
      const processEnv = { ...process.env, PYTHONPATH: ROOT_DIR };
      const child = spawn(pythonCmd, [SCRIPT_PATH], {
        cwd: ROOT_DIR,
        env: processEnv,
      });

      let stdoutData = '';
      let stderrData = '';

      const timer = setTimeout(() => {
        child.kill();
        reject(new Error('Python ML inference subprocess timed out after 8000ms'));
      }, 8000);

      child.stdout.on('data', (data) => {
        stdoutData += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderrData += data.toString();
      });

      child.on('error', (err) => {
        clearTimeout(timer);
        reject(new Error(`Failed to spawn Python process (${pythonCmd}): ${err.message}`));
      });

      child.on('close', (code) => {
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

      child.stdin.write(JSON.stringify(inputPayload));
      child.stdin.end();
    });
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

  private calculateFeaturesFromBuffer(): {
    rawSeries: number[];
    features: Record<string, number>;
  } {
    // Collect the telemetry observations
    let values: number[];

    if (this.telemetryBuffer.length >= 5) {
      values = this.telemetryBuffer.map((s) => s.metricValue);
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

    // 3. Extract exact 10 TOP statistical features & run real ML inference
    const { rawSeries, features } = this.calculateFeaturesFromBuffer();
    const mlStartTime = Date.now();

    try {
      const mlResult = await this.executeMLInference({ data_point: rawSeries, symbol: 'telemetry_stream' });
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
        inferenceTimeMs: Date.now() - mlStartTime,
        modelName: 'CICEV2023_RandomForest_v1',
      };
    } catch (err: any) {
      this.mlEngineOnline = false;
      this.mlEngineError = err?.message || 'ML Inference execution error';
    }

    // 4. Update Security State Machine
    const prob = this.latestMLResult.probability_attack;
    const threshold = this.latestMLResult.threshold;

    if (this.simulationMode === 'ATTACK') {
      if (prob >= threshold) {
        if (this.threatLevel !== 'CRITICAL') {
          this.threatLevel = 'CRITICAL';
          this.securityStatus = 'THREAT DETECTED';
          this.addSecurityEvent(
            'CRITICAL',
            '⚠ DDoS ATTACK DETECTED',
            `ML model flagged rate anomaly (${Math.round(prob * 100)}% probability >= ${Math.round(threshold * 100)}% threshold). Traffic rate: ${rps} req/s.`
          );
        }
      } else {
        if (this.threatLevel === 'NORMAL') {
          this.threatLevel = 'ANALYZING';
          this.addSecurityEvent(
            'WARNING',
            'Anomalous Telemetry Observed',
            `High request volume detected. ML probability rising (${Math.round(prob * 100)}%).`
          );
        }
      }
    } else if (this.simulationMode === 'NORMAL') {
      if (this.threatLevel !== 'NORMAL') {
        this.threatLevel = 'NORMAL';
        this.securityStatus = 'PROTECTED';
      }
    } else {
      // IDLE / Stopped
      if (prob < threshold && this.threatLevel === 'CRITICAL') {
        this.threatLevel = 'RECOVERING';
        this.addSecurityEvent(
          'INFO',
          'Traffic Returning to Baseline',
          `Attack simulation ceased. Telemetry draining (ML probability: ${Math.round(prob * 100)}%).`
        );
      } else if (prob < threshold && this.threatLevel === 'RECOVERING') {
        this.threatLevel = 'NORMAL';
        this.securityStatus = 'PROTECTED';
        this.addSecurityEvent('SUCCESS', '✓ Threat Mitigated', 'All systems returned to normal operational baseline.');
      }
    }

    // 5. Update graph time series history
    const timeStr = new Date(now).toLocaleTimeString('en-US', { hour12: false });
    this.graphHistory.push({
      timestamp: timeStr,
      requestsPerSec: rps,
      latencyMs: avgLatency,
      probability: prob,
      isAnomaly: prob >= threshold,
    });

    if (this.graphHistory.length > 30) {
      this.graphHistory.shift();
    }
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
    this.events = [];
    this.graphHistory = [];
    this.seedInitialGraphHistory();
    this.addSecurityEvent('INFO', 'System Reset', 'All telemetry buffers and counters reset to baseline.');
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
        telemetry: this.simulationMode !== 'IDLE' ? 'ACTIVE' : 'IDLE',
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
    };
  }
}

export const telemetryService = new TelemetryService();
