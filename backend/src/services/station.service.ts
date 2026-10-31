import { db } from '../config/database.js';
import { Station } from '../types/station.types.js';
import { StationStatus as PrismaStationStatus } from '@prisma/client';
import { telemetryService } from './telemetry.service.js';
import { incidentStorageService } from './incident-storage.service.js';

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

const DEFAULT_STATIONS: Station[] = [
  {
    id: 'CS-0421',
    name: 'FastCharge Terminal CS-0421',
    region: 'PUN',
    regionLabel: 'Viman Nagar, Pune',
    status: 'PROTECTED',
    requestsPerSec: 12,
    latencyMs: 14,
    healthPercent: 99,
    errorRatePercent: 0,
    connectedChargers: 8,
    lastEvent: 'Nominal operational baseline',
    mlStatus: 'NORMAL',
    mlConfidence: 98.5,
    location: 'Viman Nagar, Pune',
    isDemo: true,
  },
  {
    id: 'CS-0422',
    name: 'Express Charging Hub CS-0422',
    region: 'MUM',
    regionLabel: 'Bandra-Kurla Complex, Mumbai',
    status: 'PROTECTED',
    requestsPerSec: 10,
    latencyMs: 16,
    healthPercent: 98,
    errorRatePercent: 0,
    connectedChargers: 12,
    lastEvent: 'Session token verified',
    mlStatus: 'NORMAL',
    mlConfidence: 97.2,
    location: 'BKC, Mumbai',
    isDemo: true,
  },
  {
    id: 'CS-0423',
    name: 'AeroCharge Terminal CS-0423',
    region: 'BLR',
    regionLabel: 'Whitefield Tech Corridor, Bengaluru',
    status: 'PROTECTED',
    requestsPerSec: 11,
    latencyMs: 15,
    healthPercent: 97,
    errorRatePercent: 0,
    connectedChargers: 6,
    lastEvent: 'Telemetry heartbeat received',
    mlStatus: 'NORMAL',
    mlConfidence: 96.8,
    location: 'Whitefield, Bengaluru',
    isDemo: true,
  },
  {
    id: 'CS-0424',
    name: 'MetroEV Central CS-0424',
    region: 'DEL',
    regionLabel: 'Connaught Place Gateway, Delhi',
    status: 'PROTECTED',
    requestsPerSec: 9,
    latencyMs: 17,
    healthPercent: 99,
    errorRatePercent: 0,
    connectedChargers: 10,
    lastEvent: 'Firmware validation passed',
    mlStatus: 'NORMAL',
    mlConfidence: 99.1,
    location: 'CP, Delhi',
    isDemo: true,
  },
];

function enrichStationSecurity(station: Station): Station {
  const incidents = incidentStorageService.getAllIncidents();
  const stationIncidents = incidents.filter(
    (i) => i.primaryStationId === station.id || i.affectedStations.includes(station.id)
  );
  const active = stationIncidents.find((i) => i.status === 'OPEN' || i.status === 'INVESTIGATING');

  const maxRisk = stationIncidents.length > 0 ? Math.max(...stationIncidents.map((i) => i.riskScore)) : 15;
  let level: Station['riskLevel'] = 'LOW';
  if (maxRisk >= 85) level = 'CRITICAL';
  else if (maxRisk >= 70) level = 'HIGH';
  else if (maxRisk >= 40) level = 'MEDIUM';

  const enriched: Station = {
    ...station,
    riskScore: maxRisk,
    securityRiskScore: maxRisk,
    riskLevel: level,
    activeIncidentsCount: active ? 1 : 0,
    activeIncidentId: active?.id,
  };

  // Overlay live telemetry for local charging gateway node CS-0421
  if (station.id === 'CS-0421') {
    const snap = telemetryService.getLiveSnapshot();
    const isUnderAttack = snap.threatLevel === 'CRITICAL' || snap.securityStatus === 'THREAT DETECTED';
    const finalRisk = isUnderAttack ? 88 : enriched.riskScore;
    return {
      ...enriched,
      status: isUnderAttack ? 'UNDER ATTACK' : (snap.server.status === 'ONLINE' ? 'PROTECTED' : 'OFFLINE'),
      requestsPerSec: snap.telemetry.requestsPerSecond,
      latencyMs: snap.telemetry.averageLatencyMs,
      healthPercent: isUnderAttack ? 64 : 99,
      errorRatePercent: snap.telemetry.errorRatePercent,
      lastEvent: snap.events[0]?.title || (isUnderAttack ? 'Active Anomaly Investigation' : 'Nominal operational baseline'),
      mlStatus: isUnderAttack ? 'ATTACK DETECTED' : 'NORMAL',
      mlConfidence: Math.round(snap.ml.probability_attack * 1000) / 10,
      riskScore: finalRisk,
      securityRiskScore: finalRisk,
      riskLevel: isUnderAttack ? 'CRITICAL' : enriched.riskLevel,
    };
  }

  return enriched;
}

export class StationService {
  public async getStations(): Promise<{ items: Station[]; total: number; isDemo: boolean }> {
    try {
      const rows = await db.chargingStation.findMany({
        orderBy: { createdAt: 'asc' },
      });

      if (rows && rows.length > 0) {
        const items = rows.map((r) => {
          const meta = (r.metadata ?? {}) as Record<string, unknown>;
          const base: Station = {
            id: r.stationId,
            name: r.name,
            region: (meta['region'] as Station['region']) ?? 'MUM',
            regionLabel: (meta['regionLabel'] as string) ?? r.location,
            status: mapStationStatus(r.status),
            requestsPerSec: (meta['requestsPerSec'] as number) ?? 0,
            latencyMs: (meta['latencyMs'] as number) ?? 0,
            healthPercent: (meta['healthPercent'] as number) ?? 100,
            errorRatePercent: (meta['errorRatePercent'] as number) ?? 0,
            connectedChargers: (meta['connectedChargers'] as number) ?? 0,
            lastEvent: (meta['lastEvent'] as string) ?? 'No recent events',
            mlStatus: (meta['mlStatus'] as Station['mlStatus']) ?? 'NORMAL',
            mlConfidence: (meta['mlConfidence'] as number | undefined),
            location: r.location,
            isDemo: true,
          };
          return enrichStationSecurity(base);
        });
        return { items, total: items.length, isDemo: true };
      }
    } catch {
      // Fallback to default in-memory stations when DB is offline
    }

    const items = DEFAULT_STATIONS.map(enrichStationSecurity);
    return { items, total: items.length, isDemo: true };
  }

  public async getStationById(id: string): Promise<Station | null> {
    const list = await this.getStations();
    return list.items.find((s) => s.id === id) || null;
  }
}

export const stationService = new StationService();

