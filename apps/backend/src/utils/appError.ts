export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  details?: Array<{
    path: string;
    message: string;
  }>;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this);
  }
}
