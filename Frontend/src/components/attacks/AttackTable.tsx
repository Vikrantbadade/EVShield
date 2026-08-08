import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AttackIncident } from '../../types/attack';
import { AttackBadge } from './AttackBadge';
import { Eye, ShieldAlert, ChevronLeft, ChevronRight, FilterX } from 'lucide-react';
import { StatusChip } from '../ui/StatusChip';

interface AttackTableProps {
  incidents: AttackIncident[];
  total: number;
  page: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  onClearFilters: () => void;
}

export const AttackTable: React.FC<AttackTableProps> = ({
  incidents,
  total,
  page,
  totalPages,
  onPageChange,
  onClearFilters,
}) => {
  const navigate = useNavigate();

  if (incidents.length === 0) {
    return (
      <div className="glass-cream rounded-[28px] p-12 text-center space-y-5 shadow-glass border border-white/90">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-[#AD8B73]/15 border border-[#AD8B73]/30 flex items-center justify-center text-[#AD8B73] shadow-glow-peach">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-xl font-bold text-[#3F3832]">No incidents found</h3>
          <p className="text-sm text-[#514940] max-w-sm mx-auto">
            No attack log records match your selected search query or filter criteria.
          </p>
        </div>
        <button onClick={onClearFilters} className="btn-secondary rounded-xl text-xs py-2.5 px-5">
          <FilterX className="w-4 h-4 text-[#AD8B73]" /> CLEAR FILTERS
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Table Container */}
      <div className="glass-card rounded-[28px] overflow-hidden shadow-glass border border-white/90">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead>
              <tr className="bg-white/60 border-b border-[#AD8B73]/15 text-[11px] font-mono uppercase tracking-wider text-[#7A7067]">
                <th className="py-4 px-5">Incident</th>
                <th className="py-4 px-4">Time</th>
                <th className="py-4 px-4">Attack Type</th>
                <th className="py-4 px-4">Severity</th>
                <th className="py-4 px-4">ML Conf.</th>
                <th className="py-4 px-4">Peak Traffic</th>
                <th className="py-4 px-4">Nodes</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#AD8B73]/10 text-xs">
              {incidents.map((incident) => (
                <tr
                  key={incident.id}
                  onClick={() => navigate(`/analysis/${incident.id}`)}
                  className="hover:bg-white/80 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group"
                >
                  {/* Incident ID */}
                  <td className="py-4 px-5 font-mono font-extrabold text-[#3F3832] group-hover:text-[#19BFA3]">
                    <div className="flex items-center gap-2">
                      <span>{incident.id}</span>
                      {incident.isDemo && <StatusChip label="DEMO" variant="demo" className="py-0 px-1.5 text-[9px]" />}
                    </div>
                  </td>

                  {/* Timestamp */}
                  <td className="py-4 px-4 font-mono text-[#514940] whitespace-nowrap">{incident.timestamp}</td>

                  {/* Attack Type */}
                  <td className="py-4 px-4 font-semibold text-[#3F3832]">{incident.attackTypeLabel}</td>

                  {/* Severity */}
                  <td className="py-4 px-4">
                    <AttackBadge type="severity" value={incident.severity} />
                  </td>

                  {/* ML Confidence */}
                  <td className="py-4 px-4 font-mono font-bold text-[#19BFA3]">{incident.mlConfidence}%</td>

                  {/* Peak Traffic */}
                  <td className="py-4 px-4 font-mono font-bold text-[#3F3832]">
                    {incident.requestsPerSecond.toLocaleString()} req/s
                  </td>

                  {/* Affected Nodes */}
                  <td className="py-4 px-4 font-mono text-[#514940]">{incident.affectedNodes} nodes</td>

                  {/* Status */}
                  <td className="py-4 px-4">
                    <AttackBadge type="status" value={incident.status} />
                  </td>

                  {/* Action */}
                  <td className="py-4 px-5 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/analysis/${incident.id}`);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/70 hover:bg-white border border-white/90 text-xs font-semibold text-[#3F3832] shadow-glass-sm group-hover:border-[#19BFA3]/40 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#AD8B73]" /> VIEW
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-1 text-xs font-mono text-[#7A7067]">
        <div>
          Showing <span className="font-bold text-[#3F3832]">{incidents.length}</span> of{' '}
          <span className="font-bold text-[#3F3832]">{total}</span> incident records
        </div>

        <div className="flex items-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="p-2 rounded-xl bg-white/70 border border-white/90 text-[#3F3832] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white transition-colors shadow-glass-sm"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span>
            Page <strong className="text-[#3F3832]">{page}</strong> of <strong className="text-[#3F3832]">{totalPages}</strong>
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="p-2 rounded-xl bg-white/70 border border-white/90 text-[#3F3832] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white transition-colors shadow-glass-sm"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
