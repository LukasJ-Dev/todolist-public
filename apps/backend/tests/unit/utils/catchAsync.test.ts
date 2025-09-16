import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '../../../src/utils/catchAsync';

describe('catchAsync', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {};
    mockRes = {};
    mockNext = jest.fn();
  });

  it('should call the wrapped function with correct arguments', async () => {
    const mockHandler = jest.fn().mockResolvedValue(undefined);
    const wrappedHandler = catchAsync(mockHandler);

    await wrappedHandler(mockReq as Request, mockRes as Response, mockNext);

    expect(mockHandler).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
  });

  it('should not call next when handler succeeds', async () => {
    const mockHandler = jest.fn().mockResolvedValue('success');
    const wrappedHandler = catchAsync(mockHandler);

    await wrappedHandler(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should call next with error when handler throws', async () => {
    const testError = new Error('Handler error');
    const mockHandler = jest.fn().mockRejectedValue(testError);
    const wrappedHandler = catchAsync(mockHandler);

    await wrappedHandler(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(testError);
  });

  it('should call next with error when handler returns rejected promise', async () => {
    const testError = new Error('Promise rejected');
    const mockHandler = jest.fn().mockReturnValue(Promise.reject(testError));
    const wrappedHandler = catchAsync(mockHandler);

    await wrappedHandler(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(testError);
  });

  it('should work with handlers that return values', async () => {
    const mockHandler = jest.fn().mockReturnValue('return value');
    const wrappedHandler = catchAsync(mockHandler);

    await wrappedHandler(mockReq as Request, mockRes as Response, mockNext);

    // catchAsync doesn't return the handler's return value, it just calls the handler
    expect(mockHandler).toHaveBeenCalled();
    expect(mockNext).not.toHaveBeenCalled();
  });
});
