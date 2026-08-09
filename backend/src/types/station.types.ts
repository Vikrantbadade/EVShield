export type StationStatus = 'PROTECTED' | 'DEGRADED' | 'UNDER ATTACK' | 'OFFLINE';
export type StationHealth = 'NOMINAL' | 'ELEVATED' | 'CRITICAL';
export type RegionId = 'MUM' | 'DEL' | 'BLR' | 'PUN' | 'HYD';

export interface Station {
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
  location?: string;
  isDemo: boolean;
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
  svgX: number;
  svgY: number;
}
