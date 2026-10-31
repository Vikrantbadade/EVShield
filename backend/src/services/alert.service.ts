import { Prisma } from '@prisma/client';
import { db } from '../config/database.js';
import { Alert, AlertSeverity, AlertStatus } from '../types/alert.types.js';
import { SeverityLevel as PrismaSeverityLevel } from '@prisma/client';

// ─────────────────────────────────────────────────────────────────────────────
// Enum mappers
// ─────────────────────────────────────────────────────────────────────────────

function mapSeverity(s: PrismaSeverityLevel): AlertSeverity {
  switch (s) {
    case 'CRITICAL': return 'CRITICAL';
    case 'HIGH':     return 'HIGH';
    case 'MEDIUM':   return 'WARNING';
    case 'LOW':      return 'INFO';
    default:         return 'INFO';
  }
}

function mapStatus(acknowledged: boolean): AlertStatus {
  return acknowledged ? 'ACKNOWLEDGED' : 'ACTIVE';
}

// ─────────────────────────────────────────────────────────────────────────────
// Row type
// ─────────────────────────────────────────────────────────────────────────────
type AlertRow = Prisma.SecurityAlertGetPayload<Record<string, never>>;

function toAlert(row: AlertRow): Alert {
  const meta = (row.metadata ?? {}) as Record<string, unknown>;

  return {
    id:           row.alertId,
    title:        row.title,
    message:      row.message,
    severity:     mapSeverity(row.severity),
    status:       mapStatus(row.acknowledged),
    timestamp:    row.createdAt.toISOString(),
    attackId:     row.incidentId ?? undefined,
    stationId:    row.stationId ?? undefined,
    mlConfidence: (meta['mlConfidence'] as number | undefined),
    isDemo:       true,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────────────────────────────────

import { anomalyDetectionService } from './anomaly-detection.service.js';

export class AlertService {
  public async getAlerts(): Promise<{ items: Alert[]; total: number; isDemo: boolean }> {
    try {
      const rows = await db.securityAlert.findMany({
        orderBy: { createdAt: 'desc' },
      });

      if (rows && rows.length > 0) {
        const items = rows.map(toAlert);
        return { items, total: items.length, isDemo: true };
      }
    } catch {
      // Fallback to recent telemetry anomaly alerts if database is offline
    }

    const history = anomalyDetectionService.getAlertHistory();
    const fallbackItems: Alert[] = history.map((a) => ({
      id: a.alertId || a.id,
      title: `Anomaly Alert: ${a.category}`,
      message: a.explanation,
      severity: a.severity === 'CRITICAL' ? 'CRITICAL' : a.severity === 'HIGH' ? 'HIGH' : 'WARNING',
      status: 'ACTIVE',
      timestamp: a.timestamp,
      stationId: 'CS-0421',
      isDemo: true,
    }));

    return { items: fallbackItems, total: fallbackItems.length, isDemo: true };
  }

  public async getAlertById(id: string): Promise<Alert | null> {
    try {
      const row = await db.securityAlert.findUnique({
        where: { alertId: id },
      });
      if (row) return toAlert(row);
    } catch {}

    const history = anomalyDetectionService.getAlertHistory();
    const found = history.find((a) => a.alertId === id || a.id === id);
    if (!found) return null;

    return {
      id: found.alertId || found.id,
      title: `Anomaly Alert: ${found.category}`,
      message: found.explanation,
      severity: found.severity === 'CRITICAL' ? 'CRITICAL' : found.severity === 'HIGH' ? 'HIGH' : 'WARNING',
      status: 'ACTIVE',
      timestamp: found.timestamp,
      stationId: 'CS-0421',
      isDemo: true,
    };
  }
}

export const alertService = new AlertService();
