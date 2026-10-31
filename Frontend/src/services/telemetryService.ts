import { apiClient, ApiResponseWrapper } from './apiClient';
import { AttackIncident } from '../types/attack';
import { DetectionMethod } from '../types/ml';
import {
  TrafficCategory,
  NormalBaseline,
  ExplainableAnomalyAlert,
  AnomalyDetectionResult,
  DetectionThresholdsConfig,
  SimulationMode,
  DetectionStatus,
  SimulationLifecycle,
  AutoSimulationConfig,
  RecoveryStatus,
} from '../types/monitoring';

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
  eventType?: string;
  severity?: string;
  source?: string;
  endpoint?: string;
  detectionResult?: any;
  mitigationStatus?: string;
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
    // Stage 1 metrics
    packetRate: number;
    bytesPerSecond: number;
    bytesTransferredTotal: number;
    dataTransferredMB: number;
    activeConnections: number;
    newConnectionRate: number;
    trafficCategory: TrafficCategory;
    baseline: NormalBaseline;
    recentAlerts: ExplainableAnomalyAlert[];
    detectionResult: AnomalyDetectionResult | null;
  };
  ml: MLInferenceResult;
  simulation: {
    mode: SimulationMode | string;
    active: boolean;
    startedAt: string | null;
    durationSeconds: number;
    intensity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
    targetRps?: number;
    isSimulated?: boolean;
  };
  threatLevel: ThreatLevelState;
  securityStatus: 'PROTECTED' | 'THREAT DETECTED';
  activeDetector?: DetectionMethod;
  detectionMethod?: DetectionMethod;
  simulationMode?: SimulationMode;
  detectionStatus?: DetectionStatus;
  simulationLifecycle?: SimulationLifecycle;
  autoSimulation?: AutoSimulationConfig;
  recoveryStatus?: RecoveryStatus;
  events: SecurityEventItem[];
  activeIncident?: AttackIncident | null;
  lastIncident?: AttackIncident | null;
}

