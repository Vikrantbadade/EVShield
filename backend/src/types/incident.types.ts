/**
 * EVShield Stage 3: Intelligent Incident Management & Response Types
 */

import { ExplainableAnomalyAlert } from './telemetry.types.js';

export type IncidentStatus = 'OPEN' | 'INVESTIGATING' | 'CONTAINED' | 'RESOLVED' | 'CLOSED';
export type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type IncidentCategory =
  | 'TRAFFIC_BURST'
  | 'HIGH_CONNECTION_RATE'
  | 'REPEATED_REQUESTS'
  | 'EXCESSIVE_DATA'
  | 'UNUSUAL_LATENCY'
  | 'COMBINED_ANOMALY'
  | 'DDOS'
  | 'UNKNOWN';

export interface RiskFactor {
  name: string;
  weight: number;
  score: number;
  impact: string;
  description: string;
}

export interface RiskAssessment {
  score: number; // 0 - 100
  level: RiskLevel;
  calculatedAt: string;
  factors: RiskFactor[];
  explanation: string;
  recommendations: string[];
}

export interface InvestigationNote {
  id: string;
  incidentId: string;
  authorEmail: string;
  authorName: string;
  authorRole: string;
  content: string;
  timestamp: string;
}

export interface ResponseActionItem {
  id: string;
  incidentId: string;
  title: string;
  description: string;
  category: IncidentCategory;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'PENDING' | 'COMPLETED' | 'DISMISSED';
  actionType: 'ADVISORY' | 'INVESTIGATION' | 'CONTAINMENT' | 'HARDENING' | 'RECOVERY';
  rationale: string;
  updatedBy?: string;
  updatedAt?: string;
  notes?: string;
}

export interface ThreatIntelResult {
  indicator: string;
  type: 'IP' | 'DOMAIN';
  provider: string;
  reputation: 'MALICIOUS' | 'SUSPICIOUS' | 'BENIGN' | 'UNKNOWN';
  confidence: number;
  threatCategory?: string;
  country?: string;
  asn?: string;
  lookupTimestamp: string;
  status: 'AVAILABLE' | 'UNAVAILABLE' | 'CACHED';
  details: string;
  raw?: Record<string, unknown>;
}

export interface TimelineEventEvidence {
  telemetrySnapshot?: Record<string, unknown>;
  alertId?: string;
  detector?: string;
  deviationPercent?: number;
  metricName?: string;
  sourceIp?: string;
}

export interface IncidentTimelineEvent {
  id: string;
  incidentId: string;
  timestamp: string;
  eventType:
    | 'ANOMALY_DETECTED'
    | 'ALERT_GENERATED'
    | 'INCIDENT_CREATED'
    | 'STATUS_CHANGED'
    | 'SEVERITY_CHANGED'
    | 'CATEGORY_CHANGED'
    | 'ANALYST_ASSIGNED'
    | 'NOTE_ADDED'
    | 'ACTION_EXECUTED'
    | 'CONTAINMENT_INITIATED'
    | 'BASELINE_RECOVERED'
    | 'INCIDENT_RESOLVED'
    | 'INCIDENT_CLOSED';
  title: string;
  description: string;
  actor: {
    type: 'SYSTEM' | 'DETECTOR' | 'ANALYST';
    name: string;
    role?: string;
  };
  evidence?: TimelineEventEvidence;
}

export interface CorrelatedAlertRecord {
  alertId: string;
  timestamp: string;
  category: string;
  severity: IncidentSeverity;
  sourceIp?: string;
  targetStationId?: string;
  metricValue?: number;
  deviationPercent?: number;
  explanation: string;
}

export interface AlertCorrelationGroup {
  groupId: string;
  primaryCategory: IncidentCategory;
  alertCount: number;
  firstAlertTimestamp: string;
  lastAlertTimestamp: string;
  correlationReason: string;
  patternType: 'SINGLE_VECTOR_BURST' | 'MULTI_STEP_SURGE' | 'REPLAY_SEQUENCE' | 'DISTRIBUTED_SWARM';
  alerts: CorrelatedAlertRecord[];
}

export interface SecurityIncident {
  id: string;                     // e.g. INC-20261101-1042
  title: string;                  // Plain English incident title
  description: string;
  category: IncidentCategory;
  categoryLabel: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  riskScore: number;              // 0 - 100
  riskLevel: RiskLevel;
  riskAssessment: RiskAssessment;
  confidence: number;             // 0.0 - 1.0 (from ML / consensus)
  assignedTo?: {
    email: string;
    name: string;
    role: string;
    assignedAt: string;
  };
  affectedStations: string[];     // Station IDs e.g. ['CS-0421']
  primaryStationId: string;
  sourceIps: string[];
  targetInfrastructure: string;
  detectorAttribution: string;    // e.g. 'RandomForestClassifier & ThresholdEngine'

  // Timestamps
  createdAt: string;
  firstDetectedAt: string;
  lastUpdatedAt: string;
  containedAt?: string;
  resolvedAt?: string;
  closedAt?: string;

  // Correlation & Evidence
  correlationGroup: AlertCorrelationGroup;
  alerts: CorrelatedAlertRecord[];
  timeline: IncidentTimelineEvent[];
  notes: InvestigationNote[];
  responseActions: ResponseActionItem[];
  threatIntel?: ThreatIntelResult[];
  rootCauseAnalysis?: string;
}

export interface IncidentFilterParams {
  search?: string;
  status?: IncidentStatus | 'ALL';
  severity?: IncidentSeverity | 'ALL';
  category?: IncidentCategory | 'ALL';
  stationId?: string;
  assignedTo?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: 'newest' | 'oldest' | 'severity' | 'riskScore';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface IncidentQueryResult {
  items: SecurityIncident[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface IncidentAnalyticsSummary {
  totalIncidents: number;
  openIncidents: number;
  investigatingIncidents: number;
  containedIncidents: number;
  resolvedIncidents: number;
  closedIncidents: number;
  criticalIncidents: number;
  highIncidents: number;
  mediumIncidents: number;
  lowIncidents: number;
  averageRiskScore: number;
  mttaMinutes: number;            // Mean Time to Acknowledge
  mttrMinutes: number;            // Mean Time to Resolve
  resolutionRatePercent: number;  // % of incidents contained/resolved
  categoryDistribution: Record<IncidentCategory, number>;
  severityDistribution: Record<IncidentSeverity, number>;
  riskDistribution: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  mostAffectedStations: Array<{ stationId: string; incidentCount: number; maxRiskScore: number }>;
  incidentTrend: Array<{ date: string; count: number; criticalCount: number }>;
}

export interface AuditEventRecord {
  id: string;
  incidentId?: string;
  actor: {
    email: string;
    name: string;
    role: string;
  };
  action: string;
  entityType: 'INCIDENT' | 'NOTE' | 'RESPONSE_ACTION' | 'THREAT_INTEL' | 'CONFIGURATION';
  details: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

export interface IncidentNotificationItem {
  id: string;
  incidentId: string;
  title: string;
  message: string;
  severity: IncidentSeverity;
  timestamp: string;
  read: boolean;
  link: string;
}
