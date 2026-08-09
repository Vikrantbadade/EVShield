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

export class AlertService {
  public async getAlerts(): Promise<{ items: Alert[]; total: number; isDemo: boolean }> {
    const rows = await db.securityAlert.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const items = rows.map(toAlert);
    return { items, total: items.length, isDemo: true };
  }

  public async getAlertById(id: string): Promise<Alert | null> {
    const row = await db.securityAlert.findUnique({
      where: { alertId: id },
    });
    if (!row) return null;
    return toAlert(row);
  }
}

export const alertService = new AlertService();
