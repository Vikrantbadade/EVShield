import { apiClient, ApiResponseWrapper } from './apiClient';
import { AttackIncident, AttackFilterParams } from '../types/attack';
import { mockAttacksData } from '../data/mockAttacks';

export interface AttackQueryResult {
  items: AttackIncident[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  isDemo?: boolean;
}

export interface AttackSummaryMetrics {
  totalIncidents: number;
  criticalCount: number;
  investigatingCount: number;
  mitigatedCount: number;
}

export const attackService = {
  /**
   * Asynchronously fetch filtered list of attack incidents from backend API
   */
  getAttacksAsync: async (
    params: AttackFilterParams = {},
    activeLiveIncident?: AttackIncident | null
  ): Promise<AttackQueryResult> => {
    try {
      const response = await apiClient.get<ApiResponseWrapper<AttackQueryResult>>('/attacks', {
        params: {
          search: params.search,
          severity: params.severity,
          status: params.status,
          attackType: params.attackType,
          page: params.page,
          pageSize: params.pageSize,
        },
      });

      let result = response.data.data;
      if (!result) {
        throw new Error('Invalid backend attack response format.');
      }

      let items = [...result.items];

      // Prepend active simulation incident if currently running
      if (activeLiveIncident) {
        const idx = items.findIndex((a) => a.id === activeLiveIncident.id);
        if (idx >= 0) {
          items[idx] = { ...items[idx], ...activeLiveIncident };
        } else {
          items.unshift(activeLiveIncident);
        }
      }

      return {
        ...result,
        items,
        total: activeLiveIncident ? result.total + 1 : result.total,
      };
    } catch {
      // Fallback to local filtering if backend unreachable
      return attackService.getAttacks(params, activeLiveIncident);
    }
  },

  /**
   * Synchronous fallback query method
   */
  getAttacks: (
    params: AttackFilterParams = {},
    activeLiveIncident?: AttackIncident | null
  ): AttackQueryResult => {
    let list = [...mockAttacksData];

    if (activeLiveIncident) {
      const idx = list.findIndex((a) => a.id === activeLiveIncident.id);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...activeLiveIncident };
      } else {
        list.unshift(activeLiveIncident);
      }
    }

    const { search, severity, status, attackType, page = 1, pageSize = 10 } = params;

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

    if (severity && severity !== 'ALL') {
      list = list.filter((a) => a.severity.toUpperCase() === severity.toUpperCase());
    }

    if (status && status !== 'ALL') {
      list = list.filter((a) => a.status.toUpperCase() === status.toUpperCase());
    }

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
      isDemo: true,
    };
  },

  /**
   * Asynchronously fetch single attack incident by ID
   */
  getAttackByIdAsync: async (
    id: string,
    activeLiveIncident?: AttackIncident | null
  ): Promise<AttackIncident | null> => {
    if (activeLiveIncident && activeLiveIncident.id === id) {
      return activeLiveIncident;
    }

    try {
      const response = await apiClient.get<ApiResponseWrapper<AttackIncident>>(`/attacks/${id}`);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      return attackService.getAttackById(id, activeLiveIncident);
    } catch {
      return attackService.getAttackById(id, activeLiveIncident);
    }
  },

  /**
   * Synchronous fallback single attack fetch
   */
  getAttackById: (id: string, activeLiveIncident?: AttackIncident | null): AttackIncident | null => {
    if (activeLiveIncident && activeLiveIncident.id === id) {
      return activeLiveIncident;
    }
    const found = mockAttacksData.find((a) => a.id === id);
    if (found) return found;
    return mockAttacksData[0] || null;
  },

  /**
   * Calculate summary metrics
   */
  getSummaryMetrics: (
    activeLiveIncident?: AttackIncident | null,
    incidentsList?: AttackIncident[]
  ): AttackSummaryMetrics => {
    let list = incidentsList ? [...incidentsList] : [...mockAttacksData];

    if (activeLiveIncident && !incidentsList) {
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
   * Export incidents to CSV
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
   * Export incidents to JSON
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
