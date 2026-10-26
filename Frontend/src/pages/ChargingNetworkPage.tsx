import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { useSecurity } from '../context/SecurityContext';
import { getStations, getRegions, getNetworkSummary } from '../data/mockStations';
import { stationService } from '../services/stationService';
import { DemoStation, ChargingRegion } from '../types/station';
import { StatusChip } from '../components/ui/StatusChip';
import { ScrollReveal } from '../components/ui/ScrollReveal';
import { NetworkTopology } from '../components/network/NetworkTopology';
import { StationCard } from '../components/network/StationCard';
import { StationModal } from '../components/network/StationModal';
import { RegionPanel } from '../components/network/RegionPanel';
import { ApiConnectionBanner } from '../components/ui/ApiConnectionBanner';
import { Server, ShieldCheck, AlertTriangle, Activity, Zap, Search, FilterX, RefreshCw } from 'lucide-react';

export const ChargingNetworkPage: React.FC = () => {
  const { isAttackMode, requestsPerSec } = useSecurity();

  const [backendStations, setBackendStations] = useState<DemoStation[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const fetchStations = useCallback(async () => {
    setIsRefreshing(true);
    setApiError(null);
    try {
      const res = await stationService.getStations();
      setBackendStations(res.items);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Failed to query station telemetry from backend.');
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStations();
  }, [fetchStations]);

  // Combine backend stations with simulation override if active
  const stations = useMemo(() => {
    if (backendStations.length > 0) {
      if (!isAttackMode) return backendStations;
      return backendStations.map((st) => {
        if (st.id === 'PUN-HUB-01' || st.id === 'MUM-HUB-01' || st.id === 'CS-0421') {
          return {
            ...st,
            status: 'UNDER ATTACK' as const,
            requestsPerSec,
            mlStatus: 'ATTACK DETECTED' as const,
          };
        }
        return st;
      });
    }
    return getStations(isAttackMode, requestsPerSec);
  }, [backendStations, isAttackMode, requestsPerSec]);

  const regions = useMemo(() => getRegions(isAttackMode, requestsPerSec), [isAttackMode, requestsPerSec]);
  const summary = useMemo(() => getNetworkSummary(isAttackMode), [isAttackMode]);

  const [search, setSearch] = useState('');
  const [filterRegion, setFilterRegion] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selectedStation, setSelectedStation] = useState<DemoStation | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<ChargingRegion | null>(null);

  const filteredStations = useMemo(() => {
    return stations.filter((s) => {
      const q = search.toLowerCase();
      const matchesSearch = !q || s.id.toLowerCase().includes(q) || s.name.toLowerCase().includes(q);
      const matchesRegion = filterRegion === 'ALL' || s.region === filterRegion;
      const matchesStatus = filterStatus === 'ALL' || s.status === filterStatus;
      return matchesSearch && matchesRegion && matchesStatus;
    });
  }, [stations, search, filterRegion, filterStatus]);

  const handleClearFilters = () => {
    setSearch('');
    setFilterRegion('ALL');
    setFilterStatus('ALL');
  };

  return (
    <AppLayout pageTitle="Charging Network">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#C4B5FD]/16">
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#F5F3FF] tracking-tight">
              Charging Network
            </h2>
            <StatusChip label="BACKEND CONNECTED" variant="live" dot pulse />
            <StatusChip label={isAttackMode ? "ATTACK OBSERVED" : "NETWORK SECURE"} variant={isAttackMode ? "critical" : "live"} />
          </div>
          <p className="text-sm text-[#C4C2D6]">
            Monitor security and health of EV charging infrastructure consumed via backend API endpoints.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchStations}
            disabled={isRefreshing}
            className="p-3 rounded-2xl bg-[#252542] hover:bg-[#303052] border border-[#C4B5FD]/18 text-[#C4C2D6] hover:text-[#F5F3FF] transition-colors shadow-sm"
            title="Refresh station telemetry"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#9B7BFF]' : ''}`} />
          </button>

          {isAttackMode && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#FB7185]/15 border border-[#FB7185]/35 text-xs font-mono font-bold text-[#FB7185] shrink-0">
              <AlertTriangle className="w-4 h-4 text-[#FB7185] animate-pulse" />
              ATTACK SIMULATION ACTIVE
            </div>
          )}
        </div>
      </div>

      {/* Backend API Error Banner */}
      {apiError && (
        <ApiConnectionBanner message={apiError} onRetry={fetchStations} isRetrying={isRefreshing} />
      )}

      {/* Network Summary Metrics */}
      <ScrollReveal>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { label: 'Total Stations', value: summary.totalStations.toLocaleString(), icon: Server, color: 'text-[#9B7BFF]' },
            { label: 'Protected', value: summary.protected.toLocaleString(), icon: ShieldCheck, color: 'text-[#34D399]' },
            { label: 'Under Attack', value: summary.underAttack, icon: AlertTriangle, color: 'text-[#FB7185]' },
            { label: 'Degraded', value: summary.degraded, icon: Activity, color: 'text-[#FBBF24]' },
            { label: 'Active Connections', value: summary.activeConnections.toLocaleString(), icon: Zap, color: 'text-[#4DD9F0]' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="glass-card rounded-[24px] p-5 space-y-2.5 shadow-sm hover:-translate-y-0.5 transition-all border border-[#C4B5FD]/16">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-semibold text-[#9896B0] uppercase leading-tight">{label}</span>
                <div className="p-1.5 rounded-xl bg-[#252542] border border-[#C4B5FD]/20">
                  <Icon className={`w-3.5 h-3.5 ${color}`} />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-[#F5F3FF] tracking-tight">{value}</div>
            </div>
          ))}
        </div>
      </ScrollReveal>

      {/* Network Topology */}
      <ScrollReveal delay={100}>
        <NetworkTopology
          regions={regions}
          isAttackMode={isAttackMode}
          onRegionClick={(r) => setSelectedRegion(r)}
        />
      </ScrollReveal>

      {/* Station Grid Section */}
      <ScrollReveal delay={150}>
        <div className="space-y-5">
          {/* Filter Bar */}
          <div className="glass-card rounded-[24px] p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 border border-[#C4B5FD]/16 shadow-sm">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#9896B0] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search station ID or name..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#252542] border border-[#C4B5FD]/20 text-xs text-[#F5F3FF] placeholder-[#9896B0] focus:outline-none focus:border-[#9B7BFF] shadow-sm"
              />
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <select
                value={filterRegion}
                onChange={(e) => setFilterRegion(e.target.value)}
                className="px-3 py-2.5 rounded-xl bg-[#252542] border border-[#C4B5FD]/20 text-xs font-mono text-[#F5F3FF] focus:outline-none shadow-sm cursor-pointer"
              >
                <option value="ALL">Region: All</option>
                <option value="MUM">Mumbai</option>
                <option value="DEL">Delhi</option>
                <option value="BLR">Bengaluru</option>
                <option value="PUN">Pune</option>
                <option value="HYD">Hyderabad</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2.5 rounded-xl bg-[#252542] border border-[#C4B5FD]/20 text-xs font-mono text-[#F5F3FF] focus:outline-none shadow-sm cursor-pointer"
              >
                <option value="ALL">Status: All</option>
                <option value="PROTECTED">Protected</option>
                <option value="DEGRADED">Degraded</option>
                <option value="UNDER ATTACK">Under Attack</option>
                <option value="OFFLINE">Offline</option>
              </select>
              <button
                onClick={handleClearFilters}
                className="p-2.5 rounded-xl bg-[#252542] hover:bg-[#303052] border border-[#C4B5FD]/20 text-[#C4C2D6] hover:text-[#F5F3FF] transition-colors shadow-sm"
                title="Clear filters"
              >
                <FilterX className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Station Cards Grid */}
          {filteredStations.length === 0 ? (
            <div className="glass-card rounded-[28px] p-12 text-center space-y-4 border border-[#C4B5FD]/16 shadow-sm">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-[#9B7BFF]/15 border border-[#9B7BFF]/30 flex items-center justify-center text-[#9B7BFF]">
                <Server className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#F5F3FF]">No charging stations match your filters.</h3>
              <button onClick={handleClearFilters} className="btn-secondary rounded-xl text-xs py-2.5 px-5">
                <FilterX className="w-4 h-4 text-[#9B7BFF]" /> CLEAR FILTERS
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredStations.map((station) => (
                <StationCard
                  key={station.id}
                  station={station}
                  onClick={() => setSelectedStation(station)}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollReveal>

      {/* Station Detail Modal */}
      {selectedStation && (
        <StationModal station={selectedStation} onClose={() => setSelectedStation(null)} />
      )}

      {/* Region Detail Panel */}
      {selectedRegion && (
        <RegionPanel region={selectedRegion} onClose={() => setSelectedRegion(null)} />
      )}
    </AppLayout>
  );
};
