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
import { createHmac, randomBytes } from 'crypto';
import { refreshTokenModel } from '../models/refreshTokens';
import { ServerEnv } from '../config/env';
import {
  CookieService,
  createCookieService,
} from '../services/auth/cookieService';
import { demoDataService } from '../services/demo/demoDataService';

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

    // Check if registration is disabled globally
    const { globalSettingsService } = await import('../services/admin/globalSettingsService');
    const { checkGlobalRestriction } = await import('../utils/userRestrictions');
    const globalSettings = await globalSettingsService.getGlobalSettings();
    
    if (checkGlobalRestriction('registerDisabled', globalSettings.restrictions)) {
      throw new AppError('Registration is currently disabled', 403);
    }

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

    // Check if login is disabled (global or per-user)
    const { globalSettingsService } = await import('../services/admin/globalSettingsService');
    const { checkRestriction } = await import('../utils/userRestrictions');
    const globalSettings = await globalSettingsService.getGlobalSettings();
    
    if (checkRestriction(user, 'loginDisabled', globalSettings.restrictions)) {
      // Determine if it's global or per-user restriction for better error message
      const isGlobalRestriction = globalSettings.restrictions.loginDisabled === true;
      const isUserRestriction = user.restrictions?.loginDisabled === true;
      
      if (isGlobalRestriction) {
        throw new AppError('Login is currently disabled', 403);
      } else if (isUserRestriction) {
        throw new AppError('Login is currently disabled for your account', 403);
      }
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

  /**
   * Create a demo account with sample data
   */
  demo = catchAsync(async (req: Request, res: Response) => {
    this.logOperation(req, 'Demo account creation attempt', {
      ip: req.ip,
    });

    // Generate unique demo email
    const randomId = randomBytes(8).toString('hex');
    const demoEmail = `demo-${randomId}@lukasj.dev`;
    const demoName = 'Demo User';
    const demoPassword = randomBytes(16).toString('hex'); // Random password

    // Check if email already exists (unlikely but handle it)
    let existingUser = await userModel.findOne({ email: demoEmail });
    let attempts = 0;
    while (existingUser && attempts < 5) {
      const newRandomId = randomBytes(8).toString('hex');
      const newDemoEmail = `demo-${newRandomId}@lukasj.dev`;
      existingUser = await userModel.findOne({ email: newDemoEmail });
      if (!existingUser) {
        existingUser = null;
        break;
      }
      attempts++;
    }

    if (existingUser) {
      throw new AppError('Failed to create demo account. Please try again.', 500);
    }

    // Create new demo user
    const newUser = await userModel.create({
      name: demoName,
      email: demoEmail,
      password: demoPassword,
    });

    // Create sample data
    try {
      await demoDataService.createDemoData(newUser._id.toString());
    } catch (error) {
      // If demo data creation fails, delete the user and throw error
      await userModel.deleteOne({ _id: newUser._id });
      this.logOperation(req, 'Demo data creation failed', {
        userId: newUser._id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new AppError('Failed to create demo data', 500);
    }

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

    this.logOperation(req, 'Demo account created successfully', {
      userId: newUser._id,
      email: demoEmail,
    });

    this.sendCreated(res, {
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
      },
    });
  });
}
