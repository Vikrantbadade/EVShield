import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { attackService, AttackQueryResult } from '../services/attackService';
import { AttackTable } from '../components/attacks/AttackTable';
import { useSecurity } from '../context/SecurityContext';
import { StatusChip } from '../components/ui/StatusChip';
import { ScrollReveal } from '../components/ui/ScrollReveal';
import { ApiConnectionBanner } from '../components/ui/ApiConnectionBanner';
import { Search, Download, FilterX, RefreshCw, ShieldAlert, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

export const AttackLogsPage: React.FC = () => {
  const { activeIncident } = useSecurity();

  // Filters state
  const [search, setSearch] = useState('');
  const [severity, setSeverity] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [attackType, setAttackType] = useState('ALL');
  const [page, setPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [queryResult, setQueryResult] = useState<AttackQueryResult>({
    items: [],
    total: 0,
    page: 1,
    pageSize: 8,
    totalPages: 1,
  });
  const [apiError, setApiError] = useState<string | null>(null);

  // Fetch filtered attacks asynchronously from backend API
  const fetchAttacks = useCallback(async () => {
    setIsRefreshing(true);
    setApiError(null);
    try {
      const res = await attackService.getAttacksAsync(
        { search, severity, status, attackType, page, pageSize: 8 },
        activeIncident
      );
      setQueryResult(res);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Failed to query attack logs from backend.');
      // Local fallback
      const fallbackRes = attackService.getAttacks({ search, severity, status, attackType, page, pageSize: 8 }, activeIncident);
      setQueryResult(fallbackRes);
    } finally {
      setIsRefreshing(false);
    }
  }, [search, severity, status, attackType, page, activeIncident]);

  useEffect(() => {
    fetchAttacks();
  }, [fetchAttacks]);

  // Calculate metrics
  const metrics = useMemo(() => {
    return attackService.getSummaryMetrics(activeIncident, queryResult.items);
  }, [activeIncident, queryResult.items]);

  const handleClearFilters = () => {
    setSearch('');
    setSeverity('ALL');
    setStatus('ALL');
    setAttackType('ALL');
    setPage(1);
  };

  return (
    <AppLayout pageTitle="Attack Logs">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-4 border-b border-[#C4B5FD]/16">
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#F5F3FF] tracking-tight">
              Attack Logs
            </h2>
            <StatusChip label="BACKEND CONNECTED" variant="live" dot pulse />
            <StatusChip label="DEMO DATA" variant="demo" />
          </div>
          <p className="text-sm text-[#C4C2D6] font-normal">
            Investigate detected security incidents and anomaly logs consumed via backend API endpoints.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => attackService.exportToCSV(queryResult.items)}
            className="btn-secondary rounded-xl text-xs py-2.5 px-4"
          >
            <Download className="w-3.5 h-3.5 text-[#34D399]" /> CSV EXPORT
          </button>
          <button
            onClick={() => attackService.exportToJSON(queryResult.items)}
            className="btn-secondary rounded-xl text-xs py-2.5 px-4"
          >
            <Download className="w-3.5 h-3.5 text-[#C4B5FD]" /> JSON EXPORT
          </button>
          <button
            onClick={fetchAttacks}
            disabled={isRefreshing}
            className="p-3 rounded-2xl bg-[#252542] hover:bg-[#303052] border border-[#C4B5FD]/18 text-[#C4C2D6] hover:text-[#F5F3FF] transition-colors shadow-sm"
            title="Refresh attack logs"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#9B7BFF]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Backend API Connection Error Banner */}
      {apiError && (
        <ApiConnectionBanner message={apiError} onRetry={fetchAttacks} isRetrying={isRefreshing} />
      )}

      {/* Summary Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Incidents', value: metrics.totalIncidents, sub: 'Historical & active', icon: ShieldAlert, color: 'text-[#9B7BFF]' },
          { label: 'Critical Severity', value: metrics.criticalCount, sub: 'High risk floods', icon: AlertTriangle, color: 'text-[#FB7185]' },
          { label: 'Investigating', value: metrics.investigatingCount, sub: 'Requires review', icon: Clock, color: 'text-[#FBBF24]' },
          { label: 'Mitigated / Resolved', value: metrics.mitigatedCount, sub: 'Threats contained', icon: CheckCircle2, color: 'text-[#34D399]' },
        ].map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="glass-card rounded-[24px] p-5 space-y-2 shadow-sm hover:-translate-y-0.5 transition-all border border-[#C4B5FD]/16">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-semibold text-[#9896B0] uppercase">{label}</span>
              <div className="p-2 rounded-xl bg-[#252542] border border-[#C4B5FD]/20">
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
            </div>
            <div className="text-3xl font-extrabold font-mono text-[#F5F3FF] tracking-tight">{value}</div>
            <div className="text-[10px] font-mono text-[#9896B0]">{sub}</div>
          </div>
        ))}
      </div>

      {/* Glass Filter Bar */}
      <ScrollReveal>
        <div className="glass-card rounded-[24px] p-4 sm:p-5 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 border border-[#C4B5FD]/16 shadow-sm">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#9896B0] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search incident ID, type, scope..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#252542] border border-[#C4B5FD]/20 text-xs text-[#F5F3FF] placeholder-[#9896B0] focus:outline-none focus:border-[#9B7BFF] shadow-sm"
            />
          </div>

          {/* Select Dropdowns */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Severity Filter */}
            <select
              value={severity}
              onChange={(e) => { setSeverity(e.target.value); setPage(1); }}
              className="px-3.5 py-2.5 rounded-xl bg-[#252542] border border-[#C4B5FD]/20 text-xs font-mono text-[#F5F3FF] focus:outline-none focus:border-[#9B7BFF] shadow-sm cursor-pointer"
            >
              <option value="ALL">Severity: All</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            {/* Status Filter */}
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="px-3.5 py-2.5 rounded-xl bg-[#252542] border border-[#C4B5FD]/20 text-xs font-mono text-[#F5F3FF] focus:outline-none focus:border-[#9B7BFF] shadow-sm cursor-pointer"
            >
              <option value="ALL">Status: All</option>
              <option value="DETECTED">Detected</option>
              <option value="INVESTIGATING">Investigating</option>
              <option value="MITIGATED">Mitigated</option>
              <option value="RESOLVED">Resolved</option>
            </select>

            {/* Attack Type Filter */}
            <select
              value={attackType}
              onChange={(e) => { setAttackType(e.target.value); setPage(1); }}
              className="px-3.5 py-2.5 rounded-xl bg-[#252542] border border-[#C4B5FD]/20 text-xs font-mono text-[#F5F3FF] focus:outline-none focus:border-[#9B7BFF] shadow-sm cursor-pointer"
            >
              <option value="ALL">Type: All</option>
              <option value="DDOS">DDoS Burst</option>
              <option value="AUTHENTICATION_BURST">Auth Burst</option>
              <option value="TRAFFIC_ANOMALY">Traffic Anomaly</option>
            </select>

            {/* Clear Filters */}
            <button
              onClick={handleClearFilters}
              className="p-2.5 rounded-xl bg-[#252542] hover:bg-[#303052] border border-[#C4B5FD]/20 text-[#C4C2D6] hover:text-[#F5F3FF] transition-colors shadow-sm"
              title="Clear all filters"
            >
              <FilterX className="w-4 h-4 text-[#9B7BFF]" />
            </button>
          </div>
        </div>
      </ScrollReveal>

      {/* Incident Logs Table */}
      <AttackTable
        incidents={queryResult.items}
        total={queryResult.total}
        page={queryResult.page}
        totalPages={queryResult.totalPages}
        onPageChange={setPage}
        onClearFilters={handleClearFilters}
      />
    </AppLayout>
  );
};
