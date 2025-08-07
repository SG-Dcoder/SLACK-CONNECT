import * as jwt from 'jsonwebtoken';  

export interface JwtPayload {
  userId: string;
  slackUserId: string;
  teamId: string;
  iat?: number;
  exp?: number;
}

export class JwtService {
  private accessTokenSecret: jwt.Secret;
  private refreshTokenSecret: jwt.Secret;
  private accessTokenExpiry: jwt.SignOptions['expiresIn'] = '15m';
  private refreshTokenExpiry: jwt.SignOptions['expiresIn'] = '7d';

  constructor() {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET environment variable is required');
    }
    if (!process.env.JWT_REFRESH_SECRET) {
      throw new Error('JWT_REFRESH_SECRET environment variable is required');
    }

    this.accessTokenSecret = process.env.JWT_SECRET;
    this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET;
  }

  generateAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
    return jwt.sign(
      payload,
      this.accessTokenSecret,
      { expiresIn: this.accessTokenExpiry }
    );
  }

  generateRefreshToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
    return jwt.sign(
      payload,
      this.refreshTokenSecret,
      { expiresIn: this.refreshTokenExpiry }
    );
  }

  verifyAccessToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, this.accessTokenSecret) as JwtPayload;
    } catch {
      throw new Error('Invalid access token');
    }
  }

  verifyRefreshToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, this.refreshTokenSecret) as JwtPayload;
    } catch {
      throw new Error('Invalid refresh token');
    }
  }

  extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader) return null;
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
    return parts[1];
  }
}
