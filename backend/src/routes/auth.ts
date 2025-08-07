import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { AuthMiddleware } from '../middleware/auth';

const router = Router();
const authController = new AuthController();
const authMiddleware = new AuthMiddleware();


router.get('/slack', authController.initiateAuth);


router.get('/callback', authController.handleCallback);


router.get('/token', authController.exchangeToken);


router.get('/me', authMiddleware.authenticate, authController.getCurrentUser);

export default router;
