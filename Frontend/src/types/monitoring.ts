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
