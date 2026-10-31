/**
 * EVShield Stage 3: Incident Persistence & Storage Service
 * Provides robust persistent storage for incidents, audit events, and notifications.
 * Persists data to disk (JSON) to survive application restarts, with optional Prisma synchronization.
 */

import fs from 'fs';
import path from 'path';
import {
  SecurityIncident,
  AuditEventRecord,
  IncidentNotificationItem,
  IncidentFilterParams,
  IncidentQueryResult,
  ThreatIntelResult,
} from '../types/incident.types.js';

function resolveDataDirectory(): string {
  const rootDir = process.cwd();
  const candidates = [
    path.resolve(rootDir, 'backend', 'data'),
    path.resolve(rootDir, 'data'),
  ];
  for (const cand of candidates) {
    if (fs.existsSync(path.dirname(cand))) {
      if (!fs.existsSync(cand)) {
        try { fs.mkdirSync(cand, { recursive: true }); } catch {}
      }
      return cand;
    }
  }
  const fallback = path.resolve(rootDir, 'data');
  if (!fs.existsSync(fallback)) {
    try { fs.mkdirSync(fallback, { recursive: true }); } catch {}
  }
  return fallback;
}

const DATA_DIR = resolveDataDirectory();
const INCIDENTS_FILE = path.resolve(DATA_DIR, 'incidents.json');
const AUDIT_FILE = path.resolve(DATA_DIR, 'audit_trail.json');
const NOTIFICATIONS_FILE = path.resolve(DATA_DIR, 'notifications.json');
const THREAT_INTEL_CACHE_FILE = path.resolve(DATA_DIR, 'threat_intel_cache.json');

export class IncidentStorageService {
  private incidents: Map<string, SecurityIncident> = new Map();
  private auditEvents: AuditEventRecord[] = [];
  private notifications: IncidentNotificationItem[] = [];
  private threatIntelCache: Map<string, ThreatIntelResult> = new Map();
  private isLoaded = false;

