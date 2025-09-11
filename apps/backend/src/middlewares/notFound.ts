import { NextFunction, Request, Response } from 'express';

export function notFound(req: Request, res: Response, _next: NextFunction) {
  res.status(404).json({
    error: 'Not Found',
    path: req.originalUrl,
    requestId: req.id, // Now properly typed via src/types/express.d.ts
  });
}
