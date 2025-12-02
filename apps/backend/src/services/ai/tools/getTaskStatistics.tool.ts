import { tool } from 'langchain';
import { z } from 'zod';
import { taskService } from '../../task/taskService';

interface GetTaskStatisticsToolInput {
  todolistId: string | undefined;
}

export function getTaskStatisticsToolFactory(userId: string) {
  return tool(
    async ({ todolistId }: GetTaskStatisticsToolInput) => {
      try {
        const statistics = await taskService.getTaskStatistics(userId, {
          todolistId,
        });
        return JSON.stringify(statistics);
      } catch (error) {
        return JSON.stringify({
          error:
            error instanceof Error
              ? error.message
              : 'Failed to get task statistics',
        });
      }
    },
    {
      name: 'getTaskStatistics',
      description:
        'Get comprehensive statistics and insights about tasks. Returns counts (total, completed, incomplete, overdue), priority breakdown, due date distribution, completion rate, recurring tasks count, subtasks statistics, tag usage, todolist distribution, and insights. Can filter by specific todolist ID. Use this when users ask about their task statistics, completion rates, or want insights about their tasks.',
      schema: z.object({
        todolistId: z
          .string()
          .optional()
          .describe(
            'Optional todolist ID to filter statistics by specific todolist. If not provided, returns statistics for all todolists.'
          ),
      }),
    }
  );
}
