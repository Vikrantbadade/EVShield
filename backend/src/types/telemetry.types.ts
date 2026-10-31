/**
 * EVShield Stage 1 - Real-Time Telemetry & Anomaly Detection Types
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

export interface RawTelemetrySample {
  timestamp: number;              // Epoch milliseconds
  endpoint: string;               // Target endpoint, e.g. /api/auth
  method: string;                 // HTTP method (GET, POST, etc.)
  statusCode: number;             // Response status code
  latencyMs: number;              // Request-response duration
  bytesTransferred: number;       // Request + response size in bytes
  packetCount: number;            // Estimated or observed packet count
  activeConnections: number;      // Current concurrent connections
  newConnections: number;         // New connections initiated in this event
  sourceIp: string;               // Client IP / identifier
  destination: string;            // Server host:port
  trafficCategory: TrafficCategory;
  payloadBytes?: number;          // Body payload size
  metricValue?: number;           // Backward compatible kernel/timing feature
  isSimulated: boolean;           // True: simulated EV telemetry; False: physical capture
  success?: boolean;              // Optional request success indicator
}

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
  observationWindowSeconds: number;        // e.g. 60 seconds
  sampleCount: number;
  lastUpdated: string;                     // ISO 8601 UTC
  isEstablished: boolean;                  // True if enough samples collected
}

export interface LiveTelemetryMetrics {
  packetRate: number;                      // Packets per second
  dataTransferredBytes: number;            // Total bytes in current window
  dataTransferredMB: number;               // Transferred in MB
  activeConnections: number;               // Concurrent connections
  newConnectionRate: number;               // New connections per second
  avgConnectionDurationMs: number;         // Average connection duration in ms
  requestRate: number;                     // Requests per second
  requestFrequencyHz: number;              // Request frequency (requests/sec)
  errorRatePercent: number;                // Failure rate %
  windowSampleCount: number;               // Samples in rolling window
  timestamp: string;                       // ISO 8601 UTC
}

export interface ExplainableAnomalyAlert {
  id: string;                              // Unique alert identifier (e.g. ALT-20261031-1042)
  alertId: string;                         // Canonical alert ID
  timestamp: string;                       // ISO 8601 UTC timestamp
  category: TrafficCategory;               // Anomaly category
  severity: AnomalySeverity;               // Calculated severity
  detectionMethod: string;                 // e.g. Statistical Z-Score, Threshold Rule
  detectionRule: string;                   // Documented rule definition
  observedValues: Record<string, number>;  // Concrete observed values
  baselineValues: Record<string, number>;  // Established baseline values
  percentageDeviation: Record<string, number>; // Deviation percentage (+XXX%)
  deviations: {
    requestRatePercent?: number | null;
    packetRatePercent?: number | null;
    bytesPercent?: number | null;
    newConnectionsPercent?: number | null;
    durationPercent?: number | null;
    [key: string]: number | null | undefined;
  };
  contributingFeatures: string[];          // Primary metrics triggering the alert
  explanation: string;                     // Plain English explanation of the root cause
  recommendedActions: string[];            // Step-by-step administrator investigation guide
  recommendedInvestigation: string[];      // Investigation guide alias
  acknowledged: boolean;
  isSimulated: boolean;                    // Explicitly labeled as simulated traffic
}

export interface AnomalyDetectionResult {
  isAnomaly: boolean;
  anomalyScore: number;                    // 0.0 to 1.0 composite normalized deviation
  categories: TrafficCategory[];
  alerts: ExplainableAnomalyAlert[];
  evaluations: Record<string, {
    observed: number;
    baselineMean: number;
    baselineStd: number;
    zScore: number;
    percentDeviation: number;
    isAbnormal: boolean;
  }>;
}

export interface DetectionThresholdsConfig {
  sensitivity: DetectionSensitivity;
  burstMultiplier: number;                 // Multiplier over baseline for burst detection (default 3.0)
  connRateMultiplier: number;              // Multiplier for new connection rate (default 3.5)
  dataVolumeMultiplier: number;            // Multiplier for data volume (default 3.0)
  packetRateMultiplier: number;            // Multiplier for packet rate (default 3.0)
  durationMultiplier: number;              // Multiplier for connection duration (default 2.5)
  repeatedRequestThreshold: number;        // Identical request count in 2s window (default 15)
  zScoreThreshold: number;                 // Statistical Z-score threshold (2.0 = High sens, 2.5 = Med, 3.5 = Low)
}

// ─────────────────────────────────────────────────────────────────────────────
// Authoritative Multi-State Dimensions (Issue 1 & Issue 3)
// ─────────────────────────────────────────────────────────────────────────────

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

export interface SimulationConfig {
  mode: SimulationMode;
  lifecycle: SimulationLifecycle;
  active: boolean;
  intensity: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  targetRps: number;
  payloadSizeBytes: number;
  newConnectionsPerBatch: number;
  repeatedRequestFactor: number;
  startedAt: string | null;
  durationSeconds: number;
  isSimulated: boolean;
  autoDemo?: AutoSimulationConfig;
}
