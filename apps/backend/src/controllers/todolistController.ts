import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { TodolistModel } from '../models/todolistModel';
import { TaskModel } from '../models/taskModel';
import { catchAsync } from '../utils/catchAsync';
import response from '../utils/response';
import { AppError } from '../utils/appError';

export const getMyTodolists = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?._id;
    const todolists = await TodolistModel.find({ owner: userId });
    if (todolists.length <= 0) {
      await TodolistModel.create({
        name: 'My First Todolist',
        owner: userId,
      });
    }
    response.ok(res, { todolists });
  }
);

export const createTodolist = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?._id;
    const newTodolist = await TodolistModel.create({
      name: req.body.name,
      owner: userId,
    });

    response.created(res, { todolist: newTodolist });
  }
);

export const updateTodolist = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?._id;
    const todolistId = req.params.todolist;

    const todolist = await TodolistModel.findOne({
      _id: todolistId,
      owner: userId,
    });

    if (!todolist) throw new AppError('Todolist not found', 404);

    const editedTodolist = await TodolistModel.findOneAndUpdate(
      { _id: todolistId, owner: userId },
      req.body,
      { new: true }
    );

    response.ok(res, { todolist: editedTodolist });
  }
);

export const deleteTodolist = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?._id;
    const todolistId = req.params.todolist;

    const todolist = await TodolistModel.findOne({
      _id: todolistId,
      owner: userId,
    });

    if (!todolist) throw new AppError('Todolist not found', 404);

    todolist.deleteOne();

    await TaskModel.deleteMany({ todolist: todolistId });
    response.noContent(res, { message: 'Todolist deleted successfully' });
  }
);
