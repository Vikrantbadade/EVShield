import { AttackIncident, AttackFilterParams } from '../types/attack';
import { mockAttacksData } from '../data/mockAttacks';

export interface AttackSummaryMetrics {
  totalIncidents: number;
  criticalCount: number;
  investigatingCount: number;
  mitigatedCount: number;
}

export const attackService = {
  /**
   * Get filtered list of attacks with pagination
   */
  getAttacks: (params: AttackFilterParams = {}, activeLiveIncident?: AttackIncident | null): {
    items: AttackIncident[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  } => {
    let list = [...mockAttacksData];

    // If an active dynamic incident exists, update or prepend it
    if (activeLiveIncident) {
      const idx = list.findIndex((a) => a.id === activeLiveIncident.id);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...activeLiveIncident };
      } else {
        list.unshift(activeLiveIncident);
      }
    }

    const { search, severity, status, attackType, page = 1, pageSize = 10 } = params;

    // Search filter
    if (search && search.trim() !== '') {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (a) =>
          a.id.toLowerCase().includes(q) ||
          a.attackTypeLabel.toLowerCase().includes(q) ||
          a.targetInfrastructure.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q)
      );
    }

    // Severity filter
    if (severity && severity !== 'ALL') {
      list = list.filter((a) => a.severity.toUpperCase() === severity.toUpperCase());
    }

    // Status filter
    if (status && status !== 'ALL') {
      list = list.filter((a) => a.status.toUpperCase() === status.toUpperCase());
    }

    // Attack Type filter
    if (attackType && attackType !== 'ALL') {
      list = list.filter((a) => a.attackType.toUpperCase() === attackType.toUpperCase());
    }

    const total = list.length;
    const totalPages = Math.ceil(total / pageSize) || 1;
    const startIndex = (page - 1) * pageSize;
    const items = list.slice(startIndex, startIndex + pageSize);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages,
    };
  },

  /**
   * Get single incident by ID
   */
  getAttackById: (id: string, activeLiveIncident?: AttackIncident | null): AttackIncident | null => {
    if (activeLiveIncident && activeLiveIncident.id === id) {
      return activeLiveIncident;
    }
    const found = mockAttacksData.find((a) => a.id === id);
    if (found) return found;
    // Default fallback to first incident if ID not matched
    return mockAttacksData[0] || null;
  },

  /**
   * Calculate summary metrics from incident list
   */
  getSummaryMetrics: (activeLiveIncident?: AttackIncident | null): AttackSummaryMetrics => {
    let list = [...mockAttacksData];
    if (activeLiveIncident) {
      const idx = list.findIndex((a) => a.id === activeLiveIncident.id);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...activeLiveIncident };
      } else {
        list.unshift(activeLiveIncident);
      }
    }

    return {
      totalIncidents: list.length,
      criticalCount: list.filter((a) => a.severity === 'CRITICAL').length,
      investigatingCount: list.filter((a) => a.status === 'DETECTED' || a.status === 'INVESTIGATING').length,
      mitigatedCount: list.filter((a) => a.status === 'MITIGATED' || a.status === 'RESOLVED').length,
    };
  },

  /**
   * Export incidents to CSV (client-side)
   */
  exportToCSV: (incidents: AttackIncident[], filename = 'EVShield-Attack-Logs.csv') => {
    const headers = [
      'Incident ID',
      'Timestamp',
      'Attack Type',
      'Severity',
      'ML Confidence (%)',
      'Peak Req/s',
      'Baseline Req/s',
      'Affected Nodes',
      'Status',
      'Mitigation Time',
      'Target Scope',
    ];

    const rows = incidents.map((a) => [
      a.id,
      a.timestamp,
      `"${a.attackTypeLabel}"`,
      a.severity,
      `${a.mlConfidence}%`,
      a.requestsPerSecond,
      a.baselineRequestsPerSecond,
      a.affectedNodes,
      a.status,
      a.mitigationTime,
      `"${a.targetInfrastructure}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  /**
   * Export incidents to JSON (client-side)
   */
  exportToJSON: (incidents: AttackIncident[], filename = 'EVShield-Attack-Logs.json') => {
    const dataStr = JSON.stringify(incidents, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
};
