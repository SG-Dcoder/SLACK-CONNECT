// src/controllers/messageController.ts

import { Request, Response } from 'express';
import { SlackService } from '../services/slackServices';
import { ScheduledMessageModel } from '../models/ScheduledMessage';

export class MessageController {
  private slackService = new SlackService();
  private scheduledMessageModel = new ScheduledMessageModel();

  // List Slack channels
  listChannels = async (req: Request, res: Response) => {
    try {
      const accessToken = req.user!.accessToken;
      const channels = await this.slackService.getChannels(accessToken);
      res.json({ channels });
    } catch (error) {
      console.error('List channels error:', error);
      res.status(500).json({ error: 'Failed to list channels' });
    }
  };

  // Send immediate message
  sendMessage = async (req: Request, res: Response) => {
    try {
      const { channel, text } = req.body;
      const accessToken = req.user!.accessToken;
      const result = await this.slackService.sendMessage(accessToken, channel, text);
      res.json({ message: result });
    } catch (error) {
      console.error('Send message error:', error);
      res.status(500).json({ error: 'Failed to send message' });
    }
  };

  // Schedule message - FIXED VERSION
  scheduleMessage = async (req: Request, res: Response) => {
    try {
      const { channel, text, scheduledAt } = req.body;
      const userId = req.user!.id;
      const accessToken = req.user!.accessToken;

      console.log('Scheduling message:', { channel, text, scheduledAt, userId });

      // Validate scheduled time is in the future
      const scheduleDate = new Date(scheduledAt);
      const now = new Date();
      
      if (scheduleDate <= now) {
        return res.status(400).json({ error: 'Scheduled time must be in the future' });
      }

      try {
        // Call Slack's API to schedule the message
        const slackResult = await this.slackService.scheduleMessage(
          accessToken, 
          channel, 
          text, 
          scheduleDate
        );

        console.log('Slack schedule result:', slackResult);

        // Save to database with initial status
        const scheduledMessage = await this.scheduledMessageModel.create({
          userId,
          channel,
          message: text,
          scheduledAt: scheduleDate
        });

        // Update with Slack message ID if available
        if (slackResult.scheduled_message_id) {
          await this.scheduledMessageModel.updateStatus(
            scheduledMessage.id, 
            'pending', 
            slackResult.scheduled_message_id
          );
        }

        res.json({ 
          message: 'Message scheduled successfully',
          scheduledMessage: {
            ...scheduledMessage,
            slackMessageId: slackResult.scheduled_message_id
          }
        });

      } catch (slackError) {
  const errorMessage = slackError instanceof Error ? slackError.message : 'Unknown Slack API error';
  console.error('Slack scheduling error:', slackError);
  res.status(500).json({ 
    error: 'Failed to schedule message with Slack', 
    details: errorMessage
  });
}

} catch (error) {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  console.error('Schedule message error:', error);
  res.status(500).json({ 
    error: 'Failed to schedule message',
    details: errorMessage
  });
}

  };

  // List scheduled messages
  listScheduled = async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const messages = await this.scheduledMessageModel.findByUserId(userId);
      res.json({ scheduledMessages: messages });
    } catch (error) {
      console.error('List scheduled messages error:', error);
      res.status(500).json({ error: 'Failed to list scheduled messages' });
    }
  };

  // Cancel scheduled message
cancelScheduled = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    console.log(`Deleting scheduled message: ${id}`);
    
    // Actually delete the message from database
    await this.scheduledMessageModel.delete(id);
    
    console.log(`Successfully deleted message: ${id}`);
    
    res.json({ message: 'Scheduled message cancelled and deleted' });
  } catch (error: any) {
    console.error('Cancel scheduled message error:', error);
    res.status(500).json({ error: 'Failed to cancel scheduled message' });
  }
};

}
