import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../types';

export function errorHandler(
  err: any,
  req: AuthenticatedRequest,
  res: Response,
  _next: NextFunction
) {
  const status = res.statusCode || 500;

  console.error(err.message);

  res.status(status).json({
    status: status,
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    requestId: req.id,
  });
}
