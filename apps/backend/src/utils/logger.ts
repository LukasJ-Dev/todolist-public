import pino from 'pino';
import { validateServerEnv } from '../config/env';

let loggerInstance: pino.Logger | null = null;

// Create the logger instance lazily
function createLogger(): pino.Logger {
  if (!loggerInstance) {
    const env = validateServerEnv(process.env);

    const loggerConfig: pino.LoggerOptions = {
      level: env.LOG_LEVEL,
      timestamp: pino.stdTimeFunctions.isoTime,
      formatters: {
        level: (label) => {
          return { level: label };
        },
      },
      serializers: {
        req: (req) => ({
          id: req.id,
          method: req.method,
          url: req.url,
          headers: {
            'user-agent': req.headers['user-agent'],
            'content-type': req.headers['content-type'],
            authorization: req.headers['authorization']
              ? '[REDACTED]'
              : undefined,
          },
        }),
        res: (res) => ({
          statusCode: res.statusCode,
        }),
        err: pino.stdSerializers.err,
      },
      redact: {
        paths: [
          'req.headers.authorization',
          'req.headers.cookie',
          'password',
          'token',
          'refreshToken',
          'accessToken',
        ],
        censor: '[REDACTED]',
      },
    };

    loggerInstance = pino(loggerConfig);
  }

  return loggerInstance;
}

// Export logger with lazy initialization
export const logger = new Proxy({} as pino.Logger, {
  get(target, prop) {
    return createLogger()[prop as keyof pino.Logger];
  },
});

// Create a child logger for HTTP requests
export const createRequestLogger = (req: any) => {
  return logger.child({
    requestId: req.id,
    userId: req.user?.id,
    ip: req.ip,
  });
};

// Export logger for use in other modules
export default logger;
