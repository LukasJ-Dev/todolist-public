import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({
  path: path.join(__dirname, './../../.env'),
});

// Environment validation schemas
export const serverEnvSchema = z.object({
  // Application configuration
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.string().transform(Number).default(3000),
  HOST: z.string().default('localhost'),

  // Database configuration
  DATABASE: z.string().min(1, 'Database URL is required'),
  DATABASE_POOL_SIZE: z.string().transform(Number).default(10),
  DATABASE_CONNECT_TIMEOUT_MS: z.string().transform(Number).default(30000),
  DATABASE_SOCKET_TIMEOUT_MS: z.string().transform(Number).default(45000),

  // JWT configuration
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
  JWT_ALG: z
    .enum(['HS256', 'HS384', 'HS512', 'RS256', 'RS384', 'RS512'])
    .default('HS256'),
  JWT_KID: z.string().optional(),
  JWT_PRIVATE_KEY: z.string().optional(),
  JWT_PUBLIC_KEY: z.string().optional(),
  JWT_ISS: z.string().default('todolist-app'),
  JWT_AUD: z.string().default('todolist-users'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  ACCESS_TOKEN_TTL_MS: z.string().transform(Number).default(900000), // 15 minutes

  // Refresh token configuration
  REFRESH_HASH_SECRET: z
    .string()
    .min(32, 'Refresh hash secret must be at least 32 characters'),
  REFRESH_TOKEN_TTL_MS: z.string().transform(Number).default(604800000), // 7 days

  // Cookie configuration
  COOKIE_SAMESITE: z.enum(['strict', 'lax', 'none']).default('lax'),
  COOKIE_SECURE: z
    .string()
    .transform((val) => val === 'true')
    .default(false),
  COOKIE_DOMAIN: z.string().optional(),
  ACCESS_COOKIE_NAME: z.string().default('accessToken'),
  REFRESH_COOKIE_NAME: z.string().default('refreshToken'),

  // CORS configuration
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  CORS_CREDENTIALS: z
    .string()
    .transform((val) => val === 'true')
    .default(true),

  // Rate limiting configuration
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default(900000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default(200),
  RATE_LIMIT_AUTH_WINDOW_MS: z.string().transform(Number).default(900000), // 15 minutes
  RATE_LIMIT_AUTH_MAX_REQUESTS: z.string().transform(Number).default(10),
  RATE_LIMIT_STRICT_WINDOW_MS: z.string().transform(Number).default(300000), // 5 minutes
  RATE_LIMIT_STRICT_MAX_REQUESTS: z.string().transform(Number).default(5),
  RATE_LIMIT_REGISTRATION_WINDOW_MS: z
    .string()
    .transform(Number)
    .default(3600000), // 1 hour
  RATE_LIMIT_REGISTRATION_MAX_REQUESTS: z.string().transform(Number).default(3),

  // Trust proxy configuration
  TRUST_PROXY: z.string().default('0'),

  // Logging configuration
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
    .default('info'),
  LOG_PRETTY: z
    .string()
    .transform((val) => val === 'true')
    .default(false),

  // Security configuration
  BCRYPT_ROUNDS: z.string().transform(Number).default(12),
  SESSION_SECRET: z
    .string()
    .min(32, 'Session secret must be at least 32 characters')
    .optional(),

  // API configuration
  API_VERSION: z.string().default('v1'),
  API_PREFIX: z.string().default('/api'),

  // Health check configuration
  HEALTH_CHECK_TIMEOUT_MS: z.string().transform(Number).default(5000),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

// Environment validation function
export function validateServerEnv(env: Record<string, any>) {
  return serverEnvSchema.parse(env);
}
