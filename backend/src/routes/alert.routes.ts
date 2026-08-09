import { Router } from 'express';
import { getAlerts, getAlertById } from '../controllers/alert.controller.js';

const router = Router();

router.get('/', getAlerts);
router.get('/:id', getAlertById);

export default router;
