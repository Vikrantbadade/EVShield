import { Request, Response, NextFunction } from 'express';
import { dashboardService } from '../services/dashboard.service.js';
import { createSuccessResponse } from '../utils/apiResponse.js';

export const getDashboardSummary = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const summary = await dashboardService.getDashboardSummary();
    res.status(200).json(createSuccessResponse(summary));
  } catch (error) {
    next(error);
  }
};
