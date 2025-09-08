import { z } from 'zod';

// Environment validation schemas
export const serverEnvSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.string().transform(Number).default('3000'),
  DATABASE: z.string().min(1, 'Database URL is required'),
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  ACCESS_TOKEN_TTL_MS: z.string().default('900000'),
  REFRESH_HASH_SECRET: z.string().min(1, 'Refresh hash secret is required'),
  COOKIE_SAMESITE: z.string().default('lax'),
  COOKIE_SECURE: z.string().default('false'),
  COOKIE_DOMAIN: z.string().default(''),
  ACCESS_COOKIE_NAME: z.string().default('access'),
  REFRESH_COOKIE_NAME: z.string().default('refresh'),
});

export const clientEnvSchema = z.object({
  VITE_API_URL: z.string().url().default('http://localhost:3000/api/v1'),
  VITE_APP_NAME: z.string().default('Todolist App'),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type ClientEnv = z.infer<typeof clientEnvSchema>;

// Environment validation functions
export function validateServerEnv() {
  return serverEnvSchema.parse(process.env);
}

// For client-side validation (pass the env object from the client)
export function validateClientEnv(env: Record<string, any>) {
  return clientEnvSchema.parse(env);
}
