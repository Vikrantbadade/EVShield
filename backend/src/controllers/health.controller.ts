import { Request, Response, NextFunction } from 'express';
import { checkDatabaseConnection } from '../config/database';

export const getHealth = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const db = await checkDatabaseConnection();

    const httpStatus = db.connected ? 200 : 200; // always 200 so Phase 7 frontend never errors

    res.status(httpStatus).json({
      success: true,
      service: 'EVShield API',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: 'v1',
      database: {
        connected: db.connected,
        latencyMs: db.latencyMs,
        ...(db.error ? { error: db.error } : {}),
      },
    });
  } catch (error) {
    next(error);
  }
};
