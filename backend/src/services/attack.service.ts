import { Prisma } from '@prisma/client';
import { db } from '../config/database.js';
import { AttackIncident, AttackFilterParams, AffectedStationInfo } from '../types/attack.types.js';
import {
  SeverityLevel as PrismaSeverityLevel,
  IncidentStatus as PrismaIncidentStatus,
  AttackType as PrismaAttackType,
} from '@prisma/client';

// ─────────────────────────────────────────────────────────────────────────────
// Enum mappers
// ─────────────────────────────────────────────────────────────────────────────

function mapSeverity(s: PrismaSeverityLevel): AttackIncident['severity'] {
  // Prisma and frontend share the same string values here
  return s as AttackIncident['severity'];
}

function mapStatus(s: PrismaIncidentStatus): AttackIncident['status'] {
  switch (s) {
    case 'ACTIVE':        return 'DETECTED';
    case 'INVESTIGATING': return 'INVESTIGATING';
    case 'MITIGATED':     return 'MITIGATED';
    case 'RESOLVED':      return 'RESOLVED';
    default:              return 'DETECTED';
  }
}

/** Map frontend filter string → set of Prisma IncidentStatus values */
function filterStatusToPrisma(status: string): PrismaIncidentStatus[] {
  switch (status.toUpperCase()) {
    case 'DETECTED':      return ['ACTIVE'];
    case 'INVESTIGATING': return ['INVESTIGATING'];
    case 'MITIGATED':     return ['MITIGATED'];
    case 'RESOLVED':      return ['RESOLVED'];
    default:              return [];
  }
}

