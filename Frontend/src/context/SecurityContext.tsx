import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  SecurityContextType,
  TrafficDataPoint,
  NotificationItem,
  ChargingStationNode,
  AttackLogRecord,
  TimelineEvent,
  AttackFeedItem,
} from '../types';
import { AttackIncident } from '../types/attack';
import {
  TrafficCategory,
  NormalBaseline,
  ExplainableAnomalyAlert,
  DetectionThresholdsConfig,
  SimulationState,
  SimulationMode,
  DetectionStatus,
  SimulationLifecycle,
  AutoSimulationConfig,
  RecoveryStatus,
} from '../types/monitoring';
import { DetectionMethod } from '../types/ml';
import {
  initialTrafficData,
  initialChargingStations,
  initialTimelineEvents,
  initialAttackFeed,
} from '../data/mockData';
import { telemetryService, LiveTelemetrySnapshot } from '../services/telemetryService';
import { formatTime } from '../utils/dateTime';

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export const SecurityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Live connectivity state
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(false);
  const [liveError, setLiveError] = useState<string | null>(null);

  // Subsystem health
  const [serverStatus, setServerStatus] = useState<'ONLINE' | 'OFFLINE'>('OFFLINE');
  const [mlEngineStatus, setMlEngineStatus] = useState<'ONLINE' | 'OFFLINE'>('ONLINE');
  const [backendStatus, setBackendStatus] = useState<'ONLINE' | 'OFFLINE'>('ONLINE');
  const [telemetryStatus, setTelemetryStatus] = useState<'ACTIVE' | 'IDLE'>('IDLE');

  // Simulation & Threat states
  const [activeDetector, setActiveDetectorState] = useState<DetectionMethod>('RANDOM_FOREST');
  const [simulationMode, setSimulationMode] = useState<SimulationMode>('NORMAL');
  const [detectionStatus, setDetectionStatus] = useState<DetectionStatus>('NORMAL');
  const [simulationLifecycle, setSimulationLifecycle] = useState<SimulationLifecycle>('RUNNING');
  const [threatLevelState, setThreatLevelState] = useState<'NORMAL' | 'ANALYZING' | 'CRITICAL' | 'RECOVERING'>('NORMAL');
  const [isAttackMode, setIsAttackMode] = useState<boolean>(false);
  const [isRecovering, setIsRecovering] = useState<boolean>(false);
  const [isStopped, setIsStopped] = useState<boolean>(false);
  const [securityStatus, setSecurityStatus] = useState<'PROTECTED' | 'THREAT DETECTED'>('PROTECTED');
  const [autoSimulation, setAutoSimulation] = useState<AutoSimulationConfig | null>(null);
  const [recoveryStatus, setRecoveryStatus] = useState<RecoveryStatus | null>(null);
  const [activeThreats, setActiveThreats] = useState<number>(0);
  const [requestsPerSec, setRequestsPerSec] = useState<number>(0);
  const [affectedNodes, setAffectedNodes] = useState<number>(0);

  // Stage 1 Telemetry Metrics State
  const [packetRate, setPacketRate] = useState<number>(0);
  const [bytesPerSecond, setBytesPerSecond] = useState<number>(0);
  const [dataTransferredMB, setDataTransferredMB] = useState<number>(0);
  const [activeConnections, setActiveConnections] = useState<number>(0);
  const [newConnectionRate, setNewConnectionRate] = useState<number>(0);
  const [trafficCategory, setTrafficCategory] = useState<TrafficCategory>('NORMAL');
  const [baseline, setBaseline] = useState<NormalBaseline | null>(null);
  const [anomalyAlerts, setAnomalyAlerts] = useState<ExplainableAnomalyAlert[]>([]);
  const [anomalyScore, setAnomalyScore] = useState<number>(0);
  const [detectionThresholds, setDetectionThresholds] = useState<DetectionThresholdsConfig | null>(null);
  const [simulationState, setSimulationState] = useState<SimulationState | null>(null);

  // ML real output
  const [mlConfidence, setMlConfidence] = useState<number>(24.0);
  const [mlThreshold, setMlThreshold] = useState<number>(0.55);
  const [mlLabel, setMlLabel] = useState<'NORMAL' | 'ATTACK'>('NORMAL');
  const [mlFeatures, setMlFeatures] = useState<Record<string, number>>({});

  // Telemetry stats
  const [avgLatencyMs, setAvgLatencyMs] = useState<number>(0);
  const [minLatencyMs, setMinLatencyMs] = useState<number>(0);
  const [maxLatencyMs, setMaxLatencyMs] = useState<number>(0);
  const [totalRequests, setTotalRequests] = useState<number>(0);
  const [errorRatePercent, setErrorRatePercent] = useState<number>(0);

  // Real Incident tracking
  const [activeIncident, setActiveIncident] = useState<AttackIncident | null>(null);
  const [lastIncident, setLastIncident] = useState<AttackIncident | null>(null);

  // Feeds & Lists
  const [trafficData, setTrafficData] = useState<TrafficDataPoint[]>(initialTrafficData);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [chargingStations, setChargingStations] = useState<ChargingStationNode[]>(initialChargingStations);
  const [attackLog, setAttackLog] = useState<AttackLogRecord | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>(initialTimelineEvents);
  const [liveFeed, setLiveFeed] = useState<AttackFeedItem[]>(initialAttackFeed);

  const prevThreatLevelRef = useRef<string>('NORMAL');

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Sync snapshot from backend into React state
  const applySnapshot = useCallback((snap: LiveTelemetrySnapshot) => {
    setIsLiveConnected(true);
    setLiveError(null);

    setServerStatus(snap.server.status);
    setBackendStatus(snap.health.backend);
    setMlEngineStatus(snap.health.mlEngine);
    setTelemetryStatus(snap.health.telemetry);

    const detStatus: DetectionStatus =
      snap.detectionStatus ||
      (snap.threatLevel === 'CRITICAL' ? 'ANOMALY_ACTIVE' : snap.threatLevel === 'RECOVERING' ? 'RECOVERING' : 'NORMAL');
    setDetectionStatus(detStatus);

    const lifecycle: SimulationLifecycle =
      snap.simulationLifecycle ||
      (snap.simulation.active ? 'RUNNING' : 'STOPPED');
    setSimulationLifecycle(lifecycle);

    const simMode: SimulationMode = (snap.simulationMode || snap.simulation.mode || 'NORMAL') as SimulationMode;
    setSimulationMode(simMode);
    setThreatLevelState(snap.threatLevel);

    const isAtk = detStatus === 'ANOMALY_ACTIVE';
    setIsAttackMode(isAtk);
    setIsRecovering(detStatus === 'RECOVERING');
    setIsStopped(lifecycle === 'STOPPED');
    setSecurityStatus(snap.securityStatus);
    setActiveThreats(isAtk ? 1 : 0);
    setAffectedNodes(isAtk ? 24 : 0);

    if (snap.autoSimulation) {
      setAutoSimulation(snap.autoSimulation);
    }
    if (snap.recoveryStatus) {
      setRecoveryStatus(snap.recoveryStatus);
    }
    if (snap.activeDetector) {
      setActiveDetectorState(snap.activeDetector);
    } else if (snap.detectionMethod) {
      setActiveDetectorState(snap.detectionMethod);
    }

    // Standard telemetry
    setRequestsPerSec(snap.telemetry.requestsPerSecond);
    setAvgLatencyMs(snap.telemetry.averageLatencyMs);
    setMinLatencyMs(snap.telemetry.minLatencyMs);
    setMaxLatencyMs(snap.telemetry.maxLatencyMs);
    setTotalRequests(snap.telemetry.totalRequests);
    setErrorRatePercent(snap.telemetry.errorRatePercent);

    // Stage 1 Telemetry metrics
    setPacketRate(snap.telemetry.packetRate ?? Math.round(snap.telemetry.requestsPerSecond * 4));
    setBytesPerSecond(snap.telemetry.bytesPerSecond ?? Math.round(snap.telemetry.requestsPerSecond * 512));
    setDataTransferredMB(snap.telemetry.dataTransferredMB ?? 0);
    setActiveConnections(snap.telemetry.activeConnections ?? 1);
    setNewConnectionRate(snap.telemetry.newConnectionRate ?? snap.telemetry.requestsPerSecond);
    setTrafficCategory(snap.telemetry.trafficCategory ?? 'NORMAL');

    if (snap.telemetry.baseline) {
      setBaseline(snap.telemetry.baseline);
    }

    if (snap.telemetry.recentAlerts && snap.telemetry.recentAlerts.length > 0) {
      setAnomalyAlerts(snap.telemetry.recentAlerts);
    }

    if (snap.telemetry.detectionResult) {
      setAnomalyScore(snap.telemetry.detectionResult.anomalyScore);
    }

    setSimulationState({
      mode: snap.simulation.mode,
      intensity: snap.simulation.intensity || 'MEDIUM',
      targetRps: snap.simulation.targetRps || 12,
      startedAt: snap.simulation.startedAt,
      durationSeconds: snap.simulation.durationSeconds,
      isSimulated: snap.simulation.isSimulated ?? true,
    });

    // Real ML values
    const confidencePct = Math.round(snap.ml.probability_attack * 1000) / 10;
    setMlConfidence(confidencePct);
    setMlThreshold(snap.ml.threshold);
    setMlLabel(snap.ml.label);
    setMlFeatures(snap.ml.features || {});

    // Graph points mapping
    if (snap.telemetry.graphPoints && snap.telemetry.graphPoints.length > 0) {
      setTrafficData(
        snap.telemetry.graphPoints.map((gp) => ({
          timestamp: gp.timestamp,
          requests: gp.requestsPerSec,
          isAnomaly: gp.isAnomaly,
        }))
      );
    }

    // Real incident sync
    if (snap.activeIncident !== undefined) {
      setActiveIncident(snap.activeIncident);
    }
    if (snap.lastIncident !== undefined) {
      setLastIncident(snap.lastIncident);
    }

    // Events mapping
    if (snap.events && snap.events.length > 0) {
      setTimelineEvents(
        snap.events.map((ev) => ({
          id: ev.id,
          time: formatTime(ev.timestamp) || ev.timeStr,
          title: ev.title,
          description: ev.message,
          type: ev.type === 'CRITICAL' ? 'escalated' : ev.type === 'WARNING' ? 'suspicious' : 'normal',
          severity: ev.type === 'CRITICAL' ? 'critical' : ev.type === 'WARNING' ? 'high' : 'low',
          isHistoricalDemo: false,
        }))
      );

      setLiveFeed(
        snap.events.map((ev) => ({
          id: ev.id,
          time: formatTime(ev.timestamp) || ev.timeStr,
          title: ev.title,
          nodeId: ev.source || 'Gateway 127.0.0.1:8080',
          severity: ev.type === 'CRITICAL' ? 'critical' : ev.type === 'WARNING' ? 'high' : 'info',
          type: ev.eventType || (ev.type === 'CRITICAL' ? 'DDoS Authentication Burst' : 'Telemetry Event'),
        }))
      );
    }

    // Update charging station cards
    setChargingStations((prev) =>
      prev.map((station) =>
        station.id === 'CS-0421'
          ? {
              ...station,
              status: isAtk ? 'UNDER ATTACK' : 'PROTECTED',
              requestsPerSec: snap.telemetry.requestsPerSecond,
              threatLevel: isAtk ? 'CRITICAL' : 'NOMINAL',
            }
          : station
      )
    );

    // Synchronize attack log from real active incident or detection
    if (snap.activeIncident) {
      setAttackLog({
        attackId: snap.activeIncident.id,
        attackType: snap.activeIncident.attackTypeLabel,
        severity: snap.activeIncident.severity,
        status: snap.activeIncident.status === 'MITIGATED' ? 'MITIGATED' : 'ACTIVE',
        mlConfidence: `${snap.activeIncident.mlConfidence}% (Random Forest)`,
        requestsPerSec: snap.activeIncident.requestsPerSecond || snap.telemetry.requestsPerSecond,
        affectedNodes: snap.activeIncident.affectedNodes || 24,
        timestamp: formatTime(snap.activeIncident.startTime || snap.activeIncident.timestamp),
        targetScope: snap.activeIncident.targetInfrastructure || 'Gateway Zone 1 (CS-0421)',
      });
    } else if (snap.threatLevel === 'CRITICAL' && prevThreatLevelRef.current !== 'CRITICAL') {
      const newToast: NotificationItem = {
        id: `notif-${Date.now()}`,
        title: '⚠ DDoS ATTACK DETECTED',
        message: `Random Forest model flagged anomaly (${confidencePct}% probability >= ${Math.round(snap.ml.threshold * 100)}% threshold).`,
        type: 'critical',
        timestamp: formatTime(new Date()),
      };
      setNotifications((prev) => [newToast, ...prev]);

      setAttackLog({
        attackId: `EVS-LIVE-${Date.now().toString().slice(-4)}`,
        attackType: 'DDoS Authentication Burst',
        severity: 'CRITICAL',
        status: 'ACTIVE',
        mlConfidence: `${confidencePct}% (Random Forest)`,
        requestsPerSec: snap.telemetry.requestsPerSecond,
        affectedNodes: 24,
        timestamp: formatTime(new Date()),
        targetScope: 'Gateway Zone 1 (CS-0421)',
      });
    } else if (snap.threatLevel === 'NORMAL' && prevThreatLevelRef.current === 'CRITICAL') {
      const resolvedToast: NotificationItem = {
        id: `notif-resolved-${Date.now()}`,
        title: '✓ THREAT MITIGATED',
        message: 'Telemetry has returned to baseline. ML classification is NORMAL.',
        type: 'success',
        timestamp: formatTime(new Date()),
      };
      setNotifications((prev) => [resolvedToast, ...prev]);
      setAttackLog(null);
    } else if (snap.threatLevel === 'NORMAL' && !isAtk) {
      setAttackLog(null);
    }

    prevThreatLevelRef.current = snap.threatLevel;
  }, []);

  // Poll live telemetry from backend
  const fetchLiveTelemetry = useCallback(async () => {
    try {
      const snap = await telemetryService.getLiveSnapshot();
      applySnapshot(snap);
    } catch (err: any) {
      setIsLiveConnected(false);
      setLiveError(err?.message || 'Backend connection error');
      setBackendStatus('OFFLINE');
    }
  }, [applySnapshot]);

  // Connect native WebSocket with automatic reconnect, plus background polling backup
  useEffect(() => {
    // Initial fetch
    fetchLiveTelemetry();

    // WebSocket connection
    const unsubscribeWs = telemetryService.connectWebSocket(
      (snapshot) => applySnapshot(snapshot),
      (alert) => {
        setAnomalyAlerts((prev) => [alert, ...prev.filter((a) => a.alertId !== alert.alertId).slice(0, 49)]);
      },
      (connected) => {
        setIsLiveConnected(connected);
        if (connected) {
          setLiveError(null);
          setBackendStatus('ONLINE');
        }
      }
    );

    // Polling backup every 1500ms
    const interval = setInterval(fetchLiveTelemetry, 1500);

    return () => {
      unsubscribeWs();
      clearInterval(interval);
    };
  }, [fetchLiveTelemetry, applySnapshot]);

  // Initial load of thresholds and baseline
  useEffect(() => {
    telemetryService
      .getThresholds()
      .then((t) => setDetectionThresholds(t))
      .catch(() => {});

    telemetryService
      .getBaseline()
      .then((b) => setBaseline(b))
      .catch(() => {});
  }, []);

  // Demo Control Handlers
  const startNormalTraffic = async () => {
    try {
      const snap = await telemetryService.startNormalTraffic();
      applySnapshot(snap);
    } catch (err: any) {
      setLiveError(err?.message || 'Failed to start normal traffic');
    }
  };

  const startAttackSimulation = async () => {
    try {
      const snap = await telemetryService.startAttackSimulation();
      applySnapshot(snap);
    } catch (err: any) {
      setLiveError(err?.message || 'Failed to start attack simulation');
    }
  };

  const stopTraffic = async () => {
    try {
      const snap = await telemetryService.stopTraffic();
      applySnapshot(snap);
    } catch (err: any) {
      setLiveError(err?.message || 'Failed to stop traffic');
    }
  };

  const resetDemo = async () => {
    try {
      const snap = await telemetryService.resetDemo();
      applySnapshot(snap);
    } catch (err: any) {
      setLiveError(err?.message || 'Failed to reset demo');
    }
  };

  const executeMitigation = async () => {
    try {
      const res = await telemetryService.executeMitigation();
      if (res.incident) {
        setLastIncident(res.incident);
        setActiveIncident(null);
      }
      const successToast: NotificationItem = {
        id: `notif-mitigated-${Date.now()}`,
        title: '🛡 MITIGATION ENFORCED',
        message: res.message || 'Mitigation rules applied: rate limit CS-0421 & quarantine tokens.',
        type: 'success',
        timestamp: formatTime(new Date()),
      };
      setNotifications((prev) => [successToast, ...prev]);
      await fetchLiveTelemetry();
    } catch (err: any) {
      setLiveError(err?.message || 'Failed to execute mitigation');
    }
  };

  const toggleDDoSAttack = () => {
    if (isAttackMode || simulationMode !== 'NORMAL') {
      stopTraffic();
    } else {
      startAttackSimulation();
    }
  };

  // Stage 1 Simulation Actions
  const triggerScenario = async (scenario: string) => {
    try {
      const snap = await telemetryService.triggerScenario(scenario);
      applySnapshot(snap);
    } catch (err: any) {
      setLiveError(err?.message || `Failed to trigger scenario '${scenario}'`);
    }
  };

  const setSimulationIntensity = async (
    intensity: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME',
    targetRps?: number
  ) => {
    try {
      const snap = await telemetryService.setSimulationIntensity(intensity, targetRps);
      applySnapshot(snap);
    } catch (err: any) {
      setLiveError(err?.message || 'Failed to update simulation intensity');
    }
  };

  const updateThresholds = async (config: Partial<DetectionThresholdsConfig>) => {
    try {
      const updated = await telemetryService.updateThresholds(config);
      setDetectionThresholds(updated);
    } catch (err: any) {
      setLiveError(err?.message || 'Failed to update thresholds');
    }
  };

  const resetBaseline = async () => {
    try {
      const base = await telemetryService.resetBaseline();
      setBaseline(base);
    } catch (err: any) {
      setLiveError(err?.message || 'Failed to reset baseline');
    }
  };

  const enableAutoDemo = async (intervalSeconds?: number, durationSeconds?: number) => {
    try {
      const res = await telemetryService.enableAutoDemo(intervalSeconds, durationSeconds);
      if (res && res.snapshot) {
        applySnapshot(res.snapshot);
      }
    } catch (err: any) {
      setLiveError(err?.message || 'Failed to enable automatic demo simulation');
    }
  };

  const disableAutoDemo = async () => {
    try {
      const res = await telemetryService.disableAutoDemo();
      if (res && res.snapshot) {
        applySnapshot(res.snapshot);
      }
    } catch (err: any) {
      setLiveError(err?.message || 'Failed to disable automatic demo simulation');
    }
  };

  const setActiveDetector = async (detector: DetectionMethod) => {
    try {
      const res = await telemetryService.selectDetector(detector);
      setActiveDetectorState(res.activeDetector);
      if (res.snapshot) {
        applySnapshot(res.snapshot);
      }
    } catch (err: any) {
      setLiveError(err?.message || `Failed to set active detector to ${detector}`);
    }
  };

  return (
    <SecurityContext.Provider
      value={{
        isAttackMode,
        isRecovering,
        isStopped,
        activeDetector,
        setActiveDetector,
        detectionStatus,
        simulationLifecycle,
        autoSimulation,
        recoveryStatus,
        enableAutoDemo,
        disableAutoDemo,
        toggleDDoSAttack,
        startNormalTraffic,
        startAttackSimulation,
        stopTraffic,
        resetDemo,
        executeMitigation,
        securityStatus,
        activeThreats,
        requestsPerSec,
        affectedNodes,
        mlConfidence,
        trafficData,
        notifications,
        dismissNotification,
        chargingStations,
        attackLog,
        timelineEvents,
        liveFeed,
        // Live Telemetry Integration
        isLiveConnected,
        liveError,
        serverStatus,
        mlEngineStatus,
        backendStatus,
        telemetryStatus,
        simulationMode,
        threatLevelState,
        mlThreshold,
        mlLabel,
        mlFeatures,
        avgLatencyMs,
        minLatencyMs,
        maxLatencyMs,
        totalRequests,
        errorRatePercent,
        activeIncident,
        lastIncident,
        // Stage 1 Telemetry & Explainable Anomaly Detection Extensions
        packetRate,
        bytesPerSecond,
        dataTransferredMB,
        activeConnections,
        newConnectionRate,
        trafficCategory,
        baseline,
        anomalyAlerts,
        anomalyScore,
        detectionThresholds,
        simulationState,
        triggerScenario,
        setSimulationIntensity,
        updateThresholds,
        resetBaseline,
      }}
    >
      {children}
    </SecurityContext.Provider>
  );
};

export const useSecurity = (): SecurityContextType => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
};
