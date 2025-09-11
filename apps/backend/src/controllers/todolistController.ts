import { Response, Request } from 'express';
import { TodolistModel } from '../models/todolistModel';
import { TaskModel } from '../models/taskModel';
import { catchAsync } from '../utils/catchAsync';
import response from '../utils/response';
import { AppError } from '../utils/appError';
import {
  toObjectId,
  handleDatabaseError,
  validateOwnership,
  withTransaction,
} from '../utils/database';

export const getMyTodolists = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    try {
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

      response.ok(res, { todolists });
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }
);

export const createTodolist = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    // Log todolist creation attempt
    req.log.info(
      {
        userId,
        todolistName: req.body.name,
      },
      'Creating todolist'
    );

    try {
      // Check if todolist with same name already exists for this user
      const existingTodolist = await TodolistModel.findOne({
        name: req.body.name,
        owner: userId,
      });

      if (existingTodolist) {
        req.log.warn(
          {
            userId,
            todolistName: req.body.name,
          },
          'Todolist creation failed - name already exists'
        );
        throw new AppError('A todolist with this name already exists', 409);
      }

      const newTodolist = await TodolistModel.create({
        name: req.body.name,
        owner: userId,
      });

      // Log successful todolist creation
      req.log.info(
        {
          userId,
          todolistId: newTodolist._id,
          todolistName: req.body.name,
        },
        'Todolist created successfully'
      );

      response.created(res, { todolist: newTodolist });
    } catch (error) {
      req.log.error(
        {
          userId,
          todolistName: req.body.name,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        'Todolist creation failed'
      );
      throw handleDatabaseError(error);
    }
  }
);

export const updateTodolist = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    // Log todolist update attempt
    req.log.info(
      {
        userId,
        todolistId: req.params.todolist,
        updates: Object.keys(req.body),
      },
      'Updating todolist'
    );

    try {
      // Validate todolist ID
      const todolistId = toObjectId(req.params.todolist);

      // Find and validate ownership
      const todolist = await TodolistModel.findOne({
        _id: todolistId,
        owner: userId,
      });

      validateOwnership(todolist, userId, 'Todolist');

      // Check if new name conflicts with existing todolist
      if (req.body.name && req.body.name !== todolist?.name) {
        const existingTodolist = await TodolistModel.findOne({
          name: req.body.name,
          owner: userId,
          _id: { $ne: todolistId },
        });

        if (existingTodolist) {
          req.log.warn(
            {
              userId,
              todolistId,
              newName: req.body.name,
            },
            'Todolist update failed - name already exists'
          );
          throw new AppError('A todolist with this name already exists', 409);
        }
      }

      const editedTodolist = await TodolistModel.findOneAndUpdate(
        { _id: todolistId, owner: userId },
        req.body,
        { new: true, runValidators: true }
      );

      // Log successful todolist update
      req.log.info(
        {
          userId,
          todolistId,
          updates: Object.keys(req.body),
        },
        'Todolist updated successfully'
      );

      response.ok(res, { todolist: editedTodolist });
    } catch (error) {
      req.log.error(
        {
          userId,
          todolistId: req.params.todolist,
          updates: Object.keys(req.body),
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        'Todolist update failed'
      );
      throw handleDatabaseError(error);
    }
  }
);

export const deleteTodolist = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    // Log todolist deletion attempt
    req.log.info(
      {
        userId,
        todolistId: req.params.todolist,
      },
      'Deleting todolist'
    );

    try {
      // Validate todolist ID
      const todolistId = toObjectId(req.params.todolist);

      // Find and validate ownership
      const todolist = await TodolistModel.findOne({
        _id: todolistId,
        owner: userId,
      });

      validateOwnership(todolist, userId, 'Todolist');

      // Use transaction to ensure atomicity
      await withTransaction(async (session) => {
        // Delete all tasks in the todolist
        await TaskModel.deleteMany({ todolist: todolistId }, { session });

        // Delete the todolist
        await TodolistModel.deleteOne(
          { _id: todolistId, owner: userId },
          { session }
        );
      });

      // Log successful todolist deletion
      req.log.info(
        {
          userId,
          todolistId,
        },
        'Todolist deleted successfully'
      );

      response.noContent(res, { message: 'Todolist deleted successfully' });
    } catch (error) {
      req.log.error(
        {
          userId,
          todolistId: req.params.todolist,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        'Todolist deletion failed'
      );
      throw handleDatabaseError(error);
    }
  }
);
