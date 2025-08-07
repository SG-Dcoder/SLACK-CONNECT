import { Router } from 'express';
import { MessageController } from '../controllers/messageController';
import { AuthMiddleware } from '../middleware/auth';

const router = Router();
const controller = new MessageController();
const auth = new AuthMiddleware();


router.use(auth.authenticate);

router.get('/channels', controller.listChannels);

router.post('/send', controller.sendMessage);

router.post('/schedule', controller.scheduleMessage);

router.get('/scheduled', controller.listScheduled);

router.delete('/scheduled/:id', controller.cancelScheduled);

export default router;
