export type StationStatus = 'PROTECTED' | 'DEGRADED' | 'UNDER ATTACK' | 'OFFLINE';
export type StationHealth = 'NOMINAL' | 'ELEVATED' | 'CRITICAL';
export type RegionId = 'MUM' | 'DEL' | 'BLR' | 'PUN' | 'HYD';

export interface DemoStation {
  id: string;
  name: string;
  region: RegionId;
  regionLabel: string;
  status: StationStatus;
  requestsPerSec: number;
  latencyMs: number;
  healthPercent: number;
  errorRatePercent: number;
  connectedChargers: number;
  lastEvent: string;
  mlStatus: 'NORMAL' | 'MONITORING' | 'ATTACK DETECTED';
  mlConfidence?: number;
  securityRiskScore?: number;
  activeIncidentId?: string | null;
}

export interface ChargingRegion {
  id: RegionId;
  label: string;
  totalStations: number;
  protected: number;
  degraded: number;
  underAttack: number;
  requestsPerSec: number;
  healthPercent: number;
  latencyMs: number;
  svgX: number; // topology node position
  svgY: number;
}

export interface NetworkSummary {
  totalStations: number;
  protected: number;
  degraded: number;
  underAttack: number;
  offline: number;
  activeConnections: number;
}
