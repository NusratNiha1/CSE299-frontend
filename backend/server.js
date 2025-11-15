import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import authRoutes from './routes/auth.js';
import devicesRoutes from './routes/devices.js';
import monitoringRoutes from './routes/monitoring.js';
import errorHandler from './middleware/error.js';
import { db } from './db/client.js';

const app = express();

// Config
const PORT = process.env.PORT || 3000;
const LOG_LEVEL = process.env.LOG_LEVEL || 'dev';
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

// Middleware
app.use(helmet());
app.use(cors({ origin: CORS_ORIGIN === '*' ? true : CORS_ORIGIN }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan(LOG_LEVEL));
// Error handler
app.use(errorHandler);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// Routes
app.use('/auth', authRoutes);
app.use('/devices', devicesRoutes);
app.use('/monitoring', monitoringRoutes);

app.get('/_db-status', (req, res) => {
  res.json({ connected: !!db });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});



app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
  if (db) console.log('Drizzle(ORM)/Postgres connected');
  else console.log('Drizzle DB not connected (DATABASE_URL missing)');
});
