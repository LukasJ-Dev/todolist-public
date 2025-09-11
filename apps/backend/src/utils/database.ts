import mongoose, { Types, ClientSession } from 'mongoose';
import { AppError } from './appError';

// Essential database utility functions

/**
 * Validates if a string is a valid MongoDB ObjectId
 */
export function isValidObjectId(id: string): boolean {
  return Types.ObjectId.isValid(id);
}

/**
 * Converts a string to MongoDB ObjectId with validation
 */
export function toObjectId(id: string): Types.ObjectId {
  if (!isValidObjectId(id)) {
    throw new AppError('Invalid ID format', 400);
  }
  return new Types.ObjectId(id);
}

/**
 * Creates a new MongoDB session for transactions
 */
export async function createSession(): Promise<ClientSession> {
  return await mongoose.startSession();
}

/**
 * Executes a function within a transaction
 */
export async function withTransaction<T>(
  fn: (session: ClientSession) => Promise<T>
): Promise<T> {
  const session = await createSession();

  try {
    session.startTransaction();
    const result = await fn(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Handles MongoDB duplicate key errors
 */
export function handleDuplicateKeyError(error: any): AppError {
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    const message = `${field} already exists`;
    return new AppError(message, 409);
  }
  return new AppError('Database error', 500);
}

/**
 * Handles MongoDB validation errors
 */
export function handleValidationError(error: any): AppError {
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map((err: any) => ({
      path: err.path,
      message: err.message,
    }));
    const appError = new AppError('Validation failed', 400);
    appError.details = errors;
    return appError;
  }
  return new AppError('Database error', 500);
}

/**
 * Handles MongoDB cast errors (invalid ObjectId, etc.)
 */
export function handleCastError(error: any): AppError {
  if (error.name === 'CastError') {
    return new AppError(`Invalid ${error.path}: ${error.value}`, 400);
  }
  return new AppError('Database error', 500);
}

/**
 * Generic database error handler
 */
export function handleDatabaseError(error: any): AppError {
  if (error instanceof AppError) {
    return error;
  }

  // Handle specific MongoDB errors
  if (error.name === 'ValidationError') {
    return handleValidationError(error);
  }

  if (error.name === 'CastError') {
    return handleCastError(error);
  }

  if (error.code === 11000) {
    return handleDuplicateKeyError(error);
  }

  // Handle connection errors
  if (
    error.name === 'MongoNetworkError' ||
    error.name === 'MongoTimeoutError'
  ) {
    return new AppError('Database connection error', 503);
  }

  // Default error
  console.error('Unhandled database error:', error);
  return new AppError('Internal server error', 500);
}

/**
 * Ownership validation helper
 */
export function validateOwnership(
  resource: any,
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
