export type SeverityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type IncidentStatus = 'DETECTED' | 'INVESTIGATING' | 'MITIGATED' | 'RESOLVED';
export type AttackType = 'DDOS' | 'TRAFFIC_ANOMALY' | 'AUTHENTICATION_BURST';
export type ClassificationType = 'NORMAL' | 'ATTACK';

export interface AffectedStationInfo {
  id: string;
  name: string;
  location: string;
  status: 'PROTECTED' | 'DEGRADED' | 'UNDER ATTACK';
  requestsPerSec: number;
}

export interface AttackSignal {
  name: string;
  value: string;
  status: 'NORMAL' | 'ELEVATED' | 'HIGH' | 'ANOMALOUS';
  description: string;
}

export interface AttackIncident {
  id: string;
  timestamp: string;
  startTime: string;
  endTime?: string;
  duration: string;
  status: IncidentStatus;
  severity: SeverityLevel;
  attackType: AttackType;
  attackTypeLabel: string;
  classification: ClassificationType;
  mlConfidence: number; // e.g. 97.4
  requestsPerSecond: number;
  baselineRequestsPerSecond: number;
  peakRequestsPerSecond: number;
  affectedNodes: number;
  affectedStations: AffectedStationInfo[];
  sourceCategory: string;
  targetInfrastructure: string;
  mitigationStatus: string;
  mitigationTime: string;
  description: string;
  detectionSummary: string;
  isDemo: boolean;
  signals?: AttackSignal[];
}

export interface AttackFilterParams {
  search?: string;
  severity?: string;
  status?: string;
  attackType?: string;
  page?: number;
  pageSize?: number;
}
