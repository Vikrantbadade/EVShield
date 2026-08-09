import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import { ArrowLeft, Radio } from 'lucide-react';

export const AttackAnalysisPage: React.FC = () => {
  const { attackId } = useParams<{ attackId?: string }>();
  const { isAttackMode, requestsPerSec, affectedNodes, mlConfidence } = useSecurity();

  const targetId = attackId || 'INC-2026-8801';

  const [incident, setIncident] = useState<AttackIncident>(mockFallback);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Keep the analysis page synchronized with the active DDoS simulation.
  const activeLiveIncident: AttackIncident | null = useMemo(() => {
    if (!isAttackMode) return null;

    return {
      id: 'EVS-DEMO-001',
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
      startTime: new Date().toLocaleTimeString('en-US', { hour12: false }),
      duration: 'LIVE INCIDENT',
      status: 'DETECTED',
      severity: 'CRITICAL',
      attackType: 'DDOS',
      attackTypeLabel: 'DDoS Authentication Burst',
      classification: 'ATTACK',
      mlConfidence: mlConfidence || 97.4,
      requestsPerSecond: requestsPerSec,
      baselineRequestsPerSecond: 1200,
      peakRequestsPerSecond: requestsPerSec,
      affectedNodes: affectedNodes || 24,
      affectedStations: [
        {
          id: 'CS-0421',
          name: 'Mumbai Central Hub',
          location: 'Zone 1 - Fast Chargers',
          status: 'UNDER ATTACK',
          requestsPerSec: requestsPerSec,
        },
        {
          id: 'CS-0812',
          name: 'Bandra Supercharger Gateway',
          location: 'Zone 2 - High Voltage',
          status: 'DEGRADED',
          requestsPerSec: 4200,
        },
        {
          id: 'CS-0104',
          name: 'BKC Fleet Charging Depot',
          location: 'Zone 3 - Commercial Fleet',
          status: 'PROTECTED',
          requestsPerSec: 1220,
        },
      ],
      sourceCategory: 'Distributed EV Gateway Auth Flood',
      targetInfrastructure: 'Gateway Zone 1 (CS-0421 Mumbai Central)',
      mitigationStatus: 'ACTIVE IN PROGRESS',
      mitigationTime: 'ACTIVE',
      description: 'ACTIVE DDoS Authentication Burst flood in progress across EV charging authentication gateways.',
      detectionSummary: 'The ML detection engine classified the observed authentication traffic as abnormal DDoS-related activity with high confidence.',
      isDemo: true,
    };
  }, [isAttackMode, requestsPerSec, affectedNodes, mlConfidence]);

  const loadIncident = useCallback(async () => {
    setIsRefreshing(true);
    setApiError(null);
    try {
      const data = await attackService.getAttackByIdAsync(targetId, activeLiveIncident);
      if (data) {
        setIncident(data);
      } else {
        setIncident(mockFallback);
      }
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Failed to query attack analysis data.');
      const localFallback = attackService.getAttackById(targetId, activeLiveIncident);
      setIncident(localFallback || mockFallback);
    } finally {
      setIsRefreshing(false);
    }
  }, [targetId, activeLiveIncident]);

  useEffect(() => {
    loadIncident();
  }, [loadIncident]);

  return (
    <AppLayout pageTitle={`Attack Analysis — ${incident.id}`}>
      <div className="space-y-8">
        {/* Back navigation */}
        <ScrollReveal>
          <Link
            to="/logs"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#514940] hover:text-[#3F3832] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Attack Logs
          </Link>
        </ScrollReveal>

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
                <StatusChip label="DEMO BACKEND DATA" variant="demo" />
              </div>

              <p className="text-sm text-[#514940] font-normal">
                {incident.attackTypeLabel} &bull; Detailed forensic analysis & incident breakdown consumed via backend API
              </p>
            </div>

            {isAttackMode && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#E85C68]/15 border border-[#E85C68]/30 text-xs font-mono font-bold text-[#a82d38]">
                <Radio className="w-4 h-4 text-[#E85C68] animate-ping" />
                <span>LIVE ACTIVE INCIDENT</span>
              </div>
            )}
          </div>
        </ScrollReveal>

        {/* Backend API Connection Error Banner */}
        {apiError && (
          <ApiConnectionBanner message={apiError} onRetry={loadIncident} isRetrying={isRefreshing} />
        )}

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
              <AffectedStations stations={incident.affectedStations} />
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
          <IncidentActions incident={incident} />
        </ScrollReveal>
      </div>
    </AppLayout>
  );
};

const mockFallback: AttackIncident = {
  id: 'INC-2026-8801',
  timestamp: '12:04:17',
  startTime: '12:04:17',
  duration: '03m 43s',
  status: 'MITIGATED',
  severity: 'CRITICAL',
  attackType: 'DDOS',
  attackTypeLabel: 'DDoS Authentication Burst',
  classification: 'ATTACK',
  mlConfidence: 97.4,
  requestsPerSecond: 18450,
  baselineRequestsPerSecond: 1200,
  peakRequestsPerSecond: 18450,
  affectedNodes: 24,
  affectedStations: [
    {
      id: 'CS-0421',
      name: 'Mumbai Central Hub',
      location: 'Zone 1 - Fast Chargers',
      status: 'UNDER ATTACK',
      requestsPerSec: 18450,
    },
  ],
  sourceCategory: 'Distributed EV Gateway Auth Flood',
  targetInfrastructure: 'Gateway Zone 1 (CS-0421 Mumbai Central)',
  mitigationStatus: 'Automated Rate Limiting Engaged',
  mitigationTime: '03m 43s',
  description: 'DDoS authentication flood targeting charging station handshake tokens.',
  detectionSummary: 'The ML detection engine classified the observed authentication traffic as abnormal DDoS-related activity.',
  isDemo: true,
};

export default AttackAnalysisPage;