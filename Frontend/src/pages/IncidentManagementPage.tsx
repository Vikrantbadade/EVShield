import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { IncidentStatsHeader } from '../components/incidents/IncidentStatsHeader';
import { IncidentFilterBar } from '../components/incidents/IncidentFilterBar';
import { IncidentTable } from '../components/incidents/IncidentTable';
import { InvestigationWorkspace } from '../components/incidents/InvestigationWorkspace';
import { incidentService } from '../services/incidentService';
import {
  SecurityIncident,
  IncidentFilterParams,
  IncidentAnalyticsSummary,
} from '../types/incident';
import { RefreshCw, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';

export const IncidentManagementPage: React.FC = () => {
  const { incidentId } = useParams<{ incidentId?: string }>();
  const navigate = useNavigate();

  const [incidents, setIncidents] = useState<SecurityIncident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<SecurityIncident | null>(null);
  const [analytics, setAnalytics] = useState<IncidentAnalyticsSummary | null>(null);
  const [filters, setFilters] = useState<IncidentFilterParams>({
    status: 'ALL',
    severity: 'ALL',
    category: 'ALL',
    sortBy: 'newest',
    page: 1,
    pageSize: 15,
  });
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsRefreshing(true);
    setErrorMessage(null);
    try {
      const [incidentRes, analyticsRes] = await Promise.all([
        incidentService.getIncidents(filters),
        incidentService.getIncidentAnalytics(),
      ]);

      setIncidents(incidentRes.items || []);
      setTotalCount(incidentRes.total || 0);
      setTotalPages(incidentRes.totalPages || 1);
      setAnalytics(analyticsRes);

      // If URL param specifies an incident ID, select it
      if (incidentId) {
        const found = incidentRes.items?.find((i) => i.id === incidentId);
        if (found) {
          setSelectedIncident(found);
        } else {
          try {
            const fetched = await incidentService.getIncidentById(incidentId);
            setSelectedIncident(fetched);
          } catch {
            setSelectedIncident(null);
          }
        }
      }
    } catch (err: any) {
      console.error('Failed to load incident management data:', err);
      setErrorMessage(err.message || 'Unable to communicate with EVShield incident service.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [filters, incidentId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSelectIncident = (inc: SecurityIncident) => {
    setSelectedIncident(inc);
    navigate(`/incidents/${inc.id}`);
  };

  const handleCloseWorkspace = () => {
    setSelectedIncident(null);
    navigate('/incidents');
  };

  const handleUpdateIncident = (updated: SecurityIncident) => {
    setSelectedIncident(updated);
    setIncidents((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    // Also refresh analytics in background
    incidentService.getIncidentAnalytics().then(setAnalytics).catch(() => {});
  };

  const handleExportCsv = async () => {
    try {
      setIsExportingCsv(true);
      await incidentService.downloadBulkCsv(
        filters.status !== 'ALL' ? filters.status : undefined,
        filters.severity !== 'ALL' ? filters.severity : undefined
      );
    } catch (err) {
      console.error('Failed to export bulk CSV:', err);
    } finally {
      setIsExportingCsv(false);
    }
  };

  return (
    <AppLayout pageTitle="Incident Management & Response">
      <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Page Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#8055F6]/20 text-[#8055F6] border border-[#8055F6]/40">
                STAGE 3
              </span>
              <span className="text-xs font-mono text-[#9896B0]">Cybersecurity Operations Center (SOC)</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#F5F3FF] tracking-tight mt-1">
              Incident Management & Autonomous Response
            </h1>
            <p className="text-xs font-mono text-[#9896B0] mt-0.5">
              Correlated multi-vector anomaly alerts, risk assessment scoring, advisory response playbooks & audit logging.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-medium text-[#C4B5FD] bg-[#8055F6]/15 hover:bg-[#8055F6]/25 border border-[#8055F6]/30 transition-all duration-200 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Syncing...' : 'Refresh SOC'}</span>
            </button>
          </div>
        </div>

        {/* Error message banner */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-[#FB7185]/10 border border-[#FB7185]/30 text-xs font-mono text-[#FB7185] flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* SOC KPI Metric Cards */}
        <IncidentStatsHeader analytics={analytics} isLoading={isLoading} />

        {/* Selected Incident Investigation Workspace */}
        {selectedIncident ? (
          <div className="space-y-4">
            <InvestigationWorkspace
              incident={selectedIncident}
              onUpdateIncident={handleUpdateIncident}
              onClose={handleCloseWorkspace}
            />
          </div>
        ) : (
          /* Incident Table & Filters List View */
          <div className="space-y-4">
            <IncidentFilterBar
              filters={filters}
              onFilterChange={setFilters}
              onExportCsv={handleExportCsv}
              isExporting={isExportingCsv}
              totalCount={totalCount}
            />

            <IncidentTable
              incidents={incidents}
              selectedIncidentId={null}
              onSelectIncident={handleSelectIncident}
              isLoading={isLoading}
            />

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between text-xs font-mono text-[#9896B0] px-2 pt-2">
                <span>
                  Page {filters.page} of {totalPages} ({totalCount} total)
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setFilters({ ...filters, page: Math.max(1, (filters.page || 1) - 1) })}
                    disabled={filters.page === 1}
                    className="p-1.5 rounded-lg bg-[#17172A] border border-[#C4B5FD]/16 hover:bg-[#252542] text-[#F5F3FF] disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setFilters({ ...filters, page: Math.min(totalPages, (filters.page || 1) + 1) })}
                    disabled={filters.page === totalPages}
                    className="p-1.5 rounded-lg bg-[#17172A] border border-[#C4B5FD]/16 hover:bg-[#252542] text-[#F5F3FF] disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
};
