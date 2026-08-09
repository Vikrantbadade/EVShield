import { Router } from 'express';
import { getDashboardSummary } from '../controllers/dashboard.controller.js';

const router = Router();

router.get('/', getDashboardSummary);

export default router;
