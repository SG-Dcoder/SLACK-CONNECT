import cron from 'node-cron';
//import DatabaseConnection from '../database/connection';
import { ScheduledMessageModel } from '../models/ScheduledMessage';
import { SlackService } from '../services/slackServices';

const scheduledModel = new ScheduledMessageModel();
const slackService = new SlackService();

// Every minute, check for messages to send
export function startScheduler() {
  cron.schedule('* * * * *', async () => {
    const pending = await scheduledModel.findReadyToSend();
    for (const msg of pending) {
      try {
        const sent = await slackService.sendMessage(msg.channel, msg.channel, msg.message);
        await scheduledModel.updateStatus(msg.id, 'sent', sent.ts);
      } catch {
        await scheduledModel.updateStatus(msg.id, 'failed');
      }
    }
  });
}
