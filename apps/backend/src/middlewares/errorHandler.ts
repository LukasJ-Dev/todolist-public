import { NextFunction, Response, Request } from 'express';
import { AppError } from '../utils/appError';
//import { AuthenticatedRequest } from '../types';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  const error =
    err instanceof AppError ? err : new AppError('Internal Server Error', 500);

  const status = error.statusCode || 500;

  res.status(status).json({
    status: status,
    error: error,
    success: false,
    stack: process.env.NODE_ENV === 'production' ? null : error.stack,
  });
}
