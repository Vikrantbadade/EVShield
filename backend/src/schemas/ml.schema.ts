import { z } from 'zod';

/**
 * Provisional validation schema for ML prediction request body.
 * Passthrough allows arbitrary network feature vectors to be passed
 * once the ML engineer's dataset features are finalized.
 */
export const mlPredictionRequestSchema = z
  .object({
    flowDuration: z.number().optional(),
    totalFwdPackets: z.number().optional(),
    totalBackwardPackets: z.number().optional(),
    requestsPerSecond: z.number().optional(),
    sourceIp: z.string().optional(),
    targetNodeId: z.string().optional(),
  })
  .passthrough();
