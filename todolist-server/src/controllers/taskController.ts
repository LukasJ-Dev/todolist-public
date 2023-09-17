import { Request, Response } from "express";
import { AuthenticatedRequest } from "../types";
import { TaskModel } from "../models/taskModel";
import { TodolistModel } from "../models/todolistModel";

export const getMyTasks = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?._id;

    const todolist = await TodolistModel.findOne({
      owner: userId,
      _id: req.query.todolist,
    });

    if (!todolist) return res.status(404).json({ error: "No todolist found" });

    const tasks = await TaskModel.find({ todolist: req.query.todolist });

    res.status(200).json({ data: { tasks } });
  } catch (e) {
    res.status(400).json({ error: e });
  }
};

export const createTask = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    const newTask = await TaskModel.create({
      name: req.body.name,
      todolist: req.body.todolist,
      description: req.body.description,
      owner: userId,
      checked: false,
    });

    res.status(201).json({ data: { task: newTask } });
  } catch (e) {
    res.status(400).json({ error: e });
  }
};

export const updateTask = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    const taskId = req.params.task;

    if (!userId || !taskId) {
      return res.status(400).json({ error: "Invalid request parameters" });
    }

    const task = await TaskModel.findOne({
      _id: taskId,
      owner: userId,
    });

    if (!task) return res.status(404).json({ error: "Task not found" });

    const editedTask = await TaskModel.findOneAndUpdate(
      { _id: taskId, owner: userId },
      req.body,
      { new: true }
    );

    res.status(200).json({ data: { task: editedTask } });
  } catch (e) {
    res.status(400).json({ error: e });
  }
};

export const deleteTask = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    const taskId = req.params.task;

    if (!userId || !taskId) {
      return res.status(400).json({ error: "Invalid request parameters" });
    }

    const task = await TaskModel.findOne({
      _id: taskId,
      owner: userId,
    });

    if (!task) return res.status(404).json({ error: "Task not found" });

    task.deleteOne();

    res.status(204).json({});
  } catch (e) {
    res.status(400).json({ error: e });
  }
};
