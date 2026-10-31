import { apiClient } from './apiClient';
import {
  SecurityIncident,
  IncidentFilterParams,
  IncidentQueryResult,
  IncidentAnalyticsSummary,
  AuditEventRecord,
  IncidentNotificationItem,
  ThreatIntelResult,
  IncidentStatus,
} from '../types/incident';

export interface ThreatIntelConfig {
  abuseIpDbConfigured: boolean;
  virusTotalConfigured: boolean;
  enabled: boolean;
  cacheTtlMinutes: number;
}

export const incidentService = {
  /**
   * Query incidents with search, filters, pagination, and sorting
   */
  async getIncidents(params: IncidentFilterParams = {}): Promise<IncidentQueryResult> {
    const res = await apiClient.get('/incidents', { params });
    return res.data.data;
  },

  /**
   * Get single incident by ID with full timeline, correlation, and response actions
   */
  async getIncidentById(id: string): Promise<SecurityIncident> {
    const res = await apiClient.get(`/incidents/${encodeURIComponent(id)}`);
    return res.data.data;
  },

  /**
   * Update incident lifecycle status
   */
  async updateIncidentStatus(id: string, status: IncidentStatus, notes?: string): Promise<SecurityIncident> {
    const res = await apiClient.patch(`/incidents/${encodeURIComponent(id)}/status`, {
      status,
      notes,
    });
    return res.data.data;
  },

  /**
   * Assign analyst to incident
   */
  async assignAnalyst(id: string, email: string, name: string, role = 'security_analyst'): Promise<SecurityIncident> {
    const res = await apiClient.patch(`/incidents/${encodeURIComponent(id)}/assign`, {
      email,
      name,
      role,
    });
    return res.data.data;
  },

  /**
   * Add investigation note to incident
   */
  async addInvestigationNote(id: string, content: string): Promise<SecurityIncident> {
    const res = await apiClient.post(`/incidents/${encodeURIComponent(id)}/notes`, {
      content,
    });
    return res.data.data;
  },

  /**
   * Update response playbook action status
   */
  async updateResponseAction(
    id: string,
    actionId: string,
    status: 'PENDING' | 'COMPLETED' | 'DISMISSED',
    notes?: string
  ): Promise<SecurityIncident> {
    const res = await apiClient.patch(`/incidents/${encodeURIComponent(id)}/actions/${encodeURIComponent(actionId)}`, {
      status,
      notes,
    });
    return res.data.data;
  },

  /**
   * Get incident analytics and SOC operational metrics
   */
  async getIncidentAnalytics(): Promise<IncidentAnalyticsSummary> {
    const res = await apiClient.get('/incidents/analytics');
    return res.data.data;
  },

  /**
   * Get immutable audit trail
   */
  async getAuditTrail(incidentId?: string, limit = 50): Promise<AuditEventRecord[]> {
    const res = await apiClient.get('/incidents/audit', {
      params: { incidentId, limit },
    });
    return res.data.data;
  },

  /**
   * Get security notifications
   */
  async getNotifications(limit = 20): Promise<IncidentNotificationItem[]> {
    const res = await apiClient.get('/incidents/notifications', {
      params: { limit },
    });
    return res.data.data;
  },

  /**
   * Mark notification as read
   */
  async markNotificationRead(id: string): Promise<void> {
    await apiClient.patch(`/incidents/notifications/${encodeURIComponent(id)}/read`);
  },

  /**
   * Threat Intelligence indicator lookup
   */
  async lookupThreatIntel(indicator: string): Promise<ThreatIntelResult> {
    const res = await apiClient.get('/incidents/threat-intel/lookup', {
      params: { indicator },
    });
    return res.data.data;
  },

  /**
   * Threat Intelligence configuration
   */
  async getThreatIntelConfig(): Promise<ThreatIntelConfig> {
    const res = await apiClient.get('/incidents/threat-intel/config');
    return res.data.data;
  },

  /**
   * Update Threat Intelligence API keys
   */
  async updateThreatIntelConfig(config: {
    abuseIpDbKey?: string;
    virusTotalKey?: string;
    enableThreatIntel?: boolean;
  }): Promise<{ message: string }> {
    const res = await apiClient.post('/incidents/threat-intel/config', config);
    return res.data;
  },

  /**
   * Download Incident PDF report
   */
  async downloadPdfReport(id: string): Promise<Blob> {
    const res = await apiClient.get(`/incidents/${encodeURIComponent(id)}/report/pdf`, {
      responseType: 'blob',
    });
    const blob = new Blob([res.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${id}_Investigation_Report.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    return blob;
  },

  /**
   * Download Incident CSV report
   */
  async downloadCsvReport(id: string): Promise<Blob> {
    const res = await apiClient.get(`/incidents/${encodeURIComponent(id)}/report/csv`, {
      responseType: 'blob',
    });
    const blob = new Blob([res.data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${id}_Investigation_Report.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    return blob;
  },

  /**
   * Download bulk incidents CSV
   */
  async downloadBulkCsv(status?: string, severity?: string): Promise<Blob> {
    const res = await apiClient.get('/incidents/export/csv', {
      params: { status, severity },
      responseType: 'blob',
    });
    const blob = new Blob([res.data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `EVShield_Incidents_Export_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    return blob;
  },
};

