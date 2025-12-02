import { tool } from 'langchain';
import { z } from 'zod';
import { taskService } from '../../task/taskService';
import { TaskModel } from '../../../models/taskModel';
import { AppError } from '../../../utils/appError';

interface UpdateTaskToolInput {
  taskId?: string;
  taskName?: string;
  name?: string;
  description?: string;
  dueDate?: string;
  startDate?: string;
  priority?: 'low' | 'medium' | 'high';
  tags?: string[];
  checked?: boolean;
  todolistId?: string;
}

// Factory function approach
export function updateTaskToolFactory(userId: string) {
  return tool(
    async ({
      taskId,
      taskName,
      name,
      description,
      dueDate,
      startDate,
      priority,
      tags,
      checked,
      todolistId,
    }: UpdateTaskToolInput) => {
      try {
        // Find task by ID or name
        let finalTaskId: string;

        if (taskId) {
          finalTaskId = taskId;
        } else if (taskName) {
          // Search for task by name
          const task = await TaskModel.findOne({
            name: { $regex: new RegExp(`^${taskName}$`, 'i') }, // Case-insensitive exact match
            owner: userId,
          });

          if (!task) {
            throw new AppError(
              `Task "${taskName}" not found. Please provide the exact task name or task ID.`,
              404
            );
          }

          finalTaskId = task._id.toString();
        } else {
          throw new AppError('Either taskId or taskName must be provided', 400);
        }

        // Prepare updates object (only include defined fields)
        const updates: {
          name?: string;
          description?: string;
          dueDate?: string | Date | null;
          startDate?: string | Date | null;
          priority?: 'low' | 'medium' | 'high';
          tags?: string[];
          checked?: boolean;
          todolistId?: string;
        } = {};

        if (name !== undefined) updates.name = name;
        if (description !== undefined) updates.description = description;
        if (dueDate !== undefined)
          updates.dueDate = dueDate ? new Date(dueDate) : null;
        if (startDate !== undefined)
          updates.startDate = startDate ? new Date(startDate) : null;
        if (priority !== undefined) updates.priority = priority;
        if (tags !== undefined) updates.tags = tags;
        if (checked !== undefined) updates.checked = checked;
        if (todolistId !== undefined) updates.todolistId = todolistId;

        // Check if any updates were provided
        if (Object.keys(updates).length === 0) {
          throw new AppError('No update fields provided', 400);
        }

        // Update task using the service
        const updatedTask = await taskService.updateTask(
          finalTaskId,
          userId,
          updates
        );

        return JSON.stringify({
          success: true,
          message: `Task "${updatedTask.name}" updated successfully`,
          taskId: updatedTask._id.toString(),
          taskName: updatedTask.name,
          description: updatedTask.description,
          dueDate: updatedTask.dueDate?.toISOString(),
          priority: updatedTask.priority,
          tags: updatedTask.tags,
          checked: updatedTask.checked,
          todolistId: updatedTask.todolist.toString(),
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
          error: 'Failed to update task. Please try again.',
        });
      }
    },
    {
      name: 'updateTask',
      description:
        'Update an existing task. You can identify the task by taskId (preferred) or taskName. You can update any combination of: name, description, dueDate, startDate, priority, tags, checked status, or todolistId.',
      schema: z.object({
        taskId: z
          .string()
          .optional()
          .describe(
            'Task ID (preferred). If not provided, taskName will be used to find the task.'
          ),
        taskName: z
          .string()
          .optional()
          .describe(
            'Task name to search for (case-insensitive). Use this if taskId is not available.'
          ),
        name: z.string().optional().describe('New task name'),
        description: z.string().optional().describe('New task description'),
        dueDate: z
          .string()
          .optional()
          .describe(
            'New due date as ISO string. Set to empty string to remove due date.'
          ),
        startDate: z
          .string()
          .optional()
          .describe(
            'New start date as ISO string. Set to empty string to remove start date.'
          ),
        priority: z
          .enum(['low', 'medium', 'high'])
          .optional()
          .describe('New task priority'),
        tags: z
          .array(z.string())
          .optional()
          .describe('New tags array (replaces existing tags)'),
        checked: z
          .boolean()
          .optional()
          .describe('Mark task as completed (true) or incomplete (false)'),
        todolistId: z
          .string()
          .optional()
          .describe('Move task to a different todolist (provide todolist ID)'),
      }),
    }
  );
}
