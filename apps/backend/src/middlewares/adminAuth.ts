import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError';
import { validateServerEnv } from '../config/env';
import bcrypt from 'bcryptjs';
import { logger } from '../utils/logger';

const env = validateServerEnv(process.env);

/**
 * Middleware to check if request IP is in admin whitelist
 * If whitelist is empty, skip the check (for flexibility)
 */
export function requireAdminIP(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  const whitelist = env.ADMIN_IP_WHITELIST;

  // If no whitelist configured, skip IP check
  if (!whitelist || whitelist.trim() === '') {
    return next();
  }

  const clientIP = req.ip || req.socket.remoteAddress || 'unknown';
  const allowedIPs = whitelist.split(',').map((ip) => ip.trim());

  if (!allowedIPs.includes(clientIP)) {
    logger.warn(
      {
        ip: clientIP,
        endpoint: req.originalUrl,
        method: req.method,
      },
      'Admin access denied: IP not whitelisted'
    );
    return next(new AppError('Access denied', 403));
  }

  return next();
}

/**
 * Middleware to validate admin password from request body
 * Password must be provided in req.body.password
 */
export function validateAdminPassword(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  const passwordHash = env.ADMIN_PASSWORD_HASH;

  if (!passwordHash || passwordHash.trim() === '') {
    logger.error('Admin password hash not configured');
    return next(new AppError('Admin access not configured', 500));
  }

  // Check password from body (POST/PUT/DELETE) or header (GET)
  const password =
    req.body?.password || req.headers['x-admin-password'] || undefined;

  if (!password || typeof password !== 'string') {
    logger.warn(
      {
        ip: req.ip,
        endpoint: req.originalUrl,
        method: req.method,
      },
      'Admin access denied: No password provided'
    );
    return next(new AppError('Admin password required', 401));
  }

  // Validate password length (should be 128 characters)
  if (password.length !== 128) {
    logger.warn(
      {
        ip: req.ip,
        endpoint: req.originalUrl,
        method: req.method,
      },
      'Admin access denied: Invalid password length'
    );
    return next(new AppError('Invalid admin password', 401));
  }

  // Compare password with hash
  bcrypt.compare(password, passwordHash, (err, isMatch) => {
    if (err) {
      logger.error(
        {
          error: err.message,
          ip: req.ip,
        },
        'Error validating admin password'
      );
      return next(new AppError('Password validation failed', 500));
    }

    if (!isMatch) {
      logger.warn(
        {
          ip: req.ip,
          endpoint: req.originalUrl,
          method: req.method,
        },
        'Admin access denied: Invalid password'
      );
      return next(new AppError('Invalid admin password', 401));
    }

    // Password is valid, continue
    return next();
  });
}

