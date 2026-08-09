import { Request, Response, NextFunction } from 'express';
import { stationService } from '../services/station.service.js';
import { createSuccessResponse, createErrorResponse } from '../utils/apiResponse.js';

export const getStations = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await stationService.getStations();
    res.status(200).json(createSuccessResponse(result));
  } catch (error) {
    next(error);
  }
};

export const getStationById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const station = await stationService.getStationById(id);

    if (!station) {
      res.status(404).json(createErrorResponse('STATION_NOT_FOUND', `Station ${id} not found.`));
      return;
    }

    res.status(200).json(createSuccessResponse(station));
  } catch (error) {
    next(error);
  }
};
