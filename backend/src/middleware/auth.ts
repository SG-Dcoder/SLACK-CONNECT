import { Request, Response, NextFunction } from 'express';
import { JwtService } from '../services/jwtService';
import { UserModel } from '../models/User';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        slackUserId: string;
        teamId: string;
        accessToken: string;
      };
    }
  }
}

export class AuthMiddleware {
  private jwtService = new JwtService();
  private userModel = new UserModel();

  authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Don't authenticate /auth/token route (allow access)
      if (req.path === '/auth/token') {
        next();
        return;
      }

      const token = this.jwtService.extractTokenFromHeader(req.headers.authorization);
      if (!token) {
        res.status(401).json({ error: 'Access token required' });
        return;
      }

      const payload = this.jwtService.verifyAccessToken(token);
      const user = await this.userModel.findBySlackUserId(payload.slackUserId);
      if (!user) {
        res.status(401).json({ error: 'User not found' });
        return;
      }

      req.user = {
        id: user.id,
        slackUserId: user.slackUserId,
        teamId: user.teamId,
        accessToken: user.accessToken,
      };

      next();
    } catch (error) {
      console.error('Authentication error:', error);
      res.status(401).json({ error: 'Invalid token' });
    }
  };
}
