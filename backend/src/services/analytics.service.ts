import { db } from '../config/database.js';
import { telemetryService } from './telemetry.service.js';

export interface AnalyticsResponse {
  attackFrequency: Array<{ date: string; count: number }>;
  attackDistribution: Array<{ type: string; percentage: number }>;
  trafficTrends: Array<{ timestamp: string; requests: number; anomalies: number }>;
  severityDistribution: Array<{ severity: string; count: number }>;
  stationHealthOverview: {
    nominal: number;
    elevated: number;
    critical: number;
  };
  mlPredictionStats: {
    totalEvaluated: number;
    normalCount: number;
    attackCount: number;
    falsePositiveRatePercent: number;
    avgInferenceTimeMs: number;
  };
  isDemo: boolean;
}

export class AnalyticsService {
  public async getAnalytics(): Promise<AnalyticsResponse> {
    // ── Parallel Prisma queries ───────────────────────────────────────────────
    const [
      allIncidents,
      severityGroups,
      attackTypeGroups,
      stationStatusGroups,
      predictionGroups,
      totalPredictions,
    ] = await Promise.all([
      // All incidents with startTime for frequency bucketing
      db.attackIncident.findMany({
        select: { startTime: true, metadata: true },
        orderBy: { startTime: 'asc' },
      }),

      // Severity distribution
      db.attackIncident.groupBy({
        by: ['severity'],
        _count: { severity: true },
      }),

      // Attack type distribution
      db.attackIncident.groupBy({
        by: ['attackType'],
        _count: { attackType: true },
      }),

      // Station status for health overview
      db.chargingStation.groupBy({
        by: ['status'],
        _count: { status: true },
      }),

      // ML predictions by classification
      db.mLPrediction.groupBy({
        by: ['classification'],
        _count: { classification: true },
      }),

      // Total predictions
      db.mLPrediction.count(),
    ]);

    // ── Attack frequency (group by date string YYYY-MM-DD) ───────────────────
    const freqMap = new Map<string, number>();
    for (const inc of allIncidents) {
      const dateKey = inc.startTime.toISOString().split('T')[0]!;
      freqMap.set(dateKey, (freqMap.get(dateKey) ?? 0) + 1);
    }
    // Return sorted, include last 7 days with 0-fill
    const today = new Date();
    const attackFrequency: AnalyticsResponse['attackFrequency'] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0]!;
      attackFrequency.push({ date: key, count: freqMap.get(key) ?? 0 });
    }
    // Also include any historical dates beyond 7 days that exist in DB
    for (const [date, count] of freqMap.entries()) {
      if (!attackFrequency.find((e) => e.date === date)) {
        attackFrequency.push({ date, count });
      }
    }
    attackFrequency.sort((a, b) => a.date.localeCompare(b.date));

    // ── Attack type distribution ──────────────────────────────────────────────
    const typeCountMap: Record<string, number> = {};
    for (const g of attackTypeGroups) {
      // Map Prisma AttackType → frontend display label
      let label: string;
      switch (g.attackType) {
        case 'VOLUMETRIC':
        case 'PROTOCOL':
          label = 'Volumetric DDoS'; break;
        case 'APPLICATION_LAYER':
          label = 'Traffic Anomaly'; break;
        case 'CREDENTIAL_STUFFING':
        case 'REPLAY_ATTACK':
          label = 'Auth Spraying'; break;
        default:
          label = 'Unknown'; break;
      }
      typeCountMap[label] = (typeCountMap[label] ?? 0) + g._count.attackType;
    }
    const totalTypeCount = Object.values(typeCountMap).reduce((a, b) => a + b, 0) || 1;
    const attackDistribution = Object.entries(typeCountMap).map(([type, count]) => ({
      type,
      percentage: Math.round((count / totalTypeCount) * 100),
    }));

    // ── Severity distribution ─────────────────────────────────────────────────
    const severityDistribution = severityGroups.map((g) => ({
      severity: g.severity,
      count: g._count.severity,
    }));

    // ── Station health overview ───────────────────────────────────────────────
    const statusMap: Record<string, number> = {};
    for (const g of stationStatusGroups) {
      statusMap[g.status] = g._count.status;
    }
    const stationHealthOverview = {
      nominal:   (statusMap['ONLINE'] ?? 0),
      elevated:  (statusMap['MAINTENANCE'] ?? 0),
      critical:  (statusMap['UNDER_ATTACK'] ?? 0) + (statusMap['OFFLINE'] ?? 0),
    };

    // ── ML prediction stats ───────────────────────────────────────────────────
    const predMap: Record<string, number> = {};
    for (const g of predictionGroups) {
      predMap[g.classification] = g._count.classification;
    }
    const normalCount   = predMap['NORMAL']    ?? 0;
    const attackCount   = predMap['ATTACK']    ?? 0;
    const anomalyCount  = predMap['ANOMALOUS'] ?? 0;

    // ── Traffic trends computed from live rolling telemetry history ──────────
    const snap = telemetryService.getLiveSnapshot();
    const gp = snap.telemetry.graphPoints;
    let trafficTrends: AnalyticsResponse['trafficTrends'] = [];

    if (gp && gp.length >= 6) {
      const step = Math.floor(gp.length / 6);
      for (let i = 0; i < 6; i++) {
        const pt = gp[Math.min(i * step, gp.length - 1)];
        trafficTrends.push({
          timestamp: pt.timestamp,
          requests: pt.requestsPerSec,
          anomalies: pt.isAnomaly ? 1 : 0,
        });
      }
    } else {
      // Nominal baseline intervals
      trafficTrends = [
        { timestamp: new Date(Date.now() - 50000).toISOString(), requests: 0, anomalies: 0 },
        { timestamp: new Date(Date.now() - 40000).toISOString(), requests: 0, anomalies: 0 },
        { timestamp: new Date(Date.now() - 30000).toISOString(), requests: 0, anomalies: 0 },
        { timestamp: new Date(Date.now() - 20000).toISOString(), requests: 0, anomalies: 0 },
        { timestamp: new Date(Date.now() - 10000).toISOString(), requests: 0, anomalies: 0 },
        { timestamp: new Date().toISOString(), requests: snap.telemetry.requestsPerSecond, anomalies: snap.threatLevel === 'CRITICAL' ? 1 : 0 },
      ];
    }

    return {
      attackFrequency,
      attackDistribution,
      trafficTrends,
      severityDistribution,
      stationHealthOverview,
      mlPredictionStats: {
        totalEvaluated:         totalPredictions + (snap.activeIncident ? 1 : 0),
        normalCount,
        attackCount:            attackCount + anomalyCount + (snap.activeIncident ? 1 : 0),
        falsePositiveRatePercent: totalPredictions > 0 ? 0.04 : 0,
        avgInferenceTimeMs:     snap.ml.inferenceTimeMs || 25,
      },
      isDemo: true,
    };
  }
}

export const analyticsService = new AnalyticsService();
