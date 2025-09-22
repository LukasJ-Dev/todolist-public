import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { TaskModel } from '../models/taskModel';
import { TodolistModel } from '../models/todolistModel';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/appError';
import { toObjectId, validateOwnership } from '../utils/database';
import { ServerEnv } from '../config/env';

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

    let tasks;

    if (req.query.todolist) {
      // Validate todolist ID
      const todolistId = toObjectId(req.query.todolist as string);

      // Verify todolist exists and belongs to user
      const todolist = await TodolistModel.findOne({
        _id: todolistId,
        owner: userId,
      });

      if (!todolist) {
        throw new AppError('Todolist not found', 404);
      }

      // Get tasks for specific todolist
      tasks = await TaskModel.find({
        todolist: todolistId,
        owner: userId,
      }).populate('todolist', 'name');
    } else {
      // Get all tasks for user
      tasks = await TaskModel.find({ owner: userId })
        .populate('todolist', 'name')
        .sort({ createdAt: -1 });
    }

    this.sendSuccess(res, { tasks });
  });

  /**
   * Create a new task
   */
  createTask = catchAsync(async (req: Request, res: Response) => {
    const userId = this.validateUser(req);

    this.logOperation(req, 'Creating task', req.body);

    // Validate todolist ID
    const todolistId = toObjectId(req.body.todolist);

    // Verify todolist exists and belongs to user
    const todolist = await TodolistModel.findOne({
      _id: todolistId,
      owner: userId,
    });

    if (!todolist) {
      throw new AppError('Todolist not found', 404);
    }

    const newTask = await TaskModel.create({
      name: req.body.name,
      todolist: todolistId,
      description: req.body.description,
      owner: userId,
      checked: false,
    });

    // Populate the todolist reference
    await newTask.populate('todolist', 'name');

    this.logOperation(req, 'Task created successfully', {
      taskId: newTask._id,
    });

    this.sendCreated(res, { task: newTask });
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

    // Validate task ID
    const taskId = toObjectId(req.params.task);

    // Find and validate ownership
    const task = await TaskModel.findOne({
      _id: taskId,
      owner: userId,
    });

    validateOwnership(task as unknown as { owner?: string }, userId, 'Task');

    // If updating todolist, verify it exists and belongs to user
    if (req.body.todolist) {
      const todolistId = toObjectId(req.body.todolist);
      const todolist = await TodolistModel.findOne({
        _id: todolistId,
        owner: userId,
      });

      if (!todolist) {
        throw new AppError('Todolist not found', 404);
      }
    }

    const editedTask = await TaskModel.findOneAndUpdate(
      { _id: taskId, owner: userId },
      req.body,
      { new: true, runValidators: true }
    ).populate('todolist', 'name');

    this.logOperation(req, 'Task updated successfully', {
      taskId,
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

    // Validate task ID
    const taskId = toObjectId(req.params.task);

    // Find and validate ownership
    const task = await TaskModel.findOne({
      _id: taskId,
      owner: userId,
    });

    validateOwnership(task as unknown as { owner?: string }, userId, 'Task');

    // Delete the task
    await TaskModel.deleteOne({ _id: taskId, owner: userId });

    this.logOperation(req, 'Task deleted successfully', { taskId });

    this.sendNoContent(res, { message: 'Task deleted successfully' });
  });
}
