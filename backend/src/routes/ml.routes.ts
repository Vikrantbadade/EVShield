import { Router } from 'express';
import {
  getModelStatus,
  getModelMetrics,
  getModelComparison,
  predict,
  triggerEvaluation,
  retrainModels,
  selectDetector,
  getActiveDetector,
} from '../controllers/ml.controller.js';
import { validateBody } from '../middleware/validation.middleware.js';
import { mlPredictionRequestSchema } from '../schemas/ml.schema.js';

const router = Router();

router.get('/status', getModelStatus);
router.get('/metrics', getModelMetrics);
router.get('/comparison', getModelComparison);
router.post('/predict', validateBody(mlPredictionRequestSchema), predict);
router.post('/evaluate', triggerEvaluation);
router.post('/retrain', retrainModels);
router.post('/select-detector', selectDetector);
router.get('/active-detector', getActiveDetector);

export default router;
