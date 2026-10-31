import { Request, Response, NextFunction } from 'express';
import { mlEngineService } from '../services/ml-engine.service.js';
import { createSuccessResponse } from '../utils/apiResponse.js';
import { DetectionMethod } from '../types/ml.types.js';

export const getModelStatus = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const status = await mlEngineService.getStatus();
    res.status(200).json(createSuccessResponse(status));
  } catch (error) {
    next(error);
  }
};

export const getModelMetrics = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const comparison = await mlEngineService.getModelComparison();
    res.status(200).json(createSuccessResponse(comparison));
  } catch (error) {
    next(error);
  }
};

export const getModelComparison = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const comparison = await mlEngineService.getModelComparison();
    res.status(200).json(createSuccessResponse(comparison));
  } catch (error) {
    next(error);
  }
};

export const predict = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const prediction = await mlEngineService.predict(req.body || {});
    res.status(200).json(createSuccessResponse(prediction));
  } catch (error) {
    next(error);
  }
};

export const triggerEvaluation = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const report = await mlEngineService.triggerEvaluation();
    res.status(200).json(createSuccessResponse({
      message: 'Successfully re-evaluated all models on held-out test set.',
      report,
    }));
  } catch (error) {
    next(error);
  }
};

export const retrainModels = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const target = (req.body?.target || 'all') as string;
    const result = await mlEngineService.retrainModels(target);
    res.status(200).json(createSuccessResponse(result));
  } catch (error) {
    next(error);
  }
};

export const selectDetector = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { detector } = req.body;
    if (!['THRESHOLD', 'RANDOM_FOREST', 'ISOLATION_FOREST', 'ENSEMBLE'].includes(detector)) {
      res.status(400).json({ success: false, error: `Invalid detector '${detector}'. Must be THRESHOLD, RANDOM_FOREST, ISOLATION_FOREST, or ENSEMBLE.` });
      return;
    }
    mlEngineService.setActiveDetector(detector as DetectionMethod);
    res.status(200).json(createSuccessResponse({
      activeDetector: detector,
      message: `Active live anomaly detector set to ${detector}.`,
    }));
  } catch (error) {
    next(error);
  }
};

export const getActiveDetector = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const activeDetector = mlEngineService.getActiveDetector();
    res.status(200).json(createSuccessResponse({ activeDetector }));
  } catch (error) {
    next(error);
  }
};
