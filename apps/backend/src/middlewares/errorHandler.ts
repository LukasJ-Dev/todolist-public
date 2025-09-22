import { NextFunction, Response, Request } from 'express';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  const error =
    err instanceof AppError
      ? err
      : new AppError(`Internal Server Error: ${err.message}`, 500);

  const status = error.statusCode || 500;

  // Log the error with context
  const logLevel = status >= 500 ? 'error' : 'warn';
  logger[logLevel](
    {
      error: error.message,
      stack: error.stack,
      statusCode: status,
      path: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      userId: req.user?.id,
      requestId: req.id,
    },
    `Application error: ${error.message}`
  );

  let errorResponse = error;
  if (status === 500)
    errorResponse = new AppError('Internal Server Error', 500);

  // Ensure error message is properly serialized
  const serializedError =
    process.env.NODE_ENV === 'production'
      ? errorResponse
      : {
          message: error.message,
          statusCode: error.statusCode,
          isOperational: error.isOperational,
          ...(error.details && { details: error.details }),
        };

  res.status(status).json({
    status: status,
    error: serializedError,
    success: false,
    stack: process.env.NODE_ENV === 'production' ? null : error.stack,
  });
}
