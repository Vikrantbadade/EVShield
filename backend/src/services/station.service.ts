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

// ─────────────────────────────────────────────────────────────────────────────
// Row mapper: Prisma ChargingStation → Station (frontend interface)
// Operational telemetry fields are stored in the `metadata` JSON column.
// ─────────────────────────────────────────────────────────────────────────────
function toStation(row: Awaited<ReturnType<typeof db.chargingStation.findUniqueOrThrow>>): Station {
  const meta = (row.metadata ?? {}) as Record<string, unknown>;

  return {
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
