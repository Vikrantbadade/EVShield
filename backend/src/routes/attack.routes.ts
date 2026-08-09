import { Router } from 'express';
import { getAttacks, getAttackById } from '../controllers/attack.controller.js';

const router = Router();

router.get('/', getAttacks);
router.get('/:id', getAttackById);

export default router;
