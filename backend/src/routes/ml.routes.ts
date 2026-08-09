import { Router } from 'express';
import { getModelStatus, getModelMetrics, predict } from '../controllers/ml.controller.js';
import { validateBody } from '../middleware/validation.middleware.js';
import { mlPredictionRequestSchema } from '../schemas/ml.schema.js';

const router = Router();

router.get('/status', getModelStatus);
router.get('/metrics', getModelMetrics);
router.post('/predict', validateBody(mlPredictionRequestSchema), predict);

export default router;
