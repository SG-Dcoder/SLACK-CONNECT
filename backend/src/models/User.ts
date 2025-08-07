import DatabaseConnection from '../database/connection';
import { User } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class UserModel {
  private db = DatabaseConnection.getInstance().getDatabase();

  async create(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const id = uuidv4();
    const now = new Date().toISOString();

    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO users (id, slack_user_id, team_id, access_token, refresh_token, token_expiry, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      this.db.run(
        sql,
        [
          id,
          userData.slackUserId,
          userData.teamId,
          userData.accessToken,
          userData.refreshToken || null,
          userData.tokenExpiry ? userData.tokenExpiry.toISOString() : null,
          now,
          now,
        ],
        function (err) {
          if (err) {
            reject(err);
          } else {
            resolve({
              id,
              ...userData,
              createdAt: new Date(now),
              updatedAt: new Date(now),
            });
          }
        }
      );
    });
  }

  async findBySlackUserId(slackUserId: string): Promise<User | null> {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM users WHERE slack_user_id = ?`;

      interface UserRow {
        id: string;
        slack_user_id: string;
        team_id: string;
        access_token: string;
        refresh_token: string | null;
        token_expiry: string | null;
        created_at: string;
        updated_at: string;
      }

      this.db.get(sql, [slackUserId], (err, row: UserRow | undefined) => {
        if (err) {
          reject(err);
        } else if (row) {
          resolve({
            id: row.id,
            slackUserId: row.slack_user_id,
            teamId: row.team_id,
            accessToken: row.access_token,
            refreshToken: row.refresh_token === null ? undefined : row.refresh_token,
            tokenExpiry: row.token_expiry ? new Date(row.token_expiry) : undefined,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
          });
        } else {
          resolve(null);
        }
      });
    });
  }

  async updateTokens(
    slackUserId: string,
    accessToken: string,
    refreshToken?: string,
    tokenExpiry?: Date
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE users
        SET access_token = ?, refresh_token = ?, token_expiry = ?, updated_at = ?
        WHERE slack_user_id = ?
      `;
      this.db.run(
        sql,
        [
          accessToken,
          refreshToken || null,
          tokenExpiry ? tokenExpiry.toISOString() : null,
          new Date().toISOString(),
          slackUserId,
        ],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  // Added findById method
  async findById(id: string): Promise<User | null> {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM users WHERE id = ?`;
      this.db.get(sql, [id], (err, row: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(row ? {
            id: row.id,
            slackUserId: row.slack_user_id,
            teamId: row.team_id,
            accessToken: row.access_token,
            refreshToken: row.refresh_token === null ? undefined : row.refresh_token,
            tokenExpiry: row.token_expiry ? new Date(row.token_expiry) : undefined,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at)
          } : null);
        }
      });
    });
  }
}
