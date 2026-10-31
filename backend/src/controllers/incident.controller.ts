/**
 * EVShield Stage 3: Incident Management & Response Controller
 */

import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { incidentStorageService } from '../services/incident-storage.service.js';
import { incidentCorrelationService } from '../services/incident-correlation.service.js';
import { incidentAnalyticsService } from '../services/incident-analytics.service.js';
import { incidentReportService } from '../services/incident-report.service.js';
import { threatIntelligenceService } from '../services/threat-intelligence.service.js';
import { createSuccessResponse } from '../utils/apiResponse.js';
import {
  IncidentQuerySchema,
  UpdateIncidentStatusSchema,
  AssignAnalystSchema,
  AddInvestigationNoteSchema,
  UpdateResponseActionSchema,
  ThreatIntelConfigSchema,
  ThreatIntelLookupSchema,
} from '../schemas/incident.schema.js';

export const getIncidents = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validated = IncidentQuerySchema.parse(req.query);
    const result = incidentStorageService.queryIncidents(validated as any);
    res.status(200).json(createSuccessResponse(result));
  } catch (error) {
    next(error);
  }
};

export const getIncidentById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    let incident = incidentStorageService.getIncidentById(id);

    // If 'current' or 'latest', fetch the most recent active incident
    if (id === 'current' || id === 'latest') {
      const all = incidentStorageService.getAllIncidents();
      const active = all.find((i) => i.status === 'OPEN' || i.status === 'INVESTIGATING');
      incident = active || all[0] || null;
    }

    if (!incident) {
      res.status(404).json({ success: false, error: `Incident '${id}' not found.` });
      return;
    }

    res.status(200).json(createSuccessResponse(incident));
  } catch (error) {
    next(error);
  }
};

export const updateIncidentStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, notes } = UpdateIncidentStatusSchema.parse(req.body);

    const actor = {
      email: req.user?.email || 'analyst@evshield.demo',
      name: req.user?.name || 'Security Analyst',
      role: req.user?.role || 'security_analyst',
    };

    const updated = incidentCorrelationService.updateIncidentStatus(id, status, actor, notes);
    res.status(200).json(createSuccessResponse(updated));
  } catch (error) {
    next(error);
  }
};

export const assignAnalyst = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { analystEmail, analystName, analystRole } = AssignAnalystSchema.parse(req.body);

    const actor = {
      email: req.user?.email || 'admin@evshield.demo',
      name: req.user?.name || 'Admin',
      role: req.user?.role || 'admin',
    };

    const updated = incidentCorrelationService.assignAnalyst(
      id,
      { email: analystEmail, name: analystName, role: analystRole },
      actor
    );

    res.status(200).json(createSuccessResponse(updated));
  } catch (error) {
    next(error);
  }
};

export const addInvestigationNote = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { content } = AddInvestigationNoteSchema.parse(req.body);

    const actor = {
      email: req.user?.email || 'analyst@evshield.demo',
      name: req.user?.name || 'Security Analyst',
      role: req.user?.role || 'security_analyst',
    };

    const updated = incidentCorrelationService.addNote(id, content, actor);
    res.status(201).json(createSuccessResponse(updated));
  } catch (error) {
    next(error);
  }
};

export const updateResponseAction = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id, actionId } = req.params;
    const { status, notes } = UpdateResponseActionSchema.parse(req.body);

    const actor = {
      email: req.user?.email || 'analyst@evshield.demo',
      name: req.user?.name || 'Security Analyst',
      role: req.user?.role || 'security_analyst',
    };

    const updated = incidentCorrelationService.updateResponseAction(id, actionId, status, actor, notes);
    res.status(200).json(createSuccessResponse(updated));
  } catch (error) {
    next(error);
  }
};

export const getIncidentAnalytics = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const range = (req.query.range as any) || 'all';
    const analytics = incidentAnalyticsService.getAnalytics(range);
    res.status(200).json(createSuccessResponse(analytics));
  } catch (error) {
    next(error);
  }
};

export const getAuditTrail = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const incidentId = req.query.incidentId as string | undefined;
    const limit = Math.min(200, parseInt(req.query.limit as string || '50', 10));
    const events = incidentStorageService.getAuditTrail(incidentId, limit);
    res.status(200).json(createSuccessResponse(events));
  } catch (error) {
    next(error);
  }
};

export const getNotifications = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const unreadOnly = req.query.unread === 'true';
    const notifications = incidentStorageService.getNotifications(unreadOnly);
    res.status(200).json(createSuccessResponse(notifications));
  } catch (error) {
    next(error);
  }
};

export const markNotificationRead = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    if (id === 'all') {
      incidentStorageService.markAllNotificationsAsRead();
      res.status(200).json(createSuccessResponse({ marked: true }));
      return;
    }
    const marked = incidentStorageService.markNotificationAsRead(id);
    res.status(200).json(createSuccessResponse({ marked }));
  } catch (error) {
    next(error);
  }
};

export const exportIncidentPdf = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const incident = incidentStorageService.getIncidentById(id);
    if (!incident) {
      res.status(404).json({ success: false, error: `Incident '${id}' not found.` });
      return;
    }

    const pdfBuffer = incidentReportService.generateIncidentPdf(incident);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="EVShield_Incident_${incident.id}_Report.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.end(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

export const exportIncidentCsv = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const incident = incidentStorageService.getIncidentById(id);
    if (!incident) {
      res.status(404).json({ success: false, error: `Incident '${id}' not found.` });
      return;
    }

    const csvContent = incidentReportService.generateIncidentCsv(incident);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="EVShield_Incident_${incident.id}_Evidence.csv"`);
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

export const exportBulkCsv = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const incidents = incidentStorageService.getAllIncidents();
    const csvContent = incidentReportService.generateBulkIncidentsCsv(incidents);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="EVShield_Incidents_Master_Log.csv"');
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

export const lookupThreatIntel = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { indicator } = ThreatIntelLookupSchema.parse(req.query);
    const result = await threatIntelligenceService.lookupIndicator(indicator);
    res.status(200).json(createSuccessResponse(result));
  } catch (error) {
    next(error);
  }
};

export const getThreatIntelConfig = async (_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const config = threatIntelligenceService.getConfig();
    res.status(200).json(createSuccessResponse(config));
  } catch (error) {
    next(error);
  }
};

export const updateThreatIntelConfig = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validated = ThreatIntelConfigSchema.parse(req.body);
    const updated = threatIntelligenceService.updateConfig(validated);

    incidentStorageService.recordAuditEvent({
      actor: {
        email: req.user?.email || 'admin@evshield.demo',
        name: req.user?.name || 'Admin',
        role: req.user?.role || 'admin',
      },
      action: 'UPDATE_THREAT_INTEL_CONFIG',
      entityType: 'CONFIGURATION',
      details: `Threat intelligence provider set to ${updated.provider} (Auto-enrich: ${updated.autoEnrichEnabled}).`,
    });

    res.status(200).json(createSuccessResponse({ config: updated, message: 'Threat intelligence configuration updated.' }));
  } catch (error) {
    next(error);
  }
};
