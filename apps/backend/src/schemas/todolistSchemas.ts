import { z } from 'zod';

export const createTodolistBody = z.object({
  name: z.string().min(1).max(100),
});

export const updateTodolistBody = z.object({
  name: z.string().min(1).max(100),
});

export const deleteTodolistParams = z.object({
  todolist: z.string().min(1),
});
