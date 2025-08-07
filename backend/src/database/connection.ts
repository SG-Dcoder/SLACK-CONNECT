import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

// Use /tmp directory for Vercel serverless functions
const DB_PATH = process.env.NODE_ENV === 'production' 
  ? '/tmp/slack-connect.db'  // Vercel allows writes to /tmp
  : (process.env.DB_PATH || './database/slack-connect.db');

// Only create directory in development (not in serverless)
if (process.env.NODE_ENV !== 'production') {
  const dbDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
}

class DatabaseConnection {
  private static instance: DatabaseConnection;
  private db: sqlite3.Database | null = null;

  private constructor() {}

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public connect(): Promise<sqlite3.Database> {
    return new Promise((resolve, reject) => {
      if (this.db) {
        resolve(this.db);
        return;
      }

      this.db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
          console.error('Error opening database:', err);
          reject(err);
        } else {
          console.log('Connected to SQLite database at:', DB_PATH);
          resolve(this.db!);
        }
      });
    });
  }

  public getDatabase(): sqlite3.Database {
    if (!this.db) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.db;
  }

  public close(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            reject(err);
          } else {
            console.log('Database connection closed');
            this.db = null;
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }
}

export default DatabaseConnection;
