import { tool } from 'langchain';
import { z } from 'zod';
import { todolistService } from '../../todolist/todolistService';
import { TodolistModel } from '../../../models/todolistModel';
import { AppError } from '../../../utils/appError';

interface UpdateTodolistToolInput {
  todolistId?: string;
  todolistName?: string;
  name?: string;
}

export function updateTodolistToolFactory(userId: string) {
  return tool(
    async ({ todolistId, todolistName, name }: UpdateTodolistToolInput) => {
      try {
        // Find todolist by ID or name
        let finalTodolistId: string;

        if (todolistId) {
          finalTodolistId = todolistId;
        } else if (todolistName) {
          // Search for todolist by name
          const todolist = await TodolistModel.findOne({
            name: { $regex: new RegExp(`^${todolistName}$`, 'i') }, // Case-insensitive exact match
            owner: userId,
          });

          if (!todolist) {
            throw new AppError(
              `Todolist "${todolistName}" not found. Please provide the exact todolist name or todolist ID.`,
              404
            );
          }

          finalTodolistId = todolist._id.toString();
        } else {
          throw new AppError(
            'Either todolistId or todolistName must be provided',
            400
          );
        }

        // Prepare updates object (only include defined fields)
        const updates: { name?: string } = {};

        if (name !== undefined) {
          updates.name = name;
        }

        // Check if any updates were provided
        if (Object.keys(updates).length === 0) {
          throw new AppError('No update fields provided', 400);
        }

        // Update todolist using the service
        const updatedTodolist = await todolistService.updateTodolist(
          finalTodolistId,
          userId,
          updates
        );

        return JSON.stringify({
          success: true,
          message: `Todolist "${updatedTodolist.name}" updated successfully`,
          todolistId: updatedTodolist._id.toString(),
          name: updatedTodolist.name,
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
          error: 'Failed to update todolist. Please try again.',
        });
      }
    },
    {
      name: 'updateTodolist',
      description:
        'Update an existing todolist. You can identify the todolist by todolistId (preferred) or todolistName. Currently, you can only update the todolist name.',
      schema: z.object({
        todolistId: z
          .string()
          .optional()
          .describe(
            'Todolist ID (preferred). If not provided, todolistName will be used to find the todolist.'
          ),
        todolistName: z
          .string()
          .optional()
          .describe(
            'Todolist name to search for (case-insensitive). Use this if todolistId is not available.'
          ),
        name: z.string().optional().describe('New todolist name'),
      }),
    }
  );
}
