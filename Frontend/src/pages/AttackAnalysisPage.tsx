import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { attackService, AttackIncident } from '../services/attackService';
import { useSecurity } from '../context/SecurityContext';
import { StatusChip } from '../components/ui/StatusChip';
import { ScrollReveal } from '../components/ui/ScrollReveal';
import { ApiConnectionBanner } from '../components/ui/ApiConnectionBanner';
import { AttackBadge } from '../components/attacks/AttackBadge';
import { AttackSummary } from '../components/attacks/AttackSummary';
import { SeverityIndicator } from '../components/attacks/SeverityIndicator';
import { AttackTrafficChart } from '../components/attacks/AttackTrafficChart';
import { MLClassification } from '../components/attacks/MLClassification';
import { AffectedStations } from '../components/attacks/AffectedStations';
import { AttackFlow } from '../components/attacks/AttackFlow';
import { AttackTimeline } from '../components/attacks/AttackTimeline';
import { IncidentActions } from '../components/attacks/IncidentActions';
import { ArrowLeft, RefreshCw, Radio, ShieldAlert, Activity, ShieldCheck } from 'lucide-react';

export const AttackAnalysisPage: React.FC = () => {
  const { attackId } = useParams<{ attackId: string }>();
  const { activeIncident, lastIncident, isAttackMode } = useSecurity();

  const [activeTab, setActiveTab] = useState<'insights' | 'mitigation'>('insights');
  const [incident, setIncident] = useState<AttackIncident | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const loadIncident = useCallback(async () => {
    setIsRefreshing(true);
    setApiError(null);

    try {
      if (attackId) {
        // Specific incident requested by route
        const data = await attackService.getAttackByIdAsync(attackId, activeIncident);
        if (data) {
          setIncident(data);
        } else {
          setIncident(null);
        }
      } else if (activeIncident) {
        // Currently running live attack incident
        setIncident(activeIncident);
      } else {
        // Query backend for current active or most recent incident
        const current = await attackService.getCurrentAttack();
        if (current) {
          setIncident(current);
        } else if (lastIncident) {
          setIncident(lastIncident);
        } else {
          // Query first available historical incident from database
          const queryResult = await attackService.getAttacksAsync({ pageSize: 1 });
          if (queryResult.items && queryResult.items.length > 0) {
            setIncident(queryResult.items[0]);
          } else {
            setIncident(null);
          }
        }
      }
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Failed to query attack forensic analysis.');
      if (activeIncident) {
        setIncident(activeIncident);
      } else if (lastIncident) {
        setIncident(lastIncident);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [attackId, activeIncident, lastIncident]);

  useEffect(() => {
    loadIncident();
  }, [loadIncident]);

  // Keep live incident values synchronized with SecurityContext polling updates
  useEffect(() => {
    if (!attackId && activeIncident) {
      setIncident(activeIncident);
    } else if (attackId && activeIncident && activeIncident.id === attackId) {
      setIncident(activeIncident);
    }
  }, [attackId, activeIncident]);

  return (
    <AppLayout pageTitle={incident ? `Attack Analysis — ${incident.id}` : 'Attack Forensic Analysis'}>
      <div className="space-y-5">
        {/* Back navigation */}
        <ScrollReveal>
          <div className="flex items-center justify-between pb-2">
            <Link
              to="/logs"
              className="inline-flex items-center gap-2 text-xs font-mono font-medium text-[#9896B0] hover:text-[#F5F3FF] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Attack Logs</span>
            </Link>

            {incident && (
              <button
                onClick={loadIncident}
                disabled={isRefreshing}
                className="p-2 rounded-xl bg-[#252542] hover:bg-[#303052] border border-[#C4B5FD]/18 text-xs font-mono text-[#C4C2D6] hover:text-[#F5F3FF] transition-colors shadow-sm flex items-center gap-2"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#9B7BFF]' : ''}`} />
                <span>{isRefreshing ? 'Refreshing...' : 'Refresh Forensic Data'}</span>
              </button>
            )}
          </div>
        </ScrollReveal>

        {/* API error banner */}
        {apiError && (
          <ApiConnectionBanner message={apiError} onRetry={loadIncident} isRetrying={isRefreshing} />
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="glass-card rounded-[24px] p-12 text-center space-y-4 border border-[#C4B5FD]/16 shadow-sm">
            <RefreshCw className="w-8 h-8 text-[#9B7BFF] animate-spin mx-auto" />
            <p className="text-xs font-mono text-[#9896B0]">Loading attack forensic records from backend telemetry pipeline...</p>
          </div>
        )}

        {/* Empty state when insufficient telemetry data exists */}
        {!isLoading && !incident && (
          <div className="glass-card rounded-[28px] p-12 text-center space-y-5 border border-[#C4B5FD]/16 shadow-sm max-w-2xl mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-[#9B7BFF]/15 border border-[#9B7BFF]/30 flex items-center justify-center mx-auto text-[#9B7BFF]">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#F5F3FF]">Insufficient Telemetry to Generate Attack Analysis</h3>
              <p className="text-xs text-[#9896B0] mt-2 max-w-lg mx-auto leading-relaxed">
                No active security incident is currently detected and no forensic attack logs were found in the database.
                Initiate traffic or trigger an attack simulation to inspect live anomaly detection.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
              <Link to="/dashboard" className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#8055F6] to-[#9B7BFF] text-white font-bold text-xs shadow-md">
                Go to Dashboard
              </Link>
              <Link to="/logs" className="px-5 py-2.5 rounded-xl bg-[#252542] border border-[#C4B5FD]/20 text-xs font-mono font-semibold text-[#F5F3FF] hover:bg-[#303052]">
                View Attack Logs
              </Link>
            </div>
          </div>
        )}

        {/* Full Forensic Incident Analysis View */}
        {!isLoading && incident && (
          <>
            {/* Incident Header */}
            <ScrollReveal delay={50}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3.5 border-b border-[#C4B5FD]/16">
                <div>
                  <div className="flex flex-wrap items-center gap-3 mb-1">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-[#F5F3FF] tracking-tight">
                      {incident.id}
                    </h2>

                    <AttackBadge type="severity" value={incident.severity} />
                    <AttackBadge type="status" value={incident.status} />
                    <StatusChip
                      label={incident.isDemo ? "HISTORICAL DEMO RECORD" : "LIVE INCIDENT RECORD"}
                      variant={incident.isDemo ? "demo" : "live"}
                    />
                  </div>

                  <p className="text-xs sm:text-sm text-[#C4C2D6] font-normal">
                    {incident.attackTypeLabel} &bull; Forensic analysis ingested via EVShield ML Pipeline
                  </p>
                </div>

                {isAttackMode && incident.status === 'DETECTED' && (
                  <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-[#FB7185]/15 border border-[#FB7185]/35 text-xs font-mono font-bold text-[#FB7185]">
                    <Radio className="w-3.5 h-3.5 text-[#FB7185] animate-ping" />
                    <span>LIVE ACTIVE INCIDENT</span>
                  </div>
                )}
              </div>
            </ScrollReveal>

            {/* ── Subview Tabs ── */}
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#17172B]/90 border border-[#C4B5FD]/16 backdrop-blur-xl w-fit">
              <button
                type="button"
                onClick={() => setActiveTab('insights')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'insights'
                    ? 'bg-[#8055F6] text-white shadow-md shadow-[#8055F6]/30 font-bold'
                    : 'text-[#C4C2D6] hover:text-[#F5F3FF] hover:bg-[#252542]'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Forensic Insights &amp; Traffic</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('mitigation')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'mitigation'
                    ? 'bg-[#8055F6] text-white shadow-md shadow-[#8055F6]/30 font-bold'
                    : 'text-[#C4C2D6] hover:text-[#F5F3FF] hover:bg-[#252542]'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Timeline &amp; Mitigation</span>
              </button>
            </div>

            {/* Tab 1: Forensic Insights & Traffic */}
            {activeTab === 'insights' && (
              <div className="space-y-4 animate-fade-in">
                {/* 1. Incident Summary & Security Verdict */}
                <ScrollReveal delay={50}>
                  <AttackSummary incident={incident} />
                </ScrollReveal>

                {/* 2. Visual Severity Meter */}
                <ScrollReveal delay={100}>
                  <div className="glass-card rounded-[24px] p-5 sm:p-6 border border-[#C4B5FD]/16 shadow-sm">
                    <SeverityIndicator severity={incident.severity} />
                  </div>
                </ScrollReveal>

                {/* 3. Forensic Traffic Chart */}
                <ScrollReveal delay={150}>
                  <AttackTrafficChart incident={incident} />
                </ScrollReveal>

                {/* 4. ML Detection Signals & Affected Infrastructure */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  <div className="lg:col-span-6">
                    <ScrollReveal delay={200}>
                      <MLClassification incident={incident} />
                    </ScrollReveal>
                  </div>

                  <div className="lg:col-span-6">
                    <ScrollReveal delay={250}>
                      <AffectedStations stations={incident.affectedStations || []} />
                    </ScrollReveal>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Timeline & Mitigation */}
            {activeTab === 'mitigation' && (
              <div className="space-y-4 animate-fade-in">
                {/* 7. Incident Action Controls */}
                <ScrollReveal delay={50}>
                  <IncidentActions incident={incident} onMitigated={loadIncident} />
                </ScrollReveal>

                {/* 5. Incident Progression Flow */}
                <ScrollReveal delay={100}>
                  <AttackFlow incident={incident} />
                </ScrollReveal>

                {/* 6. Forensic Incident Timeline */}
                <ScrollReveal delay={150}>
                  <AttackTimeline incident={incident} />
                </ScrollReveal>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default AttackAnalysisPage;