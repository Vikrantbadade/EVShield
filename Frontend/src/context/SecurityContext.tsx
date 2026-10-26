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
  const [simulationMode, setSimulationMode] = useState<'NORMAL' | 'ATTACK' | 'IDLE'>('IDLE');
  const [threatLevelState, setThreatLevelState] = useState<'NORMAL' | 'ANALYZING' | 'CRITICAL' | 'RECOVERING'>('NORMAL');
  const [isAttackMode, setIsAttackMode] = useState<boolean>(false);
  const [securityStatus, setSecurityStatus] = useState<'PROTECTED' | 'THREAT DETECTED'>('PROTECTED');
  const [activeThreats, setActiveThreats] = useState<number>(0);
  const [requestsPerSec, setRequestsPerSec] = useState<number>(0);
  const [affectedNodes, setAffectedNodes] = useState<number>(0);

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

    setSimulationMode(snap.simulation.mode);
    setThreatLevelState(snap.threatLevel);

    const isAtk = snap.ml.label === 'ATTACK' || snap.threatLevel === 'CRITICAL';
    setIsAttackMode(isAtk);
    setSecurityStatus(snap.securityStatus);
    setActiveThreats(isAtk ? 1 : 0);
    setAffectedNodes(isAtk ? 24 : 0);

    setRequestsPerSec(snap.telemetry.requestsPerSecond);
    setAvgLatencyMs(snap.telemetry.averageLatencyMs);
    setMinLatencyMs(snap.telemetry.minLatencyMs);
    setMaxLatencyMs(snap.telemetry.maxLatencyMs);
    setTotalRequests(snap.telemetry.totalRequests);
    setErrorRatePercent(snap.telemetry.errorRatePercent);

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

    // Events mapping with canonical time formatting
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

  // Polling loop (every 800ms)
  useEffect(() => {
    fetchLiveTelemetry();
    const interval = setInterval(fetchLiveTelemetry, 800);
    return () => clearInterval(interval);
  }, [fetchLiveTelemetry]);

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
    if (isAttackMode || simulationMode === 'ATTACK') {
      stopTraffic();
    } else {
      startAttackSimulation();
    }
  };

  return (
    <SecurityContext.Provider
      value={{
        isAttackMode,
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
