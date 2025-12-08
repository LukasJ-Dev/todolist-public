import mongoose from 'mongoose';
import { userModel } from '../../models/userModel';
import { TodolistModel } from '../../models/todolistModel';
import { TaskModel } from '../../models/taskModel';
import { refreshTokenModel } from '../../models/refreshTokens';
import { ConversationMessageModel } from '../../models/conversationMessageModel';
import { UserMemoryModel } from '../../models/userMemoryModel';
import { toObjectId } from '../../utils/database';
import { AppError } from '../../utils/appError';

export interface AdminStats {
  totalUsers: number;
  totalTodolists: number;
  totalTasks: number;
  demoAccounts: number;
  activeUsers7Days: number;
  activeUsers30Days: number;
  totalConversations: number;
  totalAIMessages: number;
  usersUsingAI: number;
  totalToolCalls: number;
  totalMemories: number;
}

export interface UserWithStats {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  todolistCount: number;
  taskCount: number;
  lastLogin?: string;
  isDemo: boolean;
}

export interface ActivityMetrics {
  newUsers7Days: number;
  newUsers30Days: number;
  tasksCreated7Days: number;
  tasksCreated30Days: number;
  todolistsCreated7Days: number;
  todolistsCreated30Days: number;
  growthData: Array<{
    date: string;
    users: number;
    tasks: number;
    todolists: number;
  }>;
}

export interface AIStats {
  totalConversations: number;
  totalMessages: number;
  uniqueUsers: number;
  totalToolCalls: number;
  totalMemories: number;
  averageMessagesPerConversation: number;
  conversations7Days: number;
  conversations30Days: number;
  messages7Days: number;
  messages30Days: number;
}

export interface AIUsageTrends {
  dailyData: Array<{
    date: string;
    conversations: number;
    messages: number;
    toolCalls: number;
  }>;
}

export interface ToolUsage {
  tool: string;
  count: number;
}

export interface TopAIUser {
  userId: string;
  name: string;
  email: string;
  conversationCount: number;
  messageCount: number;
  toolCallCount: number;
  totalInteractions: number;
}

export interface MemoryStats {
  totalMemories: number;
  byCategory: {
    preference: number;
    fact: number;
    pattern: number;
    context: number;
  };
  averageConfidence: number;
  totalAccessCount: number;
  mostAccessed: Array<{
    key: string;
    value: string;
    category: string;
    accessCount: number;
  }>;
}

export interface CollectionStats {
  name: string;
  displayName: string;
  count: number;
  dataSize: number;
  storageSize: number;
  indexSize: number;
  totalSize: number;
  avgObjSize: number;
}

export interface DatabaseStats {
  dataSize: number;
  storageSize: number;
  indexSize: number;
  totalSize: number;
  collections: number;
  objects: number;
  avgObjSize: number;
  collectionStats: CollectionStats[];
}

export interface AgeRangeCount {
  ageDays: number;
  count: number;
}

export interface CleanupCounts {
  todolists: AgeRangeCount[];
  tasks: AgeRangeCount[];
  conversations: AgeRangeCount[];
  memories: AgeRangeCount[];
}

export interface CleanupResult {
  deletedCount: number;
  estimatedSpaceFreed: number; // in bytes
  details?: {
    todolistsDeleted?: number;
    tasksDeleted?: number;
    messagesDeleted?: number;
  };
}

/**
 * Admin service for managing and querying admin dashboard data
 */
