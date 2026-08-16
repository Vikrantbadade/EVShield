import { apiClient, ApiResponseWrapper } from './apiClient';

export interface TelemetryGraphPoint {
  timestamp: string;
  requestsPerSec: number;
  latencyMs: number;
  probability: number;
  isAnomaly: boolean;
}

export interface SecurityEventItem {
  id: string;
  timestamp: string;
  timeStr: string;
  type: 'INFO' | 'WARNING' | 'CRITICAL' | 'SUCCESS';
  title: string;
  message: string;
}

export interface MLInferenceResult {
  probability_attack: number;
  predicted_label: number;
  label: 'NORMAL' | 'ATTACK';
  threshold: number;
  mode: string;
  features: Record<string, number>;
  inferenceTimeMs: number;
  modelName: string;
}

export type ThreatLevelState = 'NORMAL' | 'ANALYZING' | 'CRITICAL' | 'RECOVERING';
export type SimulationMode = 'NORMAL' | 'ATTACK' | 'IDLE';

export interface LiveTelemetrySnapshot {
  server: {
    status: 'ONLINE' | 'OFFLINE';
    host: string;
    port: number;
    activeSessions: number;
    lastSeen: string | null;
  };
  health: {
    fakeServer: 'ONLINE' | 'OFFLINE';
    backend: 'ONLINE' | 'OFFLINE';
    mlEngine: 'ONLINE' | 'OFFLINE';
    telemetry: 'ACTIVE' | 'IDLE';
    mlError?: string;
  };
  telemetry: {
    requestsPerSecond: number;
    totalRequests: number;
    averageLatencyMs: number;
    minLatencyMs: number;
    maxLatencyMs: number;
    stdLatencyMs: number;
    errorRatePercent: number;
    windowSize: number;
    graphPoints: TelemetryGraphPoint[];
  };
  ml: MLInferenceResult;
  simulation: {
    mode: SimulationMode;
    active: boolean;
    startedAt: string | null;
    durationSeconds: number;
  };
  threatLevel: ThreatLevelState;
  securityStatus: 'PROTECTED' | 'THREAT DETECTED';
  events: SecurityEventItem[];
}

export const telemetryService = {
  getLiveSnapshot: async (): Promise<LiveTelemetrySnapshot> => {
    const response = await apiClient.get<ApiResponseWrapper<LiveTelemetrySnapshot>>('/telemetry/live');
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error('Failed to retrieve live telemetry data.');
  },

  startNormalTraffic: async (): Promise<LiveTelemetrySnapshot> => {
    const response = await apiClient.post<ApiResponseWrapper<{ message: string; snapshot: LiveTelemetrySnapshot }>>('/demo/start-normal');
    if (response.data.success && response.data.data) {
      return response.data.data.snapshot;
    }
    throw new Error('Failed to start normal traffic simulation.');
  },

  startAttackSimulation: async (): Promise<LiveTelemetrySnapshot> => {
    const response = await apiClient.post<ApiResponseWrapper<{ message: string; snapshot: LiveTelemetrySnapshot }>>('/demo/start-attack');
    if (response.data.success && response.data.data) {
      return response.data.data.snapshot;
    }
    throw new Error('Failed to start attack simulation.');
  },

  stopTraffic: async (): Promise<LiveTelemetrySnapshot> => {
    const response = await apiClient.post<ApiResponseWrapper<{ message: string; snapshot: LiveTelemetrySnapshot }>>('/demo/stop');
    if (response.data.success && response.data.data) {
      return response.data.data.snapshot;
    }
    throw new Error('Failed to stop traffic.');
  },

  resetDemo: async (): Promise<LiveTelemetrySnapshot> => {
    const response = await apiClient.post<ApiResponseWrapper<{ message: string; snapshot: LiveTelemetrySnapshot }>>('/demo/reset');
    if (response.data.success && response.data.data) {
      return response.data.data.snapshot;
    }
    throw new Error('Failed to reset demo.');
  },
};
