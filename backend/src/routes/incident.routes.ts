/**
 * EVShield Stage 3: Incident Management & Response Routes
 */

import { Router } from 'express';
import {
  getIncidents,
  getIncidentById,
  updateIncidentStatus,
  assignAnalyst,
  addInvestigationNote,
  updateResponseAction,
  getIncidentAnalytics,
  getAuditTrail,
  getNotifications,
  markNotificationRead,
  exportIncidentPdf,
  exportIncidentCsv,
  exportBulkCsv,
  lookupThreatIntel,
  getThreatIntelConfig,
  updateThreatIntelConfig,
} from '../controllers/incident.controller.js';
import { requireRole } from '../middleware/auth.middleware.js';

const router = Router();

// Analytics & Reports
router.get('/analytics', getIncidentAnalytics);
router.get('/export/csv', exportBulkCsv);

// Audit & Notifications
router.get('/audit', getAuditTrail);
router.get('/notifications', getNotifications);
router.patch('/notifications/:id/read', markNotificationRead);

// Threat Intelligence
router.get('/threat-intel/lookup', lookupThreatIntel);
router.get('/threat-intel/config', getThreatIntelConfig);
router.post('/threat-intel/config', requireRole(['admin']), updateThreatIntelConfig);

// Incident Queries
router.get('/', getIncidents);
router.get('/:id', getIncidentById);
router.get('/:id/report/pdf', exportIncidentPdf);
router.get('/:id/report/csv', exportIncidentCsv);

// Protected Incident Modifications (Role-Based Access Control)
router.patch('/:id/status', requireRole(['admin', 'security_analyst', 'soc_operator']), updateIncidentStatus);
router.patch('/:id/assign', requireRole(['admin', 'security_analyst']), assignAnalyst);
router.post('/:id/notes', requireRole(['admin', 'security_analyst', 'soc_operator']), addInvestigationNote);
router.patch('/:id/actions/:actionId', requireRole(['admin', 'security_analyst', 'soc_operator']), updateResponseAction);

export default router;

