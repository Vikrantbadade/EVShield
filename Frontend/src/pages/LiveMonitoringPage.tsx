import React, { useMemo } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { useSecurity } from '../context/SecurityContext';
import { StatusChip } from '../components/ui/StatusChip';
import { ScrollReveal } from '../components/ui/ScrollReveal';
import { TrafficMonitorChart } from '../components/monitoring/TrafficMonitorChart';
import { TelemetryMetrics } from '../components/monitoring/TelemetryMetrics';
import { DemoControls } from '../components/monitoring/DemoControls';
import { AnomalyAlertsPanel } from '../components/monitoring/AnomalyAlertsPanel';
import { RegionalTrafficPanel } from '../components/monitoring/RegionalTraffic';
import { LiveEventStream } from '../components/monitoring/LiveEventStream';
import { SecuritySignalsPanel } from '../components/monitoring/SecuritySignals';
import {
  baseMonitoringEvents,
  attackMonitoringEvents,
  baseSecuritySignals,
  attackSecuritySignals,
  baseRegionalTraffic,
  getAttackRegionalTraffic,
} from '../data/mockMonitoring';
import { MonitoringEvent } from '../types/monitoring';

export const LiveMonitoringPage: React.FC = () => {
  const {
    isAttackMode,
    requestsPerSec,
    mlConfidence,
    trafficData,
    securityStatus,
    timelineEvents,
    serverStatus,
    isLiveConnected,
    anomalyAlerts,
    detectionThresholds,
    updateThresholds,
    trafficCategory,
    activeDetector,
  } = useSecurity();

  const events: MonitoringEvent[] = useMemo(() => {
    if (timelineEvents && timelineEvents.length > 0) {
      return timelineEvents.map((ev) => ({
        id: ev.id,
        time: ev.time,
        message: `${ev.title}: ${ev.description}`,
        severity: ev.severity === 'critical' ? 'critical' : ev.severity === 'high' ? 'warning' : 'normal',
        source: 'Gateway (127.0.0.1:8080)',
      }));
    }
    return isAttackMode ? [...attackMonitoringEvents, ...baseMonitoringEvents] : baseMonitoringEvents;
  }, [timelineEvents, isAttackMode]);

  const signals = useMemo(
    () => (isAttackMode ? attackSecuritySignals(mlConfidence) : baseSecuritySignals),
    [isAttackMode, mlConfidence]
  );

  const regionalTraffic = useMemo(
    () => (isAttackMode ? getAttackRegionalTraffic(requestsPerSec || 350) : baseRegionalTraffic),
    [isAttackMode, requestsPerSec]
  );

  const isAnomalous = isAttackMode || trafficCategory !== 'NORMAL';

  return (
    <AppLayout pageTitle="Live Monitoring">
      {/* 1. Page Header & Live Status Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3.5 border-b border-[#C4B5FD]/16">
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#F5F3FF] tracking-tight">
              Real-Time Network Monitoring &amp; Anomaly Detection
            </h2>
            <StatusChip
              label={isLiveConnected ? 'STREAMING (WEBSOCKET)' : 'CONNECTING...'}
              variant={isLiveConnected ? 'live' : 'demo'}
              dot
              pulse={isLiveConnected}
            />
            <StatusChip
              label={serverStatus === 'ONLINE' ? 'SERVER ONLINE (PORT 8080)' : 'SERVER OFFLINE'}
              variant={serverStatus === 'ONLINE' ? 'protected' : 'critical'}
              dot
            />
            {trafficCategory !== 'NORMAL' && (
              <StatusChip
                label={`ANOMALY: ${trafficCategory}`}
                variant="attack"
                dot
                pulse
              />
            )}
          </div>
          <p className="text-xs sm:text-sm text-[#C4C2D6]">
            Continuous live telemetry ingestion, dynamic baseline statistical modeling, multi-feature anomaly detection, and explainable root-cause alerts.
          </p>
        </div>
        <StatusChip
          label={isAnomalous ? 'ANOMALY DETECTED' : securityStatus}
          variant={isAnomalous ? 'critical' : 'protected'}
          dot
          pulse={isAnomalous}
        />
      </div>

      {/* 2. Live Telemetry Metrics Row (All 9 Metrics) */}
      <ScrollReveal delay={30}>
        <TelemetryMetrics />
      </ScrollReveal>

      {/* 3. Stage 1 Interactive Traffic Simulation Controls */}
      <ScrollReveal delay={60}>
        <DemoControls />
      </ScrollReveal>

      {/* 4. Explainable Anomaly Alerts Panel */}
      <ScrollReveal delay={90}>
        <AnomalyAlertsPanel
          alerts={anomalyAlerts}
          sensitivity={detectionThresholds?.sensitivity || 'MEDIUM'}
          onUpdateSensitivity={(level) => updateThresholds({ sensitivity: level })}
          activeDetector={activeDetector}
        />
      </ScrollReveal>

      {/* 5. Real-time Traffic Telemetry Chart */}
      <ScrollReveal delay={120}>
        <TrafficMonitorChart trafficData={trafficData} isAttackMode={isAttackMode} />
      </ScrollReveal>

      {/* 6. Regional Network & Security Signals */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7">
          <ScrollReveal delay={150}>
            <RegionalTrafficPanel entries={regionalTraffic} isAttackMode={isAttackMode} />
          </ScrollReveal>
        </div>
        <div className="lg:col-span-5">
          <ScrollReveal delay={180}>
            <SecuritySignalsPanel signals={signals} isAttackMode={isAttackMode} />
          </ScrollReveal>
        </div>
      </div>

      {/* 7. Live Event Stream */}
      <ScrollReveal delay={210}>
        <LiveEventStream events={events} isAttackMode={isAttackMode} />
      </ScrollReveal>
    </AppLayout>
  );
};
