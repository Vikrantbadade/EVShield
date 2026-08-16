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

export interface SecurityContextType {
  isAttackMode: boolean;
  toggleDDoSAttack: () => void;
  startNormalTraffic: () => Promise<void>;
  startAttackSimulation: () => Promise<void>;
  stopTraffic: () => Promise<void>;
  resetDemo: () => Promise<void>;
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
  simulationMode: 'NORMAL' | 'ATTACK' | 'IDLE';
  threatLevelState: 'NORMAL' | 'ANALYZING' | 'CRITICAL' | 'RECOVERING';
  mlThreshold: number;
  mlLabel: 'NORMAL' | 'ATTACK';
  mlFeatures: Record<string, number>;
  avgLatencyMs: number;
  minLatencyMs: number;
  maxLatencyMs: number;
  totalRequests: number;
  errorRatePercent: number;
}
