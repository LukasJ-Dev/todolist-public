import { tool } from 'langchain';
import { z } from 'zod';
import { taskService } from '../../task/taskService';

interface GetTasksToolInput {
  filter:
    | 'due_today'
    | 'due_this_week'
    | 'overdue'
    | 'recurring'
    | 'subtasks'
    | undefined;
  priority: 'low' | 'medium' | 'high' | undefined;
  tags: string[] | undefined;
  sort: 'due_date' | 'priority' | 'name' | 'created' | undefined;
  includeSubtasks: boolean | undefined;
  todolistId: string | undefined;
}

export function getTasksToolFactory(userId: string) {
  return tool(
    async ({
      filter,
      priority,
      tags,
      sort,
      includeSubtasks,
      todolistId,
    }: GetTasksToolInput) => {
      const tasks = await taskService.getTasks(userId, {
        filter,
        priority,
        tags,
        sort,
        includeSubtasks,
        todolistId,
      });
      return JSON.stringify({ tasks });
    },
    {
      name: 'getTasks',
      description:
        'Get tasks from the database. Can filter by todolist, priority, tags, due dates, and more. If no todolistId is provided, returns tasks from all todolists.',
      schema: z.object({
        filter: z
          .enum([
            'due_today',
            'due_this_week',
            'overdue',
            'recurring',
            'subtasks',
          ])
          .optional()
          .describe('Filter tasks by date or type'),
        priority: z
          .enum(['low', 'medium', 'high'])
          .optional()
          .describe('Filter by priority level'),
        tags: z
          .array(z.string())
          .optional()
          .describe(
            'Filter by tags (tasks must have at least one matching tag)'
          ),
        sort: z
          .enum(['due_date', 'priority', 'name', 'created'])
          .optional()
          .describe('Sort order for results'),
        includeSubtasks: z
          .boolean()
          .optional()
          .describe('Whether to include subtask details in the response'),
        todolistId: z
          .string()
          .optional()
          .describe(
            'Filter tasks by specific todolist ID. If not provided, returns tasks from all todolists.'
          ),
      }),
    }
  );
}
