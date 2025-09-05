import { z } from 'zod';

export const createTaskBody = z.object({
  name: z.string().min(1).max(100),
  todolist: z.string(),
  description: z.string().optional(),
});

export const updateTaskBody = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
});

export const deleteTaskParams = z.object({
  task: z.string(),
});

export const getTaskParams = z.object({
  task: z.string(),
});

export const getTaskQuery = z.object({
  todolist: z.string(),
});
