import { tool } from 'langchain';
import { z } from 'zod';
import { taskService } from '../../task/taskService';
import { TodolistModel } from '../../../models/todolistModel';
import { AppError } from '../../../utils/appError';

interface CreateTaskToolInput {
  taskName: string;
  description: string | undefined;
  dueDate: string | undefined;
  priority: 'low' | 'medium' | 'high' | undefined;
  tags: string[] | undefined;
  parentTaskId: string | undefined;
  todolistId: string;
}

// Factory function approach
export function createTaskToolFactory(userId: string) {
  return tool(
    async ({
      taskName,
      description,
      dueDate,
      priority,
      tags,
      todolistId,
      parentTaskId,
    }: CreateTaskToolInput) => {
      try {
        // If todolistId is not provided, use the first available todolist
        let finalTodolistId: string;
        if (todolistId) {
          finalTodolistId = todolistId;
        } else {
          const firstTodolist = await TodolistModel.findOne({ owner: userId });
          if (!firstTodolist) {
            throw new AppError(
              'No todolists found. Please create a todolist first.',
              404
            );
          }
          finalTodolistId = firstTodolist._id.toString();
        }

        // Create task using the service
        const { task } = await taskService.createTask({
          name: taskName,
          todolistId: finalTodolistId,
          userId,
          description,
          dueDate: dueDate ? new Date(dueDate) : undefined,
          priority,
          tags: tags || [],
          parentTaskId,
        });

        return JSON.stringify({
          success: true,
          message: `Task "${taskName}" created successfully`,
          taskId: task._id.toString(),
          taskName: task.name,
          description: task.description,
          dueDate: task.dueDate?.toISOString(),
          priority: task.priority,
          tags: task.tags,
          todolistId: task.todolist.toString(),
          parentTaskId: task.parentTaskId?.toString(),
        });
      } catch (error) {
        // Handle errors and return a message the agent can understand
        if (error instanceof AppError) {
          return JSON.stringify({
            success: false,
            error: error.message,
            statusCode: error.statusCode,
          });
        }

        return JSON.stringify({
          success: false,
          error: 'Failed to create task. Please try again.',
        });
      }
    },
    {
      name: 'createTask',
      description:
        'Create a new task from natural language. Parses task name, due date, priority, tags, and description.',
      schema: z.object({
        taskName: z.string().describe('The name of the task'),
        description: z.string().optional().describe('Task description'),
        dueDate: z.string().optional().describe('Due date as ISO string'),
        priority: z
          .enum(['low', 'medium', 'high'])
          .optional()
          .describe('Task priority'),
        tags: z.array(z.string()).optional().describe('Tags for the task'),
        todolistId: z.string().describe('Todolist ID to add task to'),
        parentTaskId: z
          .string()
          .optional()
          .describe(
            'Parent task id if the task is a subtask, task id can be found in the getTasks tool'
          ),
      }),
    }
  );
}
