import React, { useMemo } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { useSecurity } from '../context/SecurityContext';
import { StatusChip } from '../components/ui/StatusChip';
import { ScrollReveal } from '../components/ui/ScrollReveal';
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

export const LiveMonitoringPage: React.FC = () => {
  const { isAttackMode, requestsPerSec, mlConfidence, trafficData, securityStatus } = useSecurity();

  const events = useMemo(
    () => (isAttackMode ? [...attackMonitoringEvents, ...baseMonitoringEvents] : baseMonitoringEvents),
    [isAttackMode]
  );

  const signals = useMemo(
    () => (isAttackMode ? attackSecuritySignals(mlConfidence) : baseSecuritySignals),
    [isAttackMode, mlConfidence]
  );

  const regionalTraffic = useMemo(
    () => (isAttackMode ? getAttackRegionalTraffic(requestsPerSec) : baseRegionalTraffic),
    [isAttackMode, requestsPerSec]
  );

  return (
    <AppLayout pageTitle="Live Monitoring">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#AD8B73]/18">
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#3F3832] tracking-tight">Live Monitoring</h2>
            <StatusChip label="LIVE" variant="live" dot pulse />
            <StatusChip label="DEMO DATA" variant="demo" />
          </div>
          <p className="text-sm text-[#514940]">
            Real-time security telemetry across the EV charging authentication network.
          </p>
        </div>
        <StatusChip
          label={securityStatus}
          variant={isAttackMode ? 'critical' : 'protected'}
          dot
          pulse={isAttackMode}
        />
      </div>

      {/* 1. Hero Monitoring Status Panel */}
      <ScrollReveal>
        <MonitoringHero isAttackMode={isAttackMode} requestsPerSec={requestsPerSec} mlConfidence={mlConfidence} />
      </ScrollReveal>

      {/* 2. Live Telemetry Metrics Row */}
      <ScrollReveal delay={80}>
        <TelemetryMetrics isAttackMode={isAttackMode} requestsPerSec={requestsPerSec} />
      </ScrollReveal>

      {/* 3. Traffic Chart */}
      <ScrollReveal delay={140}>
        <TrafficMonitorChart trafficData={trafficData} isAttackMode={isAttackMode} />
      </ScrollReveal>

      {/* 4. Two-column: Regional Traffic + Security Signals */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7">
          <ScrollReveal delay={200}>
            <RegionalTrafficPanel entries={regionalTraffic} isAttackMode={isAttackMode} />
          </ScrollReveal>
        </div>
        <div className="lg:col-span-5">
          <ScrollReveal delay={240}>
            <SecuritySignalsPanel signals={signals} isAttackMode={isAttackMode} />
          </ScrollReveal>
        </div>
      </div>

      {/* 5. Live Event Stream */}
      <ScrollReveal delay={300}>
        <LiveEventStream events={events} isAttackMode={isAttackMode} />
      </ScrollReveal>
    </AppLayout>
  );
};
