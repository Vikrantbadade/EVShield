import { DemoStation, ChargingRegion, NetworkSummary } from '../types/station';

export const demoStations: DemoStation[] = [
  {
    id: 'CS-0421', name: 'Mumbai Central Hub', region: 'MUM', regionLabel: 'Mumbai',
    status: 'PROTECTED', requestsPerSec: 1210, latencyMs: 42, healthPercent: 99,
    errorRatePercent: 0.3, connectedChargers: 48, lastEvent: 'All systems nominal',
    mlStatus: 'NORMAL',
  },
  {
    id: 'CS-0812', name: 'Bandra Supercharger Gateway', region: 'MUM', regionLabel: 'Mumbai',
    status: 'PROTECTED', requestsPerSec: 1195, latencyMs: 38, healthPercent: 98,
    errorRatePercent: 0.4, connectedChargers: 36, lastEvent: 'Handshake verification normal',
    mlStatus: 'NORMAL',
  },
  {
    id: 'CS-0104', name: 'BKC Fleet Charging Depot', region: 'MUM', regionLabel: 'Mumbai',
    status: 'PROTECTED', requestsPerSec: 1220, latencyMs: 45, healthPercent: 99,
    errorRatePercent: 0.2, connectedChargers: 64, lastEvent: 'Fleet session batch authenticated',
    mlStatus: 'NORMAL',
  },
  {
    id: 'CS-0331', name: 'Connaught Place EV Hub', region: 'DEL', regionLabel: 'Delhi',
    status: 'PROTECTED', requestsPerSec: 1180, latencyMs: 38, healthPercent: 99,
    errorRatePercent: 0.2, connectedChargers: 42, lastEvent: 'Traffic baseline nominal',
    mlStatus: 'NORMAL',
  },
  {
    id: 'CS-0782', name: 'Dwarka Sector 21 Charger', region: 'DEL', regionLabel: 'Delhi',
    status: 'PROTECTED', requestsPerSec: 1165, latencyMs: 41, healthPercent: 97,
    errorRatePercent: 0.5, connectedChargers: 24, lastEvent: 'Token refresh completed',
    mlStatus: 'NORMAL',
  },
  {
    id: 'CS-0955', name: 'Airport Express Terminal', region: 'MUM', regionLabel: 'Mumbai',
    status: 'PROTECTED', requestsPerSec: 1185, latencyMs: 44, healthPercent: 98,
    errorRatePercent: 0.3, connectedChargers: 32, lastEvent: 'Auth gateway response normal',
    mlStatus: 'NORMAL',
  },
  {
    id: 'CS-0210', name: 'Koramangala Rapid Charge', region: 'BLR', regionLabel: 'Bengaluru',
    status: 'PROTECTED', requestsPerSec: 1195, latencyMs: 35, healthPercent: 99,
    errorRatePercent: 0.1, connectedChargers: 28, lastEvent: 'Traffic within nominal range',
    mlStatus: 'NORMAL',
  },
  {
    id: 'CS-0642', name: 'Whitefield Tech Hub Charger', region: 'BLR', regionLabel: 'Bengaluru',
    status: 'PROTECTED', requestsPerSec: 1210, latencyMs: 37, healthPercent: 100,
    errorRatePercent: 0.1, connectedChargers: 52, lastEvent: 'Batch EV session auth succeeded',
    mlStatus: 'NORMAL',
  },
  {
    id: 'CS-0451', name: 'Hinjewadi Fast Charger Hub', region: 'PUN', regionLabel: 'Pune',
    status: 'PROTECTED', requestsPerSec: 1170, latencyMs: 41, healthPercent: 97,
    errorRatePercent: 0.4, connectedChargers: 20, lastEvent: 'Charging session handshake OK',
    mlStatus: 'NORMAL',
  },
  {
    id: 'CS-0571', name: 'Gachibowli EV Gateway', region: 'HYD', regionLabel: 'Hyderabad',
    status: 'PROTECTED', requestsPerSec: 1185, latencyMs: 39, healthPercent: 98,
    errorRatePercent: 0.3, connectedChargers: 30, lastEvent: 'Token validation nominal',
    mlStatus: 'NORMAL',
  },
];

/** Returns the station list, optionally patching CS-0421 to 'UNDER ATTACK' when simulation is active */
export const getStations = (
  isAttackMode: boolean,
  requestsPerSec: number,
): DemoStation[] => {
  if (!isAttackMode) return demoStations;

  return demoStations.map((s) => {
    if (s.id === 'CS-0421') {
      return {
        ...s,
        status: 'UNDER ATTACK' as const,
        requestsPerSec,
        latencyMs: 142,
        healthPercent: 62,
        errorRatePercent: 28,
        lastEvent: '⚠ DDoS burst detected — auth flood active',
        mlStatus: 'ATTACK DETECTED' as const,
        mlConfidence: 97.4,
      };
    }
    if (s.id === 'CS-0812') {
      return {
        ...s,
        status: 'DEGRADED' as const,
        requestsPerSec: 4200,
        latencyMs: 98,
        healthPercent: 79,
        errorRatePercent: 12,
        lastEvent: 'Elevated retry rate — gateway stressed',
        mlStatus: 'MONITORING' as const,
      };
    }
    return s;
  });
};

export const getRegions = (isAttackMode: boolean, requestsPerSec: number): ChargingRegion[] => [
  {
    id: 'MUM', label: 'Mumbai',
    totalStations: 312,
    protected: isAttackMode ? 309 : 312,
    degraded: isAttackMode ? 2 : 0,
    underAttack: isAttackMode ? 1 : 0,
    requestsPerSec: isAttackMode ? requestsPerSec : 5240,
    healthPercent: isAttackMode ? 78 : 98.7,
    latencyMs: isAttackMode ? 142 : 42,
    svgX: 180, svgY: 310,
  },
  {
    id: 'DEL', label: 'Delhi',
    totalStations: 286, protected: 286, degraded: 0, underAttack: 0,
    requestsPerSec: 4920, healthPercent: 99.1, latencyMs: 38,
    svgX: 320, svgY: 120,
  },
  {
    id: 'BLR', label: 'Bengaluru',
    totalStations: 264, protected: 264, degraded: 0, underAttack: 0,
    requestsPerSec: 4840, healthPercent: 99.4, latencyMs: 35,
    svgX: 310, svgY: 380,
  },
  {
    id: 'PUN', label: 'Pune',
    totalStations: 218, protected: 218, degraded: 0, underAttack: 0,
    requestsPerSec: 4210, healthPercent: 97.8, latencyMs: 41,
    svgX: 210, svgY: 340,
  },
  {
    id: 'HYD', label: 'Hyderabad',
    totalStations: 170, protected: 170, degraded: 0, underAttack: 0,
    requestsPerSec: 3940, healthPercent: 98.2, latencyMs: 39,
    svgX: 290, svgY: 300,
  },
];

export const getNetworkSummary = (isAttackMode: boolean): NetworkSummary => ({
  totalStations: 1250,
  protected: isAttackMode ? 1248 : 1250,
  degraded: isAttackMode ? 1 : 0,
  underAttack: isAttackMode ? 1 : 0,
  offline: 0,
  activeConnections: 18420,
});
