export interface DashboardSummary {
  totalRequests: number;
  requestsAnalyzed: number;
  attacksDetected: number;
  activeThreats: number;
  protectedChargers: number;
  totalChargers: number;
  mlAccuracy: number;
  networkHealth: number;
  requestsPerSecond: number;
  affectedNodes: number;
  securityStatus: 'PROTECTED' | 'THREAT DETECTED';
  isDemo: boolean;
}
