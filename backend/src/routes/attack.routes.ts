import { Router } from 'express';
import { getAttacks, getAttackById, getCurrentAttack, mitigateAttack } from '../controllers/attack.controller.js';

const router = Router();

router.get('/', getAttacks);
router.get('/current', getCurrentAttack);
router.post('/mitigate', mitigateAttack);
router.post('/:id/mitigate', mitigateAttack);
router.get('/:id', getAttackById);

export default router;
