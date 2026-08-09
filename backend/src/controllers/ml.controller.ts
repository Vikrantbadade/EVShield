import { Request, Response, NextFunction } from 'express';
import { mlService } from '../services/ml.service.js';
import { createSuccessResponse } from '../utils/apiResponse.js';

export const getModelStatus = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const status = await mlService.getModelStatus();
    res.status(200).json(createSuccessResponse(status));
  } catch (error) {
    next(error);
  }
};

export const getModelMetrics = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const metrics = await mlService.getModelMetrics();
    res.status(200).json(createSuccessResponse(metrics));
  } catch (error) {
    next(error);
  }
};

export const predict = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const prediction = await mlService.predict(req.body || {});
    res.status(200).json(createSuccessResponse(prediction));
  } catch (error) {
    next(error);
  }
};
