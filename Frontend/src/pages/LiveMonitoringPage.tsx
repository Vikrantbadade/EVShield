import React, { useMemo } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { useSecurity } from '../context/SecurityContext';
import { StatusChip } from '../components/ui/StatusChip';
import { ScrollReveal } from '../components/ui/ScrollReveal';
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
      {/* 1. Page Header & Live Status Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3.5 border-b border-[#C4B5FD]/16">
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#F5F3FF] tracking-tight">Live Monitoring</h2>
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
          <p className="text-xs sm:text-sm text-[#C4C2D6]">
            Real-time cybersecurity telemetry, regional traffic distributions, and live security signals across local EV charging nodes.
          </p>
        </div>
        <StatusChip
          label={securityStatus}
          variant={isAttackMode ? 'critical' : 'protected'}
          dot
          pulse={isAttackMode}
        />
      </div>

      {/* 2. Live Telemetry Metrics Row */}
      <ScrollReveal delay={30}>
        <TelemetryMetrics isAttackMode={isAttackMode} requestsPerSec={requestsPerSec} />
      </ScrollReveal>

      {/* 3. Primary Section: Regional Network & Signals (Dedicated Monitoring View) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7">
          <ScrollReveal delay={60}>
            <RegionalTrafficPanel entries={regionalTraffic} isAttackMode={isAttackMode} />
          </ScrollReveal>
        </div>
        <div className="lg:col-span-5">
          <ScrollReveal delay={90}>
            <SecuritySignalsPanel signals={signals} isAttackMode={isAttackMode} />
          </ScrollReveal>
        </div>
      </div>

      {/* 4. Real-time Traffic Telemetry Chart */}
      <ScrollReveal delay={120}>
        <TrafficMonitorChart trafficData={trafficData} isAttackMode={isAttackMode} />
      </ScrollReveal>

      {/* 5. Live Event Stream */}
      <ScrollReveal delay={150}>
        <LiveEventStream events={events} isAttackMode={isAttackMode} />
      </ScrollReveal>
    </AppLayout>
  );
};
