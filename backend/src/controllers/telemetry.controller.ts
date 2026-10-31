import { Request, Response, NextFunction } from 'express';
import { telemetryService } from '../services/telemetry.service.js';
import { baselineService } from '../services/baseline.service.js';
import { anomalyDetectionService } from '../services/anomaly-detection.service.js';
import { createSuccessResponse } from '../utils/apiResponse.js';
import { IngestTelemetrySchema, SetSimulationConfigSchema, SetThresholdsSchema } from '../schemas/telemetry.schema.js';

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
    const validated = IngestTelemetrySchema.parse(req.body);
    if (validated.samples && validated.samples.length > 0) {
      telemetryService.recordSamples(validated.samples);
    } else if (validated.sample) {
      telemetryService.recordSample(validated.sample);
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
      message: 'Normal traffic simulation started successfully (~12 req/s).',
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

export const triggerScenario = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { scenario } = req.params;
    let message = '';

    switch (scenario) {
      case 'burst':
        telemetryService.triggerTrafficBurst();
        message = 'Triggered sudden traffic burst anomaly.';
        break;
      case 'connection-rate':
        telemetryService.simulateHighConnectionRate();
        message = 'Triggered high connection creation rate anomaly.';
        break;
      case 'repeated-requests':
        telemetryService.simulateRepeatedRequests();
        message = 'Triggered repeated bot request replay anomaly.';
        break;
      case 'packet-rate':
        telemetryService.simulateAbnormalPacketRate();
        message = 'Triggered abnormal packet rate surge anomaly.';
        break;
      case 'data-volume':
        telemetryService.simulateExcessiveDataTransfer();
        message = 'Triggered excessive data transfer volume anomaly.';
        break;
      case 'duration':
        telemetryService.simulateUnusualConnectionDuration();
        message = 'Triggered unusual connection duration / latency drift anomaly.';
        break;
      case 'prolonged':
        telemetryService.simulateProlongedAbnormalTraffic();
        message = 'Triggered prolonged abnormal traffic simulation.';
        break;
      case 'combined':
        telemetryService.simulateCombinedAnomaly();
        message = 'Triggered combined multi-feature traffic anomaly.';
        break;
      case 'return-to-normal':
        telemetryService.returnToNormal();
        message = 'Restored nominal baseline traffic.';
        break;
      default:
        res.status(400).json({ error: `Unknown scenario '${scenario}'.` });
        return;
    }

    const snapshot = telemetryService.getLiveSnapshot();
    res.status(200).json(createSuccessResponse({ message, snapshot }));
  } catch (error) {
    next(error);
  }
};

export const setSimulationIntensity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { intensity, targetRps } = SetSimulationConfigSchema.parse(req.body);
    if (intensity) {
      telemetryService.configureIntensity(intensity, targetRps);
    }
    const snapshot = telemetryService.getLiveSnapshot();
    res.status(200).json(createSuccessResponse({
      message: `Simulation intensity configured to ${intensity || 'custom'}.`,
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
      message: 'System and telemetry counters reset successfully to baseline.',
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

export const getBaseline = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const baseline = baselineService.getBaseline();
    res.status(200).json(createSuccessResponse(baseline));
  } catch (error) {
    next(error);
  }
};

export const resetBaseline = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    baselineService.reset();
    const baseline = baselineService.getBaseline();
    res.status(200).json(createSuccessResponse({ message: 'Baseline reset to default nominal statistics.', baseline }));
  } catch (error) {
    next(error);
  }
};

export const getThresholds = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const thresholds = anomalyDetectionService.getThresholds();
    res.status(200).json(createSuccessResponse(thresholds));
  } catch (error) {
    next(error);
  }
};

export const updateThresholds = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validated = SetThresholdsSchema.parse(req.body);
    if (validated.sensitivity) {
      anomalyDetectionService.setSensitivity(validated.sensitivity);
    }
    anomalyDetectionService.updateThresholds(validated);
    const thresholds = anomalyDetectionService.getThresholds();
    res.status(200).json(createSuccessResponse({ message: 'Anomaly detection thresholds updated.', thresholds }));
  } catch (error) {
    next(error);
  }
};

export const getAnomalyAlerts = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const alerts = anomalyDetectionService.getAlertHistory();
    res.status(200).json(createSuccessResponse({ items: alerts, total: alerts.length }));
  } catch (error) {
    next(error);
  }
};

export const enableAutoDemo = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { intervalSeconds, durationSeconds, scenario } = req.body || {};
    const config = telemetryService.enableAutoDemo(intervalSeconds, durationSeconds, scenario);
    const snapshot = telemetryService.getLiveSnapshot();
    res.status(200).json(createSuccessResponse({
      message: 'Automatic demo simulation enabled.',
      config,
      snapshot,
    }));
  } catch (error) {
    next(error);
  }
};

export const disableAutoDemo = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const config = telemetryService.disableAutoDemo();
    const snapshot = telemetryService.getLiveSnapshot();
    res.status(200).json(createSuccessResponse({
      message: 'Automatic demo simulation disabled.',
      config,
      snapshot,
    }));
  } catch (error) {
    next(error);
  }
};

export const getAutoDemoStatus = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const config = telemetryService.getAutoDemoConfig();
    res.status(200).json(createSuccessResponse({ config }));
  } catch (error) {
    next(error);
  }
};

export const selectDetector = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { detector, method } = req.body || {};
    const selected = (detector || method) as any;
    if (!['THRESHOLD', 'RANDOM_FOREST', 'ISOLATION_FOREST', 'ENSEMBLE'].includes(selected)) {
      res.status(400).json({ error: 'Invalid detector. Must be THRESHOLD, RANDOM_FOREST, ISOLATION_FOREST, or ENSEMBLE' });
      return;
    }
    telemetryService.setActiveDetector(selected);
    const snapshot = telemetryService.getLiveSnapshot();
    res.status(200).json(createSuccessResponse({ activeDetector: selected, snapshot }));
  } catch (error) {
    next(error);
  }
};

export const getActiveDetector = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const active = telemetryService.getActiveDetector();
    res.status(200).json(createSuccessResponse({ activeDetector: active }));
  } catch (error) {
    next(error);
  }
};
