import React from 'react';
import {
  Activity,
  Zap,
  Clock,
  Radio,
  HardDrive,
  Users,
  Repeat,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { useSecurity } from '../../context/SecurityContext';

export const TelemetryMetrics: React.FC = () => {
  const {
    isAttackMode,
    requestsPerSec,
    packetRate,
    bytesPerSecond,
    dataTransferredMB,
    activeConnections,
    newConnectionRate,
    avgLatencyMs,
    totalRequests,
    errorRatePercent,
    trafficCategory,
    baseline,
    anomalyAlerts,
    isLiveConnected,
    detectionStatus,
  } = useSecurity();

  const isAnomalous = isAttackMode || detectionStatus === 'ANOMALY_ACTIVE' || trafficCategory !== 'NORMAL';

  const metrics = [
    {
      label: 'Request Rate',
      value: requestsPerSec.toLocaleString(),
      unit: 'req/s',
      baselineVal: baseline?.requestRate?.mean ? `${baseline.requestRate.mean.toFixed(1)} req/s` : '12.0 req/s',
      icon: Activity,
      accentColor: 'text-[#4DD9F0]',
      highlight: isAnomalous && requestsPerSec > 30,
    },
    {
      label: 'Packet Rate',
      value: packetRate.toLocaleString(),
      unit: 'pkt/s',
      baselineVal: baseline?.packetRate?.mean ? `${baseline.packetRate.mean.toFixed(0)} pkt/s` : '48 pkt/s',
      icon: Radio,
      accentColor: 'text-[#9B7BFF]',
      highlight: isAnomalous && packetRate > 150,
    },
    {
      label: 'Data Bandwidth',
      value: (bytesPerSecond / 1024).toFixed(1),
      unit: 'KB/s',
      secondary: `${dataTransferredMB.toFixed(2)} MB total`,
      baselineVal: baseline?.bytesPerSecond?.mean ? `${(baseline.bytesPerSecond.mean / 1024).toFixed(1)} KB/s` : '6.0 KB/s',
      icon: HardDrive,
      accentColor: 'text-[#38BDF8]',
      highlight: isAnomalous && bytesPerSecond > 50000,
    },
    {
      label: 'Active Connections',
      value: activeConnections.toString(),
      unit: 'conns',
      baselineVal: baseline?.activeConnections?.mean ? `${baseline.activeConnections.mean.toFixed(1)} nominal` : '4.0 nominal',
      icon: Users,
      accentColor: 'text-[#C4B5FD]',
      highlight: isAnomalous && activeConnections > 30,
    },
    {
      label: 'New Conn Rate',
      value: newConnectionRate.toFixed(1),
      unit: 'conn/s',
      baselineVal: baseline?.newConnectionRate?.mean ? `${baseline.newConnectionRate.mean.toFixed(1)} conn/s` : '10.0 conn/s',
      icon: Repeat,
      accentColor: 'text-[#F97316]',
      highlight: isAnomalous && newConnectionRate > 25,
    },
    {
      label: 'Conn Duration',
      value: avgLatencyMs > 0 ? avgLatencyMs.toFixed(0) : '14',
      unit: 'ms',
      baselineVal: baseline?.connectionDurationMs?.mean ? `${baseline.connectionDurationMs.mean.toFixed(0)} ms` : '14 ms',
      icon: Clock,
      accentColor: 'text-[#F472B6]',
      highlight: avgLatencyMs > 80,
    },
    {
      label: 'Total Processed',
      value: totalRequests.toLocaleString(),
      unit: 'requests',
      secondary: `${errorRatePercent.toFixed(1)}% errors`,
      baselineVal: 'Cumulative',
      icon: Zap,
      accentColor: 'text-[#34D399]',
      highlight: false,
    },
    {
      label: 'Monitoring Health',
      value: isLiveConnected ? 'STREAMING' : 'CONNECTING',
      unit: isLiveConnected ? 'WebSocket' : 'Polling',
      secondary: `${anomalyAlerts.length} active alerts`,
      baselineVal: baseline?.isEstablished ? 'Baseline Active' : 'Calibrating...',
      icon: isLiveConnected ? ShieldCheck : AlertTriangle,
      accentColor: isLiveConnected ? 'text-[#34D399]' : 'text-[#FB7185]',
      highlight: !isLiveConnected,
    },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3.5">
        {metrics.map(({ label, value, unit, secondary, baselineVal, icon: Icon, accentColor, highlight }) => (
          <div
            key={label}
            className={`bg-[#1D1D35]/80 rounded-[22px] p-4 space-y-2 shadow-glass-sm hover:-translate-y-0.5 transition-all border backdrop-blur-md ${
              highlight
                ? 'border-[#FB7185]/60 ring-2 ring-[#FB7185]/20 bg-[#FB7185]/10'
                : 'border-[#C4B5FD]/16 hover:border-[#9B7BFF]/40'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-semibold text-[#C4C2D6] uppercase tracking-wider">{label}</span>
              <div className={`p-1.5 rounded-xl ${highlight ? 'bg-[#FB7185]/20' : 'bg-[#252542]'} border border-[#C4B5FD]/16`}>
                <Icon className={`w-3.5 h-3.5 ${highlight ? 'text-[#FB7185]' : accentColor}`} />
              </div>
            </div>

            <div className="flex items-baseline gap-1.5">
              <span className={`text-2xl font-extrabold font-mono ${highlight ? 'text-[#FB7185]' : 'text-[#F5F3FF]'} tracking-tight`}>
                {value}
              </span>
              <span className="text-xs text-[#C4C2D6] font-mono">{unit}</span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-[#C4B5FD]/12 text-[10px] font-mono text-[#9896B0]">
              <span>Base: {baselineVal}</span>
              {secondary && <span className="font-semibold text-[#C4C2D6]">{secondary}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};