import React, { useState } from 'react';
import {
  SecurityIncident,
  IncidentStatus,
  IncidentSeverity,
  ThreatIntelResult,
} from '../../types/incident';
import { incidentService } from '../../services/incidentService';
import {
  ShieldAlert,
  User,
  Download,
  AlertTriangle,
  Server,
  Cpu,
  FileText,
  Activity,
  ArrowLeft,
  Send,
} from 'lucide-react';

interface InvestigationWorkspaceProps {
  incident: SecurityIncident;
  onUpdateIncident: (updated: SecurityIncident) => void;
  onClose: () => void;
}

export const InvestigationWorkspace: React.FC<InvestigationWorkspaceProps> = ({
  incident,
  onUpdateIncident,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'evidence' | 'timeline' | 'response'>('overview');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [actionUpdatingId, setActionUpdatingId] = useState<string | null>(null);

  // Manual Threat Intel indicator lookup state
  const [customIndicator, setCustomIndicator] = useState('');
  const [isLookingUpTI, setIsLookingUpTI] = useState(false);
  const [lookupResult, setLookupResult] = useState<ThreatIntelResult | null>(null);

  const handleStatusChange = async (newStatus: IncidentStatus) => {
    try {
      setIsUpdatingStatus(true);
      const updated = await incidentService.updateIncidentStatus(incident.id, newStatus);
      onUpdateIncident(updated);
    } catch (err) {
      console.error('Failed to update incident status:', err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAssignAnalyst = async (email: string, name: string, role: string) => {
    try {
      setIsAssigning(true);
      const updated = await incidentService.assignAnalyst(incident.id, email, name, role);
      onUpdateIncident(updated);
    } catch (err) {
      console.error('Failed to assign analyst:', err);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleActionStatusChange = async (actionId: string, status: 'PENDING' | 'COMPLETED' | 'DISMISSED') => {
    try {
      setActionUpdatingId(actionId);
      const updated = await incidentService.updateResponseAction(incident.id, actionId, status);
      onUpdateIncident(updated);
    } catch (err) {
      console.error('Failed to update response action:', err);
    } finally {
      setActionUpdatingId(null);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    try {
      setIsAddingNote(true);
      const updated = await incidentService.addInvestigationNote(incident.id, newNote.trim());
      onUpdateIncident(updated);
      setNewNote('');
    } catch (err) {
      console.error('Failed to add investigation note:', err);
    } finally {
      setIsAddingNote(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setIsExportingPdf(true);
      await incidentService.downloadPdfReport(incident.id);
    } catch (err) {
      console.error('Failed to export PDF report:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleDownloadCsv = async () => {
    try {
      setIsExportingCsv(true);
      await incidentService.downloadCsvReport(incident.id);
    } catch (err) {
      console.error('Failed to export CSV report:', err);
    } finally {
      setIsExportingCsv(false);
    }
  };

  const handleLookupIndicator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customIndicator.trim()) return;

    try {
      setIsLookingUpTI(true);
      const res = await incidentService.lookupThreatIntel(customIndicator.trim());
      setLookupResult(res);
    } catch (err) {
      console.error('Threat Intel lookup failed:', err);
    } finally {
      setIsLookingUpTI(false);
    }
  };

  const getSeverityBadge = (severity: IncidentSeverity) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-[#FB7185]/20 text-[#FB7185] border-[#FB7185]/40';
      case 'HIGH':
        return 'bg-[#F97316]/20 text-[#F97316] border-[#F97316]/40';
      case 'MEDIUM':
        return 'bg-[#FBBF24]/20 text-[#FBBF24] border-[#FBBF24]/40';
      case 'LOW':
      default:
        return 'bg-[#34D399]/20 text-[#34D399] border-[#34D399]/40';
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 80) return 'text-[#FB7185] bg-[#FB7185]/10 border-[#FB7185]/30';
    if (score >= 60) return 'text-[#F97316] bg-[#F97316]/10 border-[#F97316]/30';
    if (score >= 40) return 'text-[#FBBF24] bg-[#FBBF24]/10 border-[#FBBF24]/30';
    return 'text-[#34D399] bg-[#34D399]/10 border-[#34D399]/30';
  };

  return (
    <div className="bg-[#17172A]/80 border border-[#C4B5FD]/20 rounded-2xl overflow-hidden backdrop-blur-xl shadow-2xl">
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* Workspace Header                                                   */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="p-4 sm:p-5 border-b border-[#C4B5FD]/16 bg-[#131326]/70">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-[#9896B0] hover:text-[#F5F3FF] hover:bg-[#252542] transition-colors"
                title="Return to incidents list"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <span className="font-mono text-xs font-bold text-[#8055F6] px-2 py-0.5 rounded bg-[#8055F6]/10 border border-[#8055F6]/30">
                {incident.id}
              </span>
              <span className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold border ${getSeverityBadge(incident.severity)}`}>
                {incident.severity} SEVERITY
              </span>
              <span className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold border ${getRiskScoreColor(incident.riskScore)}`}>
                RISK SCORE {incident.riskScore}/100 ({incident.riskLevel})
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-[#F5F3FF] tracking-tight">{incident.title}</h2>
            <div className="flex items-center gap-3 text-xs font-mono text-[#9896B0]">
              <span>Station: <strong className="text-[#4DD9F0]">{incident.primaryStationId}</strong></span>
              <span>•</span>
              <span>Detected: {new Date(incident.firstDetectedAt).toLocaleTimeString()} ({new Date(incident.firstDetectedAt).toLocaleDateString()})</span>
            </div>
          </div>

          {/* Lifecycle & Actions Toolbar */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Status Select */}
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <span className="text-[#9896B0]">Status:</span>
              <select
                value={incident.status}
                disabled={isUpdatingStatus}
                onChange={(e) => handleStatusChange(e.target.value as IncidentStatus)}
                className="bg-[#1D1D35] border border-[#C4B5FD]/25 text-[#F5F3FF] rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:border-[#8055F6]/60 cursor-pointer disabled:opacity-50"
              >
                <option value="OPEN">OPEN</option>
                <option value="INVESTIGATING">INVESTIGATING</option>
                <option value="CONTAINED">CONTAINED</option>
                <option value="RESOLVED">RESOLVED</option>
                <option value="CLOSED">CLOSED</option>
              </select>
            </div>

            {/* Assignee Select */}
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <span className="text-[#9896B0]">Assignee:</span>
              <select
                value={incident.assignedTo?.email || 'none'}
                disabled={isAssigning}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'analyst@evshield.internal') {
                    handleAssignAnalyst('analyst@evshield.internal', 'Lead Security Analyst', 'security_analyst');
                  } else if (val === 'soc@evshield.internal') {
                    handleAssignAnalyst('soc@evshield.internal', 'SOC Operator', 'soc_operator');
                  } else if (val === 'commander@evshield.internal') {
                    handleAssignAnalyst('commander@evshield.internal', 'Incident Commander', 'admin');
                  }
                }}
                className="bg-[#1D1D35] border border-[#C4B5FD]/25 text-[#F5F3FF] rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:border-[#8055F6]/60 cursor-pointer disabled:opacity-50 max-w-[130px] truncate"
              >
                <option value="none">{incident.assignedTo ? incident.assignedTo.name : 'Unassigned'}</option>
                <option value="analyst@evshield.internal">Lead Security Analyst</option>
                <option value="soc@evshield.internal">SOC Operator</option>
                <option value="commander@evshield.internal">Incident Commander</option>
              </select>
            </div>

            {/* Export Reports */}
            <button
              onClick={handleDownloadPdf}
              disabled={isExportingPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium text-[#C4B5FD] bg-[#8055F6]/20 hover:bg-[#8055F6]/30 border border-[#8055F6]/40 transition-colors disabled:opacity-50"
              title="Download formal investigation report as PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExportingPdf ? 'Exporting...' : 'PDF Report'}</span>
            </button>

            <button
              onClick={handleDownloadCsv}
              disabled={isExportingCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium text-[#9896B0] bg-[#1D1D35] hover:bg-[#252542] border border-[#C4B5FD]/20 transition-colors disabled:opacity-50"
              title="Download incident record and evidence as CSV"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{isExportingCsv ? 'Exporting...' : 'CSV'}</span>
            </button>
          </div>
        </div>

        {/* Workspace Navigation Tabs */}
        <div className="flex items-center gap-1 mt-4 border-t border-[#C4B5FD]/10 pt-3">
          {[
            { id: 'overview', label: 'Overview & Risk', count: null },
            { id: 'evidence', label: 'Evidence & Alerts', count: incident.alerts?.length || 1 },
            { id: 'timeline', label: 'Attack Timeline', count: incident.timeline?.length || 0 },
            { id: 'response', label: 'Response & Resolution', count: incident.responseActions?.length || 0 },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-[#8055F6] text-white shadow-lg shadow-[#8055F6]/25'
                  : 'text-[#9896B0] hover:text-[#F5F3FF] hover:bg-[#1D1D35]'
              }`}
            >
              {tab.label}
              {tab.count !== null && (
                <span className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-[#141425] text-[#9896B0]'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* Workspace Tab Contents                                             */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="p-5">
        {/* ================================================================= */}
        {/* TAB 1: OVERVIEW & RISK ASSESSMENT                                 */}
        {/* ================================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Description & Executive Summary */}
            <div className="p-4 rounded-xl bg-[#141425]/60 border border-[#C4B5FD]/16">
              <h3 className="text-xs font-mono font-semibold text-[#8055F6] mb-1.5 uppercase tracking-wider">
                Incident Executive Summary
              </h3>
              <p className="text-sm font-sans text-[#F5F3FF] leading-relaxed">
                {incident.description}
              </p>
            </div>

            {/* Risk Assessment Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Score Gauge Card */}
              <div className="p-4 rounded-xl bg-[#141425]/60 border border-[#C4B5FD]/16 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-mono text-[#9896B0] mb-2 uppercase">Risk Level Assessment</h4>
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-3xl font-mono font-bold text-[#F5F3FF]">{incident.riskScore}</span>
                    <span className="text-sm font-mono text-[#9896B0]">/ 100</span>
                    <span className={`ml-auto px-2 py-0.5 rounded text-xs font-mono font-bold border ${getSeverityBadge(incident.riskLevel)}`}>
                      {incident.riskLevel}
                    </span>
                  </div>
                  <div className="w-full bg-[#1D1D35] rounded-full h-2 mb-3 overflow-hidden">
                    <div
                      className={`h-full ${
                        incident.riskScore >= 80 ? 'bg-[#FB7185]' : incident.riskScore >= 60 ? 'bg-[#F97316]' : incident.riskScore >= 40 ? 'bg-[#FBBF24]' : 'bg-[#34D399]'
                      }`}
                      style={{ width: `${incident.riskScore}%` }}
                    />
                  </div>
                </div>
                <p className="text-xs font-mono text-[#9896B0]">
                  {incident.riskAssessment?.explanation || 'Calculated using composite multi-dimensional risk matrix.'}
                </p>
              </div>

              {/* Contributing Factors */}
              <div className="md:col-span-2 p-4 rounded-xl bg-[#141425]/60 border border-[#C4B5FD]/16">
                <h4 className="text-xs font-mono text-[#9896B0] mb-3 uppercase">Scoring Factors Breakdown</h4>
                <div className="space-y-2.5">
                  {incident.riskAssessment?.factors?.map((factor, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs font-mono">
                      <div className="min-w-0 pr-2">
                        <span className="text-[#F5F3FF] font-medium">{factor.name}</span>
                        <p className="text-[11px] text-[#9896B0] truncate">{factor.description}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[#9896B0]">Weight: {factor.weight}</span>
                        <span className="px-1.5 py-0.5 rounded bg-[#1D1D35] text-[#C4B5FD] font-bold">
                          +{factor.score} pts
                        </span>
                      </div>
                    </div>
                  )) || (
                    <p className="text-xs font-mono text-[#9896B0]">No dynamic scoring factors recorded.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Infrastructure & Detection Attribution */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[#141425]/60 border border-[#C4B5FD]/16 space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono text-[#4DD9F0]">
                  <Server className="w-4 h-4" />
                  <span className="font-semibold uppercase">Target Infrastructure</span>
                </div>
                <div className="text-xs font-mono space-y-1.5 pt-1">
                  <div className="flex justify-between">
                    <span className="text-[#9896B0]">Primary Station:</span>
                    <span className="text-[#F5F3FF] font-semibold">{incident.primaryStationId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#9896B0]">Affected Stations:</span>
                    <span className="text-[#F5F3FF]">{incident.affectedStations.join(', ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#9896B0]">Source IP(s):</span>
                    <span className="text-[#F5F3FF]">{incident.sourceIps.join(', ') || '192.168.1.145'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#9896B0]">Target Gateway:</span>
                    <span className="text-[#F5F3FF]">{incident.targetInfrastructure}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#141425]/60 border border-[#C4B5FD]/16 space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono text-[#8055F6]">
                  <Cpu className="w-4 h-4" />
                  <span className="font-semibold uppercase">Detector Attribution</span>
                </div>
                <div className="text-xs font-mono space-y-1.5 pt-1">
                  <div className="flex justify-between">
                    <span className="text-[#9896B0]">Attributed Detector:</span>
                    <span className="text-[#F5F3FF] font-semibold">{incident.detectorAttribution}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#9896B0]">ML Confidence:</span>
                    <span className="text-[#34D399] font-semibold">{(incident.confidence * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#9896B0]">Pattern Sequence:</span>
                    <span className="text-[#F5F3FF]">{incident.correlationGroup?.patternType || 'SINGLE_VECTOR_BURST'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#9896B0]">Alert Count:</span>
                    <span className="text-[#F5F3FF] font-semibold">{incident.alerts?.length || 1} Correlated</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recommended Containment Actions */}
            {incident.riskAssessment?.recommendations && incident.riskAssessment.recommendations.length > 0 && (
              <div className="p-4 rounded-xl bg-[#8055F6]/10 border border-[#8055F6]/30 space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono text-[#C4B5FD] font-semibold">
                  <AlertTriangle className="w-4 h-4 text-[#8055F6]" />
                  <span>SOC Recommended Immediate Response</span>
                </div>
                <ul className="text-xs font-mono text-[#C4C2D6] space-y-1.5 pl-5 list-disc">
                  {incident.riskAssessment.recommendations.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 2: EVIDENCE & CORRELATED ALERTS                               */}
        {/* ================================================================= */}
        {activeTab === 'evidence' && (
          <div className="space-y-6">
            {/* Correlation Reasoning Banner */}
            <div className="p-4 rounded-xl bg-[#8055F6]/10 border border-[#8055F6]/25">
              <div className="flex items-center gap-2 text-xs font-mono text-[#C4B5FD] font-semibold mb-1">
                <Activity className="w-4 h-4 text-[#8055F6]" />
                <span>Correlation Logic & Engine Reasoning</span>
              </div>
              <p className="text-xs font-mono text-[#F5F3FF]">
                {incident.correlationGroup?.correlationReason ||
                  'Automated correlation group matched consecutive anomaly spikes within sliding temporal window.'}
              </p>
              <div className="flex items-center gap-4 text-[11px] font-mono text-[#9896B0] mt-2">
                <span>Group ID: {incident.correlationGroup?.groupId}</span>
                <span>•</span>
                <span>Alerts Bound: {incident.correlationGroup?.alertCount || incident.alerts?.length || 1}</span>
                <span>•</span>
                <span>Pattern: {incident.correlationGroup?.patternType}</span>
              </div>
            </div>

            {/* Correlated Alerts Table */}
            <div>
              <h4 className="text-xs font-mono font-semibold text-[#F5F3FF] mb-2 uppercase">
                Correlated Telemetry Alerts ({incident.alerts?.length || 0})
              </h4>
              <div className="overflow-x-auto rounded-xl border border-[#C4B5FD]/16 bg-[#141425]/70">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-[#C4B5FD]/16 bg-[#131326]/60 text-[#9896B0]">
                      <th className="py-2.5 px-3">Alert ID</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Severity</th>
                      <th className="py-2.5 px-3">Station</th>
                      <th className="py-2.5 px-3">Source IP</th>
                      <th className="py-2.5 px-3">Deviation</th>
                      <th className="py-2.5 px-4">Explanation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#C4B5FD]/10">
                    {incident.alerts?.map((alt, idx) => (
                      <tr key={idx} className="hover:bg-[#1D1D35]/50">
                        <td className="py-2.5 px-3 font-semibold text-[#8055F6] whitespace-nowrap">{alt.alertId}</td>
                        <td className="py-2.5 px-3 text-[#F5F3FF] whitespace-nowrap">{alt.category}</td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] border font-bold ${getSeverityBadge(alt.severity)}`}>
                            {alt.severity}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-[#4DD9F0] whitespace-nowrap">{alt.targetStationId || incident.primaryStationId}</td>
                        <td className="py-2.5 px-3 text-[#F5F3FF] whitespace-nowrap">{alt.sourceIp || '192.168.1.145'}</td>
                        <td className="py-2.5 px-3 text-[#FB7185] font-bold whitespace-nowrap">
                          +{alt.deviationPercent ?? 0}%
                        </td>
                        <td className="py-2.5 px-4 text-[#9896B0] min-w-[200px]">{alt.explanation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Threat Intelligence Indicator Section */}
            <div className="p-4 rounded-xl bg-[#141425]/60 border border-[#C4B5FD]/16 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-mono font-semibold text-[#F5F3FF]">
                  <ShieldAlert className="w-4 h-4 text-[#8055F6]" />
                  <span>Threat Intelligence Enrichment</span>
                </div>
                <span className="text-[11px] font-mono text-[#9896B0]">
                  AbuseIPDB • VirusTotal • RFC 1918 Private Filter
                </span>
              </div>

              {/* Automatic Incident Threat Intel Results */}
              {incident.threatIntel && incident.threatIntel.length > 0 ? (
                <div className="space-y-2">
                  {incident.threatIntel.map((ti, i) => (
                    <div key={i} className="p-3 rounded-lg bg-[#1D1D35] border border-[#C4B5FD]/16 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#F5F3FF]">{ti.indicator}</span>
                          <span className="text-[10px] text-[#9896B0] px-1.5 py-0.2 rounded bg-[#141425]">
                            {ti.provider}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              ti.reputation === 'MALICIOUS'
                                ? 'bg-[#FB7185]/20 text-[#FB7185] border-[#FB7185]/40'
                                : ti.reputation === 'SUSPICIOUS'
                                ? 'bg-[#FBBF24]/20 text-[#FBBF24] border-[#FBBF24]/40'
                                : 'bg-[#34D399]/20 text-[#34D399] border-[#34D399]/40'
                            }`}
                          >
                            {ti.reputation} ({ti.confidence}%)
                          </span>
                        </div>
                        <p className="text-[11px] text-[#9896B0] mt-1">{ti.details}</p>
                      </div>
                      <div className="text-[10px] text-[#9896B0] shrink-0 text-right">
                        {ti.country && <div>Country: {ti.country}</div>}
                        {ti.asn && <div>ASN: {ti.asn}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-[#1D1D35]/50 border border-[#C4B5FD]/10 text-xs font-mono text-[#9896B0]">
                  Source IP is within RFC 1918 private subnet (192.168.1.0/24) or external threat intelligence API key has not been configured in Settings.
                </div>
              )}

              {/* Live Indicator Lookup Form */}
              <form onSubmit={handleLookupIndicator} className="pt-2 border-t border-[#C4B5FD]/10 flex gap-2">
                <input
                  type="text"
                  value={customIndicator}
                  onChange={(e) => setCustomIndicator(e.target.value)}
                  placeholder="Query custom IP or domain indicator against Threat Intelligence..."
                  className="flex-1 px-3 py-1.5 rounded-lg bg-[#1D1D35] border border-[#C4B5FD]/20 text-xs font-mono text-[#F5F3FF] placeholder-[#9896B0]/60 focus:outline-none focus:border-[#8055F6]/60"
                />
                <button
                  type="submit"
                  disabled={isLookingUpTI || !customIndicator.trim()}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium text-[#C4B5FD] bg-[#8055F6]/20 hover:bg-[#8055F6]/30 border border-[#8055F6]/40 transition-colors disabled:opacity-50"
                >
                  {isLookingUpTI ? 'Querying...' : 'Query Threat Intel'}
                </button>
              </form>

              {/* Query Result Display */}
              {lookupResult && (
                <div className="p-3 rounded-lg bg-[#1D1D35] border border-[#8055F6]/30 text-xs font-mono space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#F5F3FF]">{lookupResult.indicator}</span>
                    <span className="text-[10px] text-[#9896B0]">Provider: {lookupResult.provider}</span>
                    <span className="ml-auto font-bold text-[#C4B5FD]">{lookupResult.reputation}</span>
                  </div>
                  <p className="text-[11px] text-[#9896B0]">{lookupResult.details}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 3: ATTACK TIMELINE                                            */}
        {/* ================================================================= */}
        {activeTab === 'timeline' && (
          <div className="space-y-4">
            <h4 className="text-xs font-mono font-semibold text-[#F5F3FF] uppercase mb-3">
              Chronological Investigation Timeline ({incident.timeline?.length || 0} Events)
            </h4>

            <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#C4B5FD]/20">
              {incident.timeline?.map((evt, idx) => {
                const dateObj = new Date(evt.timestamp);
                const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

                return (
                  <div key={idx} className="relative group">
                    {/* Timeline Node Dot */}
                    <div
                      className={`absolute -left-6 top-1.5 w-3 h-3 rounded-full border-2 bg-[#17172A] ${
                        evt.eventType === 'ANOMALY_DETECTED'
                          ? 'border-[#FB7185] bg-[#FB7185]/30'
                          : evt.eventType === 'STATUS_CHANGED' || evt.eventType === 'INCIDENT_RESOLVED'
                          ? 'border-[#34D399] bg-[#34D399]/30'
                          : evt.eventType === 'CONTAINMENT_INITIATED' || evt.eventType === 'ACTION_EXECUTED'
                          ? 'border-[#FBBF24] bg-[#FBBF24]/30'
                          : 'border-[#8055F6] bg-[#8055F6]/30'
                      }`}
                    />

                    {/* Timeline Event Card */}
                    <div className="p-3.5 rounded-xl bg-[#141425]/60 border border-[#C4B5FD]/16 hover:border-[#8055F6]/40 transition-colors">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-[#F5F3FF]">{evt.title}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#1D1D35] text-[#8055F6] font-semibold">
                            {evt.eventType}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-[#9896B0]">{timeStr}</span>
                      </div>

                      <p className="text-xs font-sans text-[#C4C2D6] mb-2">{evt.description}</p>

                      <div className="flex items-center gap-2 text-[10px] font-mono text-[#9896B0]">
                        <User className="w-3 h-3 text-[#8055F6]" />
                        <span>
                          {evt.actor.type}: <strong className="text-[#F5F3FF]">{evt.actor.name}</strong>
                          {evt.actor.role ? ` (${evt.actor.role})` : ''}
                        </span>
                        {evt.evidence?.deviationPercent && (
                          <span className="ml-auto text-[#FB7185] font-bold">
                            Deviation: +{evt.evidence.deviationPercent}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 4: RESPONSE PLAYBOOK & RESOLUTION                             */}
        {/* ================================================================= */}
        {activeTab === 'response' && (
          <div className="space-y-6">
            {/* Advisory Playbook Checklist */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-mono font-semibold text-[#F5F3FF] uppercase">
                  Advisory Incident Response Playbook ({incident.responseActions?.length || 0} Actions)
                </h4>
                <span className="text-[11px] font-mono text-[#9896B0]">
                  Advisory recommendations • Analyst action attribution
                </span>
              </div>

              <div className="space-y-3">
                {incident.responseActions?.map((action) => {
                  const isUpdating = actionUpdatingId === action.id;

                  return (
                    <div
                      key={action.id}
                      className={`p-4 rounded-xl border transition-all ${
                        action.status === 'COMPLETED'
                          ? 'bg-[#34D399]/10 border-[#34D399]/30'
                          : action.status === 'DISMISSED'
                          ? 'bg-[#141425]/40 border-[#C4B5FD]/10 opacity-60'
                          : 'bg-[#141425]/70 border-[#C4B5FD]/16'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                              action.priority === 'HIGH'
                                ? 'bg-[#FB7185]/20 text-[#FB7185] border-[#FB7185]/40'
                                : action.priority === 'MEDIUM'
                                ? 'bg-[#FBBF24]/20 text-[#FBBF24] border-[#FBBF24]/40'
                                : 'bg-[#34D399]/20 text-[#34D399] border-[#34D399]/40'
                            }`}
                          >
                            {action.priority} PRIORITY
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-[#1D1D35] text-[#4DD9F0]">
                            {action.actionType}
                          </span>
                          <h5 className="text-xs font-mono font-bold text-[#F5F3FF]">{action.title}</h5>
                        </div>

                        {/* Status Toggle Buttons */}
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleActionStatusChange(action.id, 'COMPLETED')}
                            disabled={isUpdating}
                            className={`px-2 py-1 rounded text-[10px] font-mono font-semibold transition-colors ${
                              action.status === 'COMPLETED'
                                ? 'bg-[#34D399] text-black'
                                : 'bg-[#1D1D35] text-[#34D399] hover:bg-[#34D399]/20'
                            }`}
                          >
                            Mark Complete
                          </button>
                          <button
                            onClick={() => handleActionStatusChange(action.id, 'DISMISSED')}
                            disabled={isUpdating}
                            className={`px-2 py-1 rounded text-[10px] font-mono font-semibold transition-colors ${
                              action.status === 'DISMISSED'
                                ? 'bg-[#9896B0] text-black'
                                : 'bg-[#1D1D35] text-[#9896B0] hover:bg-[#9896B0]/20'
                            }`}
                          >
                            Dismiss
                          </button>
                          {action.status !== 'PENDING' && (
                            <button
                              onClick={() => handleActionStatusChange(action.id, 'PENDING')}
                              disabled={isUpdating}
                              className="px-2 py-1 rounded text-[10px] font-mono text-[#C4B5FD] bg-[#1D1D35] hover:bg-[#8055F6]/20"
                            >
                              Reset
                            </button>
                          )}
                        </div>
                      </div>

                      <p className="text-xs font-sans text-[#C4C2D6] mb-1.5">{action.description}</p>
                      <p className="text-[11px] font-mono text-[#9896B0]">
                        <strong className="text-[#8055F6]">Rationale:</strong> {action.rationale}
                      </p>

                      {action.updatedBy && (
                        <div className="mt-2 pt-2 border-t border-[#C4B5FD]/10 flex items-center justify-between text-[10px] font-mono text-[#9896B0]">
                          <span>Updated by: {action.updatedBy}</span>
                          {action.updatedAt && <span>{new Date(action.updatedAt).toLocaleTimeString()}</span>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Investigation Notes & Analyst Stream */}
            <div className="p-4 rounded-xl bg-[#141425]/60 border border-[#C4B5FD]/16 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-mono font-semibold text-[#F5F3FF] uppercase">
                  Investigation Notes & Analyst Log ({incident.notes?.length || 0})
                </h4>
                <span className="text-[11px] font-mono text-[#9896B0]">Recorded permanently in audit trail</span>
              </div>

              {/* Notes Stream */}
              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                {incident.notes?.length ? (
                  incident.notes.map((note) => (
                    <div key={note.id} className="p-3 rounded-lg bg-[#1D1D35] border border-[#C4B5FD]/16 text-xs font-mono">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5 text-[#C4B5FD]">
                          <User className="w-3.5 h-3.5 text-[#8055F6]" />
                          <span className="font-bold">{note.authorName}</span>
                          <span className="text-[10px] text-[#9896B0]">({note.authorRole})</span>
                        </div>
                        <span className="text-[10px] text-[#9896B0]">
                          {new Date(note.timestamp).toLocaleTimeString()} ({new Date(note.timestamp).toLocaleDateString()})
                        </span>
                      </div>
                      <p className="text-[#F5F3FF] font-sans leading-relaxed whitespace-pre-wrap">{note.content}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs font-mono text-[#9896B0] italic">No investigation notes entered yet.</p>
                )}
              </div>

              {/* Add Note Form */}
              <form onSubmit={handleAddNote} className="space-y-2 pt-2 border-t border-[#C4B5FD]/10">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Record investigation findings, hypotheses, containment steps, or attribution notes..."
                  rows={3}
                  className="w-full p-2.5 rounded-lg bg-[#1D1D35] border border-[#C4B5FD]/20 text-xs font-mono text-[#F5F3FF] placeholder-[#9896B0]/60 focus:outline-none focus:border-[#8055F6]/60"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isAddingNote || !newNote.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-mono font-medium text-white bg-[#8055F6] hover:bg-[#6D3DF3] shadow-md transition-colors disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isAddingNote ? 'Recording...' : 'Add Investigation Note'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
