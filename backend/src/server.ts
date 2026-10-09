// Entry point: builds the app and starts the HTTP server listening on the configured port.
import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';

const app = createApp();

app.listen(env.PORT, () => {
  logger.info(`Backend listening on port ${env.PORT} (${env.NODE_ENV})`);
});
