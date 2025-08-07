import { Router } from 'express';
import { MessageController } from '../controllers/messageController';
import { AuthMiddleware } from '../middleware/auth';

const router = Router();
const controller = new MessageController();
const auth = new AuthMiddleware();

// Protect all message routes
router.use(auth.authenticate);

// List channels
router.get('/channels', controller.listChannels);

// Immediate send
router.post('/send', controller.sendMessage);

// Schedule for later
router.post('/schedule', controller.scheduleMessage);

// List scheduled
router.get('/scheduled', controller.listScheduled);

// Cancel scheduled
router.delete('/scheduled/:id', controller.cancelScheduled);

export default router;
