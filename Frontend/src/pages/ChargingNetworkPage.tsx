import React, { useMemo, useState } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { useSecurity } from '../context/SecurityContext';
import { getStations, getRegions, getNetworkSummary } from '../data/mockStations';
import { DemoStation, ChargingRegion } from '../types/station';
import { StatusChip } from '../components/ui/StatusChip';
import { ScrollReveal } from '../components/ui/ScrollReveal';
import { NetworkTopology } from '../components/network/NetworkTopology';
import { StationCard } from '../components/network/StationCard';
import { StationModal } from '../components/network/StationModal';
import { RegionPanel } from '../components/network/RegionPanel';
import {
  Server, ShieldCheck, AlertTriangle, Activity, Zap, Search, FilterX,
} from 'lucide-react';

export const ChargingNetworkPage: React.FC = () => {
  const { isAttackMode, requestsPerSec } = useSecurity();

  const stations = useMemo(() => getStations(isAttackMode, requestsPerSec), [isAttackMode, requestsPerSec]);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#AD8B73]/18">
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#3F3832] tracking-tight">
              Charging Network
            </h2>
            <StatusChip label="LIVE" variant="live" dot pulse />
            <StatusChip label="DEMO DATA" variant="demo" />
          </div>
          <p className="text-sm text-[#514940]">
            Monitor security and health of EV charging infrastructure across connected regions.
          </p>
        </div>

        {isAttackMode && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#E85C68]/12 border border-[#E85C68]/30 text-xs font-mono font-bold text-[#a82d38] shrink-0">
            <AlertTriangle className="w-4 h-4 text-[#E85C68] animate-pulse" />
            ATTACK SIMULATION ACTIVE
          </div>
        )}
      </div>

      {/* Network Summary Metrics */}
      <ScrollReveal>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { label: 'Total Stations',      value: summary.totalStations.toLocaleString(), variant: 'cream'  as const, icon: Server,       color: 'text-[#3F3832]' },
            { label: 'Protected',           value: summary.protected.toLocaleString(),      variant: 'cyan'   as const, icon: ShieldCheck,  color: 'text-[#19BFA3]' },
            { label: 'Under Attack',        value: summary.underAttack,                     variant: 'danger' as const, icon: AlertTriangle,color: 'text-[#E85C68]' },
            { label: 'Degraded',            value: summary.degraded,                        variant: 'sand'   as const, icon: Activity,     color: 'text-[#D99A32]' },
            { label: 'Active Connections',  value: summary.activeConnections.toLocaleString(), variant: 'peach' as const, icon: Zap,         color: 'text-[#52A8FF]' },
          ].map(({ label, value, variant, icon: Icon, color }) => (
            <div key={label} className={`glass-${variant} rounded-[24px] p-5 space-y-2.5 shadow-glass-sm hover:-translate-y-0.5 transition-all`}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-semibold text-[#7A7067] uppercase leading-tight">{label}</span>
                <div className="p-1.5 rounded-xl bg-white/70 border border-white/90">
                  <Icon className={`w-3.5 h-3.5 ${color}`} />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-[#3F3832] tracking-tight">{value}</div>
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
          <div className="glass-cream rounded-[24px] p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shadow-glass border border-white/90">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#7A7067] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search station ID or name..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/70 border border-white/90 text-xs text-[#3F3832] placeholder-[#7A7067] focus:outline-none focus:border-[#AD8B73] shadow-glass-sm"
              />
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <select
                value={filterRegion}
                onChange={(e) => setFilterRegion(e.target.value)}
                className="px-3 py-2.5 rounded-xl bg-white/70 border border-white/90 text-xs font-mono text-[#3F3832] focus:outline-none shadow-glass-sm cursor-pointer"
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
                className="px-3 py-2.5 rounded-xl bg-white/70 border border-white/90 text-xs font-mono text-[#3F3832] focus:outline-none shadow-glass-sm cursor-pointer"
              >
                <option value="ALL">Status: All</option>
                <option value="PROTECTED">Protected</option>
                <option value="DEGRADED">Degraded</option>
                <option value="UNDER ATTACK">Under Attack</option>
                <option value="OFFLINE">Offline</option>
              </select>
              <button
                onClick={handleClearFilters}
                className="p-2.5 rounded-xl bg-white/70 hover:bg-white border border-white/90 text-[#AD8B73] hover:text-[#3F3832] transition-colors shadow-glass-sm"
                title="Clear filters"
              >
                <FilterX className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Station Cards Grid */}
          {filteredStations.length === 0 ? (
            <div className="glass-cream rounded-[28px] p-12 text-center space-y-4 shadow-glass border border-white/90">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-[#AD8B73]/15 border border-[#AD8B73]/30 flex items-center justify-center text-[#AD8B73]">
                <Server className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#3F3832]">No charging stations match your filters.</h3>
              <button onClick={handleClearFilters} className="btn-secondary rounded-xl text-xs py-2.5 px-5">
                <FilterX className="w-4 h-4 text-[#AD8B73]" /> CLEAR FILTERS
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
