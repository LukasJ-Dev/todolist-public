import { AppError } from '../../../src/utils/appError';

describe('AppError', () => {
  it('should create AppError with message and status code', () => {
    const message = 'Test error message';
    const statusCode = 400;
    const error = new AppError(message, statusCode);

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
    expect(error.message).toBe(message);
    expect(error.statusCode).toBe(statusCode);
    expect(error.isOperational).toBe(true);
  });

  it('should have correct prototype chain', () => {
    const error = new AppError('Test', 500);
    expect(Object.getPrototypeOf(error)).toBe(AppError.prototype);
  });

  it('should have stack trace', () => {
    const error = new AppError('Test', 500);
    expect(error.stack).toBeDefined();
    expect(typeof error.stack).toBe('string');
  });

  it('should allow optional details property', () => {
    const error = new AppError('Validation failed', 400);
    error.details = [
      { path: 'email', message: 'Email is required' },
      { path: 'password', message: 'Password too short' },
    ];

    expect(error.details).toEqual([
      { path: 'email', message: 'Email is required' },
      { path: 'password', message: 'Password too short' },
    ]);
  });

  it('should work with different status codes', () => {
    const error400 = new AppError('Bad request', 400);
    const error404 = new AppError('Not found', 404);
    const error500 = new AppError('Server error', 500);

    expect(error400.statusCode).toBe(400);
    expect(error404.statusCode).toBe(404);
    expect(error500.statusCode).toBe(500);
  });

  it('should be throwable and catchable', () => {
    const error = new AppError('Test error', 400);
    
    expect(() => {
      throw error;
    }).toThrow(AppError);
    
    expect(() => {
      throw error;
    }).toThrow('Test error');
  });
});