import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { catchAsync } from '../utils/catchAsync';
import { adminService } from '../services/admin/adminService';
import { ServerEnv } from '../config/env';
import { logger } from '../utils/logger';
import { AppError } from '../utils/appError';

/**
 * Admin controller for managing admin dashboard operations
 */
export class AdminController extends BaseController {
  constructor(env: ServerEnv) {
    super(env);
  }

  /**
   * Get overall statistics
   * GET /api/v1/admin/stats
   */
  getStats = catchAsync(async (req: Request, res: Response) => {
    this.logOperation(req, 'Admin: Get stats', {
      ip: req.ip,
    });

    const stats = await adminService.getStats();

    this.sendSuccess(res, stats);
  });

  /**
   * Get paginated user list
   * GET /api/v1/admin/users?page=1&limit=50&search=query
   */
  getUsers = catchAsync(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const search = req.query.search as string | undefined;

    this.logOperation(req, 'Admin: Get users', {
      ip: req.ip,
      page,
      limit,
      search,
    });

    const result = await adminService.getUsers(page, limit, search);

    this.sendSuccess(res, result);
  });

  /**
   * Get all demo accounts
   * GET /api/v1/admin/demo-accounts
   */
  getDemoAccounts = catchAsync(async (req: Request, res: Response) => {
    this.logOperation(req, 'Admin: Get demo accounts', {
      ip: req.ip,
    });

    const demoAccounts = await adminService.getDemoAccounts();

    this.sendSuccess(res, { demoAccounts });
  });

  /**
   * Delete a specific user
   * DELETE /api/v1/admin/users/:userId
   */
  deleteUser = catchAsync(async (req: Request, res: Response) => {
    const { userId } = req.params;

    this.logOperation(req, 'Admin: Delete user', {
      ip: req.ip,
      userId,
    });

    await adminService.deleteUser(userId);

    logger.warn(
      {
        ip: req.ip,
        userId,
      },
      'Admin: User deleted'
    );

    this.sendNoContent(res, { message: 'User deleted successfully' });
  });

  /**
   * Delete all demo accounts
   * DELETE /api/v1/admin/demo-accounts
   */
  deleteDemoAccounts = catchAsync(async (req: Request, res: Response) => {
    this.logOperation(req, 'Admin: Delete demo accounts', {
      ip: req.ip,
    });

    const result = await adminService.deleteDemoAccounts();

    logger.warn(
      {
        ip: req.ip,
        deletedCount: result.deletedCount,
      },
      'Admin: Demo accounts deleted'
    );

    this.sendSuccess(res, {
      message: `Deleted ${result.deletedCount} demo accounts`,
      deletedCount: result.deletedCount,
    });
  });

  /**
   * Get activity metrics
   * GET /api/v1/admin/activity
   */
  getActivity = catchAsync(async (req: Request, res: Response) => {
    this.logOperation(req, 'Admin: Get activity', {
      ip: req.ip,
    });

    const activity = await adminService.getActivity();

    this.sendSuccess(res, activity);
  });

  /**
   * Get AI statistics
   * GET /api/v1/admin/ai/stats
   */
  getAIStats = catchAsync(async (req: Request, res: Response) => {
    this.logOperation(req, 'Admin: Get AI stats', {
      ip: req.ip,
    });

    const stats = await adminService.getAIStats();

    this.sendSuccess(res, stats);
  });

  /**
   * Get AI usage trends
   * GET /api/v1/admin/ai/usage-trends
   */
  getAIUsageTrends = catchAsync(async (req: Request, res: Response) => {
    this.logOperation(req, 'Admin: Get AI usage trends', {
      ip: req.ip,
    });

    const trends = await adminService.getAIUsageTrends();

    this.sendSuccess(res, trends);
  });

  /**
   * Get AI tool usage
   * GET /api/v1/admin/ai/tool-usage
   */
  getAIToolUsage = catchAsync(async (req: Request, res: Response) => {
    this.logOperation(req, 'Admin: Get AI tool usage', {
      ip: req.ip,
    });

    const toolUsage = await adminService.getAIToolUsage();

    this.sendSuccess(res, { toolUsage });
  });

  /**
   * Get top AI users
   * GET /api/v1/admin/ai/top-users?limit=20
   */
  getTopAIUsers = catchAsync(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 20;

    this.logOperation(req, 'Admin: Get top AI users', {
      ip: req.ip,
      limit,
    });

    const topUsers = await adminService.getTopAIUsers(limit);

    this.sendSuccess(res, { topUsers });
  });

  /**
   * Get database size statistics
   * GET /api/v1/admin/database/stats
   */
  getDatabaseStats = catchAsync(async (req: Request, res: Response) => {
    this.logOperation(req, 'Admin: Get database stats', {
      ip: req.ip,
    });

    const dbStats = await adminService.getDatabaseStats();

    this.sendSuccess(res, dbStats);
  });

  /**
   * Get cleanup counts by age ranges
   * GET /api/v1/admin/cleanup/counts
   */
  getCleanupCounts = catchAsync(async (req: Request, res: Response) => {
    this.logOperation(req, 'Admin: Get cleanup counts', {
      ip: req.ip,
    });

    const counts = await adminService.getCleanupCounts();

    this.sendSuccess(res, counts);
  });

  /**
   * Delete todolists by age
   * DELETE /api/v1/admin/cleanup/todolists?ageDays=30
   */
  deleteTodolistsByAge = catchAsync(async (req: Request, res: Response) => {
    const ageDays = parseInt(req.query.ageDays as string);
    if (!ageDays || ageDays < 1) {
      throw new AppError('Invalid ageDays parameter', 400);
    }

    this.logOperation(req, 'Admin: Delete todolists by age', {
      ip: req.ip,
      ageDays,
    });

    const result = await adminService.deleteTodolistsByAge(ageDays);

    logger.warn(
      {
        ip: req.ip,
        ageDays,
        deletedCount: result.deletedCount,
      },
      'Admin: Todolists deleted by age'
    );

    this.sendSuccess(res, result);
  });

  /**
   * Delete tasks by age
   * DELETE /api/v1/admin/cleanup/tasks?ageDays=30
   */
  deleteTasksByAge = catchAsync(async (req: Request, res: Response) => {
    const ageDays = parseInt(req.query.ageDays as string);
    if (!ageDays || ageDays < 1) {
      throw new AppError('Invalid ageDays parameter', 400);
    }

    this.logOperation(req, 'Admin: Delete tasks by age', {
      ip: req.ip,
      ageDays,
    });

    const result = await adminService.deleteTasksByAge(ageDays);

    logger.warn(
      {
        ip: req.ip,
        ageDays,
        deletedCount: result.deletedCount,
      },
      'Admin: Tasks deleted by age'
    );

    this.sendSuccess(res, result);
  });

  /**
   * Delete conversations by age
   * DELETE /api/v1/admin/cleanup/conversations?ageDays=30
   */
  deleteConversationsByAge = catchAsync(async (req: Request, res: Response) => {
    const ageDays = parseInt(req.query.ageDays as string);
    if (!ageDays || ageDays < 1) {
      throw new AppError('Invalid ageDays parameter', 400);
    }

    this.logOperation(req, 'Admin: Delete conversations by age', {
      ip: req.ip,
      ageDays,
    });

    const result = await adminService.deleteConversationsByAge(ageDays);

    logger.warn(
      {
        ip: req.ip,
        ageDays,
        deletedCount: result.deletedCount,
      },
      'Admin: Conversations deleted by age'
    );

    this.sendSuccess(res, result);
  });

  /**
   * Delete memories by age
   * DELETE /api/v1/admin/cleanup/memories?ageDays=30
   */
  deleteMemoriesByAge = catchAsync(async (req: Request, res: Response) => {
    const ageDays = parseInt(req.query.ageDays as string);
    if (!ageDays || ageDays < 1) {
      throw new AppError('Invalid ageDays parameter', 400);
    }

    this.logOperation(req, 'Admin: Delete memories by age', {
      ip: req.ip,
      ageDays,
    });

    const result = await adminService.deleteMemoriesByAge(ageDays);

    logger.warn(
      {
        ip: req.ip,
        ageDays,
        deletedCount: result.deletedCount,
      },
      'Admin: Memories deleted by age'
    );

    this.sendSuccess(res, result);
  });

  /**
   * Get user restrictions
   * GET /api/v1/admin/users/:userId/restrictions
   */
  getUserRestrictions = catchAsync(async (req: Request, res: Response) => {
    const { userId } = req.params;
    this.logOperation(req, 'Admin: Get user restrictions', {
      ip: req.ip,
      userId,
    });

    const restrictions = await adminService.getUserRestrictions(userId);
    this.sendSuccess(res, restrictions);
  });

  /**
   * Update user restrictions
   * PUT /api/v1/admin/users/:userId/restrictions
   */
  updateUserRestrictions = catchAsync(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const restrictions = req.body;

    this.logOperation(req, 'Admin: Update user restrictions', {
      ip: req.ip,
      userId,
      restrictions,
    });

    const updated = await adminService.updateUserRestrictions(
      userId,
      restrictions
    );

    logger.warn(
      {
        ip: req.ip,
        userId,
        restrictions: updated,
      },
      'Admin: User restrictions updated'
    );

    this.sendSuccess(res, updated);
  });

  /**
   * Get user limits
   * GET /api/v1/admin/users/:userId/limits
   */
  getUserLimits = catchAsync(async (req: Request, res: Response) => {
    const { userId } = req.params;
    this.logOperation(req, 'Admin: Get user limits', {
      ip: req.ip,
      userId,
    });

    const limits = await adminService.getUserLimits(userId);
    this.sendSuccess(res, limits);
  });

  /**
   * Update user limits
   * PUT /api/v1/admin/users/:userId/limits
   */
  updateUserLimits = catchAsync(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const limits = req.body;

    this.logOperation(req, 'Admin: Update user limits', {
      ip: req.ip,
      userId,
      limits,
    });

    const updated = await adminService.updateUserLimits(userId, limits);

    logger.warn(
      {
        ip: req.ip,
        userId,
        limits: updated,
      },
      'Admin: User limits updated'
    );

    this.sendSuccess(res, updated);
  });

  /**
   * Get global settings
   * GET /api/v1/admin/settings/global
   */
  getGlobalSettings = catchAsync(async (req: Request, res: Response) => {
    this.logOperation(req, 'Admin: Get global settings', { ip: req.ip });

    const settings = await adminService.getGlobalSettings();
    this.sendSuccess(res, settings);
  });

  /**
   * Update global restrictions
   * PUT /api/v1/admin/settings/global/restrictions
   */
  updateGlobalRestrictions = catchAsync(async (req: Request, res: Response) => {
    const restrictions = req.body;

    this.logOperation(req, 'Admin: Update global restrictions', {
      ip: req.ip,
      restrictions,
    });

    const updated = await adminService.updateGlobalRestrictions(restrictions);

    logger.warn(
      {
        ip: req.ip,
        restrictions: updated,
      },
      'Admin: Global restrictions updated'
    );

    this.sendSuccess(res, updated);
  });

  /**
   * Update global limits
   * PUT /api/v1/admin/settings/global/limits
   */
  updateGlobalLimits = catchAsync(async (req: Request, res: Response) => {
    const limits = req.body;

    this.logOperation(req, 'Admin: Update global limits', {
      ip: req.ip,
      limits,
    });

    const updated = await adminService.updateGlobalLimits(limits);

    logger.warn(
      {
        ip: req.ip,
        limits: updated,
      },
      'Admin: Global limits updated'
    );

    this.sendSuccess(res, updated);
  });
}
