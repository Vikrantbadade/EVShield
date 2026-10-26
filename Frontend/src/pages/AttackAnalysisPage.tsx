import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { attackService } from '../services/attackService';
import { useSecurity } from '../context/SecurityContext';
import { AttackIncident } from '../types/attack';
import { AttackBadge } from '../components/attacks/AttackBadge';
import { SeverityIndicator } from '../components/attacks/SeverityIndicator';
import { AttackSummary } from '../components/attacks/AttackSummary';
import { AttackTrafficChart } from '../components/attacks/AttackTrafficChart';
import { MLClassification } from '../components/attacks/MLClassification';
import { AttackFlow } from '../components/attacks/AttackFlow';
import { AffectedStations } from '../components/attacks/AffectedStations';
import { AttackTimeline } from '../components/attacks/AttackTimeline';
import { IncidentActions } from '../components/attacks/IncidentActions';
import { ScrollReveal } from '../components/ui/ScrollReveal';
import { StatusChip } from '../components/ui/StatusChip';
import { ApiConnectionBanner } from '../components/ui/ApiConnectionBanner';
import { ArrowLeft, Radio, ShieldAlert, RefreshCw } from 'lucide-react';

export const AttackAnalysisPage: React.FC = () => {
  const { attackId } = useParams<{ attackId?: string }>();
  const { activeIncident, lastIncident, isAttackMode } = useSecurity();

  const [incident, setIncident] = useState<AttackIncident | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

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
      <div className="space-y-8">
        {/* Back navigation */}
        <ScrollReveal>
          <div className="flex items-center justify-between">
            <Link
              to="/logs"
              className="inline-flex items-center gap-2 text-sm font-medium text-[#514940] hover:text-[#3F3832] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Attack Logs
            </Link>

            {incident && (
              <button
                onClick={loadIncident}
                disabled={isRefreshing}
                className="btn-secondary rounded-xl text-xs py-2 px-3.5 flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh Forensic Data'}
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
          <div className="glass-cream rounded-[32px] p-12 text-center space-y-4 shadow-glass border border-white/90">
            <RefreshCw className="w-8 h-8 text-[#19BFA3] animate-spin mx-auto" />
            <p className="text-sm font-mono text-[#514940]">Loading attack forensic records from backend telemetry pipeline...</p>
          </div>
        )}

        {/* Empty state when insufficient telemetry data exists */}
        {!isLoading && !incident && (
          <div className="glass-cream rounded-[32px] p-12 text-center space-y-5 shadow-glass border border-white/90 max-w-2xl mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-white/80 border border-white/90 flex items-center justify-center mx-auto shadow-glass-sm text-[#AD8B73]">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-[#3F3832]">Insufficient Telemetry to Generate Attack Analysis</h3>
              <p className="text-sm text-[#514940] mt-2 max-w-lg mx-auto leading-relaxed">
                No active security incident is currently detected and no forensic attack logs were found in the database.
                Initiate traffic or trigger an attack simulation to inspect live anomaly detection.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
              <Link to="/" className="btn-primary rounded-xl text-xs py-3 px-6">
                Go to Dashboard
              </Link>
              <Link to="/logs" className="btn-secondary rounded-xl text-xs py-3 px-6">
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-3 mb-1">
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-[#3F3832] tracking-tight">
                      {incident.id}
                    </h2>

                    <AttackBadge type="severity" value={incident.severity} />
                    <AttackBadge type="status" value={incident.status} />
                    <StatusChip
                      label={incident.isDemo ? "HISTORICAL DEMO RECORD" : "LIVE INCIDENT RECORD"}
                      variant={incident.isDemo ? "demo" : "live"}
                    />
                  </div>

                  <p className="text-sm text-[#514940] font-normal">
                    {incident.attackTypeLabel} &bull; Forensic analysis ingested via EVShield ML Pipeline
                  </p>
                </div>

                {isAttackMode && incident.status === 'DETECTED' && (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#E85C68]/15 border border-[#E85C68]/30 text-xs font-mono font-bold text-[#a82d38]">
                    <Radio className="w-4 h-4 text-[#E85C68] animate-ping" />
                    <span>LIVE ACTIVE INCIDENT</span>
                  </div>
                )}
              </div>
            </ScrollReveal>

            {/* 1. Incident Summary & Security Verdict */}
            <ScrollReveal delay={100}>
              <AttackSummary incident={incident} />
            </ScrollReveal>

            {/* 2. Visual Severity Meter */}
            <ScrollReveal delay={150}>
              <div className="glass-cream rounded-[28px] p-6 shadow-glass border border-white/90">
                <SeverityIndicator severity={incident.severity} />
              </div>
            </ScrollReveal>

            {/* 3. Forensic Traffic Chart */}
            <ScrollReveal delay={200}>
              <AttackTrafficChart incident={incident} />
            </ScrollReveal>

            {/* 4. ML Detection Signals & Affected Infrastructure */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-6">
                <ScrollReveal delay={250}>
                  <MLClassification incident={incident} />
                </ScrollReveal>
              </div>

              <div className="lg:col-span-6">
                <ScrollReveal delay={300}>
                  <AffectedStations stations={incident.affectedStations || []} />
                </ScrollReveal>
              </div>
            </div>

            {/* 5. Incident Progression Flow */}
            <ScrollReveal delay={350}>
              <AttackFlow incident={incident} />
            </ScrollReveal>

            {/* 6. Forensic Incident Timeline */}
            <ScrollReveal delay={400}>
              <AttackTimeline incident={incident} />
            </ScrollReveal>

            {/* 7. Incident Action Controls */}
            <ScrollReveal delay={450}>
              <IncidentActions incident={incident} onMitigated={loadIncident} />
            </ScrollReveal>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default AttackAnalysisPage;