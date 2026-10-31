/**
 * EVShield Stage 3: Incident Management Validation Schemas
 */

import { z } from 'zod';

export const IncidentQuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum(['OPEN', 'INVESTIGATING', 'CONTAINED', 'RESOLVED', 'CLOSED', 'ALL']).optional(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'ALL']).optional(),
  category: z.enum([
    'TRAFFIC_BURST',
    'HIGH_CONNECTION_RATE',
    'REPEATED_REQUESTS',
    'EXCESSIVE_DATA',
    'UNUSUAL_LATENCY',
    'COMBINED_ANOMALY',
    'DDOS',
    'UNKNOWN',
    'ALL',
  ]).optional(),
  stationId: z.string().optional(),
  assignedTo: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sortBy: z.enum(['newest', 'oldest', 'severity', 'riskScore']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(10),
});

export const UpdateIncidentStatusSchema = z.object({
  status: z.enum(['OPEN', 'INVESTIGATING', 'CONTAINED', 'RESOLVED', 'CLOSED']),
  notes: z.string().max(2000).optional(),
});

export const AssignAnalystSchema = z
  .object({
    email: z.string().email().optional(),
    name: z.string().optional(),
    role: z.string().optional(),
    analystEmail: z.string().email().optional(),
    analystName: z.string().optional(),
    analystRole: z.string().optional(),
  })
  .transform((data) => ({
    analystEmail: data.analystEmail || data.email || 'analyst@evshield.demo',
    analystName: data.analystName || data.name || 'Security Analyst',
    analystRole: data.analystRole || data.role || 'security_analyst',
  }));

export const AddInvestigationNoteSchema = z.object({
  content: z.string().min(1, 'Note content cannot be empty').max(3000),
});

export const UpdateResponseActionSchema = z.object({
  status: z.enum(['PENDING', 'COMPLETED', 'DISMISSED']),
  notes: z.string().max(1000).optional(),
});

export const ThreatIntelConfigSchema = z.object({
  provider: z.enum(['MOCK_SANDBOX', 'ABUSE_IPDB', 'VIRUSTOTAL', 'ALIENVAULT', 'DISABLED']).optional(),
  apiKey: z.string().optional(),
  autoEnrichEnabled: z.boolean().optional(),
});

export const ThreatIntelLookupSchema = z.object({
  indicator: z.string().min(1, 'Indicator IP or domain is required'),
});
