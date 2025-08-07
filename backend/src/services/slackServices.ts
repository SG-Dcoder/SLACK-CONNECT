// src/services/slackServices.ts

import axios from 'axios';
import { WebClient } from '@slack/web-api';

export interface SlackOAuthResponse {
  ok: boolean;
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  team: { id: string; name: string };
  authed_user: { id: string; access_token?: string; refresh_token?: string; expires_in?: number };
}

export class SlackService {
  private clientId = process.env.SLACK_CLIENT_ID!;
  private clientSecret = process.env.SLACK_CLIENT_SECRET!;
  private redirectUri = process.env.SLACK_REDIRECT_URI!;

  generateOAuthUrl(state?: string): string {
    const scopes = [
      'channels:read',
      'chat:write',
      'chat:write.public',
      'groups:read',
      'im:read',
      'users:read',
    ].join(',');
    const params = new URLSearchParams({
      client_id: this.clientId,
      scope: scopes,
      redirect_uri: this.redirectUri,
    });
    if (state) {
      params.append('state', state);
    }
    return `https://slack.com/oauth/v2/authorize?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string): Promise<SlackOAuthResponse> {
    const params = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      code,
      redirect_uri: this.redirectUri,
    });

    const response = await axios.post<SlackOAuthResponse>(
      'https://slack.com/api/oauth.v2.access',
      params.toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    if (!response.data.ok) {
      throw new Error(`Slack OAuth error: ${JSON.stringify(response.data)}`);
    }

    return response.data;
  }

  // Refresh an expired Slack token
  async refreshAccessToken(refreshToken: string): Promise<SlackOAuthResponse> {
    const params = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      redirect_uri: this.redirectUri,
    });

    const response = await axios.post<SlackOAuthResponse>(
      'https://slack.com/api/oauth.v2.access',
      params.toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    if (!response.data.ok) {
      throw new Error(`Slack token refresh error: ${JSON.stringify(response.data)}`);
    }

    return response.data;
  }

  // Create a Slack WebClient for API calls
  getClient(accessToken: string): WebClient {
    return new WebClient(accessToken);
  }

  // List the authenticated user’s channels
  async getChannels(accessToken: string) {
    const result = await this.getClient(accessToken).conversations.list({
      types: 'public_channel,private_channel',
      exclude_archived: true,
    });
    return result.channels || [];
  }

  // Send a message immediately
  async sendMessage(accessToken: string, channel: string, text: string) {
    return this.getClient(accessToken).chat.postMessage({ channel, text });
  }

  // Schedule a message for future delivery
  async scheduleMessage(accessToken: string, channel: string, text: string, postAt: Date) {
    return this.getClient(accessToken).chat.scheduleMessage({
      channel,
      text,
      post_at: Math.floor(postAt.getTime() / 1000),
    });
  }
}
