// HTTP access-log middleware: logs each request/response, tagged with the request id and status-based level.
import { pinoHttp } from 'pino-http';
import { logger } from '../lib/logger.js';

// Configured pino-http request logger
export const requestLogger = pinoHttp({
  logger,
  genReqId: (req) => req.id,
  customLogLevel: (_req, res, err) => {
    if (err || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
});
