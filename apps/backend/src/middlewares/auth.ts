// src/middleware/auth.middleware.ts
import type { Request, Response, NextFunction } from 'express';
import { readAccessFromRequest } from '../services/auth/cookieService';
import { verifyAccessToken } from '../services/auth/accessService';
import { AppError } from '../utils/appError';
import { userModel } from '../models/userModel';

// Request interface is now defined in src/types/express.d.ts

/** Require a valid access token. Attaches req.auth = { userId, roles, iat, exp, jti, iss, aud }. */
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = readAccessFromRequest(req); // cookie or Authorization header
  if (!token) return next(new AppError('Unauthorized', 401));

  try {
    const payload = verifyAccessToken(token);
    req.auth = payload;
    return next();
  } catch (err) {
    // verifyAccessToken already throws AppError (401 expired/invalid)
    return next(
      err instanceof AppError ? err : new AppError('Unauthorized', 401)
    );
  }
}

/**
 * Require auth AND load the user document (for handlers that still expect req.user).
 * Minimizes DB fields; convert _id → id.
 */
export async function requireAuthWithUser(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  const token = readAccessFromRequest(req);
  if (!token) return next(new AppError('Unauthorized', 401));

  try {
    const payload = verifyAccessToken(token);
    req.auth = payload;

    const doc = await userModel
      .findById(payload.userId)
      .select('name email')
      .lean();
    if (!doc) return next(new AppError('Unauthorized', 401));

    req.user = { id: String(doc._id), name: doc.name, email: doc.email };
    return next();
  } catch (err) {
    return next(
      err instanceof AppError ? err : new AppError('Unauthorized', 401)
    );
  }
}