function resolveWsUrl(): string {
  const envUrl = import.meta.env.VITE_WS_URL;
  if (envUrl) return envUrl;
  const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';
  try {
    const url = new URL(apiUrl);
    const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${url.host}/ws/telemetry`;
  } catch {
    return 'ws://localhost:5000/ws/telemetry';
  }
}

export const telemetryService = {
  getLiveSnapshot: async (): Promise<LiveTelemetrySnapshot> => {
    const response = await apiClient.get<ApiResponseWrapper<LiveTelemetrySnapshot>>('/telemetry/live');
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error('Failed to retrieve live telemetry data.');
  },

  executeMitigation: async (): Promise<{ success: boolean; message: string; incident: AttackIncident | null }> => {
    const response = await apiClient.post<ApiResponseWrapper<{ message: string; incident: AttackIncident | null }>>('/telemetry/mitigate');
    return {
      success: response.data.success,
      message: response.data.data?.message || 'Mitigation applied',
      incident: response.data.data?.incident || null,
    };
  },

  getActiveIncident: async (): Promise<{ activeIncident: AttackIncident | null; lastIncident: AttackIncident | null }> => {
    const response = await apiClient.get<ApiResponseWrapper<{ activeIncident: AttackIncident | null; lastIncident: AttackIncident | null }>>('/telemetry/incident');
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    return { activeIncident: null, lastIncident: null };
  },

  startNormalTraffic: async (): Promise<LiveTelemetrySnapshot> => {
    const response = await apiClient.post<ApiResponseWrapper<{ message: string; snapshot: LiveTelemetrySnapshot }>>('/telemetry/start-normal');
    if (response.data.success && response.data.data) {
      return response.data.data.snapshot;
    }
    throw new Error('Failed to start normal traffic simulation.');
  },

  startAttackSimulation: async (): Promise<LiveTelemetrySnapshot> => {
    const response = await apiClient.post<ApiResponseWrapper<{ message: string; snapshot: LiveTelemetrySnapshot }>>('/telemetry/start-attack');
    if (response.data.success && response.data.data) {
      return response.data.data.snapshot;
    }
    throw new Error('Failed to start attack simulation.');
  },

  stopTraffic: async (): Promise<LiveTelemetrySnapshot> => {
    const response = await apiClient.post<ApiResponseWrapper<{ message: string; snapshot: LiveTelemetrySnapshot }>>('/telemetry/stop');
    if (response.data.success && response.data.data) {
      return response.data.data.snapshot;
    }
    throw new Error('Failed to stop traffic.');
  },

  resetDemo: async (): Promise<LiveTelemetrySnapshot> => {
    const response = await apiClient.post<ApiResponseWrapper<{ message: string; snapshot: LiveTelemetrySnapshot }>>('/telemetry/reset');
    if (response.data.success && response.data.data) {
      return response.data.data.snapshot;
    }
    throw new Error('Failed to reset demo.');
  },

  // ── Stage 1 Scenario & Baseline Endpoints ─────────────────────────────────

  triggerScenario: async (scenario: string): Promise<LiveTelemetrySnapshot> => {
    const response = await apiClient.post<ApiResponseWrapper<{ message: string; snapshot: LiveTelemetrySnapshot }>>(`/telemetry/simulate/${scenario}`);
    if (response.data.success && response.data.data) {
      return response.data.data.snapshot;
    }
    throw new Error(`Failed to trigger scenario: ${scenario}`);
  },

  setSimulationIntensity: async (
    intensity: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME',
    targetRps?: number
  ): Promise<LiveTelemetrySnapshot> => {
    const response = await apiClient.post<ApiResponseWrapper<{ message: string; snapshot: LiveTelemetrySnapshot }>>(
      '/telemetry/simulate/intensity',
      { intensity, targetRps }
    );
    if (response.data.success && response.data.data) {
      return response.data.data.snapshot;
    }
    throw new Error('Failed to configure simulation intensity.');
  },

  getBaseline: async (): Promise<NormalBaseline> => {
    const response = await apiClient.get<ApiResponseWrapper<NormalBaseline>>('/telemetry/baseline');
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error('Failed to fetch normal baseline.');
  },

  resetBaseline: async (): Promise<NormalBaseline> => {
    const response = await apiClient.post<ApiResponseWrapper<{ message: string; baseline: NormalBaseline }>>('/telemetry/baseline/reset');
    if (response.data.success && response.data.data) {
      return response.data.data.baseline;
    }
    throw new Error('Failed to reset normal baseline.');
  },

  getThresholds: async (): Promise<DetectionThresholdsConfig> => {
    const response = await apiClient.get<ApiResponseWrapper<DetectionThresholdsConfig>>('/telemetry/thresholds');
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error('Failed to fetch detection thresholds.');
  },

  updateThresholds: async (config: Partial<DetectionThresholdsConfig>): Promise<DetectionThresholdsConfig> => {
    const response = await apiClient.post<ApiResponseWrapper<{ message: string; thresholds: DetectionThresholdsConfig }>>(
      '/telemetry/thresholds',
      config
    );
    if (response.data.success && response.data.data) {
      return response.data.data.thresholds;
    }
    throw new Error('Failed to update detection thresholds.');
  },

  getAnomalyAlerts: async (): Promise<ExplainableAnomalyAlert[]> => {
    const response = await apiClient.get<ApiResponseWrapper<{ items: ExplainableAnomalyAlert[]; total: number }>>('/telemetry/alerts');
    if (response.data.success && response.data.data) {
      return response.data.data.items;
    }
    return [];
  },

  enableAutoDemo: async (
    intervalSeconds = 20,
    durationSeconds = 8,
    scenario = 'COMBINED_ANOMALY'
  ): Promise<{ config: any; snapshot: LiveTelemetrySnapshot }> => {
    const response = await apiClient.post<ApiResponseWrapper<{ message: string; config: any; snapshot: LiveTelemetrySnapshot }>>(
      '/telemetry/auto-demo/enable',
      { intervalSeconds, durationSeconds, scenario }
    );
    if (response.data.success && response.data.data) {
      return { config: response.data.data.config, snapshot: response.data.data.snapshot };
    }
    throw new Error('Failed to enable automatic demo simulation.');
  },

  disableAutoDemo: async (): Promise<{ config: any; snapshot: LiveTelemetrySnapshot }> => {
    const response = await apiClient.post<ApiResponseWrapper<{ message: string; config: any; snapshot: LiveTelemetrySnapshot }>>(
      '/telemetry/auto-demo/disable'
    );
    if (response.data.success && response.data.data) {
      return { config: response.data.data.config, snapshot: response.data.data.snapshot };
    }
    throw new Error('Failed to disable automatic demo simulation.');
  },

  getAutoDemoStatus: async (): Promise<any> => {
    const response = await apiClient.get<ApiResponseWrapper<{ config: any }>>('/telemetry/auto-demo/status');
    if (response.data.success && response.data.data) {
      return response.data.data.config;
    }
    return null;
  },

  selectDetector: async (detector: DetectionMethod): Promise<{ activeDetector: DetectionMethod; snapshot?: LiveTelemetrySnapshot }> => {
    const response = await apiClient.post<ApiResponseWrapper<{ activeDetector: DetectionMethod; snapshot?: LiveTelemetrySnapshot }>>(
      '/telemetry/select-detector',
      { detector }
    );
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error('Failed to set active detector.');
  },

  getActiveDetector: async (): Promise<DetectionMethod> => {
    const response = await apiClient.get<ApiResponseWrapper<{ activeDetector: DetectionMethod }>>('/telemetry/active-detector');
    if (response.data.success && response.data.data) {
      return response.data.data.activeDetector;
    }
    return 'RANDOM_FOREST';
  },

  // ── Native WebSocket Stream with Automatic Reconnect & Fallback ────────────

  connectWebSocket: (
    onSnapshot: (snapshot: LiveTelemetrySnapshot) => void,
    onAlert?: (alert: ExplainableAnomalyAlert) => void,
    onStatusChange?: (connected: boolean) => void
  ): (() => void) => {
    const wsUrl = resolveWsUrl();
    let socket: WebSocket | null = null;
    let reconnectTimer: any = null;
    let isDisposed = false;

    const connect = () => {
      if (isDisposed) return;
      try {
        socket = new WebSocket(wsUrl);

        socket.onopen = () => {
          if (onStatusChange) onStatusChange(true);
        };

        socket.onmessage = (event) => {
          try {
            const parsed = JSON.parse(event.data);
            if (parsed.type === 'telemetry_snapshot' && parsed.data) {
              onSnapshot(parsed.data as LiveTelemetrySnapshot);
            } else if (parsed.type === 'anomaly_alert' && parsed.data && onAlert) {
              onAlert(parsed.data as ExplainableAnomalyAlert);
            }
          } catch (e) {
            console.error('Error parsing WebSocket message:', e);
          }
        };

        socket.onerror = () => {
          if (onStatusChange) onStatusChange(false);
        };

        socket.onclose = () => {
          if (onStatusChange) onStatusChange(false);
          if (!isDisposed) {
            reconnectTimer = setTimeout(connect, 2000);
          }
        };
      } catch (err) {
        if (onStatusChange) onStatusChange(false);
        if (!isDisposed) {
          reconnectTimer = setTimeout(connect, 2000);
        }
      }
    };

    connect();

    return () => {
      isDisposed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (socket) {
        try {
          socket.close();
        } catch {}
      }
    };
  },
};
