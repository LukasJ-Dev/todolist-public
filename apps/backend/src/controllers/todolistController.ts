import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { TodolistModel } from '../models/todolistModel';
import { TaskModel } from '../models/taskModel';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/appError';
import {
  toObjectId,
  validateOwnership,
  withTransaction,
} from '../utils/database';
import { ServerEnv } from '../config/env';

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

    let todolists = await TodolistModel.find({ owner: userId }).sort({
      createdAt: -1,
    });

    // Create default todolist if user has none
    if (todolists.length === 0) {
      const defaultTodolist = await TodolistModel.create({
        name: 'My First Todolist',
        owner: userId,
      });
      todolists = [defaultTodolist];
    }

    this.sendSuccess(res, { todolists });
  });

  /**
   * Create a new todolist
   */
  createTodolist = catchAsync(async (req: Request, res: Response) => {
    const userId = this.validateUser(req);

    this.logOperation(req, 'Creating todolist', req.body);

    // Check if todolist with same name already exists for this user
    const existingTodolist = await TodolistModel.findOne({
      name: req.body.name,
      owner: userId,
    });

    if (existingTodolist) {
      throw new AppError('A todolist with this name already exists', 409);
    }

    const newTodolist = await TodolistModel.create({
      name: req.body.name,
      owner: userId,
    });

    this.logOperation(req, 'Todolist created successfully', {
      todolistId: newTodolist._id,
    });

    this.sendCreated(res, { todolist: newTodolist });
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

    // Find and validate ownership
    const todolistId = toObjectId(req.params.todolist);
    const todolist = await TodolistModel.findOne({
      _id: todolistId,
      owner: userId,
    });

    validateOwnership(
      todolist as unknown as { owner?: string },
      userId,
      'Todolist'
    );

    // Check if new name conflicts with existing todolist
    if (req.body.name && req.body.name !== todolist?.name) {
      const existingTodolist = await TodolistModel.findOne({
        name: req.body.name,
        owner: userId,
        _id: { $ne: todolistId },
      });

      if (existingTodolist) {
        throw new AppError('A todolist with this name already exists', 409);
      }
    }

    const editedTodolist = await TodolistModel.findOneAndUpdate(
      { _id: todolistId, owner: userId },
      req.body,
      { new: true, runValidators: true }
    );

    this.logOperation(req, 'Todolist updated successfully', {
      todolistId,
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

    // Find and validate ownership
    const todolistId = toObjectId(req.params.todolist);
    const todolist = await TodolistModel.findOne({
      _id: todolistId,
      owner: userId,
    });

    validateOwnership(
      todolist as unknown as { owner?: string },
      userId,
      'Todolist'
    );

    // Use transaction to ensure atomicity
    await withTransaction(async (session) => {
      // Delete all tasks in the todolist
      await TaskModel.deleteMany(
        { todolist: todolistId },
        session ? { session } : {}
      );

      // Delete the todolist
      await TodolistModel.deleteOne(
        { _id: todolistId, owner: userId },
        session ? { session } : {}
      );
    });

    this.logOperation(req, 'Todolist deleted successfully', { todolistId });

    this.sendNoContent(res, { message: 'Todolist deleted successfully' });
  });
}
