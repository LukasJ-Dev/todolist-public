import { z } from 'zod';

export const createTaskBody = z.object({
  name: z.string().min(1).max(100),
  todolist: z.string(),
  description: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  startDate: z.string().datetime().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  isRecurring: z.boolean().optional(),
  recurrenceType: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
  recurrenceInterval: z.number().int().min(1).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  parentTask: z.string().optional(),
});

export const updateTaskBody = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  checked: z.boolean().optional(),
  dueDate: z.string().datetime().optional().nullable(),
  startDate: z.string().datetime().optional().nullable(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  isRecurring: z.boolean().optional(),
  recurrenceType: z
    .enum(['daily', 'weekly', 'monthly', 'yearly'])
    .optional()
    .nullable(),
  recurrenceInterval: z.number().int().min(1).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
});

export const deleteTaskParams = z.object({
  task: z.string(),
});

export const getTaskParams = z.object({
  task: z.string(),
});

export const getTaskQuery = z.object({
  todolist: z.string().optional(),
  filter: z
    .enum([
      'all',
      'due_today',
      'due_this_week',
      'overdue',
      'recurring',
      'subtasks',
    ])
    .optional(),
  sort: z.enum(['due_date', 'priority', 'created', 'name']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  tags: z.string().optional(), // Comma-separated tag names
});
