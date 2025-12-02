import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { catchAsync } from '../utils/catchAsync';
import { ServerEnv } from '../config/env';
import { todolistService } from '../services/todolist/todolistService';

/**
 * Todolist controller with environment dependency injection and clean service management
 */
export class TodolistController extends BaseController {
  constructor(env: ServerEnv) {
    super(env);
  }

  /**
   * Get user's todolists
   */
  getMyTodolists = catchAsync(async (req: Request, res: Response) => {
    const userId = this.validateUser(req);

    const todolists = await todolistService.getTodolists(userId);

    this.sendSuccess(res, { todolists });
  });

  /**
   * Create a new todolist
   */
  createTodolist = catchAsync(async (req: Request, res: Response) => {
    const userId = this.validateUser(req);

    this.logOperation(req, 'Creating todolist', req.body);

    const { todolist } = await todolistService.createTodolist({
      name: req.body.name,
      userId,
    });

    this.logOperation(req, 'Todolist created successfully', {
      todolistId: todolist._id,
    });

    this.sendCreated(res, { todolist });
  });

  /**
   * Update a todolist
   */
  updateTodolist = catchAsync(async (req: Request, res: Response) => {
    const userId = this.validateUser(req);

    this.logOperation(req, 'Updating todolist', {
      todolistId: req.params.todolist,
      updates: Object.keys(req.body),
    });

    const editedTodolist = await todolistService.updateTodolist(
      req.params.todolist,
      userId,
      {
        name: req.body.name,
      }
    );

    this.logOperation(req, 'Todolist updated successfully', {
      todolistId: req.params.todolist,
      updates: Object.keys(req.body),
    });

    this.sendSuccess(res, { todolist: editedTodolist });
  });

  /**
   * Delete a todolist and all its tasks
   */
  deleteTodolist = catchAsync(async (req: Request, res: Response) => {
    const userId = this.validateUser(req);

    this.logOperation(req, 'Deleting todolist', {
      todolistId: req.params.todolist,
    });

    await todolistService.deleteTodolist(req.params.todolist, userId);

    this.logOperation(req, 'Todolist deleted successfully', {
      todolistId: req.params.todolist,
    });

    this.sendNoContent(res, { message: 'Todolist deleted successfully' });
  });
}
