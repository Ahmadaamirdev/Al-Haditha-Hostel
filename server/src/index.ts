import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { config } from './config/env';
import { connectDB } from './config/database';
import { errorHandler } from './middleware';
import apiRoutes from './routes';
import { AuthService } from './services';

const app: Application = express();

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or same-origin)
      if (!origin) return callback(null, true);
      // In development or on Vercel preview/production, allow the requesting origin
      return callback(null, true);
    },
    credentials: true,
  })
);

app.use(express.json());

// Serverless DB connection middleware
app.use(async (_req: Request, _res: Response, next: NextFunction) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

// Base health route
app.get('/api/v1/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    service: 'Al Haditha Hostel Allotment Management API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Mount modular versioned API routes
app.use('/api/v1', apiRoutes);

// Global error handling middleware
app.use(errorHandler);

const startServer = async () => {
  try {
    await connectDB();
    await AuthService.seedInitialAdmin();

    if (!process.env.VERCEL && process.env.NODE_ENV !== 'test') {
      app.listen(config.port, () => {
        console.log(`[Al Haditha Server] running on http://localhost:${config.port}`);
      });
    }
  } catch (error) {
    console.error('Failed to start server:', error);
  }
};

startServer();

export default app;
