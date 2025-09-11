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
import { validateServerEnv } from '../config/env';

const env = validateServerEnv(process.env);

/**
 * @swagger
 * /api/v1/auth/signup:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SignupRequest'
 *           examples:
 *             example1:
 *               summary: New user registration
 *               value:
 *                 name: "User Name"
 *                 email: "user@example.com"
 *                 password: "SecurePassword123!"
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 *             examples:
 *               success:
 *                 summary: Successful registration
 *                 value:
 *                   success: true
 *                   user:
 *                     id: "507f1f77bcf86cd799439011"
 *                     name: "User Name"
 *                     email: "user@example.com"
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: User already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Too many registration attempts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const signup = catchAsync(async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  // Log user registration attempt
  req.log.info(
    {
      email,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    },
    'User registration attempt'
  );

  const user = await userModel.create({ name, email, password });

  const { token: refreshToken, expiresAt } = await createRefreshToken({
    userId: user._id,
    ipAddress: req.ip,
    userAgent: req.get('user-agent') || undefined,
  });

  const ACCESS_TTL_MS =
    env.ACCESS_TOKEN_TTL_MS > 0 ? env.ACCESS_TOKEN_TTL_MS : 15 * 60 * 1000; // 15m default

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

  // Log successful user registration
  req.log.info(
    {
      userId: user._id.toString(),
      email: user.email,
      ip: req.ip,
    },
    'User registered successfully'
  );

  // Respond with public user only
  const publicUser = {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
  };
  return response.created(res, { user: publicUser });
});

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Authenticate user and create session
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           examples:
 *             example1:
 *               summary: User login
 *               value:
 *                 email: "user@example.com"
 *                 password: "SecurePassword123!"
 *     responses:
 *       200:
 *         description: Login successful
 *         headers:
 *           Set-Cookie:
 *             description: HttpOnly cookies containing access and refresh tokens
 *             schema:
 *               type: string
 *               example: "accessToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; HttpOnly; Secure; SameSite=Strict"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 *             examples:
 *               success:
 *                 summary: Successful login
 *                 value:
 *                   success: true
 *                   user:
 *                     id: "507f1f77bcf86cd799439011"
 *                     name: "User Name"
 *                     email: "user@example.com"
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Too many login attempts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const login = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Log login attempt
  req.log.info(
    {
      email,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    },
    'Login attempt'
  );

  const user = await userModel.validateCredentials(email, password);

  if (!user) {
    // Log failed login
    req.log.warn(
      {
        email,
        ip: req.ip,
      },
      'Login failed - invalid credentials'
    );
    throw new AppError('Invalid credentials', 401);
  }

  const { token: refreshToken, expiresAt } = await createRefreshToken({
    userId: user._id,
    ipAddress: req.ip,
    userAgent: req.get('user-agent') || undefined,
  });

  const ACCESS_TTL_MS =
    env.ACCESS_TOKEN_TTL_MS > 0 ? env.ACCESS_TOKEN_TTL_MS : 15 * 60 * 1000; // 15m default

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

  // Log successful login
  req.log.info(
    {
      userId: user._id.toString(),
      email: user.email,
      ip: req.ip,
    },
    'Login successful'
  );

  // Respond with public user only (no tokens in body)
  const publicUser = {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
  };
  return response.ok(res, { user: publicUser });
});

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     summary: Refresh access token using refresh token
 *     tags: [Authentication]
 *     security:
 *       - refreshToken: []
 *     responses:
 *       204:
 *         description: Token refreshed successfully
 *         headers:
 *           Set-Cookie:
 *             description: New HttpOnly cookies containing refreshed tokens
 *             schema:
 *               type: string
 *               example: "accessToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; HttpOnly; Secure; SameSite=Strict"
 *       401:
 *         description: Invalid or expired refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Too many refresh attempts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const refresh = catchAsync(async (req: Request, res: Response) => {
  const raw = parseRefreshFromRequest(req);
  if (!raw) {
    req.log.warn(
      {
        ip: req.ip,
        userAgent: req.get('user-agent'),
      },
      'Token refresh failed - no refresh token'
    );
    throw new AppError('Unauthorized', 401);
  }

  // Log token refresh attempt
  req.log.info(
    {
      ip: req.ip,
      userAgent: req.get('user-agent'),
    },
    'Token refresh attempt'
  );

  const ACCESS_TTL_MS =
    env.ACCESS_TOKEN_TTL_MS > 0 ? env.ACCESS_TOKEN_TTL_MS : 15 * 60 * 1000; // 15m default

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

    // Log successful token refresh
    req.log.info(
      {
        userId,
        ip: req.ip,
      },
      'Token refresh successful'
    );

    response.noContent(res, {});
  } catch (err: any) {
    // Log token refresh failure
    req.log.warn(
      {
        ip: req.ip,
        userAgent: req.get('user-agent'),
        error: err.message,
      },
      'Token refresh failed'
    );
    // On invalid/reused refresh, clear cookies so the client can re-auth cleanly
    if (err?.statusCode === 401) {
      clearAuthCookies({ res });
    }
    throw err;
  }
});

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: Logout user and invalidate session
 *     tags: [Authentication]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       204:
 *         description: Logout successful
 *         headers:
 *           Set-Cookie:
 *             description: Cleared HttpOnly cookies
 *             schema:
 *               type: string
 *               example: "accessToken=; HttpOnly; Secure; SameSite=Strict; Max-Age=0"
 *       401:
 *         description: User not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const logout = catchAsync(async (req: Request, res: Response) => {
  // Log logout attempt
  req.log.info(
    {
      userId: req.user?.id,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    },
    'User logout attempt'
  );

  // Try to revoke the current device's session (family) using the refresh cookie.
  const raw = parseRefreshFromRequest(req);

  if (raw) {
    const secret = env.REFRESH_HASH_SECRET;
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

  // Log successful logout
  req.log.info(
    {
      userId: req.user?.id,
      ip: req.ip,
    },
    'User logged out successfully'
  );

  return response.noContent(res, {});
});

/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     summary: Get current user information
 *     tags: [Authentication]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: User information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 *             examples:
 *               success:
 *                 summary: Current user info
 *                 value:
 *                   success: true
 *                   user:
 *                     id: "507f1f77bcf86cd799439011"
 *                     name: "User Name"
 *                     email: "user@example.com"
 *       401:
 *         description: User not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
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
