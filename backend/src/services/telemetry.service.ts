import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { resolvePythonExecutable } from '../utils/python.util.js';
import { db } from '../config/database.js';
import { AttackIncident } from '../types/attack.types.js';
import {
  RawTelemetrySample,
  LiveTelemetryMetrics,
  NormalBaseline,
  ExplainableAnomalyAlert,
  AnomalyDetectionResult,
  DetectionSensitivity,
  DetectionThresholdsConfig,
  SimulationConfig,
  TrafficCategory,
  SimulationMode,
  DetectionStatus,
  SimulationLifecycle,
  AutoSimulationConfig,
  RecoveryStatus,
} from '../types/telemetry.types.js';
import { baselineService } from './baseline.service.js';
import { anomalyDetectionService } from './anomaly-detection.service.js';
import { wsService } from './websocket.service.js';
import { mlEngineService } from './ml-engine.service.js';
import { DetectionMethod } from '../types/ml.types.js';
import { RawTelemetrySampleSchema } from '../schemas/telemetry.schema.js';

// ─────────────────────────────────────────────────────────────────────────────
// Project & ML Paths
// ─────────────────────────────────────────────────────────────────────────────
function resolveProjectRoot(): string {
  if (fs.existsSync(path.resolve(process.cwd(), 'ml'))) {
    return process.cwd();
  }
  if (fs.existsSync(path.resolve(process.cwd(), '..', 'ml'))) {
    return path.resolve(process.cwd(), '..');
  }
  return path.resolve(process.cwd(), '..');
}

const ROOT_DIR = resolveProjectRoot();
const SCRIPT_PATH = path.resolve(ROOT_DIR, 'ml', 'inference', 'extract_and_predict.py');
const THRESHOLD_PATH = path.resolve(ROOT_DIR, 'ml', 'experiments', 'TOP_richer_stats_v1', 'operating_point', 'selected_threshold.json');

// ─────────────────────────────────────────────────────────────────────────────
// Frontend Graph & Event Interfaces
// ─────────────────────────────────────────────────────────────────────────────
export interface TelemetryGraphPoint {
  timestamp: string;
  requestsPerSec: number;
  packetRate: number;
  dataTransferredBytes: number;
  activeConnections: number;
  newConnectionRate: number;
  latencyMs: number;
  probability: number;
  isAnomaly: boolean;
  category?: TrafficCategory;
}

export interface SecurityEventItem {
  id: string;
  timestamp: string;
  timeStr: string;
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
    packetRate: number;
    dataTransferredBytes: number;
    bytesPerSecond: number;
    dataTransferredMB: number;
    activeConnections: number;
    newConnectionRate: number;
    averageLatencyMs: number;
    minLatencyMs: number;
    maxLatencyMs: number;
    stdLatencyMs: number;
    errorRatePercent: number;
    totalRequests: number;
    totalBytes: number;
    windowSize: number;
    graphPoints: TelemetryGraphPoint[];
    trafficCategory: TrafficCategory;
    baseline: NormalBaseline;
    recentAlerts: ExplainableAnomalyAlert[];
    detectionResult: AnomalyDetectionResult;
  };
  trafficCategory: TrafficCategory;
  detectionResult: AnomalyDetectionResult;
  baseline: NormalBaseline;
  anomalies: AnomalyDetectionResult;
  recentAlerts: ExplainableAnomalyAlert[];
  thresholds: DetectionThresholdsConfig;
  ml: MLInferenceResult;
  simulationMode: SimulationMode;
  detectionStatus: DetectionStatus;
  simulationLifecycle: SimulationLifecycle;
  autoSimulation: AutoSimulationConfig;
  recoveryStatus: RecoveryStatus;
  activeDetector: DetectionMethod;
  detectionMethod: DetectionMethod;
  simulation: {
    mode: SimulationMode;
    lifecycle: SimulationLifecycle;
    active: boolean;
    intensity: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
    targetRps: number;
    startedAt: string | null;
    durationSeconds: number;
    isSimulated: boolean;
    autoDemo: AutoSimulationConfig;
  };
  threatLevel: ThreatLevelState;
  securityStatus: 'PROTECTED' | 'THREAT DETECTED';
  events: SecurityEventItem[];
  activeIncident: AttackIncident | null;
  lastIncident: AttackIncident | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Telemetry Service (Stage 1 Core)
// ─────────────────────────────────────────────────────────────────────────────
export class TelemetryService {
  private fakeServerUrl = process.env.FAKE_SERVER_URL || 'http://127.0.0.1:8080';
  private fakeServerHost = '127.0.0.1';
  private fakeServerPort = 8080;

  // Telemetry buffer & aggregation
  private readonly WINDOW_SIZE = 150;
  private telemetryBuffer: RawTelemetrySample[] = [];
  private totalRequests = 0;
  private totalBytesTransferred = 0;
  private totalPacketsCount = 0;
  private failedRequests = 0;
  private graphHistory: TelemetryGraphPoint[] = [];

  // Authoritative Multi-State Dimensions (Issue 1 & Issue 3)
  private simulationMode: SimulationMode = 'NORMAL';
  private detectionStatus: DetectionStatus = 'NORMAL';
  private simulationLifecycle: SimulationLifecycle = 'RUNNING';
  private simulationIntensity: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME' = 'MEDIUM';
  private targetRps = 12;
  private simulationInterval: NodeJS.Timeout | null = null;
  private burstTimeout: NodeJS.Timeout | null = null;
  private simulationStartTime: number | null = null;

  // Recovery Verification Engine
  private isRecoveryPending = false;
  private recoveryConsecutiveNormal = 0;
  private readonly REQUIRED_NORMAL_CYCLES = 2; // 2 seconds of confirmed healthy metrics

  // Automatic Demo Simulation Engine (Scenario A/B/C Auto Loop)
  private autoDemoConfig: AutoSimulationConfig = {
    enabled: false,
    intervalSeconds: 20,
    durationSeconds: 8,
    scenario: 'COMBINED_ANOMALY',
    phase: 'DISABLED',
    secondsToNextAttack: 0,
    activeAttackSecondsRemaining: 0,
  };
  private autoDemoTimer: NodeJS.Timeout | null = null;
  private autoDemoPhaseStartedAt: number | null = null;

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

  // ML single flight concurrency lock
  private isInferring = false;
  private inferenceTimeoutMs = parseInt(process.env.ML_INFERENCE_TIMEOUT_MS || '15000', 10);

  // Latest Anomaly Detection Output
  private latestAnomalyResult: AnomalyDetectionResult = {
    isAnomaly: false,
    anomalyScore: 0.0,
    categories: ['NORMAL'],
    alerts: [],
    evaluations: {},
  };

