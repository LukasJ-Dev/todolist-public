import mongoose, { Types, ClientSession } from 'mongoose';
import { AppError } from './appError';

// MongoDB Error Types
interface MongoDuplicateKeyError {
  code: 11000;
  keyPattern: Record<string, unknown>;
  keyValue: Record<string, unknown>;
}

interface MongoValidationError {
  name: 'ValidationError';
  errors: Record<string, {
    path: string;
    message: string;
    value: unknown;
  }>;
}

interface MongoCastError {
  name: 'CastError';
  path: string;
  value: unknown;
}

interface MongoNetworkError {
  name: 'MongoNetworkError' | 'MongoTimeoutError';
}

// Constants for MongoDB error codes and names
const MONGO_ERROR_CODES = {
  DUPLICATE_KEY: 11000,
  ILLEGAL_OPERATION: 20,
} as const;

const MONGO_ERROR_NAMES = {
  VALIDATION_ERROR: 'ValidationError',
  CAST_ERROR: 'CastError',
  NETWORK_ERROR: 'MongoNetworkError',
  TIMEOUT_ERROR: 'MongoTimeoutError',
} as const;

// Type guards for MongoDB errors (internal use only)
function isMongoError(error: unknown): error is { code: number; name: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as Record<string, unknown>).code === 'number'
  );
}

function isMongoDuplicateKeyError(error: unknown): error is MongoDuplicateKeyError {
  return (
    isMongoError(error) &&
    error.code === MONGO_ERROR_CODES.DUPLICATE_KEY &&
    'keyPattern' in error
  );
}

function isMongoValidationError(error: unknown): error is MongoValidationError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    (error as Record<string, unknown>).name === MONGO_ERROR_NAMES.VALIDATION_ERROR &&
    'errors' in error
  );
}

function isMongoCastError(error: unknown): error is MongoCastError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    (error as Record<string, unknown>).name === MONGO_ERROR_NAMES.CAST_ERROR &&
    'path' in error &&
    'value' in error
  );
}

function isMongoNetworkError(error: unknown): error is MongoNetworkError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    ((error as Record<string, unknown>).name === MONGO_ERROR_NAMES.NETWORK_ERROR ||
     (error as Record<string, unknown>).name === MONGO_ERROR_NAMES.TIMEOUT_ERROR)
  );
}

// Essential database utility functions

 
// Validates if a string is a valid MongoDB ObjectId
export function isValidObjectId(id: string): boolean {
  return Types.ObjectId.isValid(id);
}

// Converts a string to MongoDB ObjectId with validation
export function toObjectId(id: string): Types.ObjectId {
  if (!isValidObjectId(id)) {
    throw new AppError('Invalid ID format', 400);
  }
  return new Types.ObjectId(id);
}

// Creates a new MongoDB session for transactions
export async function createSession(): Promise<ClientSession> {
  return await mongoose.startSession();
}

// Executes a function within a transaction (if supported) or without transaction (fallback)
export async function withTransaction<T>(
  fn: (session: ClientSession | null) => Promise<T>
): Promise<T> {
  try {
    // Try to use transactions (works with replica sets)
    const session = await createSession();
    session.startTransaction();
    const result = await fn(session);
    await session.commitTransaction();
    session.endSession();
    return result;
  } catch (error: unknown) {
    // If transaction fails due to standalone MongoDB, fallback to non-transactional
    if (
      isMongoError(error) &&
      (error.code === MONGO_ERROR_CODES.ILLEGAL_OPERATION ||
        (error as Record<string, unknown>).codeName === 'IllegalOperation')
    ) {
      // Fallback to non-transactional operations for standalone MongoDB
      return await fn(null);
    }

    // Re-throw other errors
    throw error;
  }
}

// Handles MongoDB duplicate key errors
export function handleDuplicateKeyError(error: unknown): AppError {
  if (isMongoDuplicateKeyError(error)) {
    const field = Object.keys(error.keyPattern)[0] || 'field';
    return new AppError(`${field} already exists`, 409);
  }
  return new AppError('Database error', 500);
}

// Handles MongoDB validation errors
export function handleValidationError(error: unknown): AppError {
  if (isMongoValidationError(error)) {
    const errors = Object.values(error.errors).map((err) => ({
      path: err.path,
      message: err.message,
    }));
    const appError = new AppError('Validation failed', 400);
    appError.details = errors;
    return appError;
  }
  return new AppError('Database error', 500);
}

// Handles MongoDB cast errors (invalid ObjectId, etc.)
export function handleCastError(error: unknown): AppError {
  if (isMongoCastError(error)) {
    return new AppError(`Invalid ${error.path}: ${error.value}`, 400);
  }
  return new AppError('Database error', 500);
}

// Generic database error handler
export function handleDatabaseError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  // Handle specific MongoDB errors
  if (isMongoValidationError(error)) {
    return handleValidationError(error);
  }

  if (isMongoCastError(error)) {
    return handleCastError(error);
  }

  if (isMongoDuplicateKeyError(error)) {
    return handleDuplicateKeyError(error);
  }

  // Handle connection errors
  if (isMongoNetworkError(error)) {
    return new AppError('Database connection error', 503);
  }

  // Default error - removed console.error for production code
  return new AppError('Internal server error', 500);
}

// Ownership validation helper
export function validateOwnership(
  resource: { owner?: string | Types.ObjectId } | null | undefined,
  ownerId: string | Types.ObjectId,
  resourceName = 'Resource'
): void {
  if (!resource) {
    throw new AppError(`${resourceName} not found`, 404);
  }

  const resourceOwnerId = resource.owner?.toString() || resource.owner;
  const userId = ownerId.toString();

  if (resourceOwnerId !== userId) {
    throw new AppError(
      `Access denied: ${resourceName} does not belong to you`,
      403
    );
  }
}
