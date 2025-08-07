// src/server.ts

import dotenv from 'dotenv';
dotenv.config();  // 1) Load env first

import express from 'express';
import cors from 'cors';
import DatabaseConnection from './database/connection';
import { runMigrations } from './database/migrate';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple health endpoint
app.get('/', (_req, res) => {
  res.json({ message: 'Slack Connect Backend is running!' });
});

app.get('/api/health', (_req, res) => {
  res.json({
    message: 'Database is connected and healthy',
    timestamp: new Date().toISOString()
  });
});

// Start server after DB is ready
async function startServer() {
  try {
    // 2) Connect to the database
    await DatabaseConnection.getInstance().connect();

    // 3) Run migrations
    await runMigrations();

    // 4) Import and register routes (after DB is initialized)
    const authRoutes = (await import('./routes/auth')).default;
    app.use('/auth', authRoutes);

    const messageRoutes = (await import('./routes/messages')).default;
    app.use('/messages', messageRoutes);

    // 5) Start the scheduler for pending messages
    const { startScheduler } = await import('./jobs/scheduler');
    startScheduler();

    // 6) Launch server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📊 Database ready at ${process.env.DB_PATH}`);
      console.log(`🔐 OAuth endpoint available at http://localhost:${PORT}/auth/slack`);
      console.log(`✉️ Message endpoints available under http://localhost:${PORT}/messages`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
