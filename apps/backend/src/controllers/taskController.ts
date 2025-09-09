import { Response, Request } from 'express';
import { TaskModel } from '../models/taskModel';
import { TodolistModel } from '../models/todolistModel';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/appError';
import response from '../utils/response';

export const getMyTasks = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!req.query.todolist) {
    const tasks = await TaskModel.find({ owner: userId });

    return response.ok(res, { tasks });
  }

  const todolist = await TodolistModel.findOne({
    owner: userId,
    _id: req.query.todolist,
  });

  if (!todolist) throw new AppError('No todolist found', 404);

  const tasks = await TaskModel.find({
    todolist: req.query.todolist,
    owner: userId,
  });

  response.ok(res, { tasks });
});

export const createTask = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const newTask = await TaskModel.create({
    name: req.body.name,
    todolist: req.body.todolist,
    description: req.body.description,
    owner: userId,
    checked: false,
  });

  response.created(res, { task: newTask });
});

export const updateTask = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const taskId = req.params.task;

  const task = await TaskModel.findOne({
    _id: taskId,
    owner: userId,
  });

  if (!task) throw new AppError('Task not found', 404);

  const editedTask = await TaskModel.findOneAndUpdate(
    { _id: taskId, owner: userId },
    req.body,
    { new: true }
  );

  response.ok(res, { task: editedTask });
});

export const deleteTask = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const taskId = req.params.task;

  const task = await TaskModel.findOne({
    _id: taskId,
    owner: userId,
  });

  if (!task) throw new AppError('Task not found', 404);

  task.deleteOne();

  response.noContent(res, { message: 'Task deleted successfully' });
});
