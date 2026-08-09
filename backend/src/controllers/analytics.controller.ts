import { Request, Response, NextFunction } from 'express';
import { analyticsService } from '../services/analytics.service.js';
import { createSuccessResponse } from '../utils/apiResponse.js';

export const getAnalytics = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await analyticsService.getAnalytics();
    res.status(200).json(createSuccessResponse(result));
  } catch (error) {
    next(error);
  }
};
