import React from 'react';
import { SecurityIncident, IncidentSeverity, IncidentStatus } from '../../types/incident';
import { Shield, ChevronRight, User } from 'lucide-react';

interface IncidentTableProps {
  incidents: SecurityIncident[];
  selectedIncidentId: string | null;
  onSelectIncident: (incident: SecurityIncident) => void;
  isLoading: boolean;
}

export const IncidentTable: React.FC<IncidentTableProps> = ({
  incidents,
  selectedIncidentId,
  onSelectIncident,
  isLoading,
}) => {
  const getSeverityBadge = (severity: IncidentSeverity) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-[#FB7185]/15 border-[#FB7185]/30 text-[#FB7185]';
      case 'HIGH':
        return 'bg-[#F97316]/15 border-[#F97316]/30 text-[#F97316]';
      case 'MEDIUM':
        return 'bg-[#FBBF24]/15 border-[#FBBF24]/30 text-[#FBBF24]';
      case 'LOW':
      default:
        return 'bg-[#34D399]/15 border-[#34D399]/30 text-[#34D399]';
    }
  };

  const getStatusBadge = (status: IncidentStatus) => {
    switch (status) {
      case 'OPEN':
        return 'bg-[#FB7185]/20 text-[#FB7185] border-[#FB7185]/40';
      case 'INVESTIGATING':
        return 'bg-[#8055F6]/20 text-[#C4B5FD] border-[#8055F6]/40';
      case 'CONTAINED':
        return 'bg-[#FBBF24]/20 text-[#FBBF24] border-[#FBBF24]/40';
      case 'RESOLVED':
        return 'bg-[#34D399]/20 text-[#34D399] border-[#34D399]/40';
      case 'CLOSED':
      default:
        return 'bg-[#9896B0]/20 text-[#9896B0] border-[#9896B0]/40';
    }
  };

  const getRiskScoreBarColor = (score: number) => {
    if (score >= 80) return 'bg-[#FB7185]';
    if (score >= 60) return 'bg-[#F97316]';
    if (score >= 40) return 'bg-[#FBBF24]';
    return 'bg-[#34D399]';
  };

  if (isLoading) {
    return (
      <div className="bg-[#17172A]/70 border border-[#C4B5FD]/16 rounded-2xl p-12 text-center backdrop-blur-md">
        <div className="animate-spin w-8 h-8 border-2 border-[#8055F6] border-t-transparent rounded-full mx-auto mb-3" />
        <p className="text-xs font-mono text-[#9896B0]">Loading security incidents from SOC repository...</p>
      </div>
    );
  }

  if (incidents.length === 0) {
    return (
      <div className="bg-[#17172A]/70 border border-[#C4B5FD]/16 rounded-2xl p-12 text-center backdrop-blur-md">
        <Shield className="w-10 h-10 text-[#9896B0]/50 mx-auto mb-3" />
        <p className="text-sm font-semibold text-[#F5F3FF] mb-1">No Incidents Found</p>
        <p className="text-xs font-mono text-[#9896B0]">
          No active or historical incidents match your current search and filter criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#17172A]/70 border border-[#C4B5FD]/16 rounded-2xl overflow-hidden backdrop-blur-md">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="border-b border-[#C4B5FD]/16 bg-[#131326]/60 text-[#9896B0]">
              <th className="py-3 px-4 font-medium">Incident ID</th>
              <th className="py-3 px-4 font-medium">Title & Category</th>
              <th className="py-3 px-3 font-medium">Target / Station</th>
              <th className="py-3 px-3 font-medium">Severity</th>
              <th className="py-3 px-3 font-medium">Status</th>
              <th className="py-3 px-3 font-medium">Risk Score</th>
              <th className="py-3 px-3 font-medium">Alerts</th>
              <th className="py-3 px-3 font-medium">Assigned</th>
              <th className="py-3 px-3 font-medium">Created</th>
              <th className="py-3 px-4 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#C4B5FD]/10">
            {incidents.map((inc) => {
              const isSelected = inc.id === selectedIncidentId;
              const dateObj = new Date(inc.createdAt);
              const formattedTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              const formattedDate = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });

              return (
                <tr
                  key={inc.id}
                  onClick={() => onSelectIncident(inc)}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-[#8055F6]/15 hover:bg-[#8055F6]/20'
                      : 'hover:bg-[#1D1D35]/60'
                  }`}
                >
                  {/* ID */}
                  <td className="py-3.5 px-4 font-semibold text-[#C4B5FD] whitespace-nowrap">
                    {inc.id}
                  </td>

                  {/* Title & Category */}
                  <td className="py-3.5 px-4 max-w-[240px]">
                    <div className="font-sans font-semibold text-[#F5F3FF] truncate">{inc.title}</div>
                    <div className="text-[11px] text-[#9896B0] truncate mt-0.5">{inc.categoryLabel}</div>
                  </td>

                  {/* Station */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded bg-[#1D1D35] border border-[#C4B5FD]/20 text-[#4DD9F0]">
                      {inc.primaryStationId}
                    </span>
                    {inc.affectedStations.length > 1 && (
                      <span className="ml-1 text-[10px] text-[#9896B0]">
                        +{inc.affectedStations.length - 1}
                      </span>
                    )}
                  </td>

                  {/* Severity */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded text-[11px] border font-bold ${getSeverityBadge(inc.severity)}`}>
                      {inc.severity}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] border font-semibold ${getStatusBadge(inc.status)}`}>
                      {inc.status}
                    </span>
                  </td>

                  {/* Risk Score */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-[#141425] rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full ${getRiskScoreBarColor(inc.riskScore)}`}
                          style={{ width: `${Math.min(100, Math.max(5, inc.riskScore))}%` }}
                        />
                      </div>
                      <span className="font-bold text-[#F5F3FF] text-[11px]">{inc.riskScore}</span>
                    </div>
                  </td>

                  {/* Alerts count */}
                  <td className="py-3.5 px-3 whitespace-nowrap text-[#9896B0]">
                    <span className="px-1.5 py-0.5 rounded bg-[#141425] text-[#C4B5FD] font-semibold">
                      {inc.alerts?.length || inc.correlationGroup?.alertCount || 1}
                    </span>
                  </td>

                  {/* Assigned to */}
                  <td className="py-3.5 px-3 whitespace-nowrap text-[#9896B0]">
                    {inc.assignedTo ? (
                      <div className="flex items-center gap-1.5 text-[11px] text-[#F5F3FF]">
                        <User className="w-3 h-3 text-[#8055F6]" />
                        <span className="truncate max-w-[90px]">{inc.assignedTo.name}</span>
                      </div>
                    ) : (
                      <span className="text-[#9896B0]/50 italic text-[11px]">Unassigned</span>
                    )}
                  </td>

                  {/* Created timestamp */}
                  <td className="py-3.5 px-3 whitespace-nowrap text-[#9896B0] text-[11px]">
                    <div>{formattedTime}</div>
                    <div className="text-[10px] text-[#9896B0]/70">{formattedDate}</div>
                  </td>

                  {/* Action */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectIncident(inc);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-sans font-medium text-[#C4B5FD] bg-[#8055F6]/10 hover:bg-[#8055F6]/25 border border-[#8055F6]/30 transition-colors"
                    >
                      <span>Investigate</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
