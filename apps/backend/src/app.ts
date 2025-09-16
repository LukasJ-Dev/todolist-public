import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import express, { Express } from 'express';
import mongoSanitize from 'express-mongo-sanitize';
import cors from 'cors';
import morgan from 'morgan';
import pinoHttp from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import router from './routes/routes';
import { requestId } from './middlewares/request_id';
import { notFound } from './middlewares/notFound';
import { errorHandler } from './middlewares/errorHandler';
import { standardLimiter } from './middlewares/rateLimiting';
import { validateServerEnv } from './config/env';
import { checkDatabaseHealth } from './config/db';
import { logger } from './utils/logger';
import { swaggerSpec } from './config/swagger';

// Types are automatically loaded by TypeScript

// Validate environment variables
const env = validateServerEnv(process.env);
export const apiURL = `${env.API_PREFIX}/${env.API_VERSION}`;

const app: Express = express();

// Trust proxy configuration
app.set('trust proxy', env.TRUST_PROXY);

// Request ID middleware
app.use(requestId);

// HTTP logging middleware (must be after requestId)
app.use(
  pinoHttp({
    logger: logger as any, // Type assertion to fix compatibility issue
    genReqId: (req) => req.id, // Use our correlation ID
    customLogLevel: (_req, res, err) => {
      if (res.statusCode >= 400 && res.statusCode < 500) {
        return 'warn';
      } else if (res.statusCode >= 500 || err) {
        return 'error';
      }
      return 'info';
    },
    customSuccessMessage: (req, res) => {
      return `${req.method} ${req.url} - ${res.statusCode}`;
    },
    customErrorMessage: (req, res, err) => {
      return `${req.method} ${req.url} - ${res.statusCode} - ${err?.message}`;
    },
  })
);

// Security headers
app.use(helmet());

// Apply standard rate limiting to all API routes
app.use(apiURL, standardLimiter);

app.use(cookieParser());
app.use(express.json({ limit: '100kb' }));
app.use(mongoSanitize());

app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(morgan('dev'));

// Health check endpoint (before rate limiting)
/**
 * @swagger
 * /health:
 *   get:
 *     summary: Basic application health check
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Application is healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 *             examples:
 *               healthy:
 *                 summary: Healthy application
 *                 value:
 *                   status: "healthy"
 *                   timestamp: "2024-01-15T10:30:45.123Z"
 *                   uptime: 3600
 *                   environment: "development"
 */
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: env.NODE_ENV,
  });
});

/**
 * @swagger
 * /health/database:
 *   get:
 *     summary: Database health check
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Database is healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DatabaseHealthResponse'
 *             examples:
 *               healthy:
 *                 summary: Healthy database
 *                 value:
 *                   status: "healthy"
 *                   timestamp: "2024-01-15T10:30:45.123Z"
 *                   database:
 *                     connectionState: "connected"
 *                     isConnected: true
 *                     connectionTime: "45ms"
 *       503:
 *         description: Database is unhealthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DatabaseHealthResponse'
 */
// Database health check endpoint
app.get('/health/database', async (_req, res) => {
  try {
    const dbHealth = await checkDatabaseHealth();
    const statusCode = dbHealth.status === 'healthy' ? 200 : 503;

    res.status(statusCode).json({
      status: dbHealth.status,
      timestamp: new Date().toISOString(),
      database: dbHealth.details,
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Database health check failed',
    });
  }
});

// API Documentation
app.use(
  '/api-docs',
  ...(swaggerUi.serve as any),
  (swaggerUi.setup as any)(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'TodoList API Documentation',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
    },
  })
);

// Serve OpenAPI JSON specification
app.get('/api-docs.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

app.use(apiURL, router);

app.use(notFound);
app.use(errorHandler);

export default app;
