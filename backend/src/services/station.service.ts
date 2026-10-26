import { db } from '../config/database.js';
import { Station } from '../types/station.types.js';
import { StationStatus as PrismaStationStatus } from '@prisma/client';

// ─────────────────────────────────────────────────────────────────────────────
// Enum mapping: Prisma StationStatus → Frontend StationStatus
// ─────────────────────────────────────────────────────────────────────────────
function mapStationStatus(
  prismaStatus: PrismaStationStatus
): Station['status'] {
  switch (prismaStatus) {
    case 'ONLINE':       return 'PROTECTED';
    case 'UNDER_ATTACK': return 'UNDER ATTACK';
    case 'MAINTENANCE':  return 'DEGRADED';
    case 'OFFLINE':      return 'OFFLINE';
    default:             return 'PROTECTED';
  }
}

import { telemetryService } from './telemetry.service.js';

// ─────────────────────────────────────────────────────────────────────────────
// Row mapper: Prisma ChargingStation → Station (frontend interface)
// Operational telemetry fields are stored in the `metadata` JSON column.
// ─────────────────────────────────────────────────────────────────────────────
function toStation(row: Awaited<ReturnType<typeof db.chargingStation.findUniqueOrThrow>>): Station {
  const meta = (row.metadata ?? {}) as Record<string, unknown>;

  const baseStation: Station = {
    id:                row.stationId,
    name:              row.name,
    region:            (meta['region'] as Station['region'])        ?? 'MUM',
    regionLabel:       (meta['regionLabel'] as string)              ?? row.location,
    status:            mapStationStatus(row.status),
    requestsPerSec:    (meta['requestsPerSec'] as number)           ?? 0,
    latencyMs:         (meta['latencyMs'] as number)                ?? 0,
    healthPercent:     (meta['healthPercent'] as number)            ?? 100,
    errorRatePercent:  (meta['errorRatePercent'] as number)         ?? 0,
    connectedChargers: (meta['connectedChargers'] as number)        ?? 0,
    lastEvent:         (meta['lastEvent'] as string)                ?? 'No recent events',
    mlStatus:          (meta['mlStatus'] as Station['mlStatus'])    ?? 'NORMAL',
    mlConfidence:      (meta['mlConfidence'] as number | undefined),
    location:          row.location,
    isDemo:            true,
  };

  // Overlay live telemetry for local charging gateway node CS-0421
  if (row.stationId === 'CS-0421') {
    const snap = telemetryService.getLiveSnapshot();
    const isUnderAttack = snap.threatLevel === 'CRITICAL' || snap.securityStatus === 'THREAT DETECTED';
    return {
      ...baseStation,
      status: isUnderAttack ? 'UNDER ATTACK' : (snap.server.status === 'ONLINE' ? 'PROTECTED' : 'OFFLINE'),
      requestsPerSec: snap.telemetry.requestsPerSecond,
      latencyMs: snap.telemetry.averageLatencyMs,
      healthPercent: isUnderAttack ? 64 : 99,
      errorRatePercent: snap.telemetry.errorRatePercent,
      lastEvent: snap.events[0]?.title || 'Nominal operational baseline',
      mlStatus: isUnderAttack ? 'ATTACK DETECTED' : 'NORMAL',
      mlConfidence: Math.round(snap.ml.probability_attack * 1000) / 10,
    };
  }

  return baseStation;
}

export class StationService {
  public async getStations(): Promise<{ items: Station[]; total: number; isDemo: boolean }> {
    const rows = await db.chargingStation.findMany({
      orderBy: { createdAt: 'asc' },
    });

    const items = rows.map(toStation);
    return { items, total: items.length, isDemo: true };
  }

  public async getStationById(id: string): Promise<Station | null> {
    const row = await db.chargingStation.findUnique({
      where: { stationId: id },
    });

    if (!row) return null;
    return toStation(row);
  }
}

export const stationService = new StationService();
