import { Request, Response } from 'express';
import { userModel } from '../models/userModel';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/appError';
import {
  createRefreshToken,
  revokeRefreshToken,
  rotateRefreshToken,
} from '../services/auth/refreshService';
import response from '../utils/response';
import {
  clearAuthCookies,
  issueAuthCookies,
  parseRefreshFromRequest,
} from '../services/auth/cookieService';
import { createAccessToken } from '../services/auth/accessService';
import { createHmac } from 'crypto';
import { refreshTokenModel } from '../models/refreshTokens';

export const signup = catchAsync(async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  const user = await userModel.create({ name, email, password });

  const { token: refreshToken, expiresAt } = await createRefreshToken({
    userId: user._id,
    ipAddress: req.ip,
    userAgent: req.get('user-agent') || undefined,
  });

  const ACCESS_TTL_MS =
    Number(process.env.ACCESS_TOKEN_TTL_MS) > 0
      ? Number(process.env.ACCESS_TOKEN_TTL_MS)
      : 15 * 60 * 1000; // 15m default

  const { token: accessToken } = createAccessToken({
    userId: user._id.toString(),
    ttlMs: ACCESS_TTL_MS,
  });

  // Set HttpOnly, Secure cookies
  issueAuthCookies({
    res,
    accessToken,
    accessTtlMs: ACCESS_TTL_MS,
    refreshToken,
    refreshExpiresAt: expiresAt,
  });

  // Respond with public user only
  const publicUser = {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
  };
  return response.created(res, { user: publicUser });
});

export const login = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await userModel.validateCredentials(email, password);

  if (!user) throw new AppError('Invalid credentials', 401);

  const { token: refreshToken, expiresAt } = await createRefreshToken({
    userId: user._id,
    ipAddress: req.ip,
    userAgent: req.get('user-agent') || undefined,
  });
  console.log(refreshToken);

  const ACCESS_TTL_MS =
    Number(process.env.ACCESS_TOKEN_TTL_MS) > 0
      ? Number(process.env.ACCESS_TOKEN_TTL_MS)
      : 15 * 60 * 1000; // 15m default

  const { token: accessToken } = createAccessToken({
    userId: user._id.toString(),
    ttlMs: ACCESS_TTL_MS,
  });

  // Set HttpOnly, Secure cookies
  issueAuthCookies({
    res,
    accessToken,
    accessTtlMs: ACCESS_TTL_MS,
    refreshToken,
    refreshExpiresAt: expiresAt,
  });

  // Respond with public user only (no tokens in body)
  const publicUser = {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
  };
  return response.ok(res, { user: publicUser });
});

export const refresh = catchAsync(async (req: Request, res: Response) => {
  const raw = parseRefreshFromRequest(req);
  if (!raw) throw new AppError('Unauthorized', 401);

  const ACCESS_TTL_MS =
    Number(process.env.ACCESS_TOKEN_TTL_MS) > 0
      ? Number(process.env.ACCESS_TOKEN_TTL_MS)
      : 15 * 60 * 1000; // 15m default

  try {
    // Rotate refresh token (reuse detection handled inside)
    const {
      token: newRefresh,
      userId,
      expiresAt,
    } = await rotateRefreshToken({
      token: raw,
      ipAddress: req.ip,
      userAgent: req.get('user-agent') || undefined,
    });

    // Mint a fresh access token
    const { token: accessToken } = createAccessToken({
      userId: userId.toString(),
      ttlMs: ACCESS_TTL_MS,
    });

    // Set cookies (httpOnly, Secure)
    issueAuthCookies({
      res,
      accessToken,
      accessTtlMs: ACCESS_TTL_MS,
      refreshToken: newRefresh,
      refreshExpiresAt: expiresAt,
    });

    response.noContent(res, {});
  } catch (err: any) {
    // On invalid/reused refresh, clear cookies so the client can re-auth cleanly
    if (err?.statusCode === 401) {
      clearAuthCookies({ res });
    }
    throw err;
  }
});

export const logout = catchAsync(async (req: Request, res: Response) => {
  // Try to revoke the current device's session (family) using the refresh cookie.
  const raw = parseRefreshFromRequest(req);

  if (raw) {
    const secret = process.env.REFRESH_HASH_SECRET;
    if (secret) {
      const tokenHash = createHmac('sha256', secret).update(raw).digest('hex');
      const doc = await refreshTokenModel
        .findOne({ tokenHash })
        .select('familyId')
        .lean();

      if (doc?.familyId) {
        // Revoke this device/session only
        await revokeRefreshToken({ familyId: doc.familyId });
      }
    }
    // If secret missing or token not found, we still clear cookies below (idempotent logout)
  }

  // Always clear cookies so the client is logged out locally.
  clearAuthCookies({ res });
  return response.noContent(res, {});
});

export const me = catchAsync(async (req: Request, res: Response) => {
  if (!req.auth) throw new AppError('Unauthorized', 401);

  const doc = await userModel
    .findById(req.auth.userId)
    .select('name email')
    .lean();
  if (!doc) throw new AppError('Unauthorized', 401);

  return response.ok(res, {
    user: { id: String(doc._id), name: doc.name, email: doc.email },
  });
});
