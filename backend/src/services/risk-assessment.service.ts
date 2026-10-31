/**
 * EVShield Stage 3: Explainable Incident Risk Assessment Engine
 *
 * Evaluates operational risk using a transparent multi-factor scoring formula:
 * Total Risk Score (0-100) =
 *   Severity Weight (up to 30 pts) +
 *   Category Impact (up to 20 pts) +
 *   Throughput Surge / Deviation (up to 15 pts) +
 *   Alert Frequency & Volume (up to 10 pts) +
 *   Station Exposure (up to 10 pts) +
 *   ML Detector Consensus (up to 10 pts) +
 *   Threat Intel Indicator Score (up to 10 pts) -
 *   Containment / Mitigation Discount (-15 pts)
 */

import {
  IncidentSeverity,
  IncidentCategory,
  RiskAssessment,
  RiskFactor,
  RiskLevel,
  ThreatIntelResult,
} from '../types/incident.types.js';

export interface RiskInputParams {
  severity: IncidentSeverity;
  category: IncidentCategory;
  deviationPercent?: number;
  alertCount: number;
  affectedStationsCount: number;
  confidence?: number;
  threatIntel?: ThreatIntelResult[];
  isContained?: boolean;
  isResolved?: boolean;
  durationSeconds?: number;
}

