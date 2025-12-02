import { tool } from 'langchain';
import { z } from 'zod';
import { todolistService } from '../../todolist/todolistService';
import { TodolistModel } from '../../../models/todolistModel';
import { AppError } from '../../../utils/appError';

export function deleteTodolistToolFactory(userId: string) {
  return tool(
    async ({ todolistId }: { todolistId?: string }) => {
      try {
        // Find todolist by ID or name
        let finalTodolistId: string;

        if (todolistId) {
          finalTodolistId = todolistId;
        } else {
          throw new AppError('Todolist ID must be provided', 400);
        }

        // Get todolist name before deletion for response
        const todolist = await TodolistModel.findOne({
          _id: finalTodolistId,
          owner: userId,
        });

        if (!todolist) {
          throw new AppError('Todolist not found', 404);
        }

        const todolistNameForResponse = todolist.name;

        // Delete todolist using the service (this also deletes all tasks in the todolist)
        await todolistService.deleteTodolist(finalTodolistId, userId);

        return JSON.stringify({
          success: true,
          message: `Todolist "${todolistNameForResponse}" and all its tasks deleted successfully`,
          todolistId: finalTodolistId,
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
          error: 'Failed to delete todolist. Please try again.',
        });
      }
    },
    {
      name: 'deleteTodolist',
      description:
        'Delete a todolist and all its tasks. You can identify the todolist by todolistId. This will permanently delete the todolist and all tasks within it. Use with caution. Make sure the users intent is clear before and always ask for confirmation.',
      schema: z.object({
        todolistId: z.string().optional().describe('Todolist ID'),
      }),
    }
  );
}