  constructor() {
    this.initDefaultThreshold();
    this.addSecurityEvent(
      'INFO',
      'EVShield Initialized',
      'Stage 1 Real-time network telemetry and explainable anomaly detection engine ready.',
      'INIT',
      'LOW',
      'NONE'
    );
    this.seedInitialGraphHistory();
    this.startNormalTraffic();

    // Background evaluation cycle (every 1000ms)
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
    for (let i = 25; i >= 0; i--) {
      const time = new Date(now - i * 1500);
      this.graphHistory.push({
        timestamp: time.toISOString(),
        requestsPerSec: 12,
        packetRate: 48,
        dataTransferredBytes: 6144,
        activeConnections: 2,
        newConnectionRate: 3,
        latencyMs: 14,
        probability: 0.24,
        isAnomaly: false,
        category: 'NORMAL',
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
  // Telemetry Recording & Ingestion
  // ───────────────────────────────────────────────────────────────────────────
  public recordSample(raw: RawTelemetrySample): void {
    // Validate with Zod schema
    const parsed = RawTelemetrySampleSchema.safeParse(raw);
    const sample: RawTelemetrySample = parsed.success
      ? (parsed.data as RawTelemetrySample)
      : {
          timestamp: Date.now(),
          endpoint: raw.endpoint || '/api/auth',
          method: raw.method || 'POST',
          statusCode: raw.statusCode || 200,
          latencyMs: raw.latencyMs || 10,
          bytesTransferred: raw.bytesTransferred || 512,
          packetCount: raw.packetCount || 4,
          activeConnections: raw.activeConnections || 1,
          newConnections: raw.newConnections || 1,
          sourceIp: raw.sourceIp || '127.0.0.1',
          destination: raw.destination || '127.0.0.1:8080',
          trafficCategory: raw.trafficCategory || 'NORMAL',
          metricValue: raw.metricValue || 2.5,
          isSimulated: true,
        };

    this.totalRequests++;
    this.totalBytesTransferred += sample.bytesTransferred;
    this.totalPacketsCount += sample.packetCount;

    if (sample.statusCode >= 400) {
      this.failedRequests++;
    }

    // When running in nominal NORMAL mode, discard any late-arriving anomaly burst packets
    if (this.simulationMode === 'NORMAL' && sample.trafficCategory !== 'NORMAL') {
      return;
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

  // ───────────────────────────────────────────────────────────────────────────
  // Background Evaluation & Anomaly Cycle
  // ───────────────────────────────────────────────────────────────────────────
  private async backgroundCycle(): Promise<void> {
    const now = Date.now();

    // 1. Heartbeat check on fake server (every 3 seconds)
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

    // 2. Window retention: retain samples within last 6 seconds
    const windowMaxAge = now - 6000;
    this.telemetryBuffer = this.telemetryBuffer.filter((s) => s.timestamp >= windowMaxAge);

    // Compute live 1-second metrics
    const oneSecAgo = now - 1000;
    const recentOneSec = this.telemetryBuffer.filter((s) => s.timestamp >= oneSecAgo);
    const rps = recentOneSec.length;
    const packetRate = recentOneSec.reduce((acc, s) => acc + (s.packetCount || 4), 0);
    const bytesInSec = recentOneSec.reduce((acc, s) => acc + (s.bytesTransferred || 512), 0);
    const newConnInSec = recentOneSec.reduce((acc, s) => acc + (s.newConnections || 1), 0);

    const latencies = this.telemetryBuffer.map((s) => s.latencyMs);
    const avgLatency =
      latencies.length > 0
        ? Math.round((latencies.reduce((a, b) => a + b, 0) / latencies.length) * 10) / 10
        : 12.0;

    const currentMetrics: LiveTelemetryMetrics = {
      packetRate: packetRate > 0 ? packetRate : rps * 4,
      dataTransferredBytes: bytesInSec > 0 ? bytesInSec : rps * 512,
      dataTransferredMB: Math.round(((bytesInSec > 0 ? bytesInSec : rps * 512) / (1024 * 1024)) * 1000) / 1000,
      activeConnections: Math.max(1, this.telemetryBuffer.slice(-5).reduce((max, s) => Math.max(max, s.activeConnections || 1), 1)),
      newConnectionRate: newConnInSec > 0 ? newConnInSec : Math.ceil(rps * 0.4),
      avgConnectionDurationMs: avgLatency,
      requestRate: rps,
      requestFrequencyHz: rps,
      errorRatePercent: this.totalRequests > 0 ? Math.round((this.failedRequests / this.totalRequests) * 1000) / 10 : 0,
      windowSampleCount: this.telemetryBuffer.length,
      timestamp: new Date(now).toISOString(),
    };

    // 3. Evaluate anomalies against normal baseline
    const baseline = baselineService.getBaseline();
    const anomalyResult = anomalyDetectionService.evaluate(currentMetrics, baseline, this.telemetryBuffer);
    this.latestAnomalyResult = anomalyResult;

    // 4. Update baseline safely (adapts only when NOT abnormal)
    baselineService.update(currentMetrics, anomalyResult.isAnomaly);

    // 5. Trigger single-flight ML inference
    this.triggerMLInference(currentMetrics);

    // 6. Security Event & Alert notification
    if (anomalyResult.isAnomaly && anomalyResult.alerts.length > 0) {
      for (const alert of anomalyResult.alerts) {
        this.addSecurityEvent(
          alert.severity === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
          `Anomaly: ${alert.category}`,
          alert.explanation,
          'TRAFFIC_BURST',
          alert.severity,
          'NONE'
        );
        wsService.broadcast('ANOMALY_ALERT', alert);
      }
    }

    // 7. Synchronize Threat Level State & Authoritative Multi-State Dimensions (Issue 1 & Issue 3)
    const activeDetector = mlEngineService.getActiveDetector();
    const isExplicitAttack = this.simulationMode !== 'NORMAL';
    let isAnomalous = false;

    if (activeDetector === 'THRESHOLD') {
      isAnomalous = anomalyResult.isAnomaly || (isExplicitAttack && this.latestMLResult.probability_attack >= this.latestMLResult.threshold);
    } else if (activeDetector === 'RANDOM_FOREST') {
      isAnomalous = (this.latestMLResult.label === 'ATTACK' && isExplicitAttack) || anomalyResult.isAnomaly;
    } else if (activeDetector === 'ISOLATION_FOREST') {
      isAnomalous = (this.latestMLResult.label === 'ATTACK' && isExplicitAttack) || anomalyResult.isAnomaly;
    } else {
      // ENSEMBLE
      isAnomalous = anomalyResult.isAnomaly || (isExplicitAttack && this.latestMLResult.label === 'ATTACK');
    }

    if (isAnomalous) {
      this.isRecoveryPending = false;
      this.recoveryConsecutiveNormal = 0;
      this.detectionStatus = 'ANOMALY_ACTIVE';
      if (this.threatLevel !== 'CRITICAL') {
        this.threatLevel = 'CRITICAL';
        this.securityStatus = 'THREAT DETECTED';
        this.onAttackDetected(rps, this.latestMLResult.probability_attack, this.latestMLResult.threshold);
      }
    } else if (this.isRecoveryPending || this.threatLevel === 'RECOVERING' || this.detectionStatus === 'RECOVERING') {
      // Evaluating recovery criteria: metrics must stay safely nominal for REQUIRED_NORMAL_CYCLES
      const isMetricsNominal = rps <= 22 && packetRate <= 100 && avgLatency <= 75 && !anomalyResult.isAnomaly;
      if (isMetricsNominal) {
        this.recoveryConsecutiveNormal++;
        if (this.recoveryConsecutiveNormal >= this.REQUIRED_NORMAL_CYCLES) {
          // Recovery criteria satisfied! Transition safely to healthy baseline
          this.isRecoveryPending = false;
          this.detectionStatus = 'NORMAL';
          this.threatLevel = 'NORMAL';
          this.securityStatus = 'PROTECTED';
          this.addSecurityEvent(
            'SUCCESS',
            'Recovery Confirmed',
            'All telemetry metrics verified within normal operational baseline. Resumed normal monitoring.',
            'RECOVERED',
            'LOW',
            'RECOVERED'
          );
        } else {
          this.detectionStatus = 'RECOVERING';
          this.threatLevel = 'RECOVERING';
        }
      } else {
        this.recoveryConsecutiveNormal = 0;
        this.detectionStatus = 'RECOVERING';
        this.threatLevel = 'RECOVERING';
      }
    } else {
      this.detectionStatus = 'NORMAL';
      this.threatLevel = 'NORMAL';
      this.securityStatus = 'PROTECTED';
      this.isRecoveryPending = false;
      this.recoveryConsecutiveNormal = 0;
    }

    // 7b. Update Auto-Simulation Timers & Phase Tracking
    if (this.autoDemoConfig.enabled && this.autoDemoPhaseStartedAt) {
      const elapsedSec = (now - this.autoDemoPhaseStartedAt) / 1000;
      if (this.autoDemoConfig.phase === 'NORMAL_PERIOD') {
        this.autoDemoConfig.secondsToNextAttack = Math.max(0, Math.ceil(this.autoDemoConfig.intervalSeconds - elapsedSec));
        this.autoDemoConfig.activeAttackSecondsRemaining = 0;
      } else if (this.autoDemoConfig.phase === 'ATTACK_PERIOD') {
        this.autoDemoConfig.activeAttackSecondsRemaining = Math.max(0, Math.ceil(this.autoDemoConfig.durationSeconds - elapsedSec));
        this.autoDemoConfig.secondsToNextAttack = 0;
      }
    }

    // 8. Update graph history
    const primaryCategory = anomalyResult.categories.includes('COMBINED_ANOMALY')
      ? 'COMBINED_ANOMALY'
      : (anomalyResult.categories[0] || 'NORMAL');
    this.graphHistory.push({
      timestamp: new Date(now).toISOString(),
      requestsPerSec: rps,
      packetRate: currentMetrics.packetRate,
      dataTransferredBytes: currentMetrics.dataTransferredBytes,
      activeConnections: currentMetrics.activeConnections,
      newConnectionRate: currentMetrics.newConnectionRate,
      latencyMs: avgLatency,
      probability: this.latestMLResult.probability_attack,
      isAnomaly: anomalyResult.isAnomaly,
      category: primaryCategory,
    });

    if (this.graphHistory.length > 50) {
      this.graphHistory.shift();
    }

    // 9. Broadcast live snapshot over WebSocket
    const snapshot = this.getLiveSnapshot();
    wsService.broadcast('TELEMETRY_SNAPSHOT', snapshot);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Subprocess Python Inference (Preserved from Stage 0)
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
        reject(new Error(`Python ML inference timed out after ${this.inferenceTimeoutMs}ms`));
      }, this.inferenceTimeoutMs);

      child.stdout.on('data', (data) => {
        stdoutData += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderrData += data.toString();
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

  private triggerMLInference(currentMetrics?: LiveTelemetryMetrics): void {
    if (this.isInferring) return;
    this.runSingleFlightInference(currentMetrics);
  }

  private async runSingleFlightInference(currentMetrics?: LiveTelemetryMetrics): Promise<void> {
    if (this.isInferring) return;
    this.isInferring = true;
    const mlStartTime = Date.now();

    try {
      const activeDet = mlEngineService.getActiveDetector();
      const payload = {
        packet_rate: currentMetrics?.packetRate ?? 48,
        request_rate: currentMetrics?.requestRate ?? 12,
        new_connection_rate: currentMetrics?.newConnectionRate ?? 10,
        active_connections: currentMetrics?.activeConnections ?? 3,
        data_transfer_volume: currentMetrics?.dataTransferredBytes ?? 6144,
        connection_duration: currentMetrics?.avgConnectionDurationMs ?? 14,
        request_frequency: currentMetrics?.requestFrequencyHz ?? 12,
        method: activeDet,
      };

      const mlResult = await mlEngineService.predict(payload as any, activeDet);
      const durationMs = Date.now() - mlStartTime;

      this.mlEngineOnline = true;
      this.mlEngineError = null;

      const isAttack = mlResult.classification === 'ATTACK';
      const prob = typeof mlResult.confidence === 'number' ? mlResult.confidence : (isAttack ? 0.95 : 0.05);

      this.latestMLResult = {
        probability_attack: isAttack ? Math.max(0.75, prob) : Math.min(0.25, prob),
        predicted_label: isAttack ? 1 : 0,
        label: isAttack ? 'ATTACK' : 'NORMAL',
        threshold: 0.50,
        mode: activeDet,
        features: (mlResult.extracted_features as Record<string, number>) || {},
        inferenceTimeMs: durationMs,
        modelName: activeDet,
      };
    } catch (err: any) {
      this.mlEngineOnline = false;
      this.mlEngineError = err?.message || 'ML Inference error';
    } finally {
      this.isInferring = false;
    }
  }

  private calculateFeaturesFromBuffer(): {
    rawSeries: number[];
    features: Record<string, number>;
  } {
    let values: number[];
    if (this.telemetryBuffer.length > 0) {
      values = this.telemetryBuffer.map((s) => s.metricValue || 2.5);
      if (values.length < 3) {
        while (values.length < 3) {
          values.push(values[values.length - 1]);
        }
      }
    } else {
      values = [2.0, 2.5, 3.1, 2.4, 2.8, 3.5, 2.2, 2.7, 3.2, 2.6];
    }

    const n = values.length;
    const sum = values.reduce((acc, v) => acc + v, 0);
    const mean = sum / n;
    const max = Math.max(...values);
    const min = Math.min(...values);

    const variance = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / n;
    const std = Math.sqrt(variance);

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
  // Incident Lifecycle Handlers
  // ───────────────────────────────────────────────────────────────────────────
  private async onAttackDetected(rps: number, probability: number, threshold: number): Promise<void> {
    const now = new Date();
    const incidentId = `INC-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const incident: AttackIncident = {
      id: incidentId,
      attackType: 'DDOS',
      attackTypeLabel: 'DDoS Authentication Burst',
      targetInfrastructure: 'Gateway Zone 1 (CS-0421)',
      severity: 'CRITICAL',
      status: 'DETECTED',
      startTime: now.toISOString(),
      timestamp: now.toISOString(),
      requestsPerSecond: rps,
      peakRequestsPerSecond: Math.max(rps, 150),
      duration: '0s',
      affectedNodes: 24,
      affectedStations: [
        {
          id: 'CS-0421',
          name: 'FastCharge Terminal CS-0421',
          location: 'Station 1 - Node 4',
          status: 'UNDER ATTACK',
          requestsPerSec: rps,
        },
      ],
      sourceCategory: 'External Botnet',
      isDemo: true,
      mlConfidence: Math.round(probability * 1000) / 10,
      baselineRequestsPerSecond: 12,
      mitigationStatus: 'NONE',
      mitigationTime: 'Pending',
      description: 'Volumetric authentication burst detected',
      classification: 'ATTACK',
      detectionSummary: `Anomaly detected by EVShield Statistical & ML Engine (${Math.round(probability * 100)}% attack probability >= ${Math.round(threshold * 100)}% threshold).`,
      telemetryGraphPoints: [...this.graphHistory],
    };

    this.activeIncident = incident;

    try {
      await db.attackIncident.create({
        data: {
          incidentId: incident.id,
          stationId: 'CS-0421',
          attackType: 'APPLICATION_LAYER',
          severity: 'CRITICAL',
          status: 'ACTIVE',
          startTime: now,
          requestsPerSec: rps,
          sourceIps: ['192.168.1.105', '192.168.1.112', '192.168.1.144'],
          description: incident.detectionSummary,
          metadata: {
            classification: incident.classification,
            mlConfidence: incident.mlConfidence,
          } as any,
        },
      });

      await db.chargingStation.updateMany({
        where: { stationId: 'CS-0421' },
        data: { status: 'OFFLINE' },
      });
    } catch (err) {
      console.warn('[TelemetryService] Async DB incident creation fallback:', err);
    }
  }

  public async executeMitigation(): Promise<{ success: boolean; message: string; incident: AttackIncident | null }> {
    this.stopTraffic(false);
    const now = new Date();
    const incident = this.activeIncident || this.lastIncident;

    if (incident) {
      incident.status = 'MITIGATED';
      incident.endTime = now.toISOString();
      incident.mitigationStatus = 'MITIGATED';

      try {
        await db.attackIncident.updateMany({
          where: { incidentId: incident.id },
          data: {
            status: 'MITIGATED',
            endTime: now,
          },
        });
      } catch (err) {
        console.warn('[TelemetryService] Async DB mitigation fallback:', err);
      }

      this.lastIncident = { ...incident };
      this.activeIncident = null;
    }

    this.threatLevel = 'NORMAL';
    this.securityStatus = 'PROTECTED';
    this.addSecurityEvent('SUCCESS', '🛡️ Mitigation Enforced', 'Rate-limiting rules applied and suspicious IP quarantine enforced on CS-0421.', 'MITIGATION_EXECUTED', 'HIGH', 'MITIGATED');

    return {
      success: true,
      message: 'Mitigation successfully enforced.',
      incident: incident || this.lastIncident,
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Multi-Scenario Simulation Controllers (Stage 1 Core)
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Scenario A / Nominal Baseline Traffic (~12 req/sec)
   */
  public startNormalTraffic(): void {
    this.stopTraffic(false);
    this.simulationMode = 'NORMAL';
    this.simulationLifecycle = 'RUNNING';
    this.targetRps = 12;
    this.simulationStartTime = Date.now();
    this.addSecurityEvent('INFO', 'Normal Traffic Simulation', 'Generating regular EV charging authentications (~12 req/s).');

    this.simulationInterval = setInterval(async () => {
      if (this.simulationMode !== 'NORMAL' || this.simulationLifecycle !== 'RUNNING') return;

      const stationId = `CS-042${Math.floor(Math.random() * 4) + 1}`;
      const evId = `EV-MH-${Math.floor(10 + Math.random() * 90)}-AB-${Math.floor(1000 + Math.random() * 9000)}`;

      const start = Date.now();
      try {
        const res = await fetch(`${this.fakeServerUrl}/api/auth`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Traffic-Category': 'NORMAL',
            'X-Packet-Count': '4',
            'X-Active-Connections': '2',
            'X-New-Connections': '1',
          },
          body: JSON.stringify({ ev_id: evId, credential: `token_${stationId}_${Date.now()}` }),
          signal: AbortSignal.timeout(1000),
        });

        if (!this.fakeServerOnline) {
          const latency = Date.now() - start;
          const metricValue = Math.round((2.0 + Math.random() * 1.5) * 100) / 100;

          this.recordSample({
            timestamp: Date.now(),
            endpoint: '/api/auth',
            method: 'POST',
            statusCode: res.status,
            latencyMs: Math.max(latency, 2),
            bytesTransferred: 512,
            packetCount: 4,
            activeConnections: 2,
            newConnections: 1,
            sourceIp: '192.168.1.50',
            destination: '127.0.0.1:8080',
            trafficCategory: 'NORMAL',
            success: res.ok,
            metricValue,
            isSimulated: true,
          });
        }
      } catch {
        this.recordSample({
          timestamp: Date.now(),
          endpoint: '/api/auth',
          method: 'POST',
          statusCode: 500,
          latencyMs: 14,
          bytesTransferred: 256,
          packetCount: 2,
          activeConnections: 1,
          newConnections: 1,
          sourceIp: '192.168.1.50',
          destination: '127.0.0.1:8080',
          trafficCategory: 'NORMAL',
          success: false,
          metricValue: 2.8,
          isSimulated: true,
        });
      }
    }, 80); // ~12 requests/sec
  }

  /**
   * Scenario B.1 — Sudden Traffic Burst
   */
  public triggerTrafficBurst(durationMs = 4500, burstRps = 120): void {
    this.stopTraffic(false);
    this.simulationMode = 'TRAFFIC_BURST';
    this.simulationLifecycle = 'RUNNING';
    this.simulationStartTime = Date.now();
    this.addSecurityEvent('WARNING', 'Traffic Burst Triggered', `Simulating sudden ingress surge of ${burstRps} req/s against charging gateway.`);

    const batchDelay = 25; // 40 batches / sec
    const perBatch = Math.ceil(burstRps / 40);

    this.simulationInterval = setInterval(() => {
      for (let i = 0; i < perBatch; i++) {
        const evId = `BURST-EV-${Math.floor(1000 + Math.random() * 9000)}`;
        const start = Date.now();

        fetch(`${this.fakeServerUrl}/api/auth`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Traffic-Category': 'TRAFFIC_BURST',
            'X-Packet-Count': '6',
            'X-Active-Connections': '8',
            'X-New-Connections': '2',
          },
          body: JSON.stringify({ ev_id: evId, credential: `burst_${Date.now()}_${i}` }),
          signal: AbortSignal.timeout(800),
        })
          .then((res) => {
            if (!this.fakeServerOnline) {
              this.recordSample({
                timestamp: Date.now(),
                endpoint: '/api/auth',
                method: 'POST',
                statusCode: res.status,
                latencyMs: Math.max(Date.now() - start, 2),
                bytesTransferred: 640,
                packetCount: 6,
                activeConnections: 8,
                newConnections: 2,
                sourceIp: `192.168.1.${Math.floor(100 + Math.random() * 50)}`,
                destination: '127.0.0.1:8080',
                trafficCategory: 'TRAFFIC_BURST',
                success: res.ok,
                metricValue: 1.45,
                isSimulated: true,
              });
            }
          })
          .catch(() => {});
      }
    }, batchDelay);

    // Auto return to normal after duration
    if (this.burstTimeout) clearTimeout(this.burstTimeout);
    this.burstTimeout = setTimeout(() => {
      this.returnToNormal();
    }, durationMs);
  }

  /**
   * Scenario B.2 — High Connection Creation Rate
   */
  public simulateHighConnectionRate(durationMs = 5000, connRate = 75): void {
    this.stopTraffic(false);
    this.simulationMode = 'HIGH_CONNECTION_RATE';
    this.simulationLifecycle = 'RUNNING';
    this.simulationStartTime = Date.now();
    this.addSecurityEvent('WARNING', 'High Connection Rate Triggered', `Simulating connection creation surge of ${connRate} new connections/sec.`);

    const intervalMs = 50;
    const connsPerTick = Math.ceil(connRate / 20);

    this.simulationInterval = setInterval(() => {
      for (let i = 0; i < connsPerTick; i++) {
        const uniqueIp = `10.0.${Math.floor(Math.random() * 255)}.${Math.floor(1 + Math.random() * 254)}`;
        fetch(`${this.fakeServerUrl}/api/status`, {
          headers: {
            'X-Forwarded-For': uniqueIp,
            'X-Traffic-Category': 'HIGH_CONNECTION_RATE',
            'X-New-Connections': '5',
            'X-Active-Connections': '15',
          },
          signal: AbortSignal.timeout(800),
        })
          .then((res) => {
            if (!this.fakeServerOnline) {
              this.recordSample({
                timestamp: Date.now(),
                endpoint: '/api/status',
                method: 'GET',
                statusCode: res.status,
                latencyMs: 8,
                bytesTransferred: 384,
                packetCount: 4,
                activeConnections: 15,
                newConnections: 5, // High new connection rate signal
                sourceIp: uniqueIp,
                destination: '127.0.0.1:8080',
                trafficCategory: 'HIGH_CONNECTION_RATE',
                success: res.ok,
                metricValue: 2.1,
                isSimulated: true,
              });
            }
          })
          .catch(() => {});
      }
    }, intervalMs);

    if (this.burstTimeout) clearTimeout(this.burstTimeout);
    this.burstTimeout = setTimeout(() => {
      this.returnToNormal();
    }, durationMs);
  }

  /**
   * Scenario B.3 — Repeated Requests
   */
  public simulateRepeatedRequests(durationMs = 5000, repeatFactor = 30): void {
    this.stopTraffic(false);
    this.simulationMode = 'REPEATED_REQUESTS';
    this.simulationLifecycle = 'RUNNING';
    this.simulationStartTime = Date.now();
    this.addSecurityEvent('WARNING', 'Repeated Requests Triggered', `Simulating bot authentication replay with identical credential tokens (${repeatFactor} repeated requests).`);

    const fixedEvId = 'EV-REPLAY-BOT-X9';
    const fixedToken = 'token_replay_attack_stale_nonce_001';

    this.simulationInterval = setInterval(() => {
      for (let i = 0; i < 5; i++) {
        fetch(`${this.fakeServerUrl}/api/auth`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Traffic-Category': 'REPEATED_REQUESTS',
          },
          body: JSON.stringify({ ev_id: fixedEvId, credential: fixedToken }),
          signal: AbortSignal.timeout(800),
        })
          .then((res) => {
            if (!this.fakeServerOnline) {
              this.recordSample({
                timestamp: Date.now(),
                endpoint: '/api/auth',
                method: 'POST',
                statusCode: res.status,
                latencyMs: 5,
                bytesTransferred: 420,
                packetCount: 4,
                activeConnections: 3,
                newConnections: 1,
                sourceIp: '198.51.100.42', // Fixed single source IP
                destination: '127.0.0.1:8080',
                trafficCategory: 'REPEATED_REQUESTS',
                success: res.ok,
                metricValue: 1.8,
                isSimulated: true,
              });
            }
          })
          .catch(() => {});
      }
    }, 60);

    if (this.burstTimeout) clearTimeout(this.burstTimeout);
    this.burstTimeout = setTimeout(() => {
      this.returnToNormal();
    }, durationMs);
  }

  /**
   * Scenario B.4 — Abnormal Packet Rate
   */
  public simulateAbnormalPacketRate(durationMs = 5000): void {
    this.stopTraffic(false);
    this.simulationMode = 'PACKET_RATE_SURGE';
    this.simulationLifecycle = 'RUNNING';
    this.simulationStartTime = Date.now();
    this.addSecurityEvent('WARNING', 'Abnormal Packet Rate Triggered', 'Simulating volumetric packet-rate surge across station interface.');

    this.simulationInterval = setInterval(() => {
      for (let i = 0; i < 6; i++) {
        fetch(`${this.fakeServerUrl}/api/status`, {
          headers: {
            'X-Traffic-Category': 'ABNORMAL_PACKET_RATE',
            'X-Packet-Count': '18',
            'X-Active-Connections': '6',
            'X-New-Connections': '2',
          },
          signal: AbortSignal.timeout(800),
        })
          .then((res) => {
            if (!this.fakeServerOnline) {
              this.recordSample({
                timestamp: Date.now(),
                endpoint: '/api/status',
                method: 'GET',
                statusCode: res.status,
                latencyMs: 4,
                bytesTransferred: 1200,
                packetCount: 18, // High packet count per transaction
                activeConnections: 6,
                newConnections: 2,
                sourceIp: '192.168.1.188',
                destination: '127.0.0.1:8080',
                trafficCategory: 'ABNORMAL_PACKET_RATE',
                success: res.ok,
                metricValue: 1.35,
                isSimulated: true,
              });
            }
          })
          .catch(() => {});
      }
    }, 40);

    if (this.burstTimeout) clearTimeout(this.burstTimeout);
    this.burstTimeout = setTimeout(() => {
      this.returnToNormal();
    }, durationMs);
  }

  /**
   * Scenario B.5 — Excessive Data Transfer Volume
   */
  public simulateExcessiveDataTransfer(durationMs = 5000, payloadKb = 12): void {
    this.stopTraffic(false);
    this.simulationMode = 'EXCESSIVE_DATA';
    this.simulationLifecycle = 'RUNNING';
    this.simulationStartTime = Date.now();
    this.addSecurityEvent('WARNING', 'Excessive Data Transfer Triggered', `Simulating large payload data exfiltration / injection (${payloadKb} KB payloads).`);

    const largePadding = 'X'.repeat(payloadKb * 1024);

    this.simulationInterval = setInterval(() => {
      this.recordSample({
        timestamp: Date.now(),
        endpoint: '/api/auth',
        method: 'POST',
        statusCode: 200,
        latencyMs: 25,
        bytesTransferred: payloadKb * 1024,
        packetCount: Math.ceil((payloadKb * 1024) / 1460) * 2,
        activeConnections: 4,
        newConnections: 1,
        sourceIp: '192.168.1.99',
        destination: '127.0.0.1:8080',
        trafficCategory: 'EXCESSIVE_DATA_TRANSFER',
        success: true,
        metricValue: 2.2,
        isSimulated: true,
      });

      if (this.fakeServerOnline) {
        fetch(`${this.fakeServerUrl}/api/auth`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-EVShield-Internal': 'true',
          },
          body: JSON.stringify({
            ev_id: 'EV-DATA-HOG',
            credential: 'token_valid',
          }),
          signal: AbortSignal.timeout(800),
        }).catch(() => {});
      }
    }, 80);

    if (this.burstTimeout) clearTimeout(this.burstTimeout);
    this.burstTimeout = setTimeout(() => {
      this.returnToNormal();
    }, durationMs);
  }

  /**
   * Scenario B.6 — Unusual Connection Duration
   */
  public simulateUnusualConnectionDuration(durationMs = 5000): void {
    this.stopTraffic(false);
    this.simulationMode = 'UNUSUAL_LATENCY';
    this.simulationLifecycle = 'RUNNING';
    this.simulationStartTime = Date.now();
    this.addSecurityEvent('WARNING', 'Unusual Connection Duration Triggered', 'Simulating Slowloris connection-holding patterns with abnormally high latency.');

    this.simulationInterval = setInterval(() => {
      this.recordSample({
        timestamp: Date.now(),
        endpoint: '/api/charging/start',
        method: 'POST',
        statusCode: 200,
        latencyMs: Math.round(180 + Math.random() * 90), // High latency / long hold
        bytesTransferred: 512,
        packetCount: 4,
        activeConnections: 12, // Held open connections
        newConnections: 1,
        sourceIp: '10.0.99.12',
        destination: '127.0.0.1:8080',
        trafficCategory: 'UNUSUAL_CONNECTION_DURATION',
        success: true,
        metricValue: 3.8,
        isSimulated: true,
      });
    }, 150);

    if (this.burstTimeout) clearTimeout(this.burstTimeout);
    this.burstTimeout = setTimeout(() => {
      this.returnToNormal();
    }, durationMs);
  }

  /**
   * Scenario B.7 — Prolonged Abnormal Traffic
   */
  public simulateProlongedAbnormalTraffic(durationMs = 12000): void {
    this.stopTraffic(false);
    this.simulationMode = 'PROLONGED_ABNORMAL';
    this.simulationLifecycle = 'RUNNING';
    this.simulationStartTime = Date.now();
    this.addSecurityEvent('WARNING', 'Prolonged Abnormal Traffic Triggered', 'Simulating sustained elevated traffic rate (~45 req/s) for 12 seconds.');

    this.simulationInterval = setInterval(() => {
      for (let i = 0; i < 3; i++) {
        fetch(`${this.fakeServerUrl}/api/auth`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Traffic-Category': 'PROLONGED_ABNORMAL',
            'X-Packet-Count': '5',
            'X-Active-Connections': '5',
            'X-New-Connections': '2',
          },
          body: JSON.stringify({ ev_id: `EV-PROLONGED-${i}`, credential: `token_${Date.now()}` }),
          signal: AbortSignal.timeout(800),
        })
          .then((res) => {
            if (!this.fakeServerOnline) {
              this.recordSample({
                timestamp: Date.now(),
                endpoint: '/api/auth',
                method: 'POST',
                statusCode: res.status,
                latencyMs: 12,
                bytesTransferred: 600,
                packetCount: 5,
                activeConnections: 5,
                newConnections: 2,
                sourceIp: `192.168.1.${Math.floor(120 + i)}`,
                destination: '127.0.0.1:8080',
                trafficCategory: 'PROLONGED_ABNORMAL',
                success: res.ok,
                metricValue: 1.6,
                isSimulated: true,
              });
            }
          })
          .catch(() => {});
      }
    }, 65); // ~45 req/s

    if (this.burstTimeout) clearTimeout(this.burstTimeout);
    this.burstTimeout = setTimeout(() => {
      this.returnToNormal();
    }, durationMs);
  }

  /**
   * Scenario B.8 — Combined Anomaly (Multi-feature simultaneous surge)
   */
  public simulateCombinedAnomaly(durationMs = 6000): void {
    this.stopTraffic(false);
    this.simulationMode = 'COMBINED_ANOMALY';
    this.simulationLifecycle = 'RUNNING';
    this.simulationStartTime = Date.now();
    this.addSecurityEvent('CRITICAL', 'Combined Anomaly Triggered', 'Simulating coordinated multi-vector surge: high packet rate, high connection rate, repeated tokens, and data volume.');

    const largeChunk = 'Z'.repeat(4096);

    this.simulationInterval = setInterval(() => {
      for (let i = 0; i < 6; i++) {
        const uniqueIp = `10.200.${Math.floor(Math.random() * 255)}.${Math.floor(1 + Math.random() * 254)}`;
        fetch(`${this.fakeServerUrl}/api/auth`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Forwarded-For': uniqueIp,
            'X-Traffic-Category': 'COMBINED_ANOMALY',
            'X-Packet-Count': '14',
            'X-Active-Connections': '12',
            'X-New-Connections': '4',
          },
          body: JSON.stringify({
            ev_id: 'EV-COMBINED-BOT',
            credential: 'bot_shared_token_flood',
            payload: largeChunk,
          }),
          signal: AbortSignal.timeout(800),
        })
          .then((res) => {
            if (!this.fakeServerOnline) {
              this.recordSample({
                timestamp: Date.now(),
                endpoint: '/api/auth',
                method: 'POST',
                statusCode: res.status,
                latencyMs: 18,
                bytesTransferred: 4600,
                packetCount: 14,
                activeConnections: 12,
                newConnections: 4,
                sourceIp: uniqueIp,
                destination: '127.0.0.1:8080',
                trafficCategory: 'COMBINED_ANOMALY',
                success: res.ok,
                metricValue: 1.38,
                isSimulated: true,
              });
            }
          })
          .catch(() => {});
      }
    }, 35);

    if (this.burstTimeout) clearTimeout(this.burstTimeout);
    this.burstTimeout = setTimeout(() => {
      this.returnToNormal();
    }, durationMs);
  }

  /**
   * Full Attack Simulation (Backward compatible DDoS burst)
   */
  public startAttackSimulation(): void {
    this.simulateCombinedAnomaly(15000);
  }

  /**
   * Return Traffic to Normal (Safe baseline recovery)
   */
  public returnToNormal(): void {
    if (this.burstTimeout) {
      clearTimeout(this.burstTimeout);
      this.burstTimeout = null;
    }

    // Instruct charging-server to clear its queued in-flight burst samples
    fetch(`${this.fakeServerUrl}/api/telemetry/reset`, {
      method: 'POST',
      headers: { 'X-EVShield-Internal': 'true' },
      signal: AbortSignal.timeout(500),
    }).catch(() => {});

    // Filter out abnormal burst artifacts so recovery is prompt and clean
    this.telemetryBuffer = this.telemetryBuffer.filter(
      (s) => s.trafficCategory === 'NORMAL' && (s.latencyMs || 0) < 75
    );
    this.simulationMode = 'NORMAL';
    this.simulationLifecycle = 'RUNNING';
    this.isRecoveryPending = true;
    this.recoveryConsecutiveNormal = 0;
    this.detectionStatus = 'RECOVERING';
    this.threatLevel = 'RECOVERING';
    this.securityStatus = 'PROTECTED';

    this.latestAnomalyResult = {
      isAnomaly: false,
      anomalyScore: 0.0,
      categories: ['NORMAL'],
      alerts: [],
      evaluations: {},
    };
    this.latestMLResult = {
      probability_attack: 0.24,
      predicted_label: 0,
      label: 'NORMAL',
      threshold: this.latestMLResult?.threshold || 0.55,
      mode: 'CICEV2023_RF',
      features: {},
      inferenceTimeMs: 10,
      modelName: 'RandomForestClassifier',
    };
    this.startNormalTraffic();
    this.addSecurityEvent('SUCCESS', 'Recovery Initiated', 'Anomalous traffic generator stopped. Evaluating 2-cycle baseline recovery criteria (~12 req/s).', 'RECOVERY_STARTED', 'LOW', 'RECOVERED');
  }

  public configureIntensity(intensity: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME', customRps?: number): void {
    this.simulationIntensity = intensity;
    switch (intensity) {
      case 'LOW': this.targetRps = customRps || 6; break;
      case 'MEDIUM': this.targetRps = customRps || 12; break;
      case 'HIGH': this.targetRps = customRps || 35; break;
      case 'EXTREME': this.targetRps = customRps || 100; break;
    }

    if (this.simulationMode === 'NORMAL') {
      this.startNormalTraffic();
    }
  }

  public stopTraffic(emitEvent = true): void {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
    if (this.burstTimeout) {
      clearTimeout(this.burstTimeout);
      this.burstTimeout = null;
    }
    const previousMode = this.simulationMode;
    const previousLifecycle = this.simulationLifecycle;

    this.simulationMode = 'NORMAL';
    this.simulationLifecycle = 'STOPPED';
    this.simulationStartTime = null;
    this.telemetryBuffer = [];

    if (emitEvent && previousLifecycle !== 'STOPPED') {
      this.addSecurityEvent('INFO', 'Traffic Simulation Stopped', 'Generator stopped. Telemetry draining to baseline.');
    }
  }

  public reset(): void {
    this.stopTraffic(false);
    this.telemetryBuffer = [];
    this.totalRequests = 0;
    this.totalBytesTransferred = 0;
    this.totalPacketsCount = 0;
    this.failedRequests = 0;
    this.simulationMode = 'NORMAL';
    this.detectionStatus = 'NORMAL';
    this.simulationLifecycle = 'RUNNING';
    this.isRecoveryPending = false;
    this.recoveryConsecutiveNormal = 0;
    this.threatLevel = 'NORMAL';
    this.securityStatus = 'PROTECTED';
    this.activeIncident = null;
    this.events = [];
    this.graphHistory = [];
    baselineService.reset();
    anomalyDetectionService.clearHistory();
    this.seedInitialGraphHistory();
    this.startNormalTraffic();
    this.addSecurityEvent('INFO', 'System Reset', 'All telemetry buffers, baseline statistics, and counters reset to nominal baseline.', 'INIT', 'LOW', 'NONE');
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Unified Scenario Dispatcher & Auto-Demo Simulation Controller
  // ───────────────────────────────────────────────────────────────────────────
  public executeScenario(scenario: string, durationMs?: number, isAutoTrigger = false): void {
    // If an administrator initiates a manual action, pause/reset auto demo to prevent conflicting state
    if (!isAutoTrigger && this.autoDemoConfig.enabled) {
      if (this.autoDemoTimer) clearTimeout(this.autoDemoTimer);
      this.autoDemoConfig.phase = 'NORMAL_PERIOD';
      this.autoDemoPhaseStartedAt = Date.now();
    }

    const dur = durationMs || 5000;
    switch (scenario) {
      case 'burst':
      case 'TRAFFIC_BURST':
        this.triggerTrafficBurst(dur);
        break;
      case 'connection-rate':
      case 'HIGH_CONNECTION_RATE':
        this.simulateHighConnectionRate(dur);
        break;
      case 'repeated-requests':
      case 'REPEATED_REQUESTS':
        this.simulateRepeatedRequests(dur);
        break;
      case 'packet-rate':
      case 'PACKET_RATE_SURGE':
        this.simulateAbnormalPacketRate(dur);
        break;
      case 'data-volume':
      case 'EXCESSIVE_DATA':
        this.simulateExcessiveDataTransfer(dur);
        break;
      case 'duration':
      case 'UNUSUAL_LATENCY':
        this.simulateUnusualConnectionDuration(dur);
        break;
      case 'prolonged':
      case 'PROLONGED_ABNORMAL':
        this.simulateProlongedAbnormalTraffic(dur || 12000);
        break;
      case 'combined':
      case 'COMBINED_ANOMALY':
        this.simulateCombinedAnomaly(dur || 6000);
        break;
      case 'return-to-normal':
      case 'normal':
      case 'NORMAL':
        this.returnToNormal();
        break;
      default:
        throw new Error(`Unknown simulation scenario '${scenario}'`);
    }
  }

  public enableAutoDemo(
    intervalSeconds = 20,
    durationSeconds = 8,
    scenario: SimulationMode = 'COMBINED_ANOMALY'
  ): AutoSimulationConfig {
    if (this.autoDemoTimer) clearTimeout(this.autoDemoTimer);

    this.autoDemoConfig = {
      enabled: true,
      intervalSeconds: Math.max(5, intervalSeconds),
      durationSeconds: Math.max(3, durationSeconds),
      scenario: scenario || 'COMBINED_ANOMALY',
      phase: 'NORMAL_PERIOD',
      secondsToNextAttack: Math.max(5, intervalSeconds),
      activeAttackSecondsRemaining: 0,
    };
    this.autoDemoPhaseStartedAt = Date.now();
    this.scheduleAutoDemoNextPhase('ATTACK', this.autoDemoConfig.intervalSeconds * 1000);
    this.startNormalTraffic();
    this.addSecurityEvent(
      'INFO',
      'Automatic Demo Simulation Enabled',
      `Auto demo active: ${this.autoDemoConfig.intervalSeconds}s normal baseline, ${this.autoDemoConfig.durationSeconds}s attack surge (${this.autoDemoConfig.scenario}).`
    );

    return { ...this.autoDemoConfig };
  }

  public disableAutoDemo(): AutoSimulationConfig {
    this.autoDemoConfig.enabled = false;
    this.autoDemoConfig.phase = 'DISABLED';
    this.autoDemoConfig.secondsToNextAttack = 0;
    this.autoDemoConfig.activeAttackSecondsRemaining = 0;

    if (this.autoDemoTimer) {
      clearTimeout(this.autoDemoTimer);
      this.autoDemoTimer = null;
    }
    this.autoDemoPhaseStartedAt = null;
    this.returnToNormal();
    this.addSecurityEvent('INFO', 'Automatic Demo Simulation Disabled', 'Restored strictly manual monitoring mode.');

    return { ...this.autoDemoConfig };
  }

  public getAutoDemoConfig(): AutoSimulationConfig {
    return { ...this.autoDemoConfig };
  }

  private scheduleAutoDemoNextPhase(target: 'ATTACK' | 'NORMAL', delayMs: number): void {
    if (this.autoDemoTimer) clearTimeout(this.autoDemoTimer);

    this.autoDemoTimer = setTimeout(() => {
      if (!this.autoDemoConfig.enabled) return;

      if (target === 'ATTACK') {
        this.autoDemoConfig.phase = 'ATTACK_PERIOD';
        this.autoDemoPhaseStartedAt = Date.now();
        this.executeScenario(this.autoDemoConfig.scenario, this.autoDemoConfig.durationSeconds * 1000, true);
        // Schedule recovery after attack duration
        this.scheduleAutoDemoNextPhase('NORMAL', this.autoDemoConfig.durationSeconds * 1000);
      } else {
        // Return to normal
        this.autoDemoConfig.phase = 'RECOVERY_PERIOD';
        this.autoDemoPhaseStartedAt = Date.now();
        this.returnToNormal();

        // After recovery window (4s), return to normal monitoring interval
        setTimeout(() => {
          if (!this.autoDemoConfig.enabled) return;
          this.autoDemoConfig.phase = 'NORMAL_PERIOD';
          this.autoDemoPhaseStartedAt = Date.now();
          this.scheduleAutoDemoNextPhase('ATTACK', this.autoDemoConfig.intervalSeconds * 1000);
        }, 4000);
      }
    }, delayMs);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Snapshot Provider
  // ───────────────────────────────────────────────────────────────────────────
  public getLiveSnapshot(): LiveTelemetrySnapshot {
    const latencies = this.telemetryBuffer.map((s) => s.latencyMs);
    const avgLatency =
      latencies.length > 0
        ? Math.round((latencies.reduce((a, b) => a + b, 0) / latencies.length) * 10) / 10
        : 14.0;
    const minLatency = latencies.length > 0 ? Math.min(...latencies) : 6;
    const maxLatency = latencies.length > 0 ? Math.max(...latencies) : 28;

    const variance =
      latencies.length > 0
        ? latencies.reduce((acc, v) => acc + Math.pow(v - avgLatency, 2), 0) / latencies.length
        : 0;
    const stdLatency = Math.round(Math.sqrt(variance) * 10) / 10;

    const oneSecAgo = Date.now() - 1000;
    const isStopped = this.simulationLifecycle === 'STOPPED';
    const recent = isStopped ? [] : this.telemetryBuffer.filter((s) => s.timestamp >= oneSecAgo);
    const rps = isStopped ? 0 : recent.length;
    const packetRate = isStopped ? 0 : recent.reduce((sum, s) => sum + (s.packetCount || 4), 0);
    const bytesInSec = isStopped ? 0 : recent.reduce((sum, s) => sum + (s.bytesTransferred || 512), 0);
    const newConns = isStopped ? 0 : recent.reduce((sum, s) => sum + (s.newConnections || 1), 0);

    const durationSeconds = this.simulationStartTime
      ? Math.floor((Date.now() - this.simulationStartTime) / 1000)
      : 0;

    const baseline = baselineService.getBaseline();
    const recentAlerts = anomalyDetectionService.getAlertHistory().slice(0, 20);
    const thresholds = anomalyDetectionService.getThresholds();

    const recoveryStatus: RecoveryStatus = {
      isRecovering: this.isRecoveryPending || this.detectionStatus === 'RECOVERING',
      consecutiveNormalCycles: this.recoveryConsecutiveNormal,
      requiredNormalCycles: this.REQUIRED_NORMAL_CYCLES,
      message: this.isRecoveryPending
        ? `Evaluating baseline recovery (${this.recoveryConsecutiveNormal}/${this.REQUIRED_NORMAL_CYCLES}s normal metrics)`
        : 'Stable baseline',
    };

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
        telemetry: this.simulationLifecycle === 'RUNNING' || rps > 0 || this.telemetryBuffer.length > 0 ? 'ACTIVE' : 'IDLE',
        ...(this.mlEngineError ? { mlError: this.mlEngineError } : {}),
      },
      telemetry: {
        requestsPerSecond: rps,
        packetRate: packetRate > 0 ? packetRate : rps * 4,
        dataTransferredBytes: bytesInSec > 0 ? bytesInSec : rps * 512,
        bytesPerSecond: bytesInSec > 0 ? bytesInSec : rps * 512,
        dataTransferredMB: Math.round(((bytesInSec > 0 ? bytesInSec : rps * 512) / (1024 * 1024)) * 1000) / 1000,
        activeConnections: Math.max(1, this.telemetryBuffer.slice(-5).reduce((max, s) => Math.max(max, s.activeConnections || 1), 1)),
        newConnectionRate: newConns > 0 ? newConns : Math.ceil(rps * 0.4),
        averageLatencyMs: avgLatency,
        minLatencyMs: minLatency,
        maxLatencyMs: maxLatency,
        stdLatencyMs: stdLatency,
        errorRatePercent: this.totalRequests > 0 ? Math.round((this.failedRequests / this.totalRequests) * 1000) / 10 : 0,
        totalRequests: this.totalRequests,
        totalBytes: this.totalBytesTransferred,
        windowSize: this.telemetryBuffer.length,
        graphPoints: this.graphHistory,
        trafficCategory: this.latestAnomalyResult.categories[0] || 'NORMAL',
        baseline,
        recentAlerts,
        detectionResult: this.latestAnomalyResult,
      },
      trafficCategory: this.latestAnomalyResult.categories[0] || 'NORMAL',
      baseline,
      anomalies: this.latestAnomalyResult,
      detectionResult: this.latestAnomalyResult,
      recentAlerts,
      thresholds,
      ml: this.latestMLResult,
      simulationMode: this.simulationMode,
      detectionStatus: this.detectionStatus,
      simulationLifecycle: this.simulationLifecycle,
      autoSimulation: { ...this.autoDemoConfig },
      recoveryStatus,
      simulation: {
        mode: this.simulationMode,
        lifecycle: this.simulationLifecycle,
        active: this.simulationLifecycle === 'RUNNING',
        intensity: this.simulationIntensity,
        targetRps: this.targetRps,
        startedAt: this.simulationStartTime ? new Date(this.simulationStartTime).toISOString() : null,
        durationSeconds,
        isSimulated: true,
        autoDemo: { ...this.autoDemoConfig },
      },
      threatLevel: this.threatLevel,
      securityStatus: this.securityStatus,
      activeDetector: mlEngineService.getActiveDetector(),
      detectionMethod: mlEngineService.getActiveDetector(),
      events: this.events,
      activeIncident: this.activeIncident,
      lastIncident: this.lastIncident,
    };
  }

  public setActiveDetector(method: DetectionMethod): void {
    mlEngineService.setActiveDetector(method);
    console.log(`[TelemetryService] Active detector set to ${method}`);
  }

  public getActiveDetector(): DetectionMethod {
    return mlEngineService.getActiveDetector();
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
}

export const telemetryService = new TelemetryService();
