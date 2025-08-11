import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { connectDB, disconnectDB, dbState } from './config/db';

const app = express();

// Config
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

// Middleware
app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(helmet());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  const states: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  res.json({ status: 'ok', uptime: process.uptime(), db: states[dbState()] });
});

// 404 handler
app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
});

// Error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const status = err.status || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = err.message || 'Something went wrong';
  const details = err.details;
  if (process.env.NODE_ENV !== 'test') {
    // tslint:disable-next-line:no-console
    console.error('Error:', err);
  }
  res.status(status).json({ error: { code, message, details } });
});

// Start server with DB
async function start() {
  try {
    await connectDB();
    const server = app.listen(PORT, () => {
      // tslint:disable-next-line:no-console
      console.log(`API listening on http://localhost:${PORT}`);
    });

    // Graceful shutdown
    const shutdown = async () => {
      // tslint:disable-next-line:no-console
      console.log('Shutting down server...');
      server.close(async () => {
        await disconnectDB();
        process.exit(0);
      });
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (err) {
    // tslint:disable-next-line:no-console
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();

export default app;
