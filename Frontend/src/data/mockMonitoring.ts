import { MonitoringEvent, SecuritySignal, RegionalTrafficEntry } from '../types/monitoring';

export const baseMonitoringEvents: MonitoringEvent[] = [
  { id: 'ev-1', time: '09:42:03', message: 'EV charging traffic baseline established at ~1,200 req/s', severity: 'normal', source: 'Gateway Monitor' },
  { id: 'ev-2', time: '10:15:17', message: 'Authentication handshake batch completed successfully', severity: 'info', source: 'Auth Engine' },
  { id: 'ev-3', time: '11:02:44', message: 'ML model inference running normally — 0 anomalies flagged', severity: 'info', source: 'ML Engine' },
  { id: 'ev-4', time: '11:35:09', message: 'Charging session token refresh cycle processed', severity: 'normal', source: 'Session Manager' },
  { id: 'ev-5', time: '12:00:00', message: 'Hourly health check: all 1,250 stations PROTECTED', severity: 'info', source: 'SOC Monitor' },
  { id: 'ev-6', time: '12:04:00', message: 'Traffic pattern stable — auth latency nominal at 42ms avg', severity: 'normal', source: 'Latency Monitor' },
];

export const attackMonitoringEvents: MonitoringEvent[] = [
  { id: 'atk-1', time: '12:04:17', message: '⚠ Traffic anomaly detected — request rate climbing past baseline', severity: 'warning', source: 'Gateway Monitor' },
  { id: 'atk-2', time: '12:04:19', message: '⚠ Authentication burst increasing — CS-0421 affected', severity: 'warning', source: 'Auth Engine' },
  { id: 'atk-3', time: '12:04:23', message: '🔴 ML detection triggered — DDoS pattern identified', severity: 'critical', source: 'ML Engine' },
  { id: 'atk-4', time: '12:04:31', message: '🔴 DDoS classification confirmed — confidence 97.4%', severity: 'critical', source: 'ML Classifier' },
  { id: 'atk-5', time: '12:04:42', message: '⚠ Mumbai gateway Zone 1 severely affected', severity: 'critical', source: 'Gateway Monitor' },
  { id: 'atk-6', time: '12:05:01', message: '🔴 Automated rate limiting enforced — mitigation active', severity: 'critical', source: 'SOC Automation' },
];

export const baseSecuritySignals: SecuritySignal[] = [
  { id: 'sig-1', label: 'Traffic Burst Intensity', value: 'NORMAL',  status: 'NORMAL',   percent: 12 },
  { id: 'sig-2', label: 'Authentication Retries',  value: 'NORMAL',  status: 'NORMAL',   percent: 8  },
  { id: 'sig-3', label: 'Latency Deviation',       value: 'NORMAL',  status: 'NORMAL',   percent: 5  },
  { id: 'sig-4', label: 'Gateway Load',            value: 'NORMAL',  status: 'NORMAL',   percent: 18 },
  { id: 'sig-5', label: 'ML Anomaly Score',        value: '1.8%',    status: 'NORMAL',   percent: 2  },
];

export const attackSecuritySignals = (mlConfidence: number): SecuritySignal[] => [
  { id: 'sig-1', label: 'Traffic Burst Intensity', value: 'CRITICAL', status: 'CRITICAL', percent: 97 },
  { id: 'sig-2', label: 'Authentication Retries',  value: 'CRITICAL', status: 'CRITICAL', percent: 92 },
  { id: 'sig-3', label: 'Latency Deviation',       value: 'ELEVATED', status: 'ELEVATED', percent: 68 },
  { id: 'sig-4', label: 'Gateway Load',            value: 'CRITICAL', status: 'CRITICAL', percent: 95 },
  { id: 'sig-5', label: 'ML Anomaly Score',        value: `${mlConfidence.toFixed(1)}%`, status: 'CRITICAL', percent: mlConfidence },
];

export const baseRegionalTraffic: RegionalTrafficEntry[] = [
  { region: 'Mumbai',     regionId: 'MUM', requestsPerSec: 5240,  healthPercent: 98.7, latencyMs: 42, status: 'PROTECTED' },
  { region: 'Delhi',      regionId: 'DEL', requestsPerSec: 4920,  healthPercent: 99.1, latencyMs: 38, status: 'PROTECTED' },
  { region: 'Bengaluru',  regionId: 'BLR', requestsPerSec: 4840,  healthPercent: 99.4, latencyMs: 35, status: 'PROTECTED' },
  { region: 'Pune',       regionId: 'PUN', requestsPerSec: 4210,  healthPercent: 97.8, latencyMs: 41, status: 'PROTECTED' },
  { region: 'Hyderabad',  regionId: 'HYD', requestsPerSec: 3940,  healthPercent: 98.2, latencyMs: 39, status: 'PROTECTED' },
];

export const getAttackRegionalTraffic = (requestsPerSec: number): RegionalTrafficEntry[] => [
  { region: 'Mumbai',     regionId: 'MUM', requestsPerSec,        healthPercent: 62,   latencyMs: 142, status: 'THREAT DETECTED' },
  { region: 'Delhi',      regionId: 'DEL', requestsPerSec: 4920,  healthPercent: 99.1, latencyMs: 38,  status: 'PROTECTED' },
  { region: 'Bengaluru',  regionId: 'BLR', requestsPerSec: 4840,  healthPercent: 99.4, latencyMs: 35,  status: 'PROTECTED' },
  { region: 'Pune',       regionId: 'PUN', requestsPerSec: 4210,  healthPercent: 97.8, latencyMs: 41,  status: 'PROTECTED' },
  { region: 'Hyderabad',  regionId: 'HYD', requestsPerSec: 3940,  healthPercent: 98.2, latencyMs: 39,  status: 'PROTECTED' },
];
