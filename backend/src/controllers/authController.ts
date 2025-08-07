import { Request, Response } from 'express';
import { SlackService } from '../services/slackServices';
import { JwtService } from '../services/jwtService';
import { UserModel } from '../models/User';
import { v4 as uuidv4 } from 'uuid';

export class AuthController {
  private slackService = new SlackService();
  private jwtService = new JwtService();
  private userModel = new UserModel();

  // Start OAuth flow: redirect user to Slack's consent screen with state parameter
  initiateAuth = (_req: Request, res: Response): void => {
    const state = uuidv4(); // generate unique state for CSRF protection
    const authUrl = this.slackService.generateOAuthUrl(state);
    // TODO: Store and verify 'state' in production for security against CSRF attacks
    res.redirect(authUrl);
  };

  // Handle Slack OAuth callback: exchange code for tokens, upsert user, then redirect to frontend
  handleCallback = async (req: Request, res: Response): Promise<void> => {
    try {
      const { code, state } = req.query;

      if (!code) {
        res.status(400).json({ error: 'Authorization code missing' });
        return;
      }

      const tokenResponse = await this.slackService.exchangeCodeForToken(code as string);

      if (!tokenResponse.ok) {
        res.status(400).json({ error: 'Failed to get access token from Slack' });
        return;
      }

      // Upsert user in DB
      let user = await this.userModel.findBySlackUserId(tokenResponse.authed_user.id);

      if (user) {
        await this.userModel.updateTokens(
          tokenResponse.authed_user.id,
          tokenResponse.access_token,
          tokenResponse.refresh_token,
          tokenResponse.expires_in ? new Date(Date.now() + tokenResponse.expires_in * 1000) : undefined
        );
        user = await this.userModel.findBySlackUserId(tokenResponse.authed_user.id);
      } else {
        user = await this.userModel.create({
          slackUserId: tokenResponse.authed_user.id,
          teamId: tokenResponse.team.id,
          accessToken: tokenResponse.access_token,
          refreshToken: tokenResponse.refresh_token,
          tokenExpiry: tokenResponse.expires_in ? new Date(Date.now() + tokenResponse.expires_in * 1000) : undefined,
        });
      }

      const frontendBaseUrl = process.env.FRONTEND_BASE_URL || 'http://localhost:3000';
      let redirectUrl = `${frontendBaseUrl}/auth/callback?code=${encodeURIComponent(code as string)}`;

      if (typeof state === 'string') {
        redirectUrl += `&state=${encodeURIComponent(state)}`;
      }

      res.redirect(redirectUrl);
    } catch (error) {
      console.error('OAuth callback error:', error);
      res.status(500).json({ error: 'Authentication failed' });
    }
  };

  // Frontend calls this endpoint to exchange OAuth code for JWT tokens and user info
  exchangeToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const { code } = req.query;
      if (!code) {
        res.status(400).json({ error: 'Authorization code missing' });
        return;
      }

      console.log('ExchangeToken: Starting Slack token exchange with code:', code);

      const tokenResponse = await this.slackService.exchangeCodeForToken(code as string);

      console.log('ExchangeToken: Slack token response:', tokenResponse);

      if (!tokenResponse.ok) {
        res.status(400).json({ error: 'Failed to get access token from Slack' });
        return;
      }

      let user;
      try {
        user = await this.userModel.findBySlackUserId(tokenResponse.authed_user.id);
        console.log('ExchangeToken: User lookup result:', user);
      } catch (dbLookupError) {
        console.error('ExchangeToken: DB error during user lookup:', dbLookupError);
        res.status(500).json({ error: 'Database error during user lookup' });
        return;
      }

      try {
        if (user) {
          await this.userModel.updateTokens(
            tokenResponse.authed_user.id,
            tokenResponse.access_token,
            tokenResponse.refresh_token,
            tokenResponse.expires_in ? new Date(Date.now() + tokenResponse.expires_in * 1000) : undefined
          );
          user = await this.userModel.findBySlackUserId(tokenResponse.authed_user.id);
          console.log('ExchangeToken: Updated existing user tokens');
        } else {
          user = await this.userModel.create({
            slackUserId: tokenResponse.authed_user.id,
            teamId: tokenResponse.team.id,
            accessToken: tokenResponse.access_token,
            refreshToken: tokenResponse.refresh_token,
            tokenExpiry: tokenResponse.expires_in ? new Date(Date.now() + tokenResponse.expires_in * 1000) : undefined,
          });
          console.log('ExchangeToken: Created new user:', user);
        }
      } catch (dbSaveError) {
        console.error('ExchangeToken: DB error during user create/update:', dbSaveError);
        res.status(500).json({ error: 'Database error during user creation/updating' });
        return;
      }

      try {
        const jwtPayload = {
          userId: user!.id,
          slackUserId: user!.slackUserId,
          teamId: user!.teamId,
        };

        const accessToken = this.jwtService.generateAccessToken(jwtPayload);
        const refreshToken = this.jwtService.generateRefreshToken(jwtPayload);

        console.log('ExchangeToken: JWT tokens generated successfully');

        res.json({
          message: 'Authentication successful',
          user: {
            id: user!.id,
            slackUserId: user!.slackUserId,
            teamId: user!.teamId,
          },
          accessToken,
          refreshToken,
        });
      } catch (jwtError) {
        console.error('ExchangeToken: JWT generation error:', jwtError);
        res.status(500).json({ error: 'JWT token generation failed' });
      }
    } catch (unexpectedError) {
      console.error('ExchangeToken: Unexpected error:', unexpectedError);
      res.status(500).json({ error: 'Failed to exchange token' });
    }
  };

  // Protected route to get current user info added by auth middleware
  getCurrentUser = async (_req: Request, res: Response): Promise<void> => {
    try {
      res.json({ user: (_req as any).user });
    } catch (error) {
      console.error('Get current user error:', error);
      res.status(500).json({ error: 'Failed to get user info' });
    }
  };
}
