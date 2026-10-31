import { DetectionMethod } from './ml';

export interface MonitoringEvent {
  id: string;
  time: string;
  message: string;
  severity: 'info' | 'normal' | 'warning' | 'critical';
  source: string;
}

export interface SecuritySignal {
  id: string;
  label: string;
  value: string;
  status: 'NORMAL' | 'ELEVATED' | 'CRITICAL';
  percent: number;
}

export interface RegionalTrafficEntry {
  region: string;
  regionId: string;
  requestsPerSec: number;
  healthPercent: number;
  latencyMs: number;
  status: 'PROTECTED' | 'DEGRADED' | 'THREAT DETECTED';
}

export interface TelemetrySnapshot {
  requestsPerSec: number;
  activeConnections: number;
  avgLatencyMs: number;
  errorRatePercent: number;
  authSuccessPercent: number;
}

/**
 * Stage 1 - Real-Time Telemetry & Explainable Anomaly Detection Types
 */

export type TrafficCategory =
  | 'NORMAL'
  | 'TRAFFIC_BURST'
  | 'HIGH_CONNECTION_RATE'
  | 'REPEATED_REQUESTS'
  | 'ABNORMAL_PACKET_RATE'
  | 'EXCESSIVE_DATA_TRANSFER'
  | 'UNUSUAL_CONNECTION_DURATION'
  | 'UNEXPECTED_USAGE_CHANGE'
  | 'COMBINED_ANOMALY'
  | 'PROLONGED_ABNORMAL';

export type AnomalySeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type DetectionSensitivity = 'LOW' | 'MEDIUM' | 'HIGH';

export interface MetricSummary {
  mean: number;
  std: number;
  min: number;
  max: number;
  p95?: number;
}

export interface NormalBaseline {
  packetRate: MetricSummary;               // packets / sec
  bytesPerSecond: MetricSummary;           // bytes / sec
  activeConnections: MetricSummary;        // count
  newConnectionRate: MetricSummary;        // conn / sec
  requestRate: MetricSummary;              // req / sec
  connectionDurationMs: MetricSummary;     // ms
  sampleCount: number;
  observationWindowSec: number;
  lastUpdated: string;
  isEstablished: boolean;
}

export interface ExplainableAnomalyAlert {
  alertId: string;
  timestamp: string;
  category: TrafficCategory;
  severity: AnomalySeverity;
  observedValues: {
    packetRate: number;
    bytesPerSecond: number;
    dataTransferredMB: number;
    activeConnections: number;
    newConnectionRate: number;
    requestRate: number;
    connectionDurationMs: number;
    [key: string]: number;
  };
  baselineValues: {
    packetRateMean: number;
    bytesPerSecondMean: number;
    activeConnectionsMean: number;
    newConnectionRateMean: number;
    requestRateMean: number;
    connectionDurationMsMean: number;
    [key: string]: number;
  };
  deviations: {
    packetRatePercent: number | null;
    bytesPercent: number | null;
    connectionsPercent: number | null;
    newConnectionsPercent: number | null;
    requestRatePercent: number | null;
    durationPercent: number | null;
  };
  contributingFeatures: string[];
  detectionRule: string;
  explanation: string;
  recommendedInvestigation: string[];
  isSimulated: boolean;
  detector?: DetectionMethod;
  detectionMethod?: DetectionMethod;
}

export interface AnomalyDetectionResult {
  isAnomaly: boolean;
  anomalyScore: number;
  severity: AnomalySeverity;
  alert: ExplainableAnomalyAlert | null;
  ruleTriggered: string | null;
}

export interface DetectionThresholdsConfig {
  sensitivity: DetectionSensitivity;
  burstRpsMultiplier: number;
  highConnRatePerSec: number;
  repeatedRequestsRatio: number;
  abnormalPacketRateMultiplier: number;
  excessiveDataMBps: number;
  durationMsThreshold: number;
  zScoreSensitivityThreshold: number;
}

export type SimulationMode =
  | 'NORMAL'
  | 'TRAFFIC_BURST'
  | 'HIGH_CONNECTION_RATE'
  | 'REPEATED_REQUESTS'
  | 'PACKET_RATE_SURGE'
  | 'EXCESSIVE_DATA'
  | 'UNUSUAL_LATENCY'
  | 'PROLONGED_ABNORMAL'
  | 'COMBINED_ANOMALY';

export type DetectionStatus = 'NORMAL' | 'ANOMALY_ACTIVE' | 'RECOVERING';

export type SimulationLifecycle = 'RUNNING' | 'STOPPED';

export interface AutoSimulationConfig {
  enabled: boolean;
  intervalSeconds: number;
  durationSeconds: number;
  scenario: SimulationMode;
  phase: 'NORMAL_PERIOD' | 'ATTACK_PERIOD' | 'RECOVERY_PERIOD' | 'DISABLED';
  secondsToNextAttack: number;
  activeAttackSecondsRemaining: number;
}

export interface RecoveryStatus {
  isRecovering: boolean;
  consecutiveNormalCycles: number;
  requiredNormalCycles: number;
  message: string;
}

export interface SimulationState {
  mode: SimulationMode | string;
  lifecycle?: SimulationLifecycle;
  intensity: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  targetRps: number;
  startedAt: string | null;
  durationSeconds: number;
  isSimulated: boolean;
  autoDemo?: AutoSimulationConfig;
}

export interface LiveTelemetrySnapshot {
  timestamp: string;
  requestsPerSecond: number;
  packetRate: number;
  bytesPerSecond: number;
  bytesTransferredTotal: number;
  dataTransferredMB: number;
  activeConnections: number;
  newConnectionRate: number;
  avgLatencyMs: number;
  minLatencyMs: number;
  maxLatencyMs: number;
  totalRequests: number;
  errorRatePercent: number;
  anomalyScore: number;
  isSimulated: boolean;
  trafficCategory: TrafficCategory;
  baseline: NormalBaseline;
  recentAlerts: ExplainableAnomalyAlert[];
  detectionResult: AnomalyDetectionResult | null;
  simulationMode?: SimulationMode;
  detectionStatus?: DetectionStatus;
  simulationLifecycle?: SimulationLifecycle;
  autoSimulation?: AutoSimulationConfig;
  recoveryStatus?: RecoveryStatus;
  simulation: SimulationState;
  threatLevel: 'NORMAL' | 'ANALYZING' | 'CRITICAL' | 'RECOVERING';
  securityStatus: 'PROTECTED' | 'THREAT DETECTED';
  activeDetector?: DetectionMethod;
  detectionMethod?: DetectionMethod;
}
