import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { userModel } from '../models/userModel';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/appError';
import {
  createRefreshTokenService,
  RefreshTokenService,
} from '../services/auth/refreshService';
import { AccessTokenService } from '../services/auth/accessService';
import { createHmac } from 'crypto';
import { refreshTokenModel } from '../models/refreshTokens';
import { ServerEnv } from '../config/env';
import {
  CookieService,
  createCookieService,
} from '../services/auth/cookieService';

/**
 * Auth controller with environment dependency injection and clean service management
 */
export class AuthController extends BaseController {
  private readonly refreshTokenService: RefreshTokenService;
  private readonly accessTokenService: AccessTokenService;
  private readonly cookieService: CookieService;

  constructor(env: ServerEnv) {
    super(env);

    // Create service instances with environment dependency injection
    this.refreshTokenService = createRefreshTokenService(this.env);
    this.cookieService = createCookieService(this.env);
    this.accessTokenService = new AccessTokenService(this.env);
  }

  /**
   * Register a new user
   */
  signup = catchAsync(async (req: Request, res: Response) => {
    this.logOperation(req, 'User registration attempt', {
      email: req.body.email,
    });

    // Check if user already exists
    const existingUser = await userModel.findOne({ email: req.body.email });
    if (existingUser) {
      throw new AppError('User already exists', 409);
    }

    // Create new user
    const newUser = await userModel.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
    });

    // Create refresh token
    const { token: refreshToken, expiresAt } =
      await this.refreshTokenService.createRefreshToken({
        userId: newUser._id,
        ipAddress: req.ip,
        userAgent: req.get('user-agent') || undefined,
      });

    // Create access token
    const { token: accessToken } =
      await this.accessTokenService.createAccessToken({
        userId: newUser._id.toString(),
      });

    // Issue auth cookies
    this.cookieService.issueAuthCookies({
      res,
      accessToken,
      accessTtlMs: this.getEnvValue('ACCESS_TOKEN_TTL_MS') || 15 * 60 * 1000,
      refreshToken,
      refreshExpiresAt: expiresAt,
    });

    this.logOperation(req, 'User registered successfully', {
      userId: newUser._id,
    });

    this.sendCreated(res, {
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
      },
    });
  });

  /**
   * Login user
   */
  login = catchAsync(async (req: Request, res: Response) => {
    this.logOperation(req, 'User login attempt', {
      email: req.body.email,
    });

    // Find user and validate password
    const user = await userModel
      .findOne({ email: req.body.email })
      .select('+password');

    if (!user || !(await user.checkPassword(req.body.password))) {
      throw new AppError('Invalid credentials', 401);
    }

    // Create refresh token
    const { token: refreshToken, expiresAt } =
      await this.refreshTokenService.createRefreshToken({
        userId: user._id,
        ipAddress: req.ip,
        userAgent: req.get('user-agent') || undefined,
      });

    // Create access token
    const { token: accessToken } =
      await this.accessTokenService.createAccessToken({
        userId: user._id.toString(),
      });

    // Issue auth cookies
    this.cookieService.issueAuthCookies({
      res,
      accessToken,
      accessTtlMs: this.getEnvValue('ACCESS_TOKEN_TTL_MS') || 15 * 60 * 1000,
      refreshToken,
      refreshExpiresAt: expiresAt,
    });

    this.logOperation(req, 'User logged in successfully', {
      userId: user._id,
    });

    this.sendSuccess(res, {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  });

  /**
   * Refresh access token
   */
  refresh = catchAsync(async (req: Request, res: Response) => {
    const refreshToken = this.cookieService.parseRefreshFromRequest(req);

    if (!refreshToken) {
      throw new AppError('Refresh token not provided', 401);
    }

    // Verify refresh token
    const hashedToken = createHmac(
      'sha256',
      this.getEnvValue('REFRESH_HASH_SECRET')
    )
      .update(refreshToken)
      .digest('hex');

    const storedToken = await refreshTokenModel.findOne({
      tokenHash: hashedToken,
      expiresAt: { $gt: new Date() },
    });

    if (!storedToken) {
      throw new AppError('Invalid or expired refresh token', 401);
    }

    // Rotate refresh token
    const { token: newRefreshToken, expiresAt } =
      await this.refreshTokenService.rotateRefreshToken({
        token: refreshToken,
        ipAddress: req.ip,
        userAgent: req.get('user-agent') || undefined,
      });

    // Create new access token
    const { token: accessToken } =
      await this.accessTokenService.createAccessToken({
        userId: storedToken.userId.toString(),
      });

    // Issue new auth cookies
    this.cookieService.issueAuthCookies({
      res,
      accessToken,
      accessTtlMs: this.getEnvValue('ACCESS_TOKEN_TTL_MS') || 15 * 60 * 1000,
      refreshToken: newRefreshToken,
      refreshExpiresAt: expiresAt,
    });

    this.logOperation(req, 'Token refreshed successfully', {
      userId: storedToken.userId,
    });

    this.sendNoContent(res, { message: 'Token refreshed successfully' });
  });

  /**
   * Logout user
   */
  logout = catchAsync(async (req: Request, res: Response) => {
    const userId = this.validateUser(req);

    this.logOperation(req, 'User logout', { userId });

    // Revoke all refresh tokens for this user
    await this.refreshTokenService.revokeRefreshToken({ userId });

    // Clear auth cookies
    this.cookieService.clearAuthCookies({ res });

    this.logOperation(req, 'User logged out successfully', { userId });

    this.sendNoContent(res, { message: 'Logged out successfully' });
  });

  /**
   * Get current user info
   */
  getMe = catchAsync(async (req: Request, res: Response) => {
    const userId = this.validateUser(req);

    const user = await userModel.findById(userId);

    this.sendSuccess(res, {
      user: {
        _id: user?._id,
        name: user?.name,
        email: user?.email,
      },
    });
  });

  /**
   * Get user sessions
   */
  getSessions = catchAsync(async (req: Request, res: Response) => {
    const userId = this.validateUser(req);

    const sessions = await this.refreshTokenService.listUserSessions(userId);

    this.sendSuccess(res, { sessions });
  });
}
