import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { userModel } from '../models/userModel';
import { catchAsync } from '../utils/catchAsync';
import { ServerEnv } from '../config/env';

/**
 * User controller with environment dependency injection and clean service management
 */
export class UserController extends BaseController {
  constructor(env: ServerEnv) {
    super(env);
  }

  /**
   * Get all users (admin only)
   */
  getAllUsers = catchAsync(async (req: Request, res: Response) => {
    // Note: In a real app, you'd want to add admin role checking here
    // For now, just requiring authentication
    this.validateUser(req);

    const users = await userModel.find().select('-password');

    this.sendSuccess(res, { users });
  });
}
