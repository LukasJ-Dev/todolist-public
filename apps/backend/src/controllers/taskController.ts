import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { catchAsync } from '../utils/catchAsync';
import { ServerEnv } from '../config/env';
import { taskService } from '../services/task/taskService';
import { AppError } from '../utils/appError';

/**
 * Task controller with environment dependency injection and clean service management
 */
export class TaskController extends BaseController {
  constructor(env: ServerEnv) {
    super(env);
  }

  /**
   * Get user's tasks
   */
  getMyTasks = catchAsync(async (req: Request, res: Response) => {
    const userId = this.validateUser(req);

    const tags = req.query.tags
      ? (req.query.tags as string).split(',').map((tag) => tag.trim())
      : undefined;

    const filter = req.query.filter as
      | 'due_today'
      | 'due_this_week'
      | 'overdue'
      | 'recurring'
      | 'subtasks'
      | undefined;
    const priority = req.query.priority as
      | 'low'
      | 'medium'
      | 'high'
      | undefined;
    const sort = req.query.sort as
      | 'due_date'
      | 'priority'
      | 'name'
      | 'created'
      | undefined;
    const includeSubtasks = req.query.include === 'subtasks';

    const tasks = await taskService.getTasks(userId, {
      todolistId: req.query.todolist as string | undefined,
      filter,
      priority,
      tags,
      sort,
      includeSubtasks,
    });

    this.sendSuccess(res, { tasks });
  });

  /**
   * Create a new task
   */
  createTask = catchAsync(async (req: Request, res: Response) => {
    const userId = this.validateUser(req);

    // Check restrictions and limits
    const { userModel } = await import('../models/userModel');
    const { globalSettingsService } = await import('../services/admin/globalSettingsService');
    const { checkRestriction, checkLimit } = await import('../utils/userRestrictions');
    const { TaskModel } = await import('../models/taskModel');

    const user = await userModel.findById(userId);
    const globalSettings = await globalSettingsService.getGlobalSettings();

    // Check restriction
    if (checkRestriction(user, 'createTasksDisabled', globalSettings.restrictions)) {
      throw new AppError(
        'Creating new tasks is currently disabled for your account',
        403
      );
    }

    // Check limit
    const taskCount = await TaskModel.countDocuments({ owner: userId });
    if (checkLimit(user, 'maxTasks', taskCount, globalSettings.limits)) {
      const { getEffectiveLimit } = await import('../utils/userRestrictions');
      const effectiveLimit = getEffectiveLimit(user, 'maxTasks', globalSettings.limits);
      throw new AppError(
        `You have reached the maximum limit of ${effectiveLimit} tasks`,
        403
      );
    }

    this.logOperation(req, 'Creating task', req.body);

    const { task } = await taskService.createTask({
      name: req.body.name,
      todolistId: req.body.todolist,
      userId,
      description: req.body.description,
      dueDate: req.body.dueDate,
      startDate: req.body.startDate,
      priority: req.body.priority,
      isRecurring: req.body.isRecurring,
      recurrenceType: req.body.recurrenceType,
      recurrenceInterval: req.body.recurrenceInterval,
      tags: req.body.tags,
      parentTaskId: req.body.parentTask,
    });

    this.logOperation(req, 'Task created successfully', {
      taskId: task._id,
    });

    this.sendCreated(res, { task });
  });

  /**
   * Update a task
   */
  updateTask = catchAsync(async (req: Request, res: Response) => {
    const userId = this.validateUser(req);

    this.logOperation(req, 'Updating task', {
      taskId: req.params.task,
      updates: Object.keys(req.body),
    });

    const editedTask = await taskService.updateTask(req.params.task, userId, {
      name: req.body.name,
      description: req.body.description,
      dueDate: req.body.dueDate,
      startDate: req.body.startDate,
      priority: req.body.priority,
      isRecurring: req.body.isRecurring,
      recurrenceType: req.body.recurrenceType,
      recurrenceInterval: req.body.recurrenceInterval,
      tags: req.body.tags,
      checked: req.body.checked,
      todolistId: req.body.todolist,
      parentTaskId: req.body.parentTask,
    });

    this.logOperation(req, 'Task updated successfully', {
      taskId: req.params.task,
      updates: Object.keys(req.body),
    });

    this.sendSuccess(res, { task: editedTask });
  });

  /**
   * Delete a task
   */
  deleteTask = catchAsync(async (req: Request, res: Response) => {
    const userId = this.validateUser(req);

    this.logOperation(req, 'Deleting task', { taskId: req.params.task });

    await taskService.deleteTask(req.params.task, userId);

    this.logOperation(req, 'Task deleted successfully', {
      taskId: req.params.task,
    });

    this.sendNoContent(res, { message: 'Task deleted successfully' });
  });
}
