import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { TodolistModel } from '../models/todolistModel';
import { TaskModel } from '../models/taskModel';

export const getMyTodolists = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user?._id;
    const todolists = await TodolistModel.find({ owner: userId });
    if (todolists.length <= 0) {
      await TodolistModel.create({
        name: 'My First Todolist',
        owner: userId,
      });
    }
    res.status(200).json({ data: { todolists } });
  } catch (e) {
    res.status(400).json({ error: e });
  }
};

export const createTodolist = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user?._id;
    const newTodolist = await TodolistModel.create({
      name: req.body.name,
      owner: userId,
    });

    res.status(201).json({ data: { todolist: newTodolist } });
  } catch (e) {
    res.status(400).json({ error: e });
  }
};

export const updateTodolist = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user?._id;
    const todolistId = req.params.todolist;

    if (!userId || !todolistId) {
      return res.status(400).json({ error: 'Invalid request parameters' });
    }

    const todolist = await TodolistModel.findOne({
      _id: todolistId,
      owner: userId,
    });

    if (!todolist) return res.status(404).json({ error: 'Todolist not found' });

    const editedTodolist = await TodolistModel.findOneAndUpdate(
      { _id: todolistId, owner: userId },
      req.body,
      { new: true }
    );

    res.status(200).json({ data: { todolist: editedTodolist } });
  } catch (e) {
    res.status(400).json({ error: e });
  }
};

export const deleteTodolist = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user?._id;
    const todolistId = req.params.todolist;

    if (!userId || !todolistId) {
      return res.status(400).json({ error: 'Invalid request parameters' });
    }

    const todolist = await TodolistModel.findOne({
      _id: todolistId,
      owner: userId,
    });

    if (!todolist) return res.status(404).json({ error: 'Todolist not found' });

    todolist.deleteOne();

    await TaskModel.deleteMany({ todolist: todolistId });
    res.status(204).json({});
  } catch (e) {
    res.status(400).json({ error: e });
  }
};
