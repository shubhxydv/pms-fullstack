import { pinoHttp } from 'pino-http';
import { logger } from '../lib/logger.js';

export const requestLogger = pinoHttp({
  logger,
  genReqId: (req) => req.id,
  customLogLevel: (_req, res, err) => {
    if (err || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
});