/** Map frontend AttackType filter → Prisma AttackType values */
function filterAttackTypeToPrisma(attackType: string): PrismaAttackType[] {
  switch (attackType.toUpperCase()) {
    case 'DDOS':                return ['VOLUMETRIC', 'PROTOCOL'];
    case 'TRAFFIC_ANOMALY':     return ['APPLICATION_LAYER'];
    case 'AUTHENTICATION_BURST':return ['CREDENTIAL_STUFFING', 'REPLAY_ATTACK'];
    default:                    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Duration helper
// ─────────────────────────────────────────────────────────────────────────────
function computeDuration(start: Date, end: Date | null): string {
  if (!end) return 'Ongoing';
  const ms = end.getTime() - start.getTime();
  const totalSecs = Math.floor(ms / 1000);
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

import { telemetryService } from './telemetry.service.js';

// ─────────────────────────────────────────────────────────────────────────────
// Row type (Prisma findMany return shape)
// ─────────────────────────────────────────────────────────────────────────────
type AttackRow = Prisma.AttackIncidentGetPayload<Record<string, never>>;

function toAttackIncident(row: AttackRow): AttackIncident {
  const meta = (row.metadata ?? {}) as Record<string, unknown>;

  return {
    id:                       row.incidentId,
    timestamp:                row.startTime.toISOString(),
    startTime:                row.startTime.toISOString(),
    endTime:                  row.endTime?.toISOString(),
    duration:                 computeDuration(row.startTime, row.endTime),
    status:                   mapStatus(row.status),
    severity:                 mapSeverity(row.severity),
    attackType:               (meta['attackType'] as AttackIncident['attackType'])         ?? 'DDOS',
    attackTypeLabel:          (meta['attackTypeLabel'] as string)                           ?? row.attackType,
    classification:           (meta['classification'] as AttackIncident['classification']) ?? 'ATTACK',
    mlConfidence:             (meta['mlConfidence'] as number)                             ?? 0,
    requestsPerSecond:        row.requestsPerSec                                           ?? 0,
    baselineRequestsPerSecond:(meta['baselineRequestsPerSecond'] as number)                ?? 12,
    peakRequestsPerSecond:    (meta['peakRequestsPerSecond'] as number)                    ?? (row.requestsPerSec ?? 0),
    affectedNodes:            (meta['affectedNodes'] as number)                            ?? 1,
    affectedStations:         (meta['affectedStations'] as AffectedStationInfo[])         ?? [
      { id: row.stationId || 'CS-0421', name: 'Pune Express Terminal', location: 'Viman Nagar, Pune', status: row.status === 'ACTIVE' ? 'UNDER ATTACK' : 'PROTECTED', requestsPerSec: row.requestsPerSec ?? 0 }
    ],
    sourceCategory:           (meta['sourceCategory'] as string)                           ?? 'Distributed EV Gateway Auth Flood',
    targetInfrastructure:     (meta['targetInfrastructure'] as string)                     ?? `Gateway ${row.stationId || 'CS-0421'} (127.0.0.1:8080)`,
    mitigationStatus:         (meta['mitigationStatus'] as string)                         ?? (row.status === 'MITIGATED' ? 'MITIGATED' : row.status === 'RESOLVED' ? 'RECOVERED' : 'ACTIVE IN PROGRESS'),
    mitigationTime:           (meta['mitigationTime'] as string)                           ?? computeDuration(row.startTime, row.endTime),
    description:              row.description                                              ?? '',
    detectionSummary:         (meta['detectionSummary'] as string)                         ?? (row.description || 'ML detection engine classified observed traffic as anomalous.'),
    isDemo:                   true,
    signals:                  (meta['signals'] as any)                                     ?? undefined,
    telemetryGraphPoints:     (meta['telemetryHistory'] as any)                            ?? undefined,
    mlFeatures:               (meta['features'] as any)                                    ?? undefined,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────────────────────────────────

export class AttackService {
  public async getAttacks(params: AttackFilterParams = {}): Promise<{
    items: AttackIncident[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    isDemo: boolean;
  }> {
    const { search, severity, status, attackType, page = 1, pageSize = 10 } = params;

    // Build Prisma where clause
    const where: Prisma.AttackIncidentWhereInput = {};

    if (severity && severity !== 'ALL') {
      const sev = severity.toUpperCase() as PrismaSeverityLevel;
      where.severity = sev;
    }

    if (status && status !== 'ALL') {
      const statusList = filterStatusToPrisma(status);
      if (statusList.length > 0) where.status = { in: statusList };
    }

    if (attackType && attackType !== 'ALL') {
      const typeList = filterAttackTypeToPrisma(attackType);
      if (typeList.length > 0) where.attackType = { in: typeList };
    }

    if (search && search.trim() !== '') {
      const q = search.trim();
      where.OR = [
        { incidentId: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [total, rows] = await Promise.all([
      db.attackIncident.count({ where }),
      db.attackIncident.findMany({
        where,
        orderBy: { startTime: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    let items = rows.map(toAttackIncident);

    // Merge live active incident from telemetryService if active and not already in items
    const active = telemetryService.getActiveIncident();
    if (active && page === 1) {
      const existingIdx = items.findIndex((i) => i.id === active.id);
      if (existingIdx >= 0) {
        items[existingIdx] = { ...items[existingIdx], ...active };
      } else {
        items = [active, ...items];
      }
    }

    const totalPages = Math.ceil((total + (active ? 1 : 0)) / pageSize) || 1;

    return { items, total: total + (active && !rows.find(r => r.incidentId === active.id) ? 1 : 0), page, pageSize, totalPages, isDemo: true };
  }

  public async getAttackById(id: string): Promise<AttackIncident | null> {
    const active = telemetryService.getActiveIncident();
    const last = telemetryService.getLastIncident();

    if (id === 'current' || id === 'latest') {
      if (active) return active;
      if (last) return last;
      const latestRow = await db.attackIncident.findFirst({
        orderBy: { startTime: 'desc' },
      });
      return latestRow ? toAttackIncident(latestRow) : null;
    }

    if (active && active.id === id) {
      return active;
    }

    if (last && last.id === id) {
      return last;
    }

    const row = await db.attackIncident.findUnique({
      where: { incidentId: id },
    });
    if (!row) return null;
    return toAttackIncident(row);
  }

  public async mitigate(id?: string): Promise<{ success: boolean; message: string; incident: AttackIncident | null }> {
    return telemetryService.executeMitigation();
  }
}

export const attackService = new AttackService();
