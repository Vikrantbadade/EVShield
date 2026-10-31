export interface KpiStat {
  id: string;
  label: string;
  value: string;
  change?: string;
  isPositive?: boolean;
  isDemo: boolean;
  description?: string;
  iconName: string;
}

export interface TrafficDataPoint {
  timestamp: string;
  requests: number;
  isAnomaly?: boolean;
}

export interface TimelineEvent {
  id: string;
  time: string;
  title: string;
  description: string;
  type: 'normal' | 'suspicious' | 'pattern' | 'escalated' | 'resolved';
  severity: 'low' | 'medium' | 'high' | 'critical';
  isHistoricalDemo: boolean;
}

export interface AttackFeedItem {
  id: string;
  time: string;
  title: string;
  nodeId: string;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  type: string;
}

export interface ChargingStationNode {
  id: string;
  name: string;
  location: string;
  status: 'PROTECTED' | 'UNDER ATTACK' | 'INVESTIGATING';
  requestsPerSec: number;
  threatLevel: 'NOMINAL' | 'ELEVATED' | 'CRITICAL';
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'critical' | 'success';
  timestamp: string;
}

export interface AttackLogRecord {
  attackId: string;
  attackType: string;
  severity: string;
  status: 'ACTIVE' | 'MITIGATED';
  mlConfidence: string;
  requestsPerSec: number;
  affectedNodes: number;
  timestamp: string;
  targetScope: string;
}

import { AttackIncident } from './attack';
import {
  NormalBaseline,
  ExplainableAnomalyAlert,
  DetectionThresholdsConfig,
  SimulationState,
  TrafficCategory,
  SimulationMode,
  DetectionStatus,
  SimulationLifecycle,
  AutoSimulationConfig,
  RecoveryStatus,
} from './monitoring';
import { DetectionMethod } from './ml';

export interface SecurityContextType {
  isAttackMode: boolean;
  isRecovering: boolean;
  isStopped: boolean;
  activeDetector: DetectionMethod;
  setActiveDetector: (detector: DetectionMethod) => Promise<void>;
  toggleDDoSAttack: () => void;
  startNormalTraffic: () => Promise<void>;
  startAttackSimulation: () => Promise<void>;
  stopTraffic: () => Promise<void>;
  resetDemo: () => Promise<void>;
  executeMitigation: () => Promise<void>;
  securityStatus: 'PROTECTED' | 'THREAT DETECTED';
  activeThreats: number;
  requestsPerSec: number;
  affectedNodes: number;
  mlConfidence: number;
  trafficData: TrafficDataPoint[];
  notifications: NotificationItem[];
  dismissNotification: (id: string) => void;
  chargingStations: ChargingStationNode[];
  attackLog: AttackLogRecord | null;
  timelineEvents: TimelineEvent[];
  liveFeed: AttackFeedItem[];
  // Live Telemetry Integration
  isLiveConnected: boolean;
  liveError: string | null;
  serverStatus: 'ONLINE' | 'OFFLINE';
  mlEngineStatus: 'ONLINE' | 'OFFLINE';
  backendStatus: 'ONLINE' | 'OFFLINE';
  telemetryStatus: 'ACTIVE' | 'IDLE';
  simulationMode: SimulationMode;
  detectionStatus: DetectionStatus;
  simulationLifecycle: SimulationLifecycle;
  autoSimulation: AutoSimulationConfig | null;
  recoveryStatus: RecoveryStatus | null;
  threatLevelState: 'NORMAL' | 'ANALYZING' | 'CRITICAL' | 'RECOVERING';
  mlThreshold: number;
  mlLabel: 'NORMAL' | 'ATTACK';
  mlFeatures: Record<string, number>;
  avgLatencyMs: number;
  minLatencyMs: number;
  maxLatencyMs: number;
  totalRequests: number;
  errorRatePercent: number;
  activeIncident: AttackIncident | null;
  lastIncident: AttackIncident | null;
  // Stage 1 Telemetry & Explainable Anomaly Detection Extensions
  packetRate: number;
  bytesPerSecond: number;
  dataTransferredMB: number;
  activeConnections: number;
  newConnectionRate: number;
  trafficCategory: TrafficCategory;
  baseline: NormalBaseline | null;
  anomalyAlerts: ExplainableAnomalyAlert[];
  anomalyScore: number;
  detectionThresholds: DetectionThresholdsConfig | null;
  simulationState: SimulationState | null;
  triggerScenario: (scenario: string) => Promise<void>;
  setSimulationIntensity: (intensity: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME', targetRps?: number) => Promise<void>;
  enableAutoDemo: (intervalSeconds?: number, durationSeconds?: number, scenario?: SimulationMode) => Promise<void>;
  disableAutoDemo: () => Promise<void>;
  updateThresholds: (config: Partial<DetectionThresholdsConfig>) => Promise<void>;
  resetBaseline: () => Promise<void>;
}

export * from './incident';

