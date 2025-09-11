// Load environment variables FIRST before any other imports

import { connectToDB } from './config/db';
import app from './app';
import { logger } from './utils/logger';
import { validateServerEnv } from './config/env';

// Validate environment variables
const env = validateServerEnv(process.env);

connectToDB().catch((err) => {
  logger.fatal(
    {
      error: err instanceof Error ? err.message : 'Unknown error',
    },
    'Failed to connect to database'
  );
  process.exit(1);
});

app.listen(env.PORT, env.HOST, () => {
  logger.info(
    {
      port: env.PORT,
      host: env.HOST,
      environment: env.NODE_ENV,
      apiUrl: `http://${env.HOST}:${env.PORT}${env.API_PREFIX}/${env.API_VERSION}`,
    },
    'Server started successfully'
  );
});
