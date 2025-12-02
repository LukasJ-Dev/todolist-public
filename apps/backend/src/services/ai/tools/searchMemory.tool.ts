import { tool } from 'langchain';
import { z } from 'zod';
import { memoryService } from '../memory/memoryService';

interface SearchMemoryToolInput {
  category?: 'preference' | 'fact' | 'pattern' | 'context';
  query?: string;
  limit?: number;
}

export function searchMemoryToolFactory(userId: string) {
  return tool(
    async ({ category, query, limit = 10 }: SearchMemoryToolInput) => {
      try {
        const memories = await memoryService.getUserMemories(userId, {
          category,
          limit,
          sortBy: 'confidence',
        });

        // If query provided, filter memories by text match (simple for now)
        let filteredMemories = memories;
        if (query) {
          const queryLower = query.toLowerCase();
          filteredMemories = memories.filter(
            (m) =>
              m.value.toLowerCase().includes(queryLower) ||
              m.key.toLowerCase().includes(queryLower)
          );
        }

        return JSON.stringify({
          success: true,
          memories: filteredMemories.map((m) => ({
            id: m._id.toString(),
            category: m.category,
            key: m.key,
            value: m.value,
            confidence: m.confidence,
            lastUpdated: m.lastUpdated.toISOString(),
          })),
          count: filteredMemories.length,
        });
      } catch (error) {
        return JSON.stringify({
          success: false,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to search memories',
        });
      }
    },
    {
      name: 'searchMemory',
      description:
        'Search for long-term memories about the user. Use this to recall user preferences, facts, patterns, or context when needed. Can filter by category or search by query text.',
      schema: z.object({
        category: z
          .enum(['preference', 'fact', 'pattern', 'context'])
          .optional()
          .describe('Filter by memory category'),
        query: z
          .string()
          .optional()
          .describe('Search query to find relevant memories'),
        limit: z
          .number()
          .min(1)
          .max(50)
          .optional()
          .describe('Maximum number of memories to return (default: 10)'),
      }),
    }
  );
}
