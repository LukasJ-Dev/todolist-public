import { tool } from 'langchain';
import { z } from 'zod';
import { todolistService } from '../../todolist/todolistService';
import { AppError } from '../../../utils/appError';

interface CreateTodolistToolInput {
  name: string;
}

export function createTodolistToolFactory(userId: string) {
  return tool(
    async ({ name }: CreateTodolistToolInput) => {
      try {
        const { todolist } = await todolistService.createTodolist({
          name,
          userId,
        });

        return JSON.stringify({
          success: true,
          message: `Todolist "${name}" created successfully`,
          todolistId: todolist._id.toString(),
          name: todolist.name,
          createdAt: todolist.createdAt.toISOString(),
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
          error: 'Failed to create todolist. Please try again.',
        });
      }
    },
    {
      name: 'createTodolist',
      description:
        'Create a new todolist with the given name. Use this when the user wants to create a new todolist or list.',
      schema: z.object({
        name: z.string().describe('The name of the todolist to create'),
      }),
    }
  );
}
