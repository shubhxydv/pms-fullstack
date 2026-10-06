import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { requestId } from './middleware/requestId.js';
import { requestLogger } from './middleware/requestLogger.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp(): Express {
  const app = express();

  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGINS,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '100kb' }));
  app.use(requestId);
  app.use(requestLogger);

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.get('/health/ready', async (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
