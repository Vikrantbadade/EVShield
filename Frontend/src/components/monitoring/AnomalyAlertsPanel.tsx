import React, { useState } from 'react';
import {
  ShieldAlert,
  Info,
  ChevronDown,
  ChevronUp,
  Search,
  CheckCircle2,
  Sliders,
  TrendingUp,
  Cpu,
} from 'lucide-react';
import { ExplainableAnomalyAlert, AnomalySeverity } from '../../types/monitoring';
import { DetectionMethod } from '../../types/ml';
import { formatTime } from '../../utils/dateTime';

interface AnomalyAlertsPanelProps {
  alerts: ExplainableAnomalyAlert[];
  sensitivity?: string;
  onUpdateSensitivity?: (level: 'LOW' | 'MEDIUM' | 'HIGH') => void;
  activeDetector?: DetectionMethod;
}

export const AnomalyAlertsPanel: React.FC<AnomalyAlertsPanelProps> = ({
  alerts,
  sensitivity = 'MEDIUM',
  onUpdateSensitivity,
  activeDetector,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(alerts.length > 0 ? alerts[0].alertId : null);
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');

  const filteredAlerts = alerts.filter((alert) => {
    if (filterSeverity === 'ALL') return true;
    return alert.severity === filterSeverity;
  });

  const getSeverityBadge = (severity: AnomalySeverity) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-[#FB7185]/15 text-[#FB7185] border-[#FB7185]/40';
      case 'HIGH':
        return 'bg-[#F97316]/15 text-[#FB923C] border-[#F97316]/40';
      case 'MEDIUM':
        return 'bg-[#FBBF24]/15 text-[#FDE047] border-[#FBBF24]/40';
      case 'LOW':
      default:
        return 'bg-[#60A5FA]/15 text-[#93C5FD] border-[#60A5FA]/40';
    }
  };

  const getDetectorBadge = (detector?: string) => {
    const det = detector || activeDetector || 'THRESHOLD';
    switch (det) {
      case 'RANDOM_FOREST':
        return { label: 'RANDOM FOREST', cls: 'bg-[#34D399]/15 text-[#6EE7B7] border-[#34D399]/40' };
      case 'ISOLATION_FOREST':
        return { label: 'ISOLATION FOREST', cls: 'bg-[#F472B6]/15 text-[#F9A8D4] border-[#F472B6]/40' };
      case 'ENSEMBLE':
        return { label: 'ENSEMBLE', cls: 'bg-[#A855F7]/15 text-[#D8B4FE] border-[#A855F7]/40' };
      case 'THRESHOLD':
      default:
        return { label: 'THRESHOLD DETECTOR', cls: 'bg-[#818CF8]/15 text-[#A5B4FC] border-[#818CF8]/40' };
    }
  };

  const getCategoryLabel = (category: string) => {
    return category.replace(/_/g, ' ');
  };

  return (
    <div className="bg-[#17172A]/90 backdrop-blur-md rounded-2xl p-6 space-y-5 border border-[#C4B5FD]/16 shadow-xl">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#C4B5FD]/12">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#FB7185]/15 border border-[#FB7185]/30 text-[#FB7185]">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-[#F5F3FF]">Explainable Anomaly Alerts</h3>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#FB7185]/15 text-[#FB7185] border border-[#FB7185]/30">
                {alerts.length} Detected
              </span>
            </div>
            <p className="text-xs text-[#C4C2D6]">
              Real-time multi-detector anomaly alerts with root-cause attribution and SOC investigation playbook
            </p>
          </div>
        </div>

        {/* Severity Filter & Sensitivity Selector */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 p-1 bg-[#1D1D35] rounded-xl border border-[#C4B5FD]/16 text-xs font-mono">
            <span className="px-1.5 text-[10px] text-[#C4C2D6] flex items-center gap-1 font-sans">
              <Sliders className="w-3 h-3 text-[#9B7BFF]" /> Sensitivity:
            </span>
            {(['LOW', 'MEDIUM', 'HIGH'] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => onUpdateSensitivity && onUpdateSensitivity(lvl)}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                  sensitivity === lvl
                    ? 'bg-[#8055F6] text-[#F5F3FF] shadow-sm'
                    : 'text-[#C4C2D6] hover:text-[#F5F3FF] hover:bg-[#252542]'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl text-xs font-mono bg-[#1D1D35] border border-[#C4B5FD]/16 text-[#F5F3FF] focus:outline-none focus:ring-1 focus:ring-[#9B7BFF]"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical Only</option>
            <option value="HIGH">High Only</option>
            <option value="MEDIUM">Medium Only</option>
            <option value="LOW">Low Only</option>
          </select>
        </div>
      </div>

      {/* Empty State */}
      {filteredAlerts.length === 0 && (
        <div className="py-10 text-center space-y-2">
          <div className="inline-flex p-3 rounded-full bg-[#34D399]/15 text-[#34D399]">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <p className="text-sm font-semibold text-[#F5F3FF]">No Active Anomalies in Rolling Window</p>
          <p className="text-xs text-[#C4C2D6] max-w-md mx-auto">
            Live telemetry is strictly conforming to the baseline model across all active detectors. Trigger a simulation scenario to inspect explainable alerts.
          </p>
        </div>
      )}

      {/* Alert Cards */}
      <div className="space-y-3">
        {filteredAlerts.map((alert) => {
          const isExpanded = expandedId === alert.alertId;
          const detectorBadge = getDetectorBadge(alert.detector || alert.detectionMethod);

          return (
            <div
              key={alert.alertId}
              className={`rounded-xl border transition-all overflow-hidden ${
                isExpanded
                  ? 'border-[#FB7185]/50 bg-[#1D1D35] shadow-lg ring-1 ring-[#FB7185]/20'
                  : 'border-[#C4B5FD]/16 bg-[#1D1D35]/80 hover:border-[#9B7BFF]/40 hover:bg-[#1D1D35]'
              }`}
            >
              {/* Alert Header Summary */}
              <div
                onClick={() => setExpandedId(isExpanded ? null : alert.alertId)}
                className="p-4 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-extrabold uppercase border ${getSeverityBadge(alert.severity)}`}>
                    {alert.severity}
                  </span>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-[#F5F3FF]">
                        {getCategoryLabel(alert.category)}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border flex items-center gap-1 ${detectorBadge.cls}`}>
                        <Cpu className="w-3 h-3" />
                        {detectorBadge.label}
                      </span>
                      <span className="text-[10px] font-mono text-[#9896B0]">
                        [{alert.alertId}]
                      </span>
                      {alert.isSimulated && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#252542] text-[#C4C2D6] border border-[#C4B5FD]/16">
                          SIMULATED
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#C4C2D6] line-clamp-1 mt-0.5">{alert.explanation}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <span className="text-xs font-mono text-[#9896B0]">
                    {formatTime(alert.timestamp)}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-[#9B7BFF]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#C4C2D6]" />
                  )}
                </div>
              </div>

              {/* Expanded Explainability Details */}
              {isExpanded && (
                <div className="px-5 pb-5 pt-3 space-y-4 border-t border-[#C4B5FD]/12 bg-[#17172A]/70">
                  {/* Plain English Explanation */}
                  <div className="p-3.5 rounded-xl bg-[#252542]/80 border border-[#C4B5FD]/16 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#FB7185]">
                      <Info className="w-3.5 h-3.5" />
                      <span>Root Cause Explanation</span>
                    </div>
                    <p className="text-xs text-[#F5F3FF] leading-relaxed">
                      {alert.explanation}
                    </p>
                    <div className="pt-1 text-[11px] font-mono text-[#C4C2D6]">
                      <span className="font-semibold text-[#F5F3FF]">Triggered Rule:</span> {alert.detectionRule}
                    </div>
                  </div>

                  {/* Comparative Metrics Table (Observed vs Baseline vs Deviation) */}
                  <div>
                    <h4 className="text-xs font-bold font-mono text-[#C4C2D6] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-[#4DD9F0]" />
                      Observed vs Baseline Feature Deviation
                    </h4>
                    <div className="overflow-x-auto rounded-xl border border-[#C4B5FD]/16">
                      <table className="w-full text-left text-xs font-mono">
                        <thead className="bg-[#252542] text-[#C4C2D6] border-b border-[#C4B5FD]/16">
                          <tr>
                            <th className="py-2.5 px-3">Flow Feature</th>
                            <th className="py-2.5 px-3">Observed Value</th>
                            <th className="py-2.5 px-3">Normal Baseline</th>
                            <th className="py-2.5 px-3">Deviation (%)</th>
                            <th className="py-2.5 px-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#C4B5FD]/10 bg-[#1D1D35]/60">
                          {alert.observedValues.requestRate !== undefined && (
                            <tr>
                              <td className="py-2 px-3 font-semibold text-[#F5F3FF]">Request Rate</td>
                              <td className="py-2 px-3 text-[#FB7185] font-bold">{alert.observedValues.requestRate.toFixed(1)} req/s</td>
                              <td className="py-2 px-3 text-[#C4C2D6]">{alert.baselineValues.requestRateMean?.toFixed(1) ?? '12.0'} req/s</td>
                              <td className="py-2 px-3 font-bold text-[#FB7185]">
                                {alert.deviations.requestRatePercent !== null ? `+${alert.deviations.requestRatePercent.toFixed(0)}%` : 'N/A'}
                              </td>
                              <td className="py-2 px-3">
                                {alert.contributingFeatures.includes('requestRate') ? (
                                  <span className="px-2 py-0.5 rounded text-[10px] bg-[#FB7185]/20 text-[#FB7185] border border-[#FB7185]/30 font-bold">ANOMALOUS</span>
                                ) : (
                                  <span className="text-[10px] text-[#34D399]">Normal</span>
                                )}
                              </td>
                            </tr>
                          )}

                          {alert.observedValues.packetRate !== undefined && (
                            <tr>
                              <td className="py-2 px-3 font-semibold text-[#F5F3FF]">Packet Rate</td>
                              <td className="py-2 px-3 text-[#FB7185] font-bold">{alert.observedValues.packetRate.toFixed(0)} pkt/s</td>
                              <td className="py-2 px-3 text-[#C4C2D6]">{alert.baselineValues.packetRateMean?.toFixed(0) ?? '48'} pkt/s</td>
                              <td className="py-2 px-3 font-bold text-[#FB7185]">
                                {alert.deviations.packetRatePercent !== null ? `+${alert.deviations.packetRatePercent.toFixed(0)}%` : 'N/A'}
                              </td>
                              <td className="py-2 px-3">
                                {alert.contributingFeatures.includes('packetRate') ? (
                                  <span className="px-2 py-0.5 rounded text-[10px] bg-[#FB7185]/20 text-[#FB7185] border border-[#FB7185]/30 font-bold">ANOMALOUS</span>
                                ) : (
                                  <span className="text-[10px] text-[#34D399]">Normal</span>
                                )}
                              </td>
                            </tr>
                          )}

                          {alert.observedValues.bytesPerSecond !== undefined && (
                            <tr>
                              <td className="py-2 px-3 font-semibold text-[#F5F3FF]">Data Transfer Rate</td>
                              <td className="py-2 px-3 text-[#FB7185] font-bold">{(alert.observedValues.bytesPerSecond / 1024).toFixed(1)} KB/s</td>
                              <td className="py-2 px-3 text-[#C4C2D6]">{((alert.baselineValues.bytesPerSecondMean || 6144) / 1024).toFixed(1)} KB/s</td>
                              <td className="py-2 px-3 font-bold text-[#FB7185]">
                                {alert.deviations.bytesPercent !== null ? `+${alert.deviations.bytesPercent.toFixed(0)}%` : 'N/A'}
                              </td>
                              <td className="py-2 px-3">
                                {alert.contributingFeatures.includes('bytesPerSecond') ? (
                                  <span className="px-2 py-0.5 rounded text-[10px] bg-[#FB7185]/20 text-[#FB7185] border border-[#FB7185]/30 font-bold">ANOMALOUS</span>
                                ) : (
                                  <span className="text-[10px] text-[#34D399]">Normal</span>
                                )}
                              </td>
                            </tr>
                          )}

                          {alert.observedValues.newConnectionRate !== undefined && (
                            <tr>
                              <td className="py-2 px-3 font-semibold text-[#F5F3FF]">New Connection Rate</td>
                              <td className="py-2 px-3 text-[#FB7185] font-bold">{alert.observedValues.newConnectionRate.toFixed(1)} conn/s</td>
                              <td className="py-2 px-3 text-[#C4C2D6]">{alert.baselineValues.newConnectionRateMean?.toFixed(1) ?? '10.0'} conn/s</td>
                              <td className="py-2 px-3 font-bold text-[#FB7185]">
                                {alert.deviations.newConnectionsPercent !== null ? `+${alert.deviations.newConnectionsPercent.toFixed(0)}%` : 'N/A'}
                              </td>
                              <td className="py-2 px-3">
                                {alert.contributingFeatures.includes('newConnectionRate') ? (
                                  <span className="px-2 py-0.5 rounded text-[10px] bg-[#FB7185]/20 text-[#FB7185] border border-[#FB7185]/30 font-bold">ANOMALOUS</span>
                                ) : (
                                  <span className="text-[10px] text-[#34D399]">Normal</span>
                                )}
                              </td>
                            </tr>
                          )}

                          {alert.observedValues.connectionDurationMs !== undefined && (
                            <tr>
                              <td className="py-2 px-3 font-semibold text-[#F5F3FF]">Connection Duration / Latency</td>
                              <td className="py-2 px-3 text-[#FB7185] font-bold">{alert.observedValues.connectionDurationMs.toFixed(0)} ms</td>
                              <td className="py-2 px-3 text-[#C4C2D6]">{alert.baselineValues.connectionDurationMsMean?.toFixed(0) ?? '14'} ms</td>
                              <td className="py-2 px-3 font-bold text-[#FB7185]">
                                {alert.deviations.durationPercent !== null ? `+${alert.deviations.durationPercent.toFixed(0)}%` : 'N/A'}
                              </td>
                              <td className="py-2 px-3">
                                {alert.contributingFeatures.includes('connectionDurationMs') ? (
                                  <span className="px-2 py-0.5 rounded text-[10px] bg-[#FB7185]/20 text-[#FB7185] border border-[#FB7185]/30 font-bold">ANOMALOUS</span>
                                ) : (
                                  <span className="text-[10px] text-[#34D399]">Normal</span>
                                )}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Recommended Administrator Investigation Steps */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold font-mono text-[#C4C2D6] uppercase tracking-wider">
                      <Search className="w-3.5 h-3.5 text-[#4DD9F0]" />
                      <span>Recommended SOC Investigation Playbook</span>
                    </div>
                    <ul className="space-y-1.5">
                      {alert.recommendedInvestigation.map((step, idx) => (
                        <li
                          key={idx}
                          className="text-xs text-[#F5F3FF] flex items-start gap-2.5 bg-[#252542]/60 p-2.5 rounded-lg border border-[#C4B5FD]/12"
                        >
                          <span className="font-mono font-bold text-[10px] px-1.5 py-0.5 rounded bg-[#17172A] border border-[#9B7BFF]/30 text-[#9B7BFF]">
                            {idx + 1}
                          </span>
                          <span className="leading-relaxed">{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
