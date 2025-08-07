import DatabaseConnection from '../database/connection';
import { ScheduledMessage } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class ScheduledMessageModel {
  private db = DatabaseConnection.getInstance().getDatabase();

  async create(messageData: Omit<ScheduledMessage, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<ScheduledMessage> {
    const id = uuidv4();
    const now = new Date().toISOString();

    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO scheduled_messages (id, user_id, channel, message, scheduled_at, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)
      `;
      
      this.db.run(sql, [
        id,
        messageData.userId,
        messageData.channel,
        messageData.message,
        messageData.scheduledAt.toISOString(),
        now,
        now
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({
            id,
            ...messageData,
            status: 'pending',
            createdAt: new Date(now),
            updatedAt: new Date(now)
          });
        }
      });
    });
  }

  // Get all scheduled messages for a user
  async findByUserId(userId: string): Promise<ScheduledMessage[]> {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM scheduled_messages WHERE user_id = ? ORDER BY scheduled_at ASC`;
      
      this.db.all(sql, [userId], (err, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          const messages = rows.map(row => ({
            id: row.id,
            userId: row.user_id,
            channel: row.channel,
            message: row.message,
            scheduledAt: new Date(row.scheduled_at),
            status: row.status as 'pending' | 'sent' | 'failed' | 'cancelled',
            slackMessageId: row.slack_message_id,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at)
          }));
          resolve(messages);
        }
      });
    });
  }

  // Update message status
  async updateStatus(id: string, status: 'pending' | 'sent' | 'failed' | 'cancelled', slackMessageId?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE scheduled_messages 
        SET status = ?, slack_message_id = ?, updated_at = ?
        WHERE id = ?
      `;
      
      this.db.run(sql, [
        status,
        slackMessageId || null,
        new Date().toISOString(),
        id
      ], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  // Delete a scheduled message
async delete(id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const sql = `DELETE FROM scheduled_messages WHERE id = ?`;
    
    this.db.run(sql, [id], function(err) {
      if (err) {
        console.error('Database delete error:', err);
        reject(err);
      } else {
        console.log(`Deleted ${this.changes} row(s) from scheduled_messages with id: ${id}`);
        if (this.changes === 0) {
          console.warn(`No rows deleted - message with id ${id} may not exist`);
        }
        resolve();
      }
    });
  });
}

  // Get messages ready to be sent
  async findReadyToSend(): Promise<ScheduledMessage[]> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT * FROM scheduled_messages 
        WHERE status = 'pending' AND scheduled_at <= ?
        ORDER BY scheduled_at ASC
      `;
      
      this.db.all(sql, [new Date().toISOString()], (err, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          const messages = rows.map(row => ({
            id: row.id,
            userId: row.user_id,
            channel: row.channel,
            message: row.message,
            scheduledAt: new Date(row.scheduled_at),
            status: row.status as 'pending' | 'sent' | 'failed' | 'cancelled',
            slackMessageId: row.slack_message_id,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at)
          }));
          resolve(messages);
        }
      });
    });
  }
}
