import { Request, Response, NextFunction } from 'express';
import { telemetryService } from '../services/telemetry.service.js';
import { createSuccessResponse } from '../utils/apiResponse.js';

export const getLiveTelemetry = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const snapshot = telemetryService.getLiveSnapshot();
    res.status(200).json(createSuccessResponse(snapshot));
  } catch (error) {
    next(error);
  }
};

export const ingestTelemetry = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { sample, samples } = req.body;
    if (Array.isArray(samples) && samples.length > 0) {
      telemetryService.recordSamples(samples);
    } else if (sample) {
      telemetryService.recordSample(sample);
    }
    res.status(200).json(createSuccessResponse({ ingested: true }));
  } catch (error) {
    next(error);
  }
};

export const startNormalTraffic = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    telemetryService.startNormalTraffic();
    const snapshot = telemetryService.getLiveSnapshot();
    res.status(200).json(createSuccessResponse({
      message: 'Normal traffic simulation started successfully.',
      snapshot,
    }));
  } catch (error) {
    next(error);
  }
};

export const startAttackSimulation = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    telemetryService.startAttackSimulation();
    const snapshot = telemetryService.getLiveSnapshot();
    res.status(200).json(createSuccessResponse({
      message: 'Attack simulation started successfully (DDoS authentication burst).',
      snapshot,
    }));
  } catch (error) {
    next(error);
  }
};

export const stopTraffic = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    telemetryService.stopTraffic();
    const snapshot = telemetryService.getLiveSnapshot();
    res.status(200).json(createSuccessResponse({
      message: 'Traffic simulation stopped successfully.',
      snapshot,
    }));
  } catch (error) {
    next(error);
  }
};

export const resetDemo = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    telemetryService.reset();
    const snapshot = telemetryService.getLiveSnapshot();
    res.status(200).json(createSuccessResponse({
      message: 'System and telemetry counters reset successfully.',
      snapshot,
    }));
  } catch (error) {
    next(error);
  }
};

export const executeMitigation = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await telemetryService.executeMitigation();
    const snapshot = telemetryService.getLiveSnapshot();
    res.status(200).json(createSuccessResponse({
      ...result,
      snapshot,
    }));
  } catch (error) {
    next(error);
  }
};

export const getActiveIncident = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.query.id ? String(req.query.id) : undefined;
    const incident = telemetryService.getForensicIncident(id);
    res.status(200).json(createSuccessResponse(incident));
  } catch (error) {
    next(error);
  }
};

