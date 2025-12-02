import { TaskModel, ITask } from '../../models/taskModel';
import { TodolistModel } from '../../models/todolistModel';
import { AppError } from '../../utils/appError';
import { toObjectId } from '../../utils/database';
import { ObjectId, PipelineStage } from 'mongoose';

export interface CreateTaskInput {
  name: string;
  todolistId: string;
  userId: string;
  description?: string;
  dueDate?: string | Date;
  startDate?: string | Date;
  priority?: 'low' | 'medium' | 'high';
  isRecurring?: boolean;
  recurrenceType?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  recurrenceInterval?: number;
  tags?: string[];
  parentTaskId?: string;
}

export interface CreateTaskOutput {
  task: ITask;
}

export interface TaskStatistics {
  totals: {
    all: number;
    completed: number;
    incomplete: number;
    overdue: number;
  };
  priorities: {
    high: number;
    medium: number;
    low: number;
  };
  dueDates: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    overdue: number;
    noDueDate: number;
  };
  completionRate: number;
  recurring: number;
  subtasks: {
    tasksWithSubtasks: number;
    totalSubtasks: number;
  };
  tags: Array<{ tag: string; count: number }>;
  todolists?: Array<{
    todolistId: string;
    todolistName: string;
    count: number;
  }>;
  insights: {
    mostUsedTag?: string;
    mostActiveTodolist?: { id: string; name: string; count: number };
    averageTasksPerTodolist?: number;
  };
}

/**
 * Task service for business logic related to tasks
 * Can be used by controllers, AI tools, and other services
 */
export class TaskService {
  /**
   * Create a new task
   */
  async createTask(input: CreateTaskInput): Promise<CreateTaskOutput> {
    const {
      name,
      todolistId,
      userId,
      description,
      dueDate,
      startDate,
      priority = 'medium',
      isRecurring = false,
      recurrenceType,
      recurrenceInterval = 1,
      tags = [],
      parentTaskId,
    } = input;

    // Validate and convert todolist ID
    const todolistObjectId = toObjectId(todolistId);

    // Verify todolist exists and belongs to user
    const todolist = await TodolistModel.findOne({
      _id: todolistObjectId,
      owner: userId,
    });

    if (!todolist) {
      throw new AppError('Todolist not found', 404);
    }

    // Check depth limit for subtasks (max 3 levels: parent -> subtask -> sub-subtask)
    if (parentTaskId) {
      const parentTaskObjectId = toObjectId(parentTaskId);
      const parentTask = await TaskModel.findById(parentTaskObjectId);

      if (!parentTask) {
        throw new AppError('Parent task not found', 404);
      }

      // Verify parent task belongs to user
      if (parentTask.owner.toString() !== userId) {
        throw new AppError('Parent task not found', 404);
      }

      // Calculate depth by counting parent levels
      let depth = 0;
      let currentParent = parentTask;

      while (currentParent.parentTask) {
        depth++;
        const nextParent = await TaskModel.findById(currentParent.parentTask);
        if (!nextParent) break;
        currentParent = nextParent;
      }

      // If parent is already at max depth (2), don't allow more subtasks
      if (depth >= 2) {
        throw new AppError('Maximum subtask depth reached (3 levels)', 400);
      }
    }

    // Create the task
    const newTask = await TaskModel.create({
      name,
      todolist: todolistObjectId,
      description,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      priority,
      isRecurring,
      recurrenceType,
      recurrenceInterval,
      tags,
      parentTask: parentTaskId ? toObjectId(parentTaskId) : undefined,
      owner: userId,
      checked: false,
    });

    // If this is a subtask, add it to the parent's subtasks array
    if (parentTaskId) {
      const parentTaskObjectId = toObjectId(parentTaskId);
      await TaskModel.findByIdAndUpdate(
        parentTaskObjectId,
        { $addToSet: { subtasks: newTask._id } },
        { new: true }
      );
    }

    // Populate the todolist reference
    await newTask.populate('todolist', 'name');

    return { task: newTask };
  }

