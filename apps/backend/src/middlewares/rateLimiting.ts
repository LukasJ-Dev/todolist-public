import rateLimit, {
  RateLimitRequestHandler,
  ipKeyGenerator,
} from 'express-rate-limit';
import { Request, Response } from 'express';
import { validateServerEnv } from '../config/env';
import { logger } from '../utils/logger';

// Get validated environment variables
const env = validateServerEnv(process.env);

// Custom key generator that considers user ID for authenticated requests
const keyGenerator = (req: Request): string => {
  // For authenticated requests, use user ID + IP
  if (req.auth?.userId) {
    return `user:${req.auth.userId}:${ipKeyGenerator(req.ip || 'unknown')}`;
  }
  // For unauthenticated requests, use IP only
  return `ip:${ipKeyGenerator(req.ip || 'unknown')}`;
};

// Standard rate limiter for general API endpoints
export const standardLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  message: {
    error: 'Too many requests',
    message: 'Rate limit exceeded. Please try again later.',
    retryAfter: Math.ceil(env.RATE_LIMIT_WINDOW_MS / 1000),
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  keyGenerator,
  // Custom handler for rate limit exceeded
  handler: (req: Request, res: Response) => {
    // Log rate limit violation
    logger.warn(
      {
        ip: req.ip,
        userId: req.auth?.userId,
        endpoint: req.originalUrl,
        method: req.method,
        userAgent: req.get('user-agent'),
        rateLimitType: 'standard',
      },
      'Rate limit exceeded'
    );

    res.status(429).json({
      success: false,
      error: {
        type: 'RateLimitExceeded',
        message: 'Too many requests from this IP/user, please try again later.',
        retryAfter: Math.ceil(env.RATE_LIMIT_WINDOW_MS / 1000),
      },
      statusCode: 429,
    });
  },
  // Skip rate limiting in test environment
  skip: (_req: Request) => {
    return env.NODE_ENV === 'test';
  },
});

// Strict rate limiter for authentication endpoints
export const authLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: env.RATE_LIMIT_AUTH_WINDOW_MS,
  max: env.RATE_LIMIT_AUTH_MAX_REQUESTS,
  message: {
    error: 'Too many authentication attempts',
    message: 'Too many login attempts. Please try again later.',
    retryAfter: Math.ceil(env.RATE_LIMIT_AUTH_WINDOW_MS / 1000),
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => `auth:${ipKeyGenerator(req.ip || 'unknown')}`,
  skipSuccessfulRequests: false, // Don't skip successful auth requests
  handler: (req: Request, res: Response) => {
    // Log authentication rate limit violation
    logger.warn(
      {
        ip: req.ip,
        endpoint: req.originalUrl,
        method: req.method,
        userAgent: req.get('user-agent'),
        rateLimitType: 'auth',
      },
      'Authentication rate limit exceeded'
    );

    res.status(429).json({
      success: false,
      error: {
        type: 'AuthRateLimitExceeded',
        message: 'Too many authentication attempts. Please try again later.',
        retryAfter: Math.ceil(env.RATE_LIMIT_AUTH_WINDOW_MS / 1000),
      },
      statusCode: 429,
    });
  },
  skip: (_req: Request) => {
    return env.NODE_ENV === 'test';
  },
});

// Very strict rate limiter for sensitive operations
export const strictLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: env.RATE_LIMIT_STRICT_WINDOW_MS,
  max: env.RATE_LIMIT_STRICT_MAX_REQUESTS,
  message: {
    error: 'Too many sensitive operations',
    message: 'Too many attempts for this operation. Please try again later.',
    retryAfter: Math.ceil(env.RATE_LIMIT_STRICT_WINDOW_MS / 1000),
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  skipSuccessfulRequests: false,
  handler: (req: Request, res: Response) => {
    // Log strict rate limit violation
    logger.warn(
      {
        ip: req.ip,
        userId: req.auth?.userId,
        endpoint: req.originalUrl,
        method: req.method,
        userAgent: req.get('user-agent'),
        rateLimitType: 'strict',
      },
      'Strict rate limit exceeded'
    );

    res.status(429).json({
      success: false,
      error: {
        type: 'StrictRateLimitExceeded',
        message:
          'Too many attempts for this sensitive operation. Please try again later.',
        retryAfter: Math.ceil(env.RATE_LIMIT_STRICT_WINDOW_MS / 1000),
      },
      statusCode: 429,
    });
  },
  skip: (_req: Request) => {
    return env.NODE_ENV === 'test';
  },
});

// Rate limiter for password reset and similar operations
export const passwordResetLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts per hour
  message: {
    error: 'Too many password reset attempts',
    message: 'Too many password reset attempts. Please try again in an hour.',
    retryAfter: 3600,
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) =>
    `password-reset:${ipKeyGenerator(req.ip || 'unknown')}`,
  skipSuccessfulRequests: false,
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: {
        type: 'PasswordResetRateLimitExceeded',
        message:
          'Too many password reset attempts. Please try again in an hour.',
        retryAfter: 3600,
      },
      statusCode: 429,
    });
  },
  skip: (_req: Request) => {
    return env.NODE_ENV === 'test';
  },
});

// Rate limiter for user registration
export const registrationLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 registrations per hour per IP
  message: {
    error: 'Too many registration attempts',
    message:
      'Too many registration attempts from this IP. Please try again later.',
    retryAfter: 3600,
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) =>
    `registration:${ipKeyGenerator(req.ip || 'unknown')}`,
  skipSuccessfulRequests: false,
  handler: (req: Request, res: Response) => {
    // Log registration rate limit violation
    logger.warn(
      {
        ip: req.ip,
        endpoint: req.originalUrl,
        method: req.method,
        userAgent: req.get('user-agent'),
        rateLimitType: 'registration',
      },
      'Registration rate limit exceeded'
    );

    res.status(429).json({
      success: false,
      error: {
        type: 'RegistrationRateLimitExceeded',
        message:
          'Too many registration attempts from this IP. Please try again later.',
        retryAfter: 3600,
      },
      statusCode: 429,
    });
  },
  skip: (_req: Request) => {
    return env.NODE_ENV === 'test';
  },
});
