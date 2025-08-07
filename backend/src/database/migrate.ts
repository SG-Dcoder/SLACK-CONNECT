import DatabaseConnection from './connection';

const createTables = `
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    slack_user_id TEXT UNIQUE NOT NULL,
    team_id TEXT NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    token_expiry DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS scheduled_messages (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    channel TEXT NOT NULL,
    message TEXT NOT NULL,
    scheduled_at DATETIME NOT NULL,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'sent', 'failed', 'cancelled')),
    slack_message_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  );

  CREATE INDEX IF NOT EXISTS idx_users_slack_user_id ON users(slack_user_id);
  CREATE INDEX IF NOT EXISTS idx_users_team_id ON users(team_id);
  CREATE INDEX IF NOT EXISTS idx_scheduled_messages_user_id ON scheduled_messages(user_id);
  CREATE INDEX IF NOT EXISTS idx_scheduled_messages_status ON scheduled_messages(status);
  CREATE INDEX IF NOT EXISTS idx_scheduled_messages_scheduled_at ON scheduled_messages(scheduled_at);
`;

export async function runMigrations(): Promise<void> {
  const dbConnection = DatabaseConnection.getInstance();
  const db = await dbConnection.connect();

  return new Promise((resolve, reject) => {
    db.exec(createTables, (err) => {
      if (err) {
        console.error('❌ Error running migrations:', err);
        reject(err);
      } else {
        console.log('✅ Database migrations completed successfully');
        resolve();
      }
    });
  });
}