  /**
   * Get user's tasks with optional filters
   */
  async getTasks(
    userId: string,
    options?: {
      todolistId?: string;
      filter?:
        | 'due_today'
        | 'due_this_week'
        | 'overdue'
        | 'recurring'
        | 'subtasks';
      priority?: 'low' | 'medium' | 'high';
      tags?: string[];
      sort?: 'due_date' | 'priority' | 'name' | 'created';
      includeSubtasks?: boolean;
    }
  ): Promise<ITask[]> {
    const query: Record<string, unknown> = { owner: userId };

    // Filter by todolist
    if (options?.todolistId) {
      const todolistId = toObjectId(options.todolistId);

      // Verify todolist exists and belongs to user
      const todolist = await TodolistModel.findOne({
        _id: todolistId,
        owner: userId,
      });

      if (!todolist) {
        throw new AppError('Todolist not found', 404);
      }

      query.todolist = todolistId;
    }

    // Apply filters
    if (options?.filter) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);

      switch (options.filter) {
        case 'due_today':
          query.dueDate = { $gte: today, $lt: tomorrow };
          break;
        case 'due_this_week':
          query.dueDate = { $gte: today, $lt: nextWeek };
          break;
        case 'overdue':
          query.dueDate = { $lt: today };
          query.checked = false;
          break;
        case 'recurring':
          query.isRecurring = true;
          break;
        case 'subtasks':
          query.parentTask = { $exists: true };
          break;
      }
    }

    // Filter by priority
    if (options?.priority) {
      query.priority = options.priority;
    }

    // Filter by tags
    if (options?.tags && options.tags.length > 0) {
      query.tags = { $in: options.tags.map((tag) => tag.trim().toLowerCase()) };
    }

    // Build sort options
    let sortOptions: Record<string, 1 | -1> | string = { createdAt: -1 }; // Default sort
    if (options?.sort) {
      switch (options.sort) {
        case 'due_date':
          sortOptions = { dueDate: 1, createdAt: -1 };
          break;
        case 'priority':
          sortOptions = { priority: -1, createdAt: -1 };
          break;
        case 'name':
          sortOptions = { name: 1 };
          break;
        case 'created':
          sortOptions = { createdAt: -1 };
          break;
      }
    }

    const queryBuilder = TaskModel.find(query)
      .populate('todolist', 'name')
      .populate('parentTask', 'name');

    if (options?.includeSubtasks) {
      queryBuilder.populate(
        'subtasks',
        'name description priority checked dueDate startDate tags todolist parentTask'
      );
    }

    return await queryBuilder.sort(sortOptions);
  }

  /**
   * Update a task
   */
  async updateTask(
    taskId: string,
    userId: string,
    updates: {
      name?: string;
      description?: string;
      dueDate?: string | Date | null;
      startDate?: string | Date | null;
      priority?: 'low' | 'medium' | 'high';
      isRecurring?: boolean;
      recurrenceType?: 'daily' | 'weekly' | 'monthly' | 'yearly';
      recurrenceInterval?: number;
      tags?: string[];
      checked?: boolean;
      todolistId?: string;
      parentTaskId?: string | null;
    }
  ): Promise<ITask> {
    const taskObjectId = toObjectId(taskId);

    // Find and validate ownership
    const task = await TaskModel.findOne({
      _id: taskObjectId,
      owner: userId,
    });

    if (!task) {
      throw new AppError('Task not found', 404);
    }

    // If updating todolist, verify it exists and belongs to user
    if (updates.todolistId) {
      const todolistId = toObjectId(updates.todolistId);
      const todolist = await TodolistModel.findOne({
        _id: todolistId,
        owner: userId,
      });

      if (!todolist) {
        throw new AppError('Todolist not found', 404);
      }
    }

    // Prepare update data with proper date conversions
    const updateData: Record<string, unknown> = { ...updates };
    if (updates.dueDate !== undefined) {
      updateData.dueDate = updates.dueDate ? new Date(updates.dueDate) : null;
    }
    if (updates.startDate !== undefined) {
      updateData.startDate = updates.startDate
        ? new Date(updates.startDate)
        : null;
    }

    // Handle parentTask changes
    if (updates.parentTaskId !== undefined) {
      const newParentTaskId =
        updates.parentTaskId && updates.parentTaskId.trim() !== ''
          ? toObjectId(updates.parentTaskId)
          : null;
      const oldParentTaskId = task.parentTask;

      // Remove from old parent's subtasks array
      if (oldParentTaskId) {
        await TaskModel.findByIdAndUpdate(
          oldParentTaskId,
          { $pull: { subtasks: taskObjectId } },
          { new: true }
        );
      }

      // Add to new parent's subtasks array
      if (newParentTaskId) {
        await TaskModel.findByIdAndUpdate(
          newParentTaskId,
          { $addToSet: { subtasks: taskObjectId } },
          { new: true }
        );
      }

      updateData.parentTask = newParentTaskId;
    }

    // Handle completedAt when task is checked
    if (updates.checked === true) {
      updateData.completedAt = new Date();
    } else if (updates.checked === false) {
      updateData.completedAt = null;
    }

    const editedTask = await TaskModel.findOneAndUpdate(
      { _id: taskObjectId, owner: userId },
      updateData,
      { new: true, runValidators: true }
    ).populate('todolist', 'name');

    if (!editedTask) {
      throw new AppError('Task not found', 404);
    }

    return editedTask;
  }

  /**
   * Get comprehensive task statistics and insights
   */
  async getTaskStatistics(
    userId: string,
    options?: {
      todolistId?: string;
    }
  ): Promise<TaskStatistics> {
    const userObjectId = toObjectId(userId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextMonth = new Date(today);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    // Build match query
    const matchQuery: Record<string, unknown> = { owner: userObjectId };

    // Filter by todolist if provided
    if (options?.todolistId) {
      const todolistId = toObjectId(options.todolistId);

      // Verify todolist exists and belongs to user
      const todolist = await TodolistModel.findOne({
        _id: todolistId,
        owner: userId,
      });

      if (!todolist) {
        throw new AppError('Todolist not found', 404);
      }

      matchQuery.todolist = todolistId;
    }

    // Main aggregation pipeline
    const pipeline: PipelineStage[] = [
      { $match: matchQuery },
      {
        $facet: {
          // Total counts
          totals: [
            {
              $group: {
                _id: null,
                all: { $sum: 1 },
                completed: {
                  $sum: { $cond: ['$checked', 1, 0] },
                },
                incomplete: {
                  $sum: { $cond: ['$checked', 0, 1] },
                },
                overdue: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          { $lt: ['$dueDate', today] },
                          { $eq: ['$checked', false] },
                          { $ne: ['$dueDate', null] },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
              },
            },
          ],
          // Priority breakdown
          priorities: [
            {
              $group: {
                _id: '$priority',
                count: { $sum: 1 },
              },
            },
          ],
          // Due date distribution
          dueDates: [
            {
              $group: {
                _id: null,
                today: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          { $gte: ['$dueDate', today] },
                          { $lt: ['$dueDate', tomorrow] },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
                thisWeek: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          { $gte: ['$dueDate', today] },
                          { $lt: ['$dueDate', nextWeek] },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
                thisMonth: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          { $gte: ['$dueDate', today] },
                          { $lt: ['$dueDate', nextMonth] },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
                overdue: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          { $lt: ['$dueDate', today] },
                          { $eq: ['$checked', false] },
                          { $ne: ['$dueDate', null] },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
                noDueDate: {
                  $sum: {
                    $cond: [{ $eq: ['$dueDate', null] }, 1, 0],
                  },
                },
              },
            },
          ],
          // Recurring tasks
          recurring: [
            {
              $match: { isRecurring: true },
            },
            {
              $group: {
                _id: null,
                count: { $sum: 1 },
              },
            },
          ],
          // Subtasks stats
          subtasks: [
            {
              $group: {
                _id: null,
                tasksWithSubtasks: {
                  $sum: {
                    $cond: [
                      { $gt: [{ $size: { $ifNull: ['$subtasks', []] } }, 0] },
                      1,
                      0,
                    ],
                  },
                },
                totalSubtasks: {
                  $sum: { $size: { $ifNull: ['$subtasks', []] } },
                },
              },
            },
          ],
          // Tag statistics
          tags: [
            { $unwind: { path: '$tags', preserveNullAndEmptyArrays: true } },
            {
              $group: {
                _id: '$tags',
                count: { $sum: 1 },
              },
            },
            { $match: { _id: { $ne: null } } },
            { $sort: { count: -1 } },
            { $limit: 20 }, // Top 20 tags
          ],
          // Todolist distribution (only if not filtered by todolist)
          todolists: options?.todolistId
            ? []
            : [
                {
                  $group: {
                    _id: '$todolist',
                    count: { $sum: 1 },
                  },
                },
                { $sort: { count: -1 } },
              ],
        },
      },
    ];

    const [result] = await TaskModel.aggregate(pipeline);

    // Extract and format results
    const totals = result.totals[0] || {
      all: 0,
      completed: 0,
      incomplete: 0,
      overdue: 0,
    };

    const prioritiesData = result.priorities || [];
    const priorities = {
      high: 0,
      medium: 0,
      low: 0,
    };
    prioritiesData.forEach((p: { _id: string; count: number }) => {
      if (p._id === 'high') priorities.high = p.count;
      else if (p._id === 'medium') priorities.medium = p.count;
      else if (p._id === 'low') priorities.low = p.count;
    });

    const dueDates = result.dueDates[0] || {
      today: 0,
      thisWeek: 0,
      thisMonth: 0,
      overdue: 0,
      noDueDate: 0,
    };

    const recurringCount = result.recurring[0]?.count || 0;

    const subtasksData = result.subtasks[0] || {
      tasksWithSubtasks: 0,
      totalSubtasks: 0,
    };

    const tagsData = result.tags || [];
    const tags = tagsData.map((t: { _id: string; count: number }) => ({
      tag: t._id,
      count: t.count,
    }));

    // Calculate completion rate
    const completionRate =
      totals.all > 0 ? Math.round((totals.completed / totals.all) * 100) : 0;

    // Process todolist distribution if available
    let todolists:
      | Array<{
          todolistId: string;
          todolistName: string;
          count: number;
        }>
      | undefined;

    if (
      !options?.todolistId &&
      result.todolists &&
      result.todolists.length > 0
    ) {
      // Get todolist names
      const todolistIds = result.todolists.map((t: { _id: ObjectId }) => t._id);
      const todolistDocs = await TodolistModel.find({
        _id: { $in: todolistIds },
        owner: userId,
      }).select('_id name');

      const todolistMap = new Map(
        todolistDocs.map((t) => [t._id.toString(), t.name])
      );

      todolists = result.todolists.map(
        (t: { _id: ObjectId; count: number }) => ({
          todolistId: t._id.toString(),
          todolistName: todolistMap.get(t._id.toString()) || 'Unknown',
          count: t.count,
        })
      );
    }

    // Calculate insights
    const insights: TaskStatistics['insights'] = {};

    if (tags.length > 0) {
      insights.mostUsedTag = tags[0].tag;
    }

    if (todolists && todolists.length > 0) {
      insights.mostActiveTodolist = {
        id: todolists[0].todolistId,
        name: todolists[0].todolistName,
        count: todolists[0].count,
      };

      const totalTodolists = todolists.length;
      const totalTasks = todolists.reduce((sum, t) => sum + t.count, 0);
      insights.averageTasksPerTodolist =
        totalTodolists > 0
          ? Math.round((totalTasks / totalTodolists) * 100) / 100
          : 0;
    }

    return {
      totals,
      priorities,
      dueDates,
      completionRate,
      recurring: recurringCount,
      subtasks: subtasksData,
      tags,
      todolists,
      insights,
    };
  }

  /**
   * Delete a task
   */
  async deleteTask(taskId: string, userId: string): Promise<void> {
    const taskObjectId = toObjectId(taskId);

    // Find and validate ownership
    const task = await TaskModel.findOne({
      _id: taskObjectId,
      owner: userId,
    });

    if (!task) {
      throw new AppError('Task not found', 404);
    }

    // If this is a subtask, remove it from the parent's subtasks array
    if (task.parentTask) {
      await TaskModel.findByIdAndUpdate(
        task.parentTask,
        { $pull: { subtasks: taskObjectId } },
        { new: true }
      );
    }

    // If this task has subtasks, delete them as well (cascade delete)
    if (task.subtasks && task.subtasks.length > 0) {
      await TaskModel.deleteMany({
        _id: { $in: task.subtasks },
        owner: userId,
      });
    }

    // Delete the task
    await TaskModel.deleteOne({ _id: taskObjectId, owner: userId });
  }
}

// Export a singleton instance
export const taskService = new TaskService();
