import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { AuthMiddleware } from '../middleware/auth';

const router = Router();
const authController = new AuthController();
const authMiddleware = new AuthMiddleware();

// Start OAuth flow
router.get('/slack', authController.initiateAuth);

// OAuth Slack redirects here — backend exchanges token & redirects to frontend
router.get('/callback', authController.handleCallback);

// New route: frontend calls here to exchange code for tokens (returns JSON)
router.get('/token', authController.exchangeToken);

// Get current user (protected route)
router.get('/me', authMiddleware.authenticate, authController.getCurrentUser);

// Add this line to your auth routes for testing
//router.get('/test-token', authController.generateTestToken);


export default router;
