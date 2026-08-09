export type AlertSeverity = 'INFO' | 'WARNING' | 'HIGH' | 'CRITICAL';
export type AlertStatus = 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';

export interface Alert {
  id: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  status: AlertStatus;
  timestamp: string;
  attackId?: string;
  stationId?: string;
  mlConfidence?: number;
  isDemo: boolean;
}