export class AdminService {
  /**
   * Get overall statistics
   */
  async getStats(): Promise<AdminStats> {
    const totalUsers = await userModel.countDocuments();
    const totalTodolists = await TodolistModel.countDocuments();
    const totalTasks = await TaskModel.countDocuments();

    // Count demo accounts (emails ending with @lukasj.dev)
    const demoAccounts = await userModel.countDocuments({
      email: { $regex: /@lukasj\.dev$/, $options: 'i' },
    });

    // Get active users (users with refresh tokens created in last 7/30 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activeUsers7Days = await refreshTokenModel.distinct('userId', {
      issuedAt: { $gte: sevenDaysAgo },
    });

    const activeUsers30Days = await refreshTokenModel.distinct('userId', {
      issuedAt: { $gte: thirtyDaysAgo },
    });

    // AI statistics
    const totalConversations = await ConversationMessageModel.distinct(
      'conversationId'
    ).then((ids) => ids.length);
    const totalAIMessages = await ConversationMessageModel.countDocuments();
    const usersUsingAI = await ConversationMessageModel.distinct('userId').then(
      (ids) => ids.length
    );
    const totalMemories = await UserMemoryModel.countDocuments();

    // Count total tool calls (sum of all toolCalls arrays)
    const messagesWithTools = await ConversationMessageModel.find({
      toolCalls: { $exists: true, $ne: [] },
    }).lean();
    const totalToolCalls = messagesWithTools.reduce(
      (sum, msg) => sum + (msg.toolCalls?.length || 0),
      0
    );

    return {
      totalUsers,
      totalTodolists,
      totalTasks,
      demoAccounts,
      activeUsers7Days: activeUsers7Days.length,
      activeUsers30Days: activeUsers30Days.length,
      totalConversations,
      totalAIMessages,
      usersUsingAI,
      totalToolCalls,
      totalMemories,
    };
  }

  /**
   * Get paginated user list with statistics
   */
  async getUsers(
    page: number = 1,
    limit: number = 50,
    search?: string
  ): Promise<{
    users: UserWithStats[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    // Build query
    const query: Record<string, unknown> = {};
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
      ];
    }

    // Get total count
    const total = await userModel.countDocuments(query);

    // Get users
    const users = await userModel.find(query).skip(skip).limit(limit).sort({
      createdAt: -1,
    });

    // Get statistics for each user
    const usersWithStats: UserWithStats[] = await Promise.all(
      users.map(async (user) => {
        const userId = user._id.toString();

        // Get todolist and task counts
        const todolistCount = await TodolistModel.countDocuments({
          owner: user._id,
        });
        const taskCount = await TaskModel.countDocuments({ owner: user._id });

        // Get last login (most recent refresh token creation)
        const lastToken = await refreshTokenModel
          .findOne({ userId: user._id })
          .sort({ issuedAt: -1 })
          .lean();

        const isDemo = user.email.toLowerCase().endsWith('@lukasj.dev');

        return {
          id: userId,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
          todolistCount,
          taskCount,
          lastLogin: lastToken?.issuedAt
            ? lastToken.issuedAt.toISOString()
            : undefined,
          isDemo,
        };
      })
    );

    return {
      users: usersWithStats,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get all demo accounts
   */
  async getDemoAccounts(): Promise<UserWithStats[]> {
    const demoUsers = await userModel.find({
      email: { $regex: /@lukasj\.dev$/, $options: 'i' },
    });

    const usersWithStats: UserWithStats[] = await Promise.all(
      demoUsers.map(async (user) => {
        const userId = user._id.toString();

        const todolistCount = await TodolistModel.countDocuments({
          owner: user._id,
        });
        const taskCount = await TaskModel.countDocuments({ owner: user._id });

        const lastToken = await refreshTokenModel
          .findOne({ userId: user._id })
          .sort({ issuedAt: -1 })
          .lean();

        return {
          id: userId,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
          todolistCount,
          taskCount,
          lastLogin: lastToken?.issuedAt
            ? lastToken.issuedAt.toISOString()
            : undefined,
          isDemo: true,
        };
      })
    );

    return usersWithStats;
  }

  /**
   * Delete a user and all their data
   */
  async deleteUser(userId: string): Promise<void> {
    const userObjectId = toObjectId(userId);

    // Verify user exists
    const user = await userModel.findById(userObjectId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Delete all tasks owned by user (includes tasks in their todolists and orphaned tasks)
    await TaskModel.deleteMany({ owner: userObjectId });

    // Delete all user's todolists (cascade should handle tasks, but we already deleted them above)
    await TodolistModel.deleteMany({ owner: userObjectId });

    // Delete refresh tokens
    await refreshTokenModel.deleteMany({ userId: userObjectId });

    // Delete user
    await userModel.deleteOne({ _id: userObjectId });
  }

  /**
   * Delete all demo accounts
   */
  async deleteDemoAccounts(): Promise<{ deletedCount: number }> {
    const demoUsers = await userModel.find({
      email: { $regex: /@lukasj\.dev$/, $options: 'i' },
    });

    let deletedCount = 0;

    for (const user of demoUsers) {
      const userId = user._id.toString();
      try {
        await this.deleteUser(userId);
        deletedCount++;
      } catch (error) {
        // Log error but continue deleting other accounts
        console.error(`Failed to delete demo account ${userId}:`, error);
      }
    }

    return { deletedCount };
  }

  /**
   * Get activity metrics
   */
  async getActivity(): Promise<ActivityMetrics> {
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // New users
    const newUsers7Days = await userModel.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
    });
    const newUsers30Days = await userModel.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    });

    // Tasks created
    const tasksCreated7Days = await TaskModel.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
    });
    const tasksCreated30Days = await TaskModel.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    });

    // Todolists created
    const todolistsCreated7Days = await TodolistModel.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
    });
    const todolistsCreated30Days = await TodolistModel.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    });

    // Growth data (last 30 days, grouped by day)
    const growthData: ActivityMetrics['growthData'] = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const users = await userModel.countDocuments({
        createdAt: { $gte: date, $lt: nextDate },
      });
      const tasks = await TaskModel.countDocuments({
        createdAt: { $gte: date, $lt: nextDate },
      });
      const todolists = await TodolistModel.countDocuments({
        createdAt: { $gte: date, $lt: nextDate },
      });

      growthData.push({
        date: date.toISOString().split('T')[0],
        users,
        tasks,
        todolists,
      });
    }

    return {
      newUsers7Days,
      newUsers30Days,
      tasksCreated7Days,
      tasksCreated30Days,
      todolistsCreated7Days,
      todolistsCreated30Days,
      growthData,
    };
  }

  /**
   * Get AI statistics
   */
  async getAIStats(): Promise<AIStats> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Total conversations (unique conversationIds)
    const totalConversations = await ConversationMessageModel.distinct(
      'conversationId'
    ).then((ids) => ids.length);

    // Total messages
    const totalMessages = await ConversationMessageModel.countDocuments();

    // Unique users using AI
    const uniqueUsers = await ConversationMessageModel.distinct('userId').then(
      (ids) => ids.length
    );

    // Total tool calls
    const messagesWithTools = await ConversationMessageModel.find({
      toolCalls: { $exists: true, $ne: [] },
    }).lean();
    const totalToolCalls = messagesWithTools.reduce(
      (sum, msg) => sum + (msg.toolCalls?.length || 0),
      0
    );

    // Total memories
    const totalMemories = await UserMemoryModel.countDocuments();

    // Average messages per conversation
    const averageMessagesPerConversation =
      totalConversations > 0 ? totalMessages / totalConversations : 0;

    // Conversations in last 7/30 days (conversations that started in this period)
    // Get the first message of each conversation and check if it was created in the period
    const conversations7DaysAgg = await ConversationMessageModel.aggregate([
      {
        $group: {
          _id: '$conversationId',
          firstMessageDate: { $min: '$createdAt' },
        },
      },
      {
        $match: {
          firstMessageDate: { $gte: sevenDaysAgo },
        },
      },
    ]);
    const conversations7Days = conversations7DaysAgg.length;

    const conversations30DaysAgg = await ConversationMessageModel.aggregate([
      {
        $group: {
          _id: '$conversationId',
          firstMessageDate: { $min: '$createdAt' },
        },
      },
      {
        $match: {
          firstMessageDate: { $gte: thirtyDaysAgo },
        },
      },
    ]);
    const conversations30Days = conversations30DaysAgg.length;

    // Messages in last 7/30 days
    const messages7Days = await ConversationMessageModel.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
    });

    const messages30Days = await ConversationMessageModel.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    });

    return {
      totalConversations,
      totalMessages,
      uniqueUsers,
      totalToolCalls,
      totalMemories,
      averageMessagesPerConversation:
        Math.round(averageMessagesPerConversation * 100) / 100,
      conversations7Days,
      conversations30Days,
      messages7Days,
      messages30Days,
    };
  }

  /**
   * Get AI usage trends (daily data for last 30 days)
   */
  async getAIUsageTrends(): Promise<AIUsageTrends> {
    const now = new Date();
    const dailyData: AIUsageTrends['dailyData'] = [];

    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      // Count unique conversations that started on this day (first message date)
      const conversationsAgg = await ConversationMessageModel.aggregate([
        {
          $group: {
            _id: '$conversationId',
            firstMessageDate: { $min: '$createdAt' },
          },
        },
        {
          $match: {
            firstMessageDate: { $gte: date, $lt: nextDate },
          },
        },
      ]);
      const conversations = conversationsAgg.length;

      // Count messages on this day
      const messages = await ConversationMessageModel.countDocuments({
        createdAt: { $gte: date, $lt: nextDate },
      });

      // Count tool calls on this day
      const messagesWithTools = await ConversationMessageModel.find({
        createdAt: { $gte: date, $lt: nextDate },
        toolCalls: { $exists: true, $ne: [] },
      }).lean();
      const toolCalls = messagesWithTools.reduce(
        (sum, msg) => sum + (msg.toolCalls?.length || 0),
        0
      );

      dailyData.push({
        date: date.toISOString().split('T')[0],
        conversations,
        messages,
        toolCalls,
      });
    }

    return { dailyData };
  }

  /**
   * Get AI tool usage statistics
   */
  async getAIToolUsage(): Promise<ToolUsage[]> {
    // Get all messages with tool calls
    const messagesWithTools = await ConversationMessageModel.find({
      toolCalls: { $exists: true, $ne: [] },
    }).lean();

    // Aggregate tool usage
    const toolCounts: Record<string, number> = {};
    messagesWithTools.forEach((msg) => {
      if (msg.toolCalls && Array.isArray(msg.toolCalls)) {
        msg.toolCalls.forEach((toolCall) => {
          const toolName = toolCall.tool || 'unknown';
          toolCounts[toolName] = (toolCounts[toolName] || 0) + 1;
        });
      }
    });

    // Convert to array and sort by count
    const toolUsage: ToolUsage[] = Object.entries(toolCounts)
      .map(([tool, count]) => ({ tool, count }))
      .sort((a, b) => b.count - a.count);

    return toolUsage;
  }

  /**
   * Get top AI users
   */
  async getTopAIUsers(limit: number = 20): Promise<TopAIUser[]> {
    // Aggregate user statistics
    const userStats = await ConversationMessageModel.aggregate([
      {
        $group: {
          _id: '$userId',
          conversationIds: { $addToSet: '$conversationId' },
          messageCount: { $sum: 1 },
          toolCallCount: {
            $sum: {
              $cond: [{ $isArray: '$toolCalls' }, { $size: '$toolCalls' }, 0],
            },
          },
        },
      },
      {
        $project: {
          userId: '$_id',
          conversationCount: { $size: '$conversationIds' },
          messageCount: 1,
          toolCallCount: 1,
          totalInteractions: {
            $add: [
              { $size: '$conversationIds' },
              '$messageCount',
              '$toolCallCount',
            ],
          },
        },
      },
      { $sort: { totalInteractions: -1 } },
      { $limit: limit },
    ]);

    // Get user details
    const topUsers = await Promise.all(
      userStats.map(async (stat) => {
        const user = await userModel.findById(stat.userId).lean();
        if (!user) {
          return null;
        }

        return {
          userId: stat.userId.toString(),
          name: user.name,
          email: user.email,
          conversationCount: stat.conversationCount,
          messageCount: stat.messageCount,
          toolCallCount: stat.toolCallCount,
          totalInteractions: stat.totalInteractions,
        };
      })
    );

    // Filter out nulls and return
    return topUsers.filter((user): user is TopAIUser => user !== null);
  }

  /**
   * Get memory statistics
   */
  async getAIMemoryStats(): Promise<MemoryStats> {
    // Total memories
    const totalMemories = await UserMemoryModel.countDocuments();

    // Memories by category
    const byCategory = {
      preference: await UserMemoryModel.countDocuments({
        category: 'preference',
      }),
      fact: await UserMemoryModel.countDocuments({ category: 'fact' }),
      pattern: await UserMemoryModel.countDocuments({ category: 'pattern' }),
      context: await UserMemoryModel.countDocuments({ category: 'context' }),
    };

    // Average confidence
    const memories = await UserMemoryModel.find({}).lean();
    const averageConfidence =
      memories.length > 0
        ? memories.reduce((sum, mem) => sum + (mem.confidence || 0), 0) /
          memories.length
        : 0;

    // Total access count
    const totalAccessCount = memories.reduce(
      (sum, mem) => sum + (mem.accessCount || 0),
      0
    );

    // Most accessed memories (top 10)
    const mostAccessed = await UserMemoryModel.find({})
      .sort({ accessCount: -1 })
      .limit(10)
      .lean();

    return {
      totalMemories,
      byCategory,
      averageConfidence: Math.round(averageConfidence * 100) / 100,
      totalAccessCount,
      mostAccessed: mostAccessed.map((mem) => ({
        key: mem.key,
        value: mem.value,
        category: mem.category,
        accessCount: mem.accessCount || 0,
      })),
    };
  }

  /**
   * Get database size statistics
   */
  async getDatabaseStats(): Promise<DatabaseStats> {
    const db = mongoose.connection.db;
    if (!db) {
      throw new AppError('Database connection not available', 503);
    }

    // Get overall database stats
    const dbStats = await db.stats();

    // Collection name mapping (MongoDB collection name -> Display name)
    const collectionNameMap: Record<string, string> = {
      users: 'Users',
      todolists: 'Todolists',
      tasks: 'Tasks',
      conversationmessages: 'Conversation Messages',
      usermemories: 'User Memories',
      refreshtokens: 'Refresh Tokens',
    };

    // Get all collections
    const collections = await db.listCollections().toArray();

    // Get stats for each collection
    const collectionStats: CollectionStats[] = await Promise.all(
      collections.map(async (collection) => {
        try {
          const stats = await db.collection(collection.name).stats();
          const displayName =
            collectionNameMap[collection.name.toLowerCase()] ||
            collection.name.charAt(0).toUpperCase() +
              collection.name.slice(1).replace(/([A-Z])/g, ' $1');

          return {
            name: collection.name,
            displayName,
            count: stats.count || 0,
            dataSize: stats.size || 0,
            storageSize: stats.storageSize || 0,
            indexSize: stats.totalIndexSize || 0,
            totalSize: (stats.storageSize || 0) + (stats.totalIndexSize || 0),
            avgObjSize: stats.avgObjSize || 0,
          };
        } catch (error) {
          // If stats fail for a collection, return minimal info
          return {
            name: collection.name,
            displayName:
              collectionNameMap[collection.name.toLowerCase()] ||
              collection.name,
            count: 0,
            dataSize: 0,
            storageSize: 0,
            indexSize: 0,
            totalSize: 0,
            avgObjSize: 0,
          };
        }
      })
    );

    // Sort collections by total size (descending)
    collectionStats.sort((a, b) => b.totalSize - a.totalSize);

    return {
      dataSize: dbStats.dataSize || 0,
      storageSize: dbStats.storageSize || 0,
      indexSize: dbStats.indexSize || 0,
      totalSize: (dbStats.storageSize || 0) + (dbStats.indexSize || 0),
      collections: collectionStats.length,
      objects: dbStats.objects || 0,
      avgObjSize: dbStats.avgObjSize || 0,
      collectionStats,
    };
  }

  /**
   * Get cleanup counts by age ranges
   */
  async getCleanupCounts(): Promise<CleanupCounts> {
    const ageRanges = [30, 60, 90, 180, 365];
    const now = new Date();

    // Helper to count documents older than X days
    // Using any here because we need to accept different Mongoose model types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const countByAge = async (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      model: mongoose.Model<any>,
      ageDays: number
    ): Promise<number> => {
      const cutoffDate = new Date(now);
      cutoffDate.setDate(cutoffDate.getDate() - ageDays);
      return await model.countDocuments({
        createdAt: { $lt: cutoffDate },
      });
    };

    // Count todolists by age
    const todolists = await Promise.all(
      ageRanges.map(async (ageDays) => ({
        ageDays,
        count: await countByAge(TodolistModel, ageDays),
      }))
    );

    // Count tasks by age
    const tasks = await Promise.all(
      ageRanges.map(async (ageDays) => ({
        ageDays,
        count: await countByAge(TaskModel, ageDays),
      }))
    );

    // Count conversations by age (based on first message date)
    const conversations = await Promise.all(
      ageRanges.map(async (ageDays) => {
        const cutoffDate = new Date(now);
        cutoffDate.setDate(cutoffDate.getDate() - ageDays);
        // Count unique conversations where the first message is older than cutoff
        const result = await ConversationMessageModel.aggregate([
          {
            $group: {
              _id: '$conversationId',
              firstMessageDate: { $min: '$createdAt' },
            },
          },
          {
            $match: {
              firstMessageDate: { $lt: cutoffDate },
            },
          },
          {
            $count: 'count',
          },
        ]);
        return {
          ageDays,
          count: result[0]?.count || 0,
        };
      })
    );

    // Count memories by age
    const memories = await Promise.all(
      ageRanges.map(async (ageDays) => ({
        ageDays,
        count: await countByAge(UserMemoryModel, ageDays),
      }))
    );

    return {
      todolists,
      tasks,
      conversations,
      memories,
    };
  }

  /**
   * Delete todolists older than specified age
   */
  async deleteTodolistsByAge(ageDays: number): Promise<CleanupResult> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - ageDays);

    // Find todolists to delete
    const todolistsToDelete = await TodolistModel.find({
      createdAt: { $lt: cutoffDate },
    }).lean();

    const todolistIds = todolistsToDelete.map((t) => t._id);
    const todolistCount = todolistIds.length;

    // Count tasks that will be deleted (cascade)
    const taskCount = await TaskModel.countDocuments({
      todolist: { $in: todolistIds },
    });

    // Estimate space (rough estimate based on average sizes)
    // Average todolist: ~200 bytes, Average task: ~500 bytes
    const estimatedSpace = todolistCount * 200 + taskCount * 500;

    // Delete tasks first (cascade)
    await TaskModel.deleteMany({
      todolist: { $in: todolistIds },
    });

    // Delete todolists
    await TodolistModel.deleteMany({
      createdAt: { $lt: cutoffDate },
    });

    return {
      deletedCount: todolistCount + taskCount,
      estimatedSpaceFreed: estimatedSpace,
      details: {
        todolistsDeleted: todolistCount,
        tasksDeleted: taskCount,
      },
    };
  }

  /**
   * Delete tasks older than specified age
   */
  async deleteTasksByAge(ageDays: number): Promise<CleanupResult> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - ageDays);

    const taskCount = await TaskModel.countDocuments({
      createdAt: { $lt: cutoffDate },
    });

    // Estimate space
    const estimatedSpace = taskCount * 500;

    await TaskModel.deleteMany({
      createdAt: { $lt: cutoffDate },
    });

    return {
      deletedCount: taskCount,
      estimatedSpaceFreed: estimatedSpace,
    };
  }

  /**
   * Delete conversations older than specified age
   */
  async deleteConversationsByAge(ageDays: number): Promise<CleanupResult> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - ageDays);

    // Find conversations to delete (where first message is older than cutoff)
    const conversationsToDelete = await ConversationMessageModel.aggregate([
      {
        $group: {
          _id: '$conversationId',
          firstMessageDate: { $min: '$createdAt' },
        },
      },
      {
        $match: {
          firstMessageDate: { $lt: cutoffDate },
        },
      },
    ]);

    const conversationIds = conversationsToDelete.map((c) => c._id);

    // Count messages that will be deleted
    const messageCount = await ConversationMessageModel.countDocuments({
      conversationId: { $in: conversationIds },
    });

    // Estimate space (average message: ~300 bytes)
    const estimatedSpace = messageCount * 300;

    // Delete messages (which deletes the conversations)
    await ConversationMessageModel.deleteMany({
      conversationId: { $in: conversationIds },
    });

    return {
      deletedCount: messageCount,
      estimatedSpaceFreed: estimatedSpace,
      details: {
        messagesDeleted: messageCount,
      },
    };
  }

  /**
   * Delete memories older than specified age
   */
  async deleteMemoriesByAge(ageDays: number): Promise<CleanupResult> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - ageDays);

    const memoryCount = await UserMemoryModel.countDocuments({
      createdAt: { $lt: cutoffDate },
    });

    // Estimate space (average memory: ~200 bytes)
    const estimatedSpace = memoryCount * 200;

    await UserMemoryModel.deleteMany({
      createdAt: { $lt: cutoffDate },
    });

    return {
      deletedCount: memoryCount,
      estimatedSpaceFreed: estimatedSpace,
    };
  }

  /**
   * Get user restrictions
   */
  async getUserRestrictions(userId: string) {
    const user = await userModel.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    return user.restrictions || {};
  }

  /**
   * Update user restrictions
   */
  async updateUserRestrictions(
    userId: string,
    restrictions: {
      aiDisabled?: boolean;
      createTodolistsDisabled?: boolean;
      createTasksDisabled?: boolean;
      loginDisabled?: boolean;
    }
  ) {
    const user = await userModel.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    user.restrictions = { ...user.restrictions, ...restrictions };
    await user.save();
    return user.restrictions || {};
  }

  /**
   * Get user limits
   */
  async getUserLimits(userId: string) {
    const user = await userModel.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    return user.limits || {};
  }

  /**
   * Update user limits
   */
  async updateUserLimits(
    userId: string,
    limits: {
      maxTodolists?: number;
      maxTasks?: number;
      maxAIMessages?: number;
    }
  ) {
    const user = await userModel.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    user.limits = { ...user.limits, ...limits };
    await user.save();
    return user.limits || {};
  }

  /**
   * Get global settings
   */
  async getGlobalSettings() {
    const { globalSettingsService } = await import('./globalSettingsService');
    return await globalSettingsService.getGlobalSettings();
  }

  /**
   * Update global restrictions
   */
  async updateGlobalRestrictions(restrictions: {
    aiDisabled?: boolean;
    createTodolistsDisabled?: boolean;
    createTasksDisabled?: boolean;
    loginDisabled?: boolean;
    registerDisabled?: boolean;
  }) {
    const { globalSettingsService } = await import('./globalSettingsService');
    return await globalSettingsService.updateGlobalRestrictions(restrictions);
  }

  /**
   * Update global limits
   */
  async updateGlobalLimits(limits: {
    maxTodolists?: number;
    maxTasks?: number;
    maxAIMessages?: number;
  }) {
    const { globalSettingsService } = await import('./globalSettingsService');
    return await globalSettingsService.updateGlobalLimits(limits);
  }
}

// Export singleton instance
export const adminService = new AdminService();
