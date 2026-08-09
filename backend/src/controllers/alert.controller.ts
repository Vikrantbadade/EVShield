import { Request, Response, NextFunction } from 'express';
import { alertService } from '../services/alert.service.js';
import { createSuccessResponse, createErrorResponse } from '../utils/apiResponse.js';

export const getAlerts = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await alertService.getAlerts();
    res.status(200).json(createSuccessResponse(result));
  } catch (error) {
    next(error);
  }
};

export const getAlertById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const alert = await alertService.getAlertById(id);

    if (!alert) {
      res.status(404).json(createErrorResponse('ALERT_NOT_FOUND', `Alert ${id} not found.`));
      return;
    }

    res.status(200).json(createSuccessResponse(alert));
  } catch (error) {
    next(error);
  }
};
