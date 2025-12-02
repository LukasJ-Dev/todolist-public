import {
  ConversationMessageModel,
  IConversationMessage,
} from '../../../models/conversationMessageModel';
import { UserMemoryModel, IUserMemory } from '../../../models/userMemoryModel';
import { Types } from 'mongoose';

export interface MessageForHistory {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * Service for managing conversation memory
 */
export class MemoryService {
  /**
   * Load conversation history
   * Returns messages in chronological order
   */
  async loadConversationHistory(
    conversationId: string,
    userId: string
  ): Promise<MessageForHistory[]> {
    const messages = await ConversationMessageModel.find({
      conversationId,
      userId: new Types.ObjectId(userId),
    })
      .sort({ createdAt: 1 }) // Oldest first
      .lean();

    // Convert to format expected by LangChain
    return messages.map((msg) => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
    }));
  }

  /**
   * Load full conversation history with tool calls for frontend display
   */
  async loadFullConversationHistory(
    conversationId: string,
    userId: string
  ): Promise<
    Array<{
      role: 'user' | 'assistant';
      content: string;
      toolCalls?: Array<{
        tool: string;
        input: Record<string, unknown>;
        result: unknown;
      }>;
      timestamp: string;
    }>
  > {
    const messages = await ConversationMessageModel.find({
      conversationId,
      userId: new Types.ObjectId(userId),
    })
      .sort({ createdAt: 1 }) // Oldest first
      .lean();

    return messages
      .filter((msg) => msg.role !== 'system') // Filter out system messages
      .map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        toolCalls: msg.toolCalls || undefined,
        timestamp: msg.createdAt.toISOString(),
      }));
  }

  /**
   * Save a user message
   */
  async saveUserMessage(
    conversationId: string,
    userId: string,
    content: string
  ): Promise<IConversationMessage> {
    return await ConversationMessageModel.create({
      conversationId,
      userId: new Types.ObjectId(userId),
      role: 'user',
      content,
    });
  }

  /**
   * Save an assistant message with optional tool calls
   */
  async saveAssistantMessage(
    conversationId: string,
    userId: string,
    content: string,
    toolCalls?: Array<{
      tool: string;
      input: Record<string, unknown>;
      result: unknown;
    }>
  ): Promise<IConversationMessage> {
    return await ConversationMessageModel.create({
      conversationId,
      userId: new Types.ObjectId(userId),
      role: 'assistant',
      content,
      toolCalls: toolCalls || [],
    });
  }

  /**
   * Delete all messages for a conversation (for cleanup)
   */
  async deleteConversation(
    conversationId: string,
    userId: string
  ): Promise<void> {
    await ConversationMessageModel.deleteMany({
      conversationId,
      userId: new Types.ObjectId(userId),
    });
  }

  /**
   * Get conversation summary (message count, last message time, etc.)
   */
  async getConversationSummary(
    conversationId: string,
    userId: string
  ): Promise<{
    messageCount: number;
    lastMessageAt: Date | null;
  }> {
    const messages = await ConversationMessageModel.find({
      conversationId,
      userId: new Types.ObjectId(userId),
    })
      .sort({ createdAt: -1 })
      .limit(1)
      .lean();

    const count = await ConversationMessageModel.countDocuments({
      conversationId,
      userId: new Types.ObjectId(userId),
    });

    return {
      messageCount: count,
      lastMessageAt: messages.length > 0 ? messages[0].createdAt : null,
    };
  }

  /**
   * List all conversations for a user with metadata
   */
  async listConversations(userId: string): Promise<
    Array<{
      conversationId: string;
      messageCount: number;
      lastMessageAt: Date | null;
      preview: string | null;
    }>
  > {
    // Get all unique conversation IDs for this user
    const conversations = await ConversationMessageModel.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(userId),
        },
      },
      {
        $group: {
          _id: '$conversationId',
          messageCount: { $sum: 1 },
          lastMessageAt: { $max: '$createdAt' },
          firstUserMessage: {
            $min: {
              $cond: [{ $eq: ['$role', 'user'] }, '$createdAt', null],
            },
          },
        },
      },
      {
        $sort: { lastMessageAt: -1 },
      },
    ]);

    // Get preview (first user message) for each conversation
    const conversationIds = conversations.map((c) => c._id);
    const firstMessages = await ConversationMessageModel.find({
      conversationId: { $in: conversationIds },
      userId: new Types.ObjectId(userId),
      role: 'user',
    })
      .sort({ createdAt: 1 })
      .lean();

    // Create a map of conversationId -> first message
    const previewMap = new Map<string, string>();
    for (const msg of firstMessages) {
      if (!previewMap.has(msg.conversationId)) {
        previewMap.set(
          msg.conversationId,
          msg.content.substring(0, 100) // Limit preview length
        );
      }
    }

    return conversations.map((conv) => ({
      conversationId: conv._id,
      messageCount: conv.messageCount,
      lastMessageAt: conv.lastMessageAt,
      preview: previewMap.get(conv._id) || null,
    }));
  }

  /**
   * Save a user memory (preference, fact, pattern, or context)
   */
  async saveUserMemory(
    userId: string,
    category: 'preference' | 'fact' | 'pattern' | 'context',
    key: string,
    value: string,
    source: string = 'system',
    confidence: number = 0.8
  ): Promise<IUserMemory> {
    const userObjectId = new Types.ObjectId(userId);

    // Check if memory with this key already exists
    const existingMemory = await UserMemoryModel.findOne({
      userId: userObjectId,
      key,
    });

    if (existingMemory) {
      // Update existing memory
      existingMemory.value = value;
      existingMemory.category = category;
      existingMemory.confidence = confidence;
      existingMemory.source = source;
      existingMemory.lastUpdated = new Date();
      return await existingMemory.save();
    }

    // Create new memory
    return await UserMemoryModel.create({
      userId: userObjectId,
      category,
      key,
      value,
      confidence,
      source,
      lastUpdated: new Date(),
      accessCount: 0,
    });
  }

  /**
   * Get user memories, optionally filtered by category
   */
  async getUserMemories(
    userId: string,
    options?: {
      category?: 'preference' | 'fact' | 'pattern' | 'context';
      limit?: number;
      sortBy?: 'recent' | 'accessCount' | 'confidence';
    }
  ): Promise<IUserMemory[]> {
    const userObjectId = new Types.ObjectId(userId);
    const query: Record<string, unknown> = { userId: userObjectId };

    if (options?.category) {
      query.category = options.category;
    }

    let sortOptions: Record<string, 1 | -1> = { lastUpdated: -1 };
    if (options?.sortBy) {
      switch (options.sortBy) {
        case 'accessCount':
          sortOptions = { accessCount: -1, lastUpdated: -1 };
          break;
        case 'confidence':
          sortOptions = { confidence: -1, lastUpdated: -1 };
          break;
        case 'recent':
        default:
          sortOptions = { lastUpdated: -1 };
          break;
      }
    }

    const limit = options?.limit || 50;

    const memories = await UserMemoryModel.find(query)
      .sort(sortOptions)
      .limit(limit)
      .lean();

    // Increment access count for retrieved memories
    if (memories.length > 0) {
      const memoryIds = memories.map((m) => m._id);
      await UserMemoryModel.updateMany(
        { _id: { $in: memoryIds } },
        { $inc: { accessCount: 1 } }
      );
    }

    return memories as IUserMemory[];
  }

  /**
   * Get a specific memory by key
   */
  async getUserMemoryByKey(
    userId: string,
    key: string
  ): Promise<IUserMemory | null> {
    const userObjectId = new Types.ObjectId(userId);
    const memory = await UserMemoryModel.findOne({
      userId: userObjectId,
      key,
    });

    if (memory) {
      // Increment access count
      memory.accessCount += 1;
      await memory.save();
    }

    return memory;
  }

  /**
   * Update an existing memory
   */
  async updateUserMemory(
    memoryId: string,
    updates: {
      value?: string;
      category?: 'preference' | 'fact' | 'pattern' | 'context';
      confidence?: number;
    }
  ): Promise<IUserMemory | null> {
    const memoryObjectId = new Types.ObjectId(memoryId);
    const updateData: Record<string, unknown> = {
      ...updates,
      lastUpdated: new Date(),
    };

    return await UserMemoryModel.findByIdAndUpdate(memoryObjectId, updateData, {
      new: true,
    });
  }

  /**
   * Delete a memory
   */
  async deleteUserMemory(memoryId: string, userId: string): Promise<void> {
    const memoryObjectId = new Types.ObjectId(memoryId);
    const userObjectId = new Types.ObjectId(userId);

    await UserMemoryModel.deleteOne({
      _id: memoryObjectId,
      userId: userObjectId,
    });
  }

  /**
   * Delete a memory by key
   */
  async deleteUserMemoryByKey(userId: string, key: string): Promise<void> {
    const userObjectId = new Types.ObjectId(userId);

    await UserMemoryModel.deleteOne({
      userId: userObjectId,
      key,
    });
  }

  /**
   * Get formatted memories for injection into system prompt
   */
  async getFormattedMemories(userId: string): Promise<string> {
    const memories = await this.getUserMemories(userId, {
      limit: 20,
      sortBy: 'confidence',
    });

    if (memories.length === 0) {
      return 'No user memories found.';
    }

    const grouped = memories.reduce(
      (acc, memory) => {
        if (!acc[memory.category]) {
          acc[memory.category] = [];
        }
        acc[memory.category].push(memory);
        return acc;
      },
      {} as Record<string, IUserMemory[]>
    );

    const sections: string[] = [];

    if (grouped.preference) {
      sections.push(
        'User Preferences:',
        ...grouped.preference.map(
          (m) =>
            `  - ${m.value} (confidence: ${Math.round(m.confidence * 100)}%)`
        )
      );
    }

    if (grouped.fact) {
      sections.push(
        '',
        'Known Facts:',
        ...grouped.fact.map(
          (m) =>
            `  - ${m.value} (confidence: ${Math.round(m.confidence * 100)}%)`
        )
      );
    }

    if (grouped.pattern) {
      sections.push(
        '',
        'Observed Patterns:',
        ...grouped.pattern.map(
          (m) =>
            `  - ${m.value} (confidence: ${Math.round(m.confidence * 100)}%)`
        )
      );
    }

    if (grouped.context) {
      sections.push(
        '',
        'Current Context:',
        ...grouped.context.map(
          (m) =>
            `  - ${m.value} (confidence: ${Math.round(m.confidence * 100)}%)`
        )
      );
    }

    return sections.join('\n');
  }
}

// Export singleton instance
export const memoryService = new MemoryService();
