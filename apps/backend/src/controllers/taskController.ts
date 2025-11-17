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

    // Build query
    const query: any = { owner: userId };

    // Filter by todolist
    if (req.query.todolist) {
      const todolistId = toObjectId(req.query.todolist as string);

      // Verify todolist exists and belongs to user
      const todolist = await TodolistModel.findOne({
        _id: todolistId,
        owner: userId,
      });

      if (!todolist) {
        throw new AppError('Todolist not found', 404);
      }

      query.todolist = todolistId;
    }

    // Apply filters
    const filter = req.query.filter as string;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    switch (filter) {
      case 'due_today':
        query.dueDate = { $gte: today, $lt: tomorrow };
        break;
      case 'due_this_week':
        query.dueDate = { $gte: today, $lt: nextWeek };
        break;
      case 'overdue':
        query.dueDate = { $lt: today };
        query.checked = false;
        break;
      case 'recurring':
        query.isRecurring = true;
        break;
      case 'subtasks':
        query.parentTask = { $exists: true };
        break;
    }

    // Filter by priority
    if (req.query.priority) {
      query.priority = req.query.priority;
    }

    // Filter by tags
    if (req.query.tags) {
      const tags = (req.query.tags as string)
        .split(',')
        .map((tag) => tag.trim().toLowerCase());
      query.tags = { $in: tags };
    }

    // Build sort options
    let sortOptions: any = { createdAt: -1 }; // Default sort
    const sort = req.query.sort as string;

    switch (sort) {
      case 'due_date':
        sortOptions = { dueDate: 1, createdAt: -1 };
        break;
      case 'priority':
        sortOptions = { priority: -1, createdAt: -1 };
        break;
      case 'name':
        sortOptions = { name: 1 };
        break;
      case 'created':
        sortOptions = { createdAt: -1 };
        break;
    }

    // Check if subtasks should be included
    const includeSubtasks = req.query.include === 'subtasks';

    const queryBuilder = TaskModel.find(query)
      .populate('todolist', 'name')
      .populate('parentTask', 'name');

    if (includeSubtasks) {
      queryBuilder.populate(
        'subtasks',
        'name description priority checked dueDate startDate tags todolist parentTask'
      );
    }

    const tasks = await queryBuilder.sort(sortOptions);

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

    // Check depth limit for subtasks (max 3 levels: parent -> subtask -> sub-subtask)
    if (req.body.parentTask && req.body.parentTask.trim() !== '') {
      const parentTaskId = toObjectId(req.body.parentTask);
      const parentTask = await TaskModel.findById(parentTaskId);

      if (!parentTask) {
        throw new AppError('Parent task not found', 404);
      }

      // Calculate depth by counting parent levels
      let depth = 0;
      let currentParent = parentTask;

      while (currentParent.parentTask) {
        depth++;
        const nextParent = await TaskModel.findById(currentParent.parentTask);
        if (!nextParent) break;
        currentParent = nextParent;
      }

      // If parent is already at max depth (2), don't allow more subtasks
      if (depth >= 2) {
        throw new AppError('Maximum subtask depth reached (3 levels)', 400);
      }
    }

    const newTask = await TaskModel.create({
      name: req.body.name,
      todolist: todolistId,
      description: req.body.description,
      dueDate: req.body.dueDate ? new Date(req.body.dueDate) : undefined,
      startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
      priority: req.body.priority || 'medium',
      isRecurring: req.body.isRecurring || false,
      recurrenceType: req.body.recurrenceType,
      recurrenceInterval: req.body.recurrenceInterval || 1,
      tags: req.body.tags || [],
      parentTask: req.body.parentTask
        ? toObjectId(req.body.parentTask)
        : undefined,
      owner: userId,
      checked: false,
    });

    // If this is a subtask, add it to the parent's subtasks array
    if (req.body.parentTask && req.body.parentTask.trim() !== '') {
      const parentTaskId = toObjectId(req.body.parentTask);
      await TaskModel.findByIdAndUpdate(
        parentTaskId,
        { $addToSet: { subtasks: newTask._id } },
        { new: true }
      );
    }

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

    // Prepare update data with proper date conversions
    const updateData = { ...req.body };
    if (req.body.dueDate !== undefined) {
      updateData.dueDate = req.body.dueDate ? new Date(req.body.dueDate) : null;
    }
    if (req.body.startDate !== undefined) {
      updateData.startDate = req.body.startDate
        ? new Date(req.body.startDate)
        : null;
    }

    // Handle parentTask changes
    if (req.body.parentTask !== undefined) {
      const newParentTaskId =
        req.body.parentTask && req.body.parentTask.trim() !== ''
          ? toObjectId(req.body.parentTask)
          : null;
      const oldParentTaskId = task?.parentTask;

      // Remove from old parent's subtasks array
      if (oldParentTaskId) {
        await TaskModel.findByIdAndUpdate(
          oldParentTaskId,
          { $pull: { subtasks: taskId } },
          { new: true }
        );
      }

      // Add to new parent's subtasks array
      if (newParentTaskId) {
        await TaskModel.findByIdAndUpdate(
          newParentTaskId,
          { $addToSet: { subtasks: taskId } },
          { new: true }
        );
      }

      updateData.parentTask = newParentTaskId;
    }

    // Handle completedAt when task is checked
    if (req.body.checked === true) {
      updateData.completedAt = new Date();
    } else if (req.body.checked === false) {
      updateData.completedAt = null;
    }

    const editedTask = await TaskModel.findOneAndUpdate(
      { _id: taskId, owner: userId },
      updateData,
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

    // If this is a subtask, remove it from the parent's subtasks array
    if (task?.parentTask) {
      await TaskModel.findByIdAndUpdate(
        task.parentTask,
        { $pull: { subtasks: taskId } },
        { new: true }
      );
    }

    // If this task has subtasks, delete them as well (cascade delete)
    if (task?.subtasks && task.subtasks.length > 0) {
      await TaskModel.deleteMany({
        _id: { $in: task.subtasks },
        owner: userId,
      });
    }

    // Delete the task
    await TaskModel.deleteOne({ _id: taskId, owner: userId });

    this.logOperation(req, 'Task deleted successfully', { taskId });

    this.sendNoContent(res, { message: 'Task deleted successfully' });
  });
}
