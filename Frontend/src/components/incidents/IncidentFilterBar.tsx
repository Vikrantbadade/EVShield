import React from 'react';
import { Search, Filter, Download, ArrowUpDown, X } from 'lucide-react';
import { IncidentFilterParams, IncidentStatus, IncidentSeverity, IncidentCategory } from '../../types/incident';

interface IncidentFilterBarProps {
  filters: IncidentFilterParams;
  onFilterChange: (filters: IncidentFilterParams) => void;
  onExportCsv: () => void;
  isExporting: boolean;
  totalCount: number;
}

export const IncidentFilterBar: React.FC<IncidentFilterBarProps> = ({
  filters,
  onFilterChange,
  onExportCsv,
  isExporting,
  totalCount,
}) => {
  const statusOptions: Array<{ label: string; value: IncidentStatus | 'ALL' }> = [
    { label: 'All Statuses', value: 'ALL' },
    { label: 'Open', value: 'OPEN' },
    { label: 'Investigating', value: 'INVESTIGATING' },
    { label: 'Contained', value: 'CONTAINED' },
    { label: 'Resolved', value: 'RESOLVED' },
    { label: 'Closed', value: 'CLOSED' },
  ];

  const severityOptions: Array<{ label: string; value: IncidentSeverity | 'ALL' }> = [
    { label: 'All Severities', value: 'ALL' },
    { label: 'Critical', value: 'CRITICAL' },
    { label: 'High', value: 'HIGH' },
    { label: 'Medium', value: 'MEDIUM' },
    { label: 'Low', value: 'LOW' },
  ];

  const categoryOptions: Array<{ label: string; value: IncidentCategory | 'ALL' }> = [
    { label: 'All Categories', value: 'ALL' },
    { label: 'Traffic Burst', value: 'TRAFFIC_BURST' },
    { label: 'High Connection Rate', value: 'HIGH_CONNECTION_RATE' },
    { label: 'Repeated Requests', value: 'REPEATED_REQUESTS' },
    { label: 'Excessive Data', value: 'EXCESSIVE_DATA' },
    { label: 'Unusual Latency', value: 'UNUSUAL_LATENCY' },
    { label: 'Combined Anomaly', value: 'COMBINED_ANOMALY' },
    { label: 'DDoS Attack', value: 'DDOS' },
  ];

  const stations = ['ALL', 'CS-0421', 'CS-0422', 'CS-0423', 'CS-0424'];

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, search: e.target.value, page: 1 });
  };

  const handleClearFilters = () => {
    onFilterChange({
      search: '',
      status: 'ALL',
      severity: 'ALL',
      category: 'ALL',
      stationId: '',
      sortBy: 'newest',
      page: 1,
    });
  };

  const hasActiveFilters = Boolean(
    filters.search ||
      (filters.status && filters.status !== 'ALL') ||
      (filters.severity && filters.severity !== 'ALL') ||
      (filters.category && filters.category !== 'ALL') ||
      filters.stationId
  );

  return (
    <div className="bg-[#17172A]/70 border border-[#C4B5FD]/16 rounded-2xl p-4 mb-5 backdrop-blur-md space-y-3">
      {/* Top row: Search input + Bulk CSV export */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#9896B0] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={filters.search || ''}
            onChange={handleSearch}
            placeholder="Search by incident ID, title, affected station, source IP, or details..."
            className="w-full pl-10 pr-4 py-2 bg-[#141425]/70 border border-[#C4B5FD]/16 rounded-xl text-xs font-mono text-[#F5F3FF] placeholder-[#9896B0]/60 focus:outline-none focus:border-[#8055F6]/60 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono text-[#FB7185] bg-[#FB7185]/10 border border-[#FB7185]/20 hover:bg-[#FB7185]/20 transition-colors"
              title="Clear all filters"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}

          <button
            onClick={onExportCsv}
            disabled={isExporting}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-medium text-[#C4B5FD] bg-[#8055F6]/15 hover:bg-[#8055F6]/25 border border-[#8055F6]/30 transition-all duration-200 disabled:opacity-50"
            title="Export filtered incidents as CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? 'Exporting...' : 'Export CSV'}</span>
          </button>
        </div>
      </div>

      {/* Bottom row: Filter selectors */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#C4B5FD]/10 text-xs font-mono">
        <div className="flex items-center gap-1.5 text-[#9896B0] mr-1">
          <Filter className="w-3.5 h-3.5" />
          <span>Filters:</span>
        </div>

        {/* Status Filter */}
        <select
          value={filters.status || 'ALL'}
          onChange={(e) =>
            onFilterChange({ ...filters, status: e.target.value as IncidentStatus | 'ALL', page: 1 })
          }
          className="bg-[#141425] border border-[#C4B5FD]/16 text-[#F5F3FF] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#8055F6]/60"
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Severity Filter */}
        <select
          value={filters.severity || 'ALL'}
          onChange={(e) =>
            onFilterChange({ ...filters, severity: e.target.value as IncidentSeverity | 'ALL', page: 1 })
          }
          className="bg-[#141425] border border-[#C4B5FD]/16 text-[#F5F3FF] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#8055F6]/60"
        >
          {severityOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Category Filter */}
        <select
          value={filters.category || 'ALL'}
          onChange={(e) =>
            onFilterChange({ ...filters, category: e.target.value as IncidentCategory | 'ALL', page: 1 })
          }
          className="bg-[#141425] border border-[#C4B5FD]/16 text-[#F5F3FF] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#8055F6]/60 max-w-[160px] truncate"
        >
          {categoryOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Station Filter */}
        <select
          value={filters.stationId || 'ALL'}
          onChange={(e) =>
            onFilterChange({
              ...filters,
              stationId: e.target.value === 'ALL' ? undefined : e.target.value,
              page: 1,
            })
          }
          className="bg-[#141425] border border-[#C4B5FD]/16 text-[#F5F3FF] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#8055F6]/60"
        >
          {stations.map((st) => (
            <option key={st} value={st}>
              {st === 'ALL' ? 'All Stations' : st}
            </option>
          ))}
        </select>

        {/* Sort By */}
        <div className="ml-auto flex items-center gap-1.5 text-[#9896B0]">
          <ArrowUpDown className="w-3.5 h-3.5" />
          <select
            value={filters.sortBy || 'newest'}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                sortBy: e.target.value as 'newest' | 'oldest' | 'severity' | 'riskScore',
                page: 1,
              })
            }
            className="bg-[#141425] border border-[#C4B5FD]/16 text-[#F5F3FF] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#8055F6]/60"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="riskScore">Highest Risk</option>
            <option value="severity">Highest Severity</option>
          </select>
          <span className="text-[11px] text-[#9896B0] hidden md:inline ml-1">
            ({totalCount} {totalCount === 1 ? 'incident' : 'incidents'})
          </span>
        </div>
      </div>
    </div>
  );
};

