import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

import moodRoutes from './routes/moodRoutes.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import reflectionRoutes from './routes/reflectionRoutes.js';
import activityRoutes from './routes/activityRoutes.js';
import insightRoutes from './routes/insightRoutes.js';
import safetyRoutes from './routes/safetyRoutes.js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5003;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    message: 'MoodLift API is running',
    routes: ['/api/health', '/api/test-db', '/api/moods'],
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

app.get('/api/test-db', async (req, res) => {
  try {
    if (!process.env.MONGO_URI) {
      return res.status(200).json({
        message: 'MONGO_URI not configured yet. Add it to .env to enable MongoDB.',
        readyState: mongoose.connection.readyState,
      });
    }

    const dbState = mongoose.connection.readyState;
    res.json({
      message: 'MongoDB connection status checked',
      readyState: dbState,
      states: {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting',
      }[dbState],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.use('/api/moods', moodRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reflections', reflectionRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/insights', insightRoutes);
app.use('/api/safety', safetyRoutes);

const startServer = async () => {
  try {
    if (process.env.MONGO_URI) {
      try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected successfully');
      } catch (dbError) {
        console.warn('MongoDB connection failed. Starting backend in local/offline mode:', dbError.message);
      }
    } else {
      console.log('MONGO_URI not set. Starting backend without a database connection.');
    }

    if (!process.env.AUTH_TOKEN_SECRET) {
      console.warn('AUTH_TOKEN_SECRET not set. Using a random secret, so every restart signs all users out. Set it in the host environment.');
    }

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Server startup failed:', error.message);
  }
};

startServer();
