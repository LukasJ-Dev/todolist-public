import { z } from 'zod';

export const chatRequestBody = z.object({
  message: z.string().min(1).max(2000),
  conversationId: z.string().optional(),
});
