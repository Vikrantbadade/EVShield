import { z } from 'zod';

export const RawTelemetrySampleSchema = z.object({
  timestamp: z.number().int().positive().optional().default(() => Date.now()),
  endpoint: z.string().min(1).default('/api/auth'),
  method: z.string().min(1).default('POST'),
  statusCode: z.number().int().min(100).max(599).default(200),
  latencyMs: z.number().nonnegative().default(10),
  bytesTransferred: z.number().nonnegative().optional().default(512),
  packetCount: z.number().int().nonnegative().optional().default(4),
  activeConnections: z.number().int().nonnegative().optional().default(1),
  newConnections: z.number().int().nonnegative().optional().default(1),
  sourceIp: z.string().default('127.0.0.1'),
  destination: z.string().default('127.0.0.1:8080'),
  trafficCategory: z.enum([
    'NORMAL',
    'TRAFFIC_BURST',
    'HIGH_CONNECTION_RATE',
    'REPEATED_REQUESTS',
    'ABNORMAL_PACKET_RATE',
    'EXCESSIVE_DATA_TRANSFER',
    'UNUSUAL_CONNECTION_DURATION',
    'UNEXPECTED_USAGE_CHANGE',
    'COMBINED_ANOMALY',
    'PROLONGED_ABNORMAL',
  ]).optional().default('NORMAL'),
  payloadBytes: z.number().nonnegative().optional(),
  metricValue: z.number().optional().default(2.5),
  isSimulated: z.boolean().optional().default(true),
  success: z.boolean().optional(),
});

export const IngestTelemetrySchema = z.object({
  samples: z.array(RawTelemetrySampleSchema).optional(),
  sample: RawTelemetrySampleSchema.optional(),
}).refine((data) => data.samples !== undefined || data.sample !== undefined, {
  message: 'Must provide either "samples" array or "sample" object',
});

export const SetSimulationConfigSchema = z.object({
  mode: z.enum([
    'IDLE',
    'NORMAL',
    'BURST',
    'HIGH_CONN_RATE',
    'REPEATED_REQUESTS',
    'HIGH_VOLUME',
    'PROLONGED_ABNORMAL',
    'COMBINED',
  ]).optional(),
  intensity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'EXTREME']).optional(),
  targetRps: z.number().min(1).max(1000).optional(),
  payloadSizeBytes: z.number().min(100).max(10000000).optional(),
  newConnectionsPerBatch: z.number().min(1).max(500).optional(),
  repeatedRequestFactor: z.number().min(1).max(100).optional(),
});

export const SetThresholdsSchema = z.object({
  sensitivity: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  burstMultiplier: z.number().min(1.1).max(20).optional(),
  connRateMultiplier: z.number().min(1.1).max(20).optional(),
  dataVolumeMultiplier: z.number().min(1.1).max(20).optional(),
  packetRateMultiplier: z.number().min(1.1).max(20).optional(),
  durationMultiplier: z.number().min(1.1).max(20).optional(),
  repeatedRequestThreshold: z.number().min(2).max(500).optional(),
  zScoreThreshold: z.number().min(1.0).max(10.0).optional(),
});
