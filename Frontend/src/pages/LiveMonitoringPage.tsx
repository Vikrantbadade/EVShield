import React, { useMemo } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { useSecurity } from '../context/SecurityContext';
import { StatusChip } from '../components/ui/StatusChip';
import { ScrollReveal } from '../components/ui/ScrollReveal';
import { DemoControls } from '../components/monitoring/DemoControls';
import { MonitoringHero } from '../components/monitoring/MonitoringHero';
import { TrafficMonitorChart } from '../components/monitoring/TrafficMonitorChart';
import { TelemetryMetrics } from '../components/monitoring/TelemetryMetrics';
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

  return (
    <AppLayout pageTitle="Live Monitoring">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#AD8B73]/18">
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#3F3832] tracking-tight">Live Monitoring</h2>
            <StatusChip
              label={isLiveConnected ? 'LIVE PIPELINE' : 'DISCONNECTED'}
              variant={isLiveConnected ? 'live' : 'demo'}
              dot
              pulse={isLiveConnected}
            />
            <StatusChip
              label={serverStatus === 'ONLINE' ? 'SERVER ONLINE' : 'SERVER OFFLINE'}
              variant={serverStatus === 'ONLINE' ? 'protected' : 'critical'}
              dot
            />
          </div>
          <p className="text-sm text-[#514940]">
            Real-time cybersecurity telemetry and CICEV2023 Random Forest ML defense across local EV charging infrastructure.
          </p>
        </div>
        <StatusChip
          label={securityStatus}
          variant={isAttackMode ? 'critical' : 'protected'}
          dot
          pulse={isAttackMode}
        />
      </div>

      {/* 1. Interactive Demo Control Lab */}
      <ScrollReveal>
        <DemoControls />
      </ScrollReveal>

      {/* 2. Hero Monitoring Status Panel */}
      <ScrollReveal delay={60}>
        <MonitoringHero isAttackMode={isAttackMode} requestsPerSec={requestsPerSec} mlConfidence={mlConfidence} />
      </ScrollReveal>

      {/* 3. Live Telemetry Metrics Row */}
      <ScrollReveal delay={100}>
        <TelemetryMetrics isAttackMode={isAttackMode} requestsPerSec={requestsPerSec} />
      </ScrollReveal>

      {/* 4. Real-time Traffic & Anomaly Chart */}
      <ScrollReveal delay={140}>
        <TrafficMonitorChart trafficData={trafficData} isAttackMode={isAttackMode} />
      </ScrollReveal>

      {/* 5. Two-column: Regional Traffic + Security Signals */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7">
          <ScrollReveal delay={180}>
            <RegionalTrafficPanel entries={regionalTraffic} isAttackMode={isAttackMode} />
          </ScrollReveal>
        </div>
        <div className="lg:col-span-5">
          <ScrollReveal delay={220}>
            <SecuritySignalsPanel signals={signals} isAttackMode={isAttackMode} />
          </ScrollReveal>
        </div>
      </div>

      {/* 6. Live Event Stream */}
      <ScrollReveal delay={260}>
        <LiveEventStream events={events} isAttackMode={isAttackMode} />
      </ScrollReveal>
    </AppLayout>
  );
};
