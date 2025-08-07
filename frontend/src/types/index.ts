export interface Channel {
  id: string;
  name: string;
}

export type ScheduledMessageStatus = 'pending' | 'sent' | 'cancelled' | 'failed';

export interface ScheduledMessage {
  id: string;
  channel: string;
  message: string;
  scheduledAt: string;
  status: ScheduledMessageStatus;
}
