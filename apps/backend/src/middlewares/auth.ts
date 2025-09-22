// src/middleware/auth.middleware.ts
import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError';
import { userModel } from '../models/userModel';
import { CookieService } from '../services/auth/cookieService';
import { AccessTokenService } from '../services/auth/accessService';
import { validateServerEnv } from '../config/env';

// Request interface is now defined in src/types/express.d.ts

/**
 * Factory function to create requireAuth middleware with dependency injection.
 * This allows for easy unit testing by mocking the services.
 */
export function createRequireAuth(
  cookieService: CookieService,
  accessTokenService: AccessTokenService
) {
  return function requireAuth(
    req: Request,
    _res: Response,
    next: NextFunction
  ) {
    const token = cookieService.readAccessFromRequest(req); // cookie or Authorization header
    if (!token) return next(new AppError('Unauthorized', 401));

    try {
      const payload = accessTokenService.verifyAccessToken(token);
      req.auth = payload;
      return next();
    } catch (err) {
      // verifyAccessToken already throws AppError (401 expired/invalid)
      return next(
        err instanceof AppError ? err : new AppError('Unauthorized', 401)
      );
    }
  };
}

/**
 * Factory function to create requireAuthWithUser middleware with dependency injection.
 * This allows for easy unit testing by mocking the services and user model.
 */
export function createRequireAuthWithUser(
  cookieService: CookieService,
  accessTokenService: AccessTokenService,
  userModel: {
    findById: (id: string) => {
      select: (fields: string) => {
        lean: () => Promise<{
          _id: string;
          name: string;
          email: string;
        } | null>;
      };
    };
  }
) {
  return async function requireAuthWithUser(
    req: Request,
    _res: Response,
    next: NextFunction
  ) {
    const token = cookieService.readAccessFromRequest(req);
    if (!token) return next(new AppError('User not authenticated', 401));

    try {
      const payload = accessTokenService.verifyAccessToken(token);
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
  };
}

// Backward compatibility - existing code continues to work
const env = validateServerEnv(process.env);
const cookieService = new CookieService(env);
const accessTokenService = new AccessTokenService(env);

/** Require a valid access token. Attaches req.auth = { userId, roles, iat, exp, jti, iss, aud }. */
export const requireAuth = createRequireAuth(cookieService, accessTokenService);

/**
 * Require auth AND load the user document (for handlers that still expect req.user).
 * Minimizes DB fields; convert _id → id.
 */
export const requireAuthWithUser = createRequireAuthWithUser(
  cookieService,
  accessTokenService,
  userModel
);
