import mongoose, { Types } from 'mongoose';
import { AppError } from '../../../src/utils/appError';
import {
  isValidObjectId,
  toObjectId,
  createSession,
  withTransaction,
  handleDuplicateKeyError,
  handleValidationError,
  handleCastError,
  handleDatabaseError,
  validateOwnership,
} from '../../../src/utils/database';

// Mock mongoose
jest.mock('mongoose', () => ({
  ...jest.requireActual('mongoose'),
  startSession: jest.fn(),
}));

describe('Database Utils', () => {
  describe('isValidObjectId', () => {
    it('should return true for valid ObjectId string', () => {
      const validId = '507f1f77bcf86cd799439011';
      expect(isValidObjectId(validId)).toBe(true);
    });

    it('should return false for invalid ObjectId string', () => {
      const invalidId = 'invalid-id';
      expect(isValidObjectId(invalidId)).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isValidObjectId('')).toBe(false);
    });
  });

  describe('toObjectId', () => {
    it('should return ObjectId for valid string', () => {
      const validId = '507f1f77bcf86cd799439011';
      const result = toObjectId(validId);
      expect(result).toBeInstanceOf(Types.ObjectId);
      expect(result.toString()).toBe(validId);
    });

    it('should throw AppError for invalid string', () => {
      const invalidId = 'invalid-id';
      expect(() => toObjectId(invalidId)).toThrow(AppError);
      expect(() => toObjectId(invalidId)).toThrow('Invalid ID format');
    });
  });

  describe('createSession', () => {
    it('should return a session', async () => {
      const mockSession = { id: 'session-123' };
      (mongoose.startSession as jest.Mock).mockResolvedValue(mockSession);

      const result = await createSession();
      expect(result).toBe(mockSession);
      expect(mongoose.startSession).toHaveBeenCalled();
    });
  });

  describe('withTransaction', () => {
    it('should execute function with transaction successfully', async () => {
      const mockSession = {
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        endSession: jest.fn(),
      };
      (mongoose.startSession as jest.Mock).mockResolvedValue(mockSession);

      const mockFn = jest.fn().mockResolvedValue('success');
      const result = await withTransaction(mockFn);

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledWith(mockSession);
      expect(mockSession.startTransaction).toHaveBeenCalled();
      expect(mockSession.commitTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
    });

    it('should fallback to non-transactional for standalone MongoDB', async () => {
      const mockSession = {
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        endSession: jest.fn(),
      };
      (mongoose.startSession as jest.Mock).mockResolvedValue(mockSession);

      // Mock transaction failure with illegal operation error
      mockSession.startTransaction.mockImplementation(() => {
        const error = { code: 20, codeName: 'IllegalOperation' };
        throw error;
      });

      const mockFn = jest.fn().mockResolvedValue('fallback-success');
      const result = await withTransaction(mockFn);

      expect(result).toBe('fallback-success');
      expect(mockFn).toHaveBeenCalledTimes(1); // Only called once with null (fallback)
      expect(mockFn).toHaveBeenCalledWith(null);
    });

    it('should propagate non-transaction errors', async () => {
      const mockSession = {
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        endSession: jest.fn(),
      };
      (mongoose.startSession as jest.Mock).mockResolvedValue(mockSession);

      const testError = new Error('Database connection failed');
      const mockFn = jest.fn().mockRejectedValue(testError);

      await expect(withTransaction(mockFn)).rejects.toThrow('Database connection failed');
    });
  });

  describe('handleDuplicateKeyError', () => {
    it('should return 409 error for duplicate key', () => {
      const duplicateError = {
        code: 11000,
        keyPattern: { email: 1 },
        keyValue: { email: 'test@example.com' },
      };

      const result = handleDuplicateKeyError(duplicateError);
      expect(result).toBeInstanceOf(AppError);
      expect(result.statusCode).toBe(409);
      expect(result.message).toBe('email already exists');
    });

    it('should return 500 error for non-duplicate key error', () => {
      const otherError = new Error('Some other error');
      const result = handleDuplicateKeyError(otherError);
      expect(result).toBeInstanceOf(AppError);
      expect(result.statusCode).toBe(500);
      expect(result.message).toBe('Database error');
    });
  });

  describe('handleValidationError', () => {
    it('should return 400 error with details for validation error', () => {
      const validationError = {
        name: 'ValidationError',
        errors: {
          email: {
            path: 'email',
            message: 'Email is required',
            value: undefined,
          },
          password: {
            path: 'password',
            message: 'Password too short',
            value: '123',
          },
        },
      };

      const result = handleValidationError(validationError);
      expect(result).toBeInstanceOf(AppError);
      expect(result.statusCode).toBe(400);
      expect(result.message).toBe('Validation failed');
      expect(result.details).toEqual([
        { path: 'email', message: 'Email is required' },
        { path: 'password', message: 'Password too short' },
      ]);
    });

    it('should return 500 error for non-validation error', () => {
      const otherError = new Error('Some other error');
      const result = handleValidationError(otherError);
      expect(result).toBeInstanceOf(AppError);
      expect(result.statusCode).toBe(500);
      expect(result.message).toBe('Database error');
    });
  });

  describe('handleCastError', () => {
    it('should return 400 error for cast error', () => {
      const castError = {
        name: 'CastError',
        path: '_id',
        value: 'invalid-id',
      };

      const result = handleCastError(castError);
      expect(result).toBeInstanceOf(AppError);
      expect(result.statusCode).toBe(400);
      expect(result.message).toBe('Invalid _id: invalid-id');
    });

    it('should return 500 error for non-cast error', () => {
      const otherError = new Error('Some other error');
      const result = handleCastError(otherError);
      expect(result).toBeInstanceOf(AppError);
      expect(result.statusCode).toBe(500);
      expect(result.message).toBe('Database error');
    });
  });

  describe('handleDatabaseError', () => {
    it('should pass through AppError instances', () => {
      const appError = new AppError('Custom error', 422);
      const result = handleDatabaseError(appError);
      expect(result).toBe(appError);
    });

    it('should handle validation errors', () => {
      const validationError = {
        name: 'ValidationError',
        errors: {
          email: { path: 'email', message: 'Required', value: undefined },
        },
      };

      const result = handleDatabaseError(validationError);
      expect(result).toBeInstanceOf(AppError);
      expect(result.statusCode).toBe(400);
      expect(result.message).toBe('Validation failed');
    });

    it('should handle cast errors', () => {
      const castError = {
        name: 'CastError',
        path: '_id',
        value: 'invalid',
      };

      const result = handleDatabaseError(castError);
      expect(result).toBeInstanceOf(AppError);
      expect(result.statusCode).toBe(400);
      expect(result.message).toBe('Invalid _id: invalid');
    });

    it('should handle duplicate key errors', () => {
      const duplicateError = {
        code: 11000,
        keyPattern: { email: 1 },
        keyValue: { email: 'test@example.com' },
      };

      const result = handleDatabaseError(duplicateError);
      expect(result).toBeInstanceOf(AppError);
      expect(result.statusCode).toBe(409);
      expect(result.message).toBe('email already exists');
    });

    it('should handle network errors', () => {
      const networkError = {
        name: 'MongoNetworkError',
      };

      const result = handleDatabaseError(networkError);
      expect(result).toBeInstanceOf(AppError);
      expect(result.statusCode).toBe(503);
      expect(result.message).toBe('Database connection error');
    });

    it('should return 500 for unknown errors', () => {
      const unknownError = new Error('Unknown error');
      const result = handleDatabaseError(unknownError);
      expect(result).toBeInstanceOf(AppError);
      expect(result.statusCode).toBe(500);
      expect(result.message).toBe('Internal server error');
    });
  });

  describe('validateOwnership', () => {
    it('should pass for valid ownership', () => {
      const resource = { owner: '507f1f77bcf86cd799439011' };
      const ownerId = '507f1f77bcf86cd799439011';

      expect(() => validateOwnership(resource, ownerId)).not.toThrow();
    });

    it('should pass for valid ownership with ObjectId', () => {
      const resource = { owner: new Types.ObjectId('507f1f77bcf86cd799439011') };
      const ownerId = new Types.ObjectId('507f1f77bcf86cd799439011');

      expect(() => validateOwnership(resource, ownerId)).not.toThrow();
    });

    it('should throw 404 for null resource', () => {
      const ownerId = '507f1f77bcf86cd799439011';

      expect(() => validateOwnership(null, ownerId)).toThrow(AppError);
      expect(() => validateOwnership(null, ownerId)).toThrow('Resource not found');
    });

    it('should throw 404 for undefined resource', () => {
      const ownerId = '507f1f77bcf86cd799439011';

      expect(() => validateOwnership(undefined, ownerId)).toThrow(AppError);
      expect(() => validateOwnership(undefined, ownerId)).toThrow('Resource not found');
    });

    it('should throw 403 for access denied', () => {
      const resource = { owner: '507f1f77bcf86cd799439011' };
      const ownerId = '507f1f77bcf86cd799439012';

      expect(() => validateOwnership(resource, ownerId)).toThrow(AppError);
      expect(() => validateOwnership(resource, ownerId)).toThrow('Access denied: Resource does not belong to you');
    });

    it('should use custom resource name in error messages', () => {
      const resource = { owner: '507f1f77bcf86cd799439011' };
      const ownerId = '507f1f77bcf86cd799439012';

      expect(() => validateOwnership(null, ownerId, 'Task')).toThrow('Task not found');
      expect(() => validateOwnership(resource, ownerId, 'Task')).toThrow('Access denied: Task does not belong to you');
    });
  });
});
