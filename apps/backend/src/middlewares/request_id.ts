import { Response, NextFunction, Request } from 'express';
import { randomUUID } from 'crypto';
//import { AuthenticatedRequest } from '../types';

export function requestId(req: Request, res: Response, next: NextFunction) {
  const headerId = req.headers['x-request-id'];
  const id = headerId && headerId.length < 100 ? headerId : randomUUID();

  req.id = id as string;
  res.setHeader('X-Request-Id', id);
  next();
}
