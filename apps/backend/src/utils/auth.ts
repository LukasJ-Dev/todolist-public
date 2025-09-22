import { createHmac, randomBytes } from 'crypto';
import { Types } from 'mongoose';
import { AppError } from './appError';

// ============================================================================
// CONSTANTS
// ============================================================================

export const AUTH_CONSTANTS = {
  // TTL constants
  MIN_TTL_SECONDS: 60,
  MAX_TTL_SECONDS: 60 * 60,
  DEFAULT_ACCESS_TTL_MS: 15 * 60 * 1000, // 15 minutes
  DEFAULT_REFRESH_TTL_MS: 30 * 24 * 60 * 60 * 1000, // 30 days

  // Security constants
  MIN_SECRET_LENGTH: 32,
  TOKEN_BYTES: 32,
  MAX_RETRY_ATTEMPTS: 3,

  // Session constants
  DEFAULT_SESSION_LIMIT: 20,
  MAX_SESSION_LIMIT: 100,
  DEFAULT_CLOCK_TOLERANCE_SEC: 60,
} as const;

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

export function validateSecret(
  secret: string | undefined,
  secretName: string
): string {
  if (!secret || secret.length < AUTH_CONSTANTS.MIN_SECRET_LENGTH) {
    throw new AppError(`${secretName} missing/weak`, 500);
  }
  return secret;
}

export function validateRequired(value: unknown, fieldName: string): void {
  if (!value) {
    throw new AppError(`${fieldName} is required`, 400);
  }
}

export function validatePositiveNumber(
  value: number | undefined,
  fieldName: string
): void {
  if (value !== undefined && value <= 0) {
    throw new AppError(`${fieldName} must be positive`, 400);
  }
}

// ============================================================================
// TIME UTILITIES
// ============================================================================

export function clampTtl(
  ttlMs: number,
  minSeconds = AUTH_CONSTANTS.MIN_TTL_SECONDS,
  maxSeconds = AUTH_CONSTANTS.MAX_TTL_SECONDS
): number {
  return Math.max(minSeconds, Math.min(Math.floor(ttlMs / 1000), maxSeconds));
}

export function calculateExpiration(now: Date, ttlMs: number): Date {
  return new Date(now.getTime() + ttlMs);
}

// ============================================================================
// GENERIC UTILITIES
// ============================================================================

export function validateKey(key: string | undefined, keyName: string): string {
  if (!key) {
    throw new AppError(`${keyName} missing`, 500);
  }
  return key;
}

export function createTokenHash(token: string, secret: string): string {
  return createHmac('sha256', secret).update(token).digest('hex');
}

export function generateRandomToken(): string {
  return randomBytes(AUTH_CONSTANTS.TOKEN_BYTES).toString('base64url');
}

export function normalizeUserId(
  userId: string | Types.ObjectId
): Types.ObjectId {
  return userId instanceof Types.ObjectId ? userId : new Types.ObjectId(userId);
}

export function validateObjectId(id: string, fieldName: string): void {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError(`Invalid ${fieldName}`, 400);
  }
}
