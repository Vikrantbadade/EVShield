import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';

const router = Router();

router.post('/login', authController.login);
router.post('/signup', authController.signup);
router.get('/me', authController.me);
router.post('/logout', authController.logout);
router.get('/demo-accounts', authController.demoAccounts);

export default router;
