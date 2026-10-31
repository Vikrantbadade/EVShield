/**
 * EVShield Stage 3: Intelligent Alert Correlation & Incident Management Service
 *
 * Correlates real-time anomaly alerts into cohesive security incidents based on:
 * - Time proximity (within 60s sliding window)
 * - Shared affected charging stations
 * - Source IP or subnet overlap
 * - Multi-step attack sequence transitions
 *
 * Generates transparent correlation explanations, maintains full incident lifecycles,
 * generates response playbooks, records immutable audit trails, and updates risk scores.
 */

import { ExplainableAnomalyAlert } from '../types/telemetry.types.js';
import {
  SecurityIncident,
  IncidentStatus,
  IncidentSeverity,
  IncidentCategory,
  CorrelatedAlertRecord,
  AlertCorrelationGroup,
  IncidentTimelineEvent,
  ResponseActionItem,
  InvestigationNote,
} from '../types/incident.types.js';
import { incidentStorageService } from './incident-storage.service.js';
import { riskAssessmentService } from './risk-assessment.service.js';
import { threatIntelligenceService } from './threat-intelligence.service.js';
import { wsService } from './websocket.service.js';

export class IncidentCorrelationService {
  private correlationWindowMs = 60 * 1000; // 60 seconds sliding correlation window
  private recentActiveIncidentId: string | null = null;
  private lastAlertTimestamp = 0;

  constructor() {
    this.seedDefaultIncidentsIfEmpty();
  }

