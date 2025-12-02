import { tool } from 'langchain';
import { z } from 'zod';
import { memoryService } from '../memory/memoryService';

interface SaveMemoryToolInput {
  category: 'preference' | 'fact' | 'pattern' | 'context';
  key: string;
  value: string;
  confidence?: number;
}

export function saveMemoryToolFactory(userId: string) {
  return tool(
    async ({ category, key, value, confidence = 0.8 }: SaveMemoryToolInput) => {
      try {
        const memory = await memoryService.saveUserMemory(
          userId,
          category,
          key,
          value,
          'manual', // Source is 'manual' when saved by agent
          confidence
        );

        return JSON.stringify({
          success: true,
          message: `Memory saved: ${value}`,
          memoryId: memory._id.toString(),
          category,
          key,
          value,
        });
      } catch (error) {
        return JSON.stringify({
          success: false,
          error:
            error instanceof Error ? error.message : 'Failed to save memory',
        });
      }
    },
    {
      name: 'saveMemory',
      description:
        'Save a long-term memory about the user. Use this when the user tells you something about themselves, their preferences, facts, patterns, or context that you should remember for future conversations. Categories: preference (user preferences), fact (known facts about user), pattern (observed behaviors), context (current situation).',
      schema: z.object({
        category: z
          .enum(['preference', 'fact', 'pattern', 'context'])
          .describe(
            'Category of memory: preference, fact, pattern, or context'
          ),
        key: z
          .string()
          .describe(
            'Unique key for this memory (e.g., "task_priority_preference", "work_schedule")'
          ),
        value: z
          .string()
          .describe(
            'The memory content (e.g., "prefers high priority tasks first", "works in the morning")'
          ),
        confidence: z
          .number()
          .min(0)
          .max(1)
          .optional()
          .describe(
            'Confidence level (0-1) in this memory. Default is 0.8. Use lower values if uncertain.'
          ),
      }),
    }
  );
}
