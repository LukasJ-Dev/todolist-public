import { tool } from 'langchain';
import { z } from 'zod';
import { taskService } from '../../task/taskService';
import { TaskModel } from '../../../models/taskModel';
import { AppError } from '../../../utils/appError';

export function deleteTaskToolFactory(userId: string) {
  return tool(
    async ({ taskId }: { taskId?: string }) => {
      try {
        // Find task by ID or name
        let finalTaskId: string;

        if (taskId) {
          finalTaskId = taskId;
        } else {
          throw new AppError('Task ID must be provided', 400);
        }

        // Get task name before deletion for response
        const task = await TaskModel.findOne({
          _id: finalTaskId,
          owner: userId,
        });

        if (!task) {
          throw new AppError('Task not found', 404);
        }

        const taskNameForResponse = task.name;

        // Delete task using the service
        await taskService.deleteTask(finalTaskId, userId);

        return JSON.stringify({
          success: true,
          message: `Task "${taskNameForResponse}" deleted successfully`,
          taskId: finalTaskId,
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
          error: 'Failed to delete task. Please try again.',
        });
      }
    },
    {
      name: 'deleteTask',
      description:
        'Delete a task. You can identify the task by taskId. This will permanently delete the task and all its subtasks. Make sure the users intent is clear before and always ask for confirmation.',
      schema: z.object({
        taskId: z.string().optional().describe('Task ID.'),
      }),
    }
  );
}