  constructor() {
    this.loadFromDisk();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Disk Persistence Handlers
  // ─────────────────────────────────────────────────────────────────────────────

  private loadFromDisk(): void {
    if (this.isLoaded) return;
    this.isLoaded = true;

    // 1. Incidents
    try {
      if (fs.existsSync(INCIDENTS_FILE)) {
        const raw = fs.readFileSync(INCIDENTS_FILE, 'utf-8');
        const list: SecurityIncident[] = JSON.parse(raw);
        for (const inc of list) {
          this.incidents.set(inc.id, inc);
        }
      }
    } catch (err) {
      console.warn('[IncidentStorage] Error loading incidents from disk:', err);
    }

    // 2. Audit Trail
    try {
      if (fs.existsSync(AUDIT_FILE)) {
        const raw = fs.readFileSync(AUDIT_FILE, 'utf-8');
        this.auditEvents = JSON.parse(raw);
      }
    } catch (err) {
      console.warn('[IncidentStorage] Error loading audit trail from disk:', err);
    }

    // 3. Notifications
    try {
      if (fs.existsSync(NOTIFICATIONS_FILE)) {
        const raw = fs.readFileSync(NOTIFICATIONS_FILE, 'utf-8');
        this.notifications = JSON.parse(raw);
      }
    } catch (err) {
      console.warn('[IncidentStorage] Error loading notifications from disk:', err);
    }

    // 4. Threat Intel Cache
    try {
      if (fs.existsSync(THREAT_INTEL_CACHE_FILE)) {
        const raw = fs.readFileSync(THREAT_INTEL_CACHE_FILE, 'utf-8');
        const list: ThreatIntelResult[] = JSON.parse(raw);
        for (const ti of list) {
          this.threatIntelCache.set(ti.indicator, ti);
        }
      }
    } catch (err) {
      console.warn('[IncidentStorage] Error loading threat intel cache from disk:', err);
    }
  }

  private saveIncidentsToDisk(): void {
    try {
      const list = Array.from(this.incidents.values());
      fs.writeFileSync(INCIDENTS_FILE, JSON.stringify(list, null, 2), 'utf-8');
    } catch (err) {
      console.error('[IncidentStorage] Failed to save incidents to disk:', err);
    }
  }

  private saveAuditToDisk(): void {
    try {
      fs.writeFileSync(AUDIT_FILE, JSON.stringify(this.auditEvents.slice(0, 1000), null, 2), 'utf-8');
    } catch (err) {
      console.error('[IncidentStorage] Failed to save audit trail to disk:', err);
    }
  }

  private saveNotificationsToDisk(): void {
    try {
      fs.writeFileSync(NOTIFICATIONS_FILE, JSON.stringify(this.notifications.slice(0, 200), null, 2), 'utf-8');
    } catch (err) {
      console.error('[IncidentStorage] Failed to save notifications to disk:', err);
    }
  }

  private saveThreatIntelToDisk(): void {
    try {
      const list = Array.from(this.threatIntelCache.values());
      fs.writeFileSync(THREAT_INTEL_CACHE_FILE, JSON.stringify(list.slice(0, 500), null, 2), 'utf-8');
    } catch (err) {
      console.error('[IncidentStorage] Failed to save threat intel cache to disk:', err);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Incident CRUD Operations
  // ─────────────────────────────────────────────────────────────────────────────

  public saveIncident(incident: SecurityIncident): SecurityIncident {
    this.incidents.set(incident.id, incident);
    this.saveIncidentsToDisk();
    return incident;
  }

  public getIncidentById(id: string): SecurityIncident | null {
    return this.incidents.get(id) || null;
  }

  public getAllIncidents(): SecurityIncident[] {
    return Array.from(this.incidents.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public queryIncidents(params: IncidentFilterParams = {}): IncidentQueryResult {
    let list = this.getAllIncidents();

    // 1. Search Query
    if (params.search && params.search.trim() !== '') {
      const q = params.search.trim().toLowerCase();
      list = list.filter((inc) =>
        inc.id.toLowerCase().includes(q) ||
        inc.title.toLowerCase().includes(q) ||
        inc.description.toLowerCase().includes(q) ||
        inc.primaryStationId.toLowerCase().includes(q) ||
        inc.sourceIps.some((ip) => ip.includes(q))
      );
    }

    // 2. Status Filter
    if (params.status && params.status !== 'ALL') {
      list = list.filter((inc) => inc.status === params.status);
    }

    // 3. Severity Filter
    if (params.severity && params.severity !== 'ALL') {
      list = list.filter((inc) => inc.severity === params.severity);
    }

    // 4. Category Filter
    if (params.category && params.category !== 'ALL') {
      list = list.filter((inc) => inc.category === params.category);
    }

    // 5. Station Filter
    if (params.stationId && params.stationId !== 'ALL') {
      list = list.filter(
        (inc) => inc.primaryStationId === params.stationId || inc.affectedStations.includes(params.stationId!)
      );
    }

    // 6. Assigned To Filter
    if (params.assignedTo && params.assignedTo !== 'ALL') {
      list = list.filter((inc) => inc.assignedTo?.email === params.assignedTo);
    }

    // 7. Date Range Filter
    if (params.startDate) {
      const startMs = new Date(params.startDate).getTime();
      list = list.filter((inc) => new Date(inc.createdAt).getTime() >= startMs);
    }
    if (params.endDate) {
      const endMs = new Date(params.endDate).getTime();
      list = list.filter((inc) => new Date(inc.createdAt).getTime() <= endMs);
    }

    // 8. Sorting
    const sortBy = params.sortBy || 'newest';
    const sortOrder = params.sortOrder || 'desc';

    list.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'newest' || sortBy === 'oldest') {
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        comparison = sortBy === 'newest' ? timeB - timeA : timeA - timeB;
      } else if (sortBy === 'severity') {
        const rank: Record<string, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
        comparison = (rank[b.severity] || 0) - (rank[a.severity] || 0);
      } else if (sortBy === 'riskScore') {
        comparison = b.riskScore - a.riskScore;
      }
      return sortOrder === 'asc' ? -comparison : comparison;
    });

    const total = list.length;
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.max(1, params.pageSize || 10);
    const totalPages = Math.ceil(total / pageSize) || 1;
    const items = list.slice((page - 1) * pageSize, page * pageSize);

    return { items, total, page, pageSize, totalPages };
  }

  public deleteIncident(id: string): boolean {
    const deleted = this.incidents.delete(id);
    if (deleted) this.saveIncidentsToDisk();
    return deleted;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Audit Trail Operations
  // ─────────────────────────────────────────────────────────────────────────────

  public recordAuditEvent(event: Omit<AuditEventRecord, 'id' | 'timestamp'>): AuditEventRecord {
    const record: AuditEventRecord = {
      ...event,
      id: `AUD-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      timestamp: new Date().toISOString(),
    };
    this.auditEvents.unshift(record);
    if (this.auditEvents.length > 2000) this.auditEvents.pop();
    this.saveAuditToDisk();
    return record;
  }

  public getAuditTrail(incidentId?: string, limit = 50): AuditEventRecord[] {
    if (incidentId) {
      return this.auditEvents.filter((e) => e.incidentId === incidentId).slice(0, limit);
    }
    return this.auditEvents.slice(0, limit);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Notification Operations
  // ─────────────────────────────────────────────────────────────────────────────

  public addNotification(item: Omit<IncidentNotificationItem, 'id' | 'timestamp' | 'read'>): IncidentNotificationItem {
    const notification: IncidentNotificationItem = {
      ...item,
      id: `NOTIF-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      timestamp: new Date().toISOString(),
      read: false,
    };
    this.notifications.unshift(notification);
    if (this.notifications.length > 500) this.notifications.pop();
    this.saveNotificationsToDisk();
    return notification;
  }

  public getNotifications(unreadOnly = false): IncidentNotificationItem[] {
    if (unreadOnly) {
      return this.notifications.filter((n) => !n.read);
    }
    return this.notifications;
  }

  public markNotificationAsRead(id: string): boolean {
    const notif = this.notifications.find((n) => n.id === id);
    if (notif) {
      notif.read = true;
      this.saveNotificationsToDisk();
      return true;
    }
    return false;
  }

  public markAllNotificationsAsRead(): void {
    for (const notif of this.notifications) {
      notif.read = true;
    }
    this.saveNotificationsToDisk();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Threat Intel Cache
  // ─────────────────────────────────────────────────────────────────────────────

  public getThreatIntelCache(indicator: string): ThreatIntelResult | null {
    return this.threatIntelCache.get(indicator) || null;
  }

  public setThreatIntelCache(result: ThreatIntelResult): void {
    this.threatIntelCache.set(result.indicator, result);
    this.saveThreatIntelToDisk();
  }
}

export const incidentStorageService = new IncidentStorageService();

