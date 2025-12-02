import { TodolistModel, ITodolist } from '../../models/todolistModel';
import { TaskModel } from '../../models/taskModel';
import { AppError } from '../../utils/appError';
import {
  toObjectId,
  validateOwnership,
  withTransaction,
} from '../../utils/database';

export interface CreateTodolistInput {
  name: string;
  userId: string;
}

export interface CreateTodolistOutput {
  todolist: ITodolist;
}

export interface UpdateTodolistInput {
  name?: string;
}

/**
 * Todolist service for business logic related to todolists
 * Can be used by controllers, AI tools, and other services
 */
export class TodolistService {
  /**
   * Get user's todolists
   * Creates a default todolist if user has none
   */
  async getTodolists(userId: string): Promise<ITodolist[]> {
    let todolists = await TodolistModel.find({ owner: userId }).sort({
      createdAt: -1,
    });

    // Create default todolist if user has none
    if (todolists.length === 0) {
      const defaultTodolist = await TodolistModel.create({
        name: 'My First Todolist',
        owner: userId,
      });
      todolists = [defaultTodolist];
    }

    return todolists;
  }

  /**
   * Create a new todolist
   */
  async createTodolist(
    input: CreateTodolistInput
  ): Promise<CreateTodolistOutput> {
    const { name, userId } = input;

    // Check if todolist with same name already exists for this user
    const existingTodolist = await TodolistModel.findOne({
      name,
      owner: userId,
    });

    if (existingTodolist) {
      throw new AppError('A todolist with this name already exists', 409);
    }

    const newTodolist = await TodolistModel.create({
      name,
      owner: userId,
    });

    return { todolist: newTodolist };
  }

  /**
   * Update a todolist
   */
  async updateTodolist(
    todolistId: string,
    userId: string,
    updates: UpdateTodolistInput
  ): Promise<ITodolist> {
    const todolistObjectId = toObjectId(todolistId);

    // Find and validate ownership
    const todolist = await TodolistModel.findOne({
      _id: todolistObjectId,
      owner: userId,
    });

    validateOwnership(
      todolist as unknown as { owner?: string },
      userId,
      'Todolist'
    );

    // Check if new name conflicts with existing todolist
    if (updates.name && updates.name !== todolist?.name) {
      const existingTodolist = await TodolistModel.findOne({
        name: updates.name,
        owner: userId,
        _id: { $ne: todolistObjectId },
      });

      if (existingTodolist) {
        throw new AppError('A todolist with this name already exists', 409);
      }
    }

    const editedTodolist = await TodolistModel.findOneAndUpdate(
      { _id: todolistObjectId, owner: userId },
      updates,
      { new: true, runValidators: true }
    );

    if (!editedTodolist) {
      throw new AppError('Todolist not found', 404);
    }

    return editedTodolist;
  }

  /**
   * Delete a todolist and all its tasks
   */
  async deleteTodolist(todolistId: string, userId: string): Promise<void> {
    const todolistObjectId = toObjectId(todolistId);

    // Find and validate ownership
    const todolist = await TodolistModel.findOne({
      _id: todolistObjectId,
      owner: userId,
    });

    validateOwnership(
      todolist as unknown as { owner?: string },
      userId,
      'Todolist'
    );

    // Use transaction to ensure atomicity
    await withTransaction(async (session) => {
      // Delete all tasks in the todolist
      await TaskModel.deleteMany(
        { todolist: todolistObjectId },
        session ? { session } : {}
      );

      // Delete the todolist
      await TodolistModel.deleteOne(
        { _id: todolistObjectId, owner: userId },
        session ? { session } : {}
      );
    });
  }
}

// Export singleton instance
export const todolistService = new TodolistService();