export class RiskAssessmentService {
  /**
   * Calculate consistent, explainable risk score from observed incident dimensions.
   */
  public evaluateRisk(params: RiskInputParams): RiskAssessment {
    const factors: RiskFactor[] = [];
    let totalScore = 0;

    // 1. Severity Impact (0 - 30 points)
    let severityScore = 10;
    if (params.severity === 'CRITICAL') severityScore = 30;
    else if (params.severity === 'HIGH') severityScore = 22;
    else if (params.severity === 'MEDIUM') severityScore = 14;
    else if (params.severity === 'LOW') severityScore = 6;

    factors.push({
      name: 'Incident Severity Tier',
      weight: 30,
      score: severityScore,
      impact: params.severity,
      description: `Baseline classification assigned at ${params.severity} severity rating.`,
    });
    totalScore += severityScore;

    // 2. Attack Category Inherent Threat (0 - 20 points)
    let categoryScore = 10;
    let catDesc = 'Standard operational anomaly pattern.';
    switch (params.category) {
      case 'COMBINED_ANOMALY':
      case 'DDOS':
        categoryScore = 20;
        catDesc = 'Multi-vector distributed volumetric surge threatening EV gateway availability.';
        break;
      case 'TRAFFIC_BURST':
        categoryScore = 16;
        catDesc = 'High-frequency request flood stressing backend charging session dispatch.';
        break;
      case 'HIGH_CONNECTION_RATE':
        categoryScore = 15;
        catDesc = 'Rapid TCP handshake depletion attack threatening ingress capacity.';
        break;
      case 'EXCESSIVE_DATA':
        categoryScore = 14;
        catDesc = 'Abnormal payload volume indicating possible data exfiltration or buffer overflow.';
        break;
      case 'REPEATED_REQUESTS':
        categoryScore = 12;
        catDesc = 'Replay sequence / token reuse bypassing authentication cache.';
        break;
      case 'UNUSUAL_LATENCY':
        categoryScore = 10;
        catDesc = 'Slowloris connection-holding attack draining station socket limits.';
        break;
      default:
        categoryScore = 8;
        catDesc = 'Unclassified abnormal flow requiring manual triage.';
    }

    factors.push({
      name: 'Attack Vector Profile',
      weight: 20,
      score: categoryScore,
      impact: params.category,
      description: catDesc,
    });
    totalScore += categoryScore;

    // 3. Telemetry Deviation Surge (0 - 15 points)
    const dev = params.deviationPercent ?? 0;
    let devScore = 0;
    if (dev > 500) devScore = 15;
    else if (dev > 250) devScore = 12;
    else if (dev > 100) devScore = 8;
    else if (dev > 30) devScore = 4;
    else devScore = 1;

    factors.push({
      name: 'Baseline Deviation Magnitude',
      weight: 15,
      score: devScore,
      impact: `+${dev.toFixed(0)}%`,
      description: `Observed traffic metrics exceed established normal baseline by +${dev.toFixed(0)}%.`,
    });
    totalScore += devScore;

    // 4. Correlated Alert Volume & Persistence (0 - 10 points)
    const count = params.alertCount;
    let alertScore = 2;
    if (count >= 10) alertScore = 10;
    else if (count >= 5) alertScore = 7;
    else if (count >= 2) alertScore = 5;
    else alertScore = 2;

    factors.push({
      name: 'Alert Clustering Density',
      weight: 10,
      score: alertScore,
      impact: `${count} alerts`,
      description: `${count} correlated alert observations aggregated within sliding observation window.`,
    });
    totalScore += alertScore;

    // 5. Station Blast Radius / Scope (0 - 10 points)
    const stations = params.affectedStationsCount;
    let stationScore = 3;
    if (stations >= 4) stationScore = 10;
    else if (stations >= 2) stationScore = 7;
    else stationScore = 4;

    factors.push({
      name: 'Infrastructure Blast Radius',
      weight: 10,
      score: stationScore,
      impact: `${stations} station(s)`,
      description: `${stations} charging terminal(s) actively reporting correlated degradation.`,
    });
    totalScore += stationScore;

    // 6. ML Model Agreement & Confidence (0 - 10 points)
    const conf = params.confidence ?? 0.5;
    const mlScore = Math.min(10, Math.round(conf * 10));
    factors.push({
      name: 'ML Detector Confidence',
      weight: 10,
      score: mlScore,
      impact: `${Math.round(conf * 100)}%`,
      description: `Consensus confidence across supervised and unsupervised detection models.`,
    });
    totalScore += mlScore;

    // 7. Threat Intelligence Enrichment (0 - 10 points)
    let tiScore = 0;
    let tiDesc = 'No external threat intelligence flags identified.';
    if (params.threatIntel && params.threatIntel.length > 0) {
      const malicious = params.threatIntel.filter((t) => t.reputation === 'MALICIOUS').length;
      const suspicious = params.threatIntel.filter((t) => t.reputation === 'SUSPICIOUS').length;
      if (malicious > 0) {
        tiScore = 10;
        tiDesc = `${malicious} source indicator(s) verified malicious by threat intelligence.`;
      } else if (suspicious > 0) {
        tiScore = 6;
        tiDesc = `${suspicious} source indicator(s) flagged suspicious in threat intelligence database.`;
      } else {
        tiScore = 1;
        tiDesc = 'Target source IPs verified clean or benign in threat database.';
      }
    } else {
      tiDesc = 'Threat intelligence enrichment unavailable or pending indicator lookup.';
    }

    factors.push({
      name: 'Threat Intelligence Signals',
      weight: 10,
      score: tiScore,
      impact: tiScore >= 6 ? 'ELEVATED' : 'NOMINAL',
      description: tiDesc,
    });
    totalScore += tiScore;

    // 8. Containment / Resolution Mitigation Discount (-15 or -35 points)
    if (params.isResolved) {
      const discount = 35;
      factors.push({
        name: 'Incident Resolution Credit',
        weight: -35,
        score: -discount,
        impact: 'RESOLVED',
        description: 'Incident verified recovered and nominal traffic baseline re-established.',
      });
      totalScore -= discount;
    } else if (params.isContained) {
      const discount = 15;
      factors.push({
        name: 'Active Containment Discount',
        weight: -15,
        score: -discount,
        impact: 'CONTAINED',
        description: 'Protective mitigation steps applied; operational disruption suppressed.',
      });
      totalScore -= discount;
    }

    // Clamp score between 0 and 100
    const finalScore = Math.max(5, Math.min(100, Math.round(totalScore)));

    // Determine Risk Level
    let level: RiskLevel = 'LOW';
    if (finalScore >= 85) level = 'CRITICAL';
    else if (finalScore >= 70) level = 'HIGH';
    else if (finalScore >= 40) level = 'MEDIUM';
    else level = 'LOW';

    // Tailored Recommendations
    const recommendations: string[] = [];
    if (level === 'CRITICAL') {
      recommendations.push('Immediate SOC triage required: enforce ingress rate clamping on affected charging gateways.');
      recommendations.push('Isolate compromised station connection pools and review recent OCPP token exchanges.');
    } else if (level === 'HIGH') {
      recommendations.push('Investigate source IPs and verify whether activity stems from automated bot re-attempts.');
      recommendations.push('Inspect server authentication logs for repeated failure patterns and hold times.');
    } else if (level === 'MEDIUM') {
      recommendations.push('Monitor connection durations and telemetry graph trends over the next 15 minutes.');
      recommendations.push('Verify station network firmware and latency characteristics.');
    } else {
      recommendations.push('Continue standard continuous monitoring. Incident within nominal operating risk bounds.');
    }

    const explanation = `Calculated risk score of ${finalScore}/100 (${level}) driven primarily by ${params.severity} severity, ${params.category} attack profile (+${categoryScore} pts), and +${dev.toFixed(0)}% deviation from baseline (+${devScore} pts).`;

    return {
      score: finalScore,
      level,
      calculatedAt: new Date().toISOString(),
      factors,
      explanation,
      recommendations,
    };
  }
}

export const riskAssessmentService = new RiskAssessmentService();

