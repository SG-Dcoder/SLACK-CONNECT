export interface User {
  id: string;
  slackUserId: string;
  teamId: string;
  accessToken: string;
  refreshToken?: string;
  tokenExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScheduledMessage {
  id: string;
  userId: string;
  channel: string;
  message: string;
  scheduledAt: Date;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  slackMessageId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SlackChannel {
  id: string;
  name: string;
  isChannel: boolean;
  isPrivate: boolean;
}