  /**
   * Seed a few initial historical incidents if store is completely empty,
   * ensuring analysts immediately have investigative records to explore.
   */
  private seedDefaultIncidentsIfEmpty(): void {
    const existing = incidentStorageService.getAllIncidents();
    if (existing.length > 0) return;

    const now = Date.now();
    const demoIncident1: SecurityIncident = {
      id: 'INC-20261031-1042',
      title: 'Distributed Ingress Flood on Station CS-0421',
      description: 'Supervised ML model and dynamic Z-score baseline flagged high-throughput authentication burst exceeding +710% of nominal threshold.',
      category: 'TRAFFIC_BURST',
      categoryLabel: 'Sudden Traffic Burst Surge',
      severity: 'CRITICAL',
      status: 'CONTAINED',
      riskScore: 88,
      riskLevel: 'CRITICAL',
      confidence: 0.98,
      primaryStationId: 'CS-0421',
      affectedStations: ['CS-0421', 'CS-0422'],
      sourceIps: ['192.168.1.145', '192.168.1.189'],
      targetInfrastructure: 'Gateway Zone 1 (CS-0421 / 127.0.0.1:8080)',
      detectorAttribution: 'RandomForestClassifier & ThresholdEngine',
      createdAt: new Date(now - 1000 * 60 * 45).toISOString(),
      firstDetectedAt: new Date(now - 1000 * 60 * 45).toISOString(),
      lastUpdatedAt: new Date(now - 1000 * 60 * 15).toISOString(),
      containedAt: new Date(now - 1000 * 60 * 15).toISOString(),
      assignedTo: {
        email: 'analyst@evshield.demo',
        name: 'Security Analyst',
        role: 'security_analyst',
        assignedAt: new Date(now - 1000 * 60 * 30).toISOString(),
      },
      correlationGroup: {
        groupId: 'GRP-20261031-01',
        primaryCategory: 'TRAFFIC_BURST',
        alertCount: 4,
        firstAlertTimestamp: new Date(now - 1000 * 60 * 45).toISOString(),
        lastAlertTimestamp: new Date(now - 1000 * 60 * 20).toISOString(),
        correlationReason: 'Four consecutive high-throughput surges observed on CS-0421 within 25 seconds originating from identical subnet.',
        patternType: 'SINGLE_VECTOR_BURST',
        alerts: [
          {
            alertId: 'ALT-20261031-01',
            timestamp: new Date(now - 1000 * 60 * 45).toISOString(),
            category: 'TRAFFIC_BURST',
            severity: 'CRITICAL',
            sourceIp: '192.168.1.145',
            targetStationId: 'CS-0421',
            metricValue: 95.0,
            deviationPercent: 710,
            explanation: 'Request rate spiked to 95.0 req/s (+710% above baseline).',
          },
          {
            alertId: 'ALT-20261031-02',
            timestamp: new Date(now - 1000 * 60 * 40).toISOString(),
            category: 'TRAFFIC_BURST',
            severity: 'HIGH',
            sourceIp: '192.168.1.189',
            targetStationId: 'CS-0421',
            metricValue: 88.0,
            deviationPercent: 640,
            explanation: 'Sustained throughput flood observed on gateway authentication route.',
          },
        ],
      },
      alerts: [
        {
          alertId: 'ALT-20261031-01',
          timestamp: new Date(now - 1000 * 60 * 45).toISOString(),
          category: 'TRAFFIC_BURST',
          severity: 'CRITICAL',
          sourceIp: '192.168.1.145',
          targetStationId: 'CS-0421',
          metricValue: 95.0,
          deviationPercent: 710,
          explanation: 'Request rate spiked to 95.0 req/s (+710% above baseline).',
        },
      ],
      timeline: [
        {
          id: 'EVT-01',
          incidentId: 'INC-20261031-1042',
          timestamp: new Date(now - 1000 * 60 * 45).toISOString(),
          eventType: 'ANOMALY_DETECTED',
          title: 'Throughput Threshold Breached',
          description: 'Request frequency reached 95 req/s on FastCharge CS-0421.',
          actor: { type: 'DETECTOR', name: 'ThresholdDetector' },
        },
        {
          id: 'EVT-02',
          incidentId: 'INC-20261031-1042',
          timestamp: new Date(now - 1000 * 60 * 45).toISOString(),
          eventType: 'INCIDENT_CREATED',
          title: 'Incident Opened Automatically',
          description: 'Correlated 2 qualifying alerts into incident INC-20261031-1042.',
          actor: { type: 'SYSTEM', name: 'AlertCorrelationEngine' },
        },
        {
          id: 'EVT-03',
          incidentId: 'INC-20261031-1042',
          timestamp: new Date(now - 1000 * 60 * 30).toISOString(),
          eventType: 'ANALYST_ASSIGNED',
          title: 'Investigator Assigned',
          description: 'Assigned to Security Analyst (analyst@evshield.demo).',
          actor: { type: 'ANALYST', name: 'Security Analyst', role: 'security_analyst' },
        },
        {
          id: 'EVT-04',
          incidentId: 'INC-20261031-1042',
          timestamp: new Date(now - 1000 * 60 * 15).toISOString(),
          eventType: 'CONTAINMENT_INITIATED',
          title: 'Containment Action Logged',
          description: 'Ingress rate limit policy applied to station CS-0421 gateway.',
          actor: { type: 'ANALYST', name: 'Security Analyst' },
        },
      ],
      notes: [
        {
          id: 'NOTE-01',
          incidentId: 'INC-20261031-1042',
          authorEmail: 'analyst@evshield.demo',
          authorName: 'Security Analyst',
          authorRole: 'security_analyst',
          content: 'Confirmed synthetic traffic flood during morning charging schedule. Ingress rate limit verified.',
          timestamp: new Date(now - 1000 * 60 * 25).toISOString(),
        },
      ],
      responseActions: [
        {
          id: 'ACT-01',
          incidentId: 'INC-20261031-1042',
          title: 'Verify Ingress Rate Limiter',
          description: 'Check gateway firewall drop metrics and confirm threshold suppression.',
          category: 'TRAFFIC_BURST',
          priority: 'HIGH',
          status: 'COMPLETED',
          actionType: 'CONTAINMENT',
          rationale: 'Suppresses downstream processing load on charging station backend.',
          updatedBy: 'analyst@evshield.demo',
          updatedAt: new Date(now - 1000 * 60 * 15).toISOString(),
        },
        {
          id: 'ACT-02',
          incidentId: 'INC-20261031-1042',
          title: 'Inspect Replay Token Cache',
          description: 'Ensure duplicate authentication nonces are rejected.',
          category: 'TRAFFIC_BURST',
          priority: 'MEDIUM',
          status: 'PENDING',
          actionType: 'INVESTIGATION',
          rationale: 'Identifies whether flood includes credential stuffing or replay attempts.',
        },
      ],
      threatIntel: [
        {
          indicator: '192.168.1.145',
          type: 'IP',
          provider: 'INTERNAL_RANGE',
          reputation: 'BENIGN',
          confidence: 1.0,
          threatCategory: 'Private Network Range (RFC 1918)',
          country: 'Local Subnet',
          lookupTimestamp: new Date(now - 1000 * 60 * 40).toISOString(),
          status: 'AVAILABLE',
          details: 'Internal EV charging network station subnet.',
        },
      ],
      riskAssessment: {
        score: 88,
        level: 'CRITICAL',
        calculatedAt: new Date(now - 1000 * 60 * 15).toISOString(),
        factors: [
          { name: 'Incident Severity Tier', weight: 30, score: 30, impact: 'CRITICAL', description: 'Assigned at CRITICAL severity.' },
          { name: 'Attack Vector Profile', weight: 20, score: 16, impact: 'TRAFFIC_BURST', description: 'High-frequency request flood.' },
          { name: 'Baseline Deviation Magnitude', weight: 15, score: 15, impact: '+710%', description: 'Exceeded normal baseline by +710%.' },
          { name: 'Alert Clustering Density', weight: 10, score: 7, impact: '4 alerts', description: '4 correlated alert records.' },
          { name: 'Infrastructure Blast Radius', weight: 10, score: 7, impact: '2 stations', description: 'CS-0421 and CS-0422 affected.' },
          { name: 'ML Detector Confidence', weight: 10, score: 10, impact: '98%', description: 'Consensus confidence.' },
          { name: 'Active Containment Discount', weight: -15, score: -15, impact: 'CONTAINED', description: 'Mitigation applied.' },
        ],
        explanation: 'Calculated risk score of 88/100 (CRITICAL) driven by CRITICAL severity and +710% deviation.',
        recommendations: [
          'Immediate SOC triage required: enforce ingress rate clamping on affected charging gateways.',
          'Isolate compromised station connection pools and review recent OCPP token exchanges.',
        ],
      },
      rootCauseAnalysis: 'External automated bot script generated high-frequency HTTP POST authentications against endpoint /api/auth.',
    };

    incidentStorageService.saveIncident(demoIncident1);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Core Alert Processing & Correlation Algorithm
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Process a live qualifying alert emitted by the anomaly detection engine.
   * Correlates with existing active incident if within time & pattern window,
   * or spawns a new security incident automatically.
   */
  public async processAlert(alert: ExplainableAnomalyAlert, context: {
    stationId?: string;
    sourceIp?: string;
    confidence?: number;
    telemetry?: Record<string, unknown>;
    detectorName?: string;
  } = {}): Promise<SecurityIncident> {
    const now = Date.now();
    const stationId = context.stationId || 'CS-0421';
    const sourceIp = context.sourceIp || '192.168.1.50';
    const confidence = context.confidence ?? 0.95;
    const category = alert.category as IncidentCategory;
    const severity = (alert.severity || 'HIGH') as IncidentSeverity;

    // Check for an existing open / active incident that matches correlation criteria
    const activeIncidents = incidentStorageService
      .getAllIncidents()
      .filter((inc) => inc.status === 'OPEN' || inc.status === 'INVESTIGATING');

    let matchedIncident: SecurityIncident | null = null;

    for (const inc of activeIncidents) {
      const timeDiff = now - new Date(inc.lastUpdatedAt).getTime();
      const isWithinWindow = timeDiff <= this.correlationWindowMs;

      // Criteria 1: Matching charging station within time window
      const sameStation = inc.affectedStations.includes(stationId);

      // Criteria 2: Matching or related attack category
      const sameCategory = inc.category === category || inc.category === 'COMBINED_ANOMALY';
      const isMultiStepProgression =
        (inc.category === 'HIGH_CONNECTION_RATE' && category === 'TRAFFIC_BURST') ||
        (inc.category === 'TRAFFIC_BURST' && category === 'EXCESSIVE_DATA');

      // Criteria 3: Same source IP
      const sameSource = inc.sourceIps.includes(sourceIp);

      if (isWithinWindow && (sameStation || sameSource || (sameCategory && isWithinWindow))) {
        matchedIncident = inc;
        break;
      }
    }

    const metricValue = alert.observedValues ? (Object.values(alert.observedValues)[0] ?? 0) : 0;
    const deviationPercent = alert.percentageDeviation
      ? Math.max(0, ...Object.values(alert.percentageDeviation).filter((v): v is number => typeof v === 'number'))
      : 0;

    const alertRecord: CorrelatedAlertRecord = {
      alertId: alert.alertId || alert.id,
      timestamp: alert.timestamp || new Date(now).toISOString(),
      category: alert.category,
      severity,
      sourceIp,
      targetStationId: stationId,
      metricValue,
      deviationPercent,
      explanation: alert.explanation,
    };

    if (matchedIncident) {
      // ─────────────────────────────────────────────────────────────────────────
      // CORRELATE TO EXISTING INCIDENT
      // ─────────────────────────────────────────────────────────────────────────
      const inc = matchedIncident;

      // Prevent duplicate identical alerts in short bursts
      const isDuplicate = inc.alerts.some(
        (a) => a.alertId === alertRecord.alertId || (a.category === alertRecord.category && now - new Date(a.timestamp).getTime() < 3000)
      );

      if (!isDuplicate) {
        inc.alerts.unshift(alertRecord);
        inc.correlationGroup.alerts.unshift(alertRecord);
        inc.correlationGroup.alertCount = inc.alerts.length;
        inc.correlationGroup.lastAlertTimestamp = alertRecord.timestamp;
      }

      // Expand affected stations if new station detected
      if (!inc.affectedStations.includes(stationId)) {
        inc.affectedStations.push(stationId);
      }
      if (!inc.sourceIps.includes(sourceIp)) {
        inc.sourceIps.push(sourceIp);
      }

      // Check for multi-step category progression to COMBINED_ANOMALY
      const uniqueCategories = new Set(inc.alerts.map((a) => a.category));
      if (uniqueCategories.size >= 2 && inc.category !== 'COMBINED_ANOMALY') {
        const prevCategory = inc.category;
        inc.category = 'COMBINED_ANOMALY';
        inc.categoryLabel = 'Multi-Vector Combined Attack Surge';
        inc.correlationGroup.patternType = 'MULTI_STEP_SURGE';
        inc.correlationGroup.correlationReason = `Multi-vector escalation observed: Initial ${prevCategory} combined with subsequent ${category} attack vectors.`;

        // Timeline event for category change
        inc.timeline.unshift({
          id: `EVT-${Date.now()}-${Math.floor(10 + Math.random() * 90)}`,
          incidentId: inc.id,
          timestamp: new Date().toISOString(),
          eventType: 'CATEGORY_CHANGED',
          title: 'Escalated to Multi-Vector Attack',
          description: inc.correlationGroup.correlationReason,
          actor: { type: 'SYSTEM', name: 'AlertCorrelationEngine' },
        });
      }

      // Upgrade severity if current alert is higher
      if (severity === 'CRITICAL' && inc.severity !== 'CRITICAL') {
        inc.severity = 'CRITICAL';
        inc.timeline.unshift({
          id: `EVT-${Date.now()}-${Math.floor(10 + Math.random() * 90)}`,
          incidentId: inc.id,
          timestamp: new Date().toISOString(),
          eventType: 'SEVERITY_CHANGED',
          title: 'Incident Severity Upgraded to CRITICAL',
          description: `Qualifying critical alert ${alertRecord.alertId} increased overall incident severity.`,
          actor: { type: 'DETECTOR', name: context.detectorName || 'AnomalyDetectionEngine' },
        });
      }

      // Recalculate Risk Score
      const risk = riskAssessmentService.evaluateRisk({
        severity: inc.severity,
        category: inc.category,
        deviationPercent,
        alertCount: inc.alerts.length,
        affectedStationsCount: inc.affectedStations.length,
        confidence: inc.confidence,
        threatIntel: inc.threatIntel,
        isContained: inc.status === 'CONTAINED',
        isResolved: inc.status === 'RESOLVED',
      });
      inc.riskScore = risk.score;
      inc.riskLevel = risk.level;
      inc.riskAssessment = risk;
      inc.lastUpdatedAt = new Date().toISOString();

      incidentStorageService.saveIncident(inc);
      this.recentActiveIncidentId = inc.id;

      // Broadcast update over WebSocket
      wsService.broadcast('INCIDENT_UPDATED', {
        incidentId: inc.id,
        severity: inc.severity,
        status: inc.status,
        riskScore: inc.riskScore,
        alertCount: inc.alerts.length,
      });

      return inc;
    } else {
      // ─────────────────────────────────────────────────────────────────────────
      // CREATE BRAND NEW INCIDENT
      // ─────────────────────────────────────────────────────────────────────────
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randSuffix = Math.floor(1000 + Math.random() * 9000);
      const incidentId = `INC-${dateStr}-${randSuffix}`;

      let catLabel = alert.category.replace(/_/g, ' ');
      if (category === 'TRAFFIC_BURST') catLabel = 'Sudden Traffic Burst Surge';
      else if (category === 'HIGH_CONNECTION_RATE') catLabel = 'High Ingress Connection Handshake Flood';
      else if (category === 'REPEATED_REQUESTS') catLabel = 'Replay Attack & Cache Bypass';
      else if (category === 'EXCESSIVE_DATA') catLabel = 'Excessive Payload Volume Exfiltration';
      else if (category === 'UNUSUAL_LATENCY') catLabel = 'Slowloris Connection Holding';
      else if (category === 'COMBINED_ANOMALY') catLabel = 'Multi-Vector Combined Attack Surge';

      const initialTimeline: IncidentTimelineEvent[] = [
        {
          id: `EVT-${Date.now()}-1`,
          incidentId,
          timestamp: alertRecord.timestamp,
          eventType: 'ANOMALY_DETECTED',
          title: `${catLabel} Detected`,
          description: alert.explanation,
          actor: { type: 'DETECTOR', name: context.detectorName || 'AnomalyDetectionService' },
          evidence: {
            alertId: alertRecord.alertId,
            detector: context.detectorName || 'ML & Baseline Engine',
            deviationPercent,
            sourceIp,
          },
        },
        {
          id: `EVT-${Date.now()}-2`,
          incidentId,
          timestamp: new Date().toISOString(),
          eventType: 'INCIDENT_CREATED',
          title: 'Incident Automatically Created',
          description: `Qualifying ${severity} alert breached security threshold. Assigned incident ID ${incidentId}.`,
          actor: { type: 'SYSTEM', name: 'AlertCorrelationEngine' },
        },
      ];

      // Initial Playbook Response Actions
      const initialActions = this.generateResponsePlaybook(incidentId, category);

      // Initial Risk Assessment
      const risk = riskAssessmentService.evaluateRisk({
        severity,
        category,
        deviationPercent,
        alertCount: 1,
        affectedStationsCount: 1,
        confidence,
        isContained: false,
        isResolved: false,
      });

      const newIncident: SecurityIncident = {
        id: incidentId,
        title: `${catLabel} on Station ${stationId}`,
        description: alert.explanation || `Automated anomaly detector flagged abnormal network flow metrics on charging gateway ${stationId}.`,
        category,
        categoryLabel: catLabel,
        severity,
        status: 'OPEN',
        riskScore: risk.score,
        riskLevel: risk.level,
        riskAssessment: risk,
        confidence,
        primaryStationId: stationId,
        affectedStations: [stationId],
        sourceIps: [sourceIp],
        targetInfrastructure: `Gateway Zone (${stationId} / 127.0.0.1:8080)`,
        detectorAttribution: context.detectorName || 'Multi-Model Detection Suite',
        createdAt: new Date().toISOString(),
        firstDetectedAt: alertRecord.timestamp,
        lastUpdatedAt: new Date().toISOString(),
        correlationGroup: {
          groupId: `GRP-${Date.now()}`,
          primaryCategory: category,
          alertCount: 1,
          firstAlertTimestamp: alertRecord.timestamp,
          lastAlertTimestamp: alertRecord.timestamp,
          correlationReason: `Single qualifying ${severity} anomaly alert initiated incident boundary on ${stationId}.`,
          patternType: 'SINGLE_VECTOR_BURST',
          alerts: [alertRecord],
        },
        alerts: [alertRecord],
        timeline: initialTimeline,
        notes: [],
        responseActions: initialActions,
        rootCauseAnalysis: alert.explanation,
      };

      // Enrich threat intelligence asynchronously in background
      threatIntelligenceService.enrichIndicators([sourceIp]).then((tiResults) => {
        if (tiResults && tiResults.length > 0) {
          newIncident.threatIntel = tiResults;
          // Recalculate risk if threat intelligence identified flags
          const updatedRisk = riskAssessmentService.evaluateRisk({
            severity: newIncident.severity,
            category: newIncident.category,
            deviationPercent,
            alertCount: newIncident.alerts.length,
            affectedStationsCount: newIncident.affectedStations.length,
            confidence: newIncident.confidence,
            threatIntel: tiResults,
          });
          newIncident.riskScore = updatedRisk.score;
          newIncident.riskLevel = updatedRisk.level;
          newIncident.riskAssessment = updatedRisk;
          incidentStorageService.saveIncident(newIncident);
        }
      });

      incidentStorageService.saveIncident(newIncident);
      this.recentActiveIncidentId = incidentId;

      // Record Audit Event
      incidentStorageService.recordAuditEvent({
        incidentId,
        actor: { email: 'system@evshield.internal', name: 'AlertCorrelationEngine', role: 'system' },
        action: 'CREATE_INCIDENT',
        entityType: 'INCIDENT',
        details: `Created security incident ${incidentId} for ${catLabel} on station ${stationId}.`,
      });

      // Create in-app Notification for High/Critical incidents
      if (severity === 'CRITICAL' || severity === 'HIGH') {
        incidentStorageService.addNotification({
          incidentId,
          title: `New ${severity} Incident: ${catLabel}`,
          message: `Station ${stationId} is experiencing an active attack. Immediate triage recommended.`,
          severity,
          link: `/analysis/${incidentId}`,
        });
      }

      // Broadcast over WebSocket
      wsService.broadcast('INCIDENT_CREATED', {
        incident: newIncident,
      });

      return newIncident;
    }
  }

  /**
   * Generate category-specific incident response playbooks with prioritized advisory actions.
   */
  public generateResponsePlaybook(incidentId: string, category: IncidentCategory): ResponseActionItem[] {
    const actions: ResponseActionItem[] = [];

    // Common baseline triage action for all categories
    actions.push({
      id: `ACT-${Date.now()}-1`,
      incidentId,
      title: 'Acknowledge Incident & Validate Telemetry Stream',
      description: 'Review active latency, requests/sec, and packet rates on the live monitoring dashboard to confirm anomaly persistence.',
      category,
      priority: 'HIGH',
      status: 'PENDING',
      actionType: 'INVESTIGATION',
      rationale: 'Establishes initial operational scope and rules out transient network hiccups.',
    });

    if (category === 'TRAFFIC_BURST' || category === 'DDOS') {
      actions.push({
        id: `ACT-${Date.now()}-2`,
        incidentId,
        title: 'Apply Ingress Rate Clamping to Affected Station Gateway',
        description: 'Throttle authentication POST endpoints to nominal 15 req/s ceiling on station gateway firewall.',
        category,
        priority: 'HIGH',
        status: 'PENDING',
        actionType: 'CONTAINMENT',
        rationale: 'Prevents CPU and socket exhaustion on the EV charging controller while preserving valid sessions.',
      });
      actions.push({
        id: `ACT-${Date.now()}-3`,
        incidentId,
        title: 'Inspect Authentication Nonce Cache',
        description: 'Verify whether incoming authentication tokens are distinct or repeated from bot replay scripts.',
        category,
        priority: 'MEDIUM',
        status: 'PENDING',
        actionType: 'INVESTIGATION',
        rationale: 'Distinguishes pure volumetric floods from credential stuffing sequences.',
      });
    } else if (category === 'HIGH_CONNECTION_RATE') {
      actions.push({
        id: `ACT-${Date.now()}-2`,
        incidentId,
        title: 'Enable TCP SYN Cookie Validation',
        description: 'Protect station network stack from half-open connection table exhaustion.',
        category,
        priority: 'HIGH',
        status: 'PENDING',
        actionType: 'CONTAINMENT',
        rationale: 'Mitigates aggressive handshake floods without dropping established EV charging transactions.',
      });
      actions.push({
        id: `ACT-${Date.now()}-3`,
        incidentId,
        title: 'Audit Source IP Connection Density',
        description: 'Identify if handshake requests originate from a single IP or distributed subnet block.',
        category,
        priority: 'MEDIUM',
        status: 'PENDING',
        actionType: 'INVESTIGATION',
        rationale: 'Informs whether targeted IP firewall rules or broader subnet rate limits are necessary.',
      });
    } else if (category === 'REPEATED_REQUESTS') {
      actions.push({
        id: `ACT-${Date.now()}-2`,
        incidentId,
        title: 'Enforce Strict Token Nonce Invalidation',
        description: 'Expire previous session tokens immediately upon successful charging sequence completion.',
        category,
        priority: 'HIGH',
        status: 'PENDING',
        actionType: 'HARDENING',
        rationale: 'Neutrals replay attacks using captured EV authorization payloads.',
      });
    } else if (category === 'EXCESSIVE_DATA') {
      actions.push({
        id: `ACT-${Date.now()}-2`,
        incidentId,
        title: 'Inspect OCPP Message Payload Lengths',
        description: 'Check for oversized DataTransfer or firmware update requests exceeding MTU and buffer limits.',
        category,
        priority: 'HIGH',
        status: 'PENDING',
        actionType: 'INVESTIGATION',
        rationale: 'Identifies buffer exploitation attempts or unauthorized bulk data exfiltration.',
      });
    } else if (category === 'UNUSUAL_LATENCY') {
      actions.push({
        id: `ACT-${Date.now()}-2`,
        incidentId,
        title: 'Enforce Keep-Alive Timeout Clamping',
        description: 'Reduce HTTP and WebSocket keep-alive idle timeouts from 30s to 5s on charging terminal gateways.',
        category,
        priority: 'HIGH',
        status: 'PENDING',
        actionType: 'CONTAINMENT',
        rationale: 'Tears down slowloris hanging sockets and frees connection slots for legitimate drivers.',
      });
    } else {
      // COMBINED_ANOMALY
      actions.push({
        id: `ACT-${Date.now()}-2`,
        incidentId,
        title: 'Initiate Coordinated Multi-Vector Shield Protocol',
        description: 'Engage gateway rate clamping, connection duration ceilings, and strict token nonce checks concurrently.',
        category,
        priority: 'HIGH',
        status: 'PENDING',
        actionType: 'CONTAINMENT',
        rationale: 'Attacks spanning multiple metrics require layered defense across both rate and transport layers.',
      });
    }

    actions.push({
      id: `ACT-${Date.now()}-4`,
      incidentId,
      title: 'Conduct Post-Mitigation Recovery Verification',
      description: 'Observe 2 consecutive 1-second telemetry cycles at baseline (~12 req/s) before marking incident RESOLVED.',
      category,
      priority: 'LOW',
      status: 'PENDING',
      actionType: 'RECOVERY',
      rationale: 'Ensures security status returns to PROTECTED only after abnormal activity has completely subsided.',
    });

    return actions;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Incident Lifecycle Management Handlers
  // ─────────────────────────────────────────────────────────────────────────────

  public updateIncidentStatus(
    incidentId: string,
    newStatus: IncidentStatus,
    actor: { email: string; name: string; role: string },
    notes?: string
  ): SecurityIncident {
    const inc = incidentStorageService.getIncidentById(incidentId);
    if (!inc) {
      throw new Error(`Incident with ID '${incidentId}' not found.`);
    }

    const oldStatus = inc.status;
    inc.status = newStatus;
    inc.lastUpdatedAt = new Date().toISOString();

    if (newStatus === 'CONTAINED' && !inc.containedAt) {
      inc.containedAt = new Date().toISOString();
    } else if (newStatus === 'RESOLVED' && !inc.resolvedAt) {
      inc.resolvedAt = new Date().toISOString();
    } else if (newStatus === 'CLOSED' && !inc.closedAt) {
      inc.closedAt = new Date().toISOString();
    }

    // Add Timeline Event
    inc.timeline.unshift({
      id: `EVT-${Date.now()}-${Math.floor(10 + Math.random() * 90)}`,
      incidentId,
      timestamp: new Date().toISOString(),
      eventType: 'STATUS_CHANGED',
      title: `Status Changed to ${newStatus}`,
      description: `Incident transitioned from ${oldStatus} to ${newStatus}.${notes ? ` Note: ${notes}` : ''}`,
      actor: { type: 'ANALYST', name: actor.name, role: actor.role },
    });

    // Optional Note
    if (notes && notes.trim()) {
      inc.notes.unshift({
        id: `NOTE-${Date.now()}-${Math.floor(10 + Math.random() * 90)}`,
        incidentId,
        authorEmail: actor.email,
        authorName: actor.name,
        authorRole: actor.role,
        content: notes.trim(),
        timestamp: new Date().toISOString(),
      });
    }

    // Recalculate Risk Score based on new lifecycle status
    const risk = riskAssessmentService.evaluateRisk({
      severity: inc.severity,
      category: inc.category,
      alertCount: inc.alerts.length,
      affectedStationsCount: inc.affectedStations.length,
      confidence: inc.confidence,
      threatIntel: inc.threatIntel,
      isContained: inc.status === 'CONTAINED',
      isResolved: inc.status === 'RESOLVED' || inc.status === 'CLOSED',
    });
    inc.riskScore = risk.score;
    inc.riskLevel = risk.level;
    inc.riskAssessment = risk;

    incidentStorageService.saveIncident(inc);

    // Record Audit Event
    incidentStorageService.recordAuditEvent({
      incidentId,
      actor,
      action: 'UPDATE_STATUS',
      entityType: 'INCIDENT',
      details: `Status changed from ${oldStatus} to ${newStatus}.${notes ? ` Note: ${notes}` : ''}`,
      metadata: { oldStatus, newStatus },
    });

    // Notify over WebSocket
    wsService.broadcast('INCIDENT_STATUS_CHANGED', {
      incidentId,
      oldStatus,
      newStatus,
      actor: actor.name,
    });

    return inc;
  }

  public assignAnalyst(
    incidentId: string,
    analyst: { email: string; name: string; role: string },
    actor: { email: string; name: string; role: string }
  ): SecurityIncident {
    const inc = incidentStorageService.getIncidentById(incidentId);
    if (!inc) {
      throw new Error(`Incident with ID '${incidentId}' not found.`);
    }

    inc.assignedTo = {
      email: analyst.email,
      name: analyst.name,
      role: analyst.role,
      assignedAt: new Date().toISOString(),
    };
    if (inc.status === 'OPEN') {
      inc.status = 'INVESTIGATING';
    }
    inc.lastUpdatedAt = new Date().toISOString();

    inc.timeline.unshift({
      id: `EVT-${Date.now()}-${Math.floor(10 + Math.random() * 90)}`,
      incidentId,
      timestamp: new Date().toISOString(),
      eventType: 'ANALYST_ASSIGNED',
      title: 'Analyst Assigned',
      description: `Assigned to ${analyst.name} (${analyst.email}).`,
      actor: { type: 'ANALYST', name: actor.name, role: actor.role },
    });

    incidentStorageService.saveIncident(inc);

    incidentStorageService.recordAuditEvent({
      incidentId,
      actor,
      action: 'ASSIGN_ANALYST',
      entityType: 'INCIDENT',
      details: `Assigned incident to ${analyst.name} (${analyst.email}).`,
      metadata: { analystEmail: analyst.email },
    });

    return inc;
  }

  public addNote(
    incidentId: string,
    content: string,
    actor: { email: string; name: string; role: string }
  ): SecurityIncident {
    const inc = incidentStorageService.getIncidentById(incidentId);
    if (!inc) {
      throw new Error(`Incident with ID '${incidentId}' not found.`);
    }

    const note: InvestigationNote = {
      id: `NOTE-${Date.now()}-${Math.floor(10 + Math.random() * 90)}`,
      incidentId,
      authorEmail: actor.email,
      authorName: actor.name,
      authorRole: actor.role,
      content: content.trim(),
      timestamp: new Date().toISOString(),
    };

    inc.notes.unshift(note);
    inc.lastUpdatedAt = new Date().toISOString();

    inc.timeline.unshift({
      id: `EVT-${Date.now()}-${Math.floor(10 + Math.random() * 90)}`,
      incidentId,
      timestamp: note.timestamp,
      eventType: 'NOTE_ADDED',
      title: 'Investigation Note Added',
      description: content.length > 80 ? `${content.slice(0, 77)}...` : content,
      actor: { type: 'ANALYST', name: actor.name, role: actor.role },
    });

    incidentStorageService.saveIncident(inc);

    incidentStorageService.recordAuditEvent({
      incidentId,
      actor,
      action: 'ADD_NOTE',
      entityType: 'NOTE',
      details: `Added investigation note to incident ${incidentId}.`,
    });

    return inc;
  }

  public updateResponseAction(
    incidentId: string,
    actionId: string,
    status: 'PENDING' | 'COMPLETED' | 'DISMISSED',
    actor: { email: string; name: string; role: string },
    notes?: string
  ): SecurityIncident {
    const inc = incidentStorageService.getIncidentById(incidentId);
    if (!inc) {
      throw new Error(`Incident with ID '${incidentId}' not found.`);
    }

    const action = inc.responseActions.find((a) => a.id === actionId);
    if (!action) {
      throw new Error(`Response action with ID '${actionId}' not found on incident ${incidentId}.`);
    }

    action.status = status;
    action.updatedBy = actor.email;
    action.updatedAt = new Date().toISOString();
    if (notes) action.notes = notes;

    inc.lastUpdatedAt = new Date().toISOString();

    inc.timeline.unshift({
      id: `EVT-${Date.now()}-${Math.floor(10 + Math.random() * 90)}`,
      incidentId,
      timestamp: new Date().toISOString(),
      eventType: 'ACTION_EXECUTED',
      title: `Response Action Marked ${status}`,
      description: `Action '${action.title}' set to ${status} by ${actor.name}.${notes ? ` Note: ${notes}` : ''}`,
      actor: { type: 'ANALYST', name: actor.name, role: actor.role },
    });

    incidentStorageService.saveIncident(inc);

    incidentStorageService.recordAuditEvent({
      incidentId,
      actor,
      action: 'UPDATE_RESPONSE_ACTION',
      entityType: 'RESPONSE_ACTION',
      details: `Marked action '${action.title}' as ${status}.`,
      metadata: { actionId, status },
    });

    return inc;
  }
}

export const incidentCorrelationService = new IncidentCorrelationService();
