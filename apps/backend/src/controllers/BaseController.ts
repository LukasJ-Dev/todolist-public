import { Request, Response } from 'express';
import { AppError } from '../utils/appError';
import response from '../utils/response';
import { ServerEnv } from '../config/env';

/**
 * Base controller with environment dependency injection
 * Provides common functionality for all controllers
 */
export abstract class BaseController {
  protected readonly env: ServerEnv;

  constructor(env: ServerEnv) {
    this.env = env;
  }

  /**
   * Validates that the user is authenticated and returns the user ID
   */
  protected validateUser(req: Request): string {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }
    return userId;
  }

  /**
   * Logs an operation with standardized format
   */
  protected logOperation(
    req: Request,
    operation: string,
    data: Record<string, unknown> = {}
  ) {
    req.log.info(
      {
        userId: req.user?.id,
        ...data,
      },
      operation
    );
  }

  /**
   * Logs an error with standardized format
   */
  protected logError(req: Request, error: unknown, operation: string) {
    req.log.error(
      {
        userId: req.user?.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      `${operation} failed`
    );
  }

  /**
   * Standardized success response
   */
  protected sendSuccess<T>(res: Response, data: T) {
    response.ok(res, data);
  }

  /**
   * Standardized created response
   */
  protected sendCreated<T>(res: Response, data: T) {
    response.created(res, data);
  }

  /**
   * Standardized no content response
   */
  protected sendNoContent<T>(res: Response, data: T) {
    response.noContent(res, data);
  }

  /**
   * Get environment configuration value
   */
  protected getEnvValue<K extends keyof ServerEnv>(key: K): ServerEnv[K] {
    return this.env[key];
  }

  /**
   * Check if running in development mode
   */
  protected isDevelopment(): boolean {
    return this.env.NODE_ENV === 'development';
  }

  /**
   * Check if running in production mode
   */
  protected isProduction(): boolean {
    return this.env.NODE_ENV === 'production';
  }

  /**
   * Check if running in test mode
   */
  protected isTest(): boolean {
    return this.env.NODE_ENV === 'test';
  }
}

/**
 * Factory function to create controllers with environment
 */
export function createController<T extends BaseController>(
  ControllerClass: new (env: ServerEnv) => T,
  env: ServerEnv
): T {
  return new ControllerClass(env);
}
