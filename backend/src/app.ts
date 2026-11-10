import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
import deviceRoutes from './routes/deviceRoutes';
import telemetryRoutes from './routes/telemetryRoutes';
import alertRoutes from './routes/alertRoutes';

const app: Application = express();

// Global middlewares
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/telemetry', telemetryRoutes);
app.use('/api/alerts', alertRoutes);

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timeStamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export default app;
