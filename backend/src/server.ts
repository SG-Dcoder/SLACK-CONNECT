import dotenv from 'dotenv';
dotenv.config();  

import express from 'express';
import cors from 'cors';
import DatabaseConnection from './database/connection';
import { runMigrations } from './database/migrate';

const app = express();
const PORT = process.env.PORT || 3001;


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.get('/', (_req, res) => {
  res.json({ message: 'Slack Connect Backend is running!' });
});

app.get('/api/health', (_req, res) => {
  res.json({
    message: 'Database is connected and healthy',
    timestamp: new Date().toISOString()
  });
});


async function startServer() {
  try {
    await DatabaseConnection.getInstance().connect();
    await runMigrations();
    const authRoutes = (await import('./routes/auth')).default;
    app.use('/auth', authRoutes);

    const messageRoutes = (await import('./routes/messages')).default;
    app.use('/messages', messageRoutes);
   
    const { startScheduler } = await import('./jobs/scheduler');
    startScheduler();

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

export default app;