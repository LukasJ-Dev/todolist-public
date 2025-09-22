// Todolist Model Integration Tests
// Tests todolist model behavior with real database operations

import { TodolistModel } from '../../../src/models/todolistModel';
import { TaskModel } from '../../../src/models/taskModel';
import { userModel } from '../../../src/models/userModel';

describe('Todolist Model Integration', () => {
  let testUser: any;

  beforeEach(async () => {
    // Create a test user for each test
    testUser = await userModel.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    });
  });

  describe('Todolist Creation', () => {
    it('should create a todolist with valid data', async () => {
      const todolistData = {
        name: 'Test Todolist',
        owner: testUser._id,
      };

      const todolist = await TodolistModel.create(todolistData);

      expect(todolist._id).toBeDefined();
      expect(todolist.name).toBe(todolistData.name);
      expect(todolist.owner.toString()).toBe(testUser._id.toString());
      expect(todolist.createdAt).toBeDefined();
      expect(todolist.updatedAt).toBeDefined();
    });

    it('should trim todolist name whitespace', async () => {
      const todolistData = {
        name: '  Trimmed Todolist  ',
        owner: testUser._id,
      };

      const todolist = await TodolistModel.create(todolistData);

      expect(todolist.name).toBe('Trimmed Todolist');
    });
  });

  describe('Validation', () => {
    it('should validate todolist name is required', async () => {
      const todolistData = {
        owner: testUser._id,
      };

      const todolist = new TodolistModel(todolistData);
      await expect(todolist.save()).rejects.toThrow(
        'Todolist name is required'
      );
    });

    it('should validate todolist name minimum length', async () => {
      const todolistData = {
        name: '', // Empty string
        owner: testUser._id,
      };

      const todolist = new TodolistModel(todolistData);
      await expect(todolist.save()).rejects.toThrow(
        'Todolist name is required'
      );
    });

    it('should validate todolist name maximum length', async () => {
      const todolistData = {
        name: 'a'.repeat(101), // Too long
        owner: testUser._id,
      };

      const todolist = new TodolistModel(todolistData);
      await expect(todolist.save()).rejects.toThrow(
        'Todolist name cannot exceed 100 characters'
      );
    });

    it('should validate owner is required', async () => {
      const todolistData = {
        name: 'Test Todolist',
      };

      const todolist = new TodolistModel(todolistData);
      await expect(todolist.save()).rejects.toThrow('Owner is required');
    });
  });

  describe('Database Operations', () => {
    it('should find todolists by owner', async () => {
      const todolist1 = await TodolistModel.create({
        name: 'Todolist 1',
        owner: testUser._id,
      });

      const todolist2 = await TodolistModel.create({
        name: 'Todolist 2',
        owner: testUser._id,
      });

      const todolists = await TodolistModel.find({ owner: testUser._id });
      expect(todolists).toHaveLength(2);
      expect(todolists.map((t) => t._id.toString())).toContain(
        todolist1._id.toString()
      );
      expect(todolists.map((t) => t._id.toString())).toContain(
        todolist2._id.toString()
      );
    });

    it('should find todolist by ID', async () => {
      const todolist = await TodolistModel.create({
        name: 'Find Me Todolist',
        owner: testUser._id,
      });

      const foundTodolist = await TodolistModel.findById(todolist._id);
      expect(foundTodolist).toBeTruthy();
      expect(foundTodolist?._id.toString()).toBe(todolist._id.toString());
      expect(foundTodolist?.name).toBe('Find Me Todolist');
    });

    it('should update todolist fields', async () => {
      const todolist = await TodolistModel.create({
        name: 'Original Todolist',
        owner: testUser._id,
      });

      const originalUpdatedAt = todolist.updatedAt;

      // Wait a bit to ensure updatedAt changes
      await new Promise((resolve) => setTimeout(resolve, 10));

      todolist.name = 'Updated Todolist';
      await todolist.save();

      const updatedTodolist = await TodolistModel.findById(todolist._id);
      expect(updatedTodolist?.name).toBe('Updated Todolist');
      expect(updatedTodolist?.updatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime()
      );
    });

    it('should delete todolist', async () => {
      const todolist = await TodolistModel.create({
        name: 'Todolist to Delete',
        owner: testUser._id,
      });

      await TodolistModel.findByIdAndDelete(todolist._id);

      const deletedTodolist = await TodolistModel.findById(todolist._id);
      expect(deletedTodolist).toBeNull();
    });
  });

  describe('Todolist Relationships', () => {
    it('should populate owner reference', async () => {
      const todolist = await TodolistModel.create({
        name: 'Todolist with Owner',
        owner: testUser._id,
      });

      const populatedTodolist = await TodolistModel.findById(
        todolist._id
      ).populate('owner');

      expect(populatedTodolist?.owner).toBeTruthy();
      expect((populatedTodolist?.owner as any).email).toBe(testUser.email);
    });
  });

  describe('JSON Transformation', () => {
    it('should transform to JSON with id field', async () => {
      const todolist = await TodolistModel.create({
        name: 'JSON Test Todolist',
        owner: testUser._id,
      });

      const json = todolist.toJSON();

      expect(json.id).toBeDefined();
      expect(json._id).toBeUndefined();
      expect(json.__v).toBeUndefined();
      expect(json.name).toBe('JSON Test Todolist');
    });

    it('should transform to object with id field', async () => {
      const todolist = await TodolistModel.create({
        name: 'Object Test Todolist',
        owner: testUser._id,
      });

      const obj = todolist.toObject();

      expect(obj.id).toBeDefined();
      expect(obj._id).toBeDefined(); // _id is still present in toObject
      expect(obj.__v).toBeDefined(); // __v is still present in toObject
      expect(obj.name).toBe('Object Test Todolist');
    });
  });

  describe('Timestamps', () => {
    it('should automatically set createdAt and updatedAt', async () => {
      const beforeCreate = new Date();

      const todolist = await TodolistModel.create({
        name: 'Timestamp Test Todolist',
        owner: testUser._id,
      });

      const afterCreate = new Date();

      expect(todolist.createdAt.getTime()).toBeGreaterThanOrEqual(
        beforeCreate.getTime()
      );
      expect(todolist.createdAt.getTime()).toBeLessThanOrEqual(
        afterCreate.getTime()
      );
      expect(todolist.updatedAt.getTime()).toBeGreaterThanOrEqual(
        beforeCreate.getTime()
      );
      expect(todolist.updatedAt.getTime()).toBeLessThanOrEqual(
        afterCreate.getTime()
      );
    });

    it('should update updatedAt when todolist is modified', async () => {
      const todolist = await TodolistModel.create({
        name: 'Original Name',
        owner: testUser._id,
      });

      const originalUpdatedAt = todolist.updatedAt;

      // Wait a bit to ensure updatedAt changes
      await new Promise((resolve) => setTimeout(resolve, 10));

      todolist.name = 'Updated Name';
      await todolist.save();

      expect(todolist.updatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime()
      );
    });
  });

  describe('Cascade Delete', () => {
    it('should delete all tasks when todolist is deleted', async () => {
      const todolist = await TodolistModel.create({
        name: 'Todolist with Tasks',
        owner: testUser._id,
      });

      // Create tasks in the todolist
      const task1 = await TaskModel.create({
        name: 'Task 1',
        todolist: todolist._id,
        owner: testUser._id,
      });

      const task2 = await TaskModel.create({
        name: 'Task 2',
        todolist: todolist._id,
        owner: testUser._id,
      });

      // Verify tasks exist
      const tasksBeforeDelete = await TaskModel.find({
        todolist: todolist._id,
      });
      expect(tasksBeforeDelete).toHaveLength(2);

      // Delete the todolist (using deleteOne to trigger the pre-remove middleware)
      await todolist.deleteOne();

      // Verify todolist is deleted
      const deletedTodolist = await TodolistModel.findById(todolist._id);
      expect(deletedTodolist).toBeNull();

      // Verify all tasks are deleted
      const tasksAfterDelete = await TaskModel.find({ todolist: todolist._id });
      expect(tasksAfterDelete).toHaveLength(0);

      // Verify specific tasks are deleted
      const deletedTask1 = await TaskModel.findById(task1._id);
      const deletedTask2 = await TaskModel.findById(task2._id);
      expect(deletedTask1).toBeNull();
      expect(deletedTask2).toBeNull();
    });

    it('should handle cascade delete with multiple todolists', async () => {
      const todolist1 = await TodolistModel.create({
        name: 'Todolist 1',
        owner: testUser._id,
      });

      const todolist2 = await TodolistModel.create({
        name: 'Todolist 2',
        owner: testUser._id,
      });

      // Create tasks in both todolists
      const task1 = await TaskModel.create({
        name: 'Task in Todolist 1',
        todolist: todolist1._id,
        owner: testUser._id,
      });

      const task2 = await TaskModel.create({
        name: 'Task in Todolist 2',
        todolist: todolist2._id,
        owner: testUser._id,
      });

      // Delete only todolist1 (using deleteOne to trigger the pre-remove middleware)
      await todolist1.deleteOne();

      // Verify todolist1 and its task are deleted
      const deletedTodolist1 = await TodolistModel.findById(todolist1._id);
      const deletedTask1 = await TaskModel.findById(task1._id);
      expect(deletedTodolist1).toBeNull();
      expect(deletedTask1).toBeNull();

      // Verify todolist2 and its task still exist
      const existingTodolist2 = await TodolistModel.findById(todolist2._id);
      const existingTask2 = await TaskModel.findById(task2._id);
      expect(existingTodolist2).toBeTruthy();
      expect(existingTask2).toBeTruthy();
    });

    it('should handle cascade delete with no tasks', async () => {
      const todolist = await TodolistModel.create({
        name: 'Empty Todolist',
        owner: testUser._id,
      });

      // Delete the todolist (should not throw error even with no tasks)
      await expect(
        TodolistModel.findByIdAndDelete(todolist._id)
      ).resolves.toBeTruthy();

      // Verify todolist is deleted
      const deletedTodolist = await TodolistModel.findById(todolist._id);
      expect(deletedTodolist).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle todolist with maximum length name', async () => {
      const maxName = 'a'.repeat(100);

      const todolist = await TodolistModel.create({
        name: maxName,
        owner: testUser._id,
      });

      expect(todolist.name).toBe(maxName);
    });

    it('should handle todolist with special characters in name', async () => {
      const specialName =
        'Todolist with Special Chars: !@#$%^&*()_+-=[]{}|;:,.<>?';

      const todolist = await TodolistModel.create({
        name: specialName,
        owner: testUser._id,
      });

      expect(todolist.name).toBe(specialName);
    });

    it('should handle todolist with unicode characters', async () => {
      const unicodeName = 'Todolist with Unicode: 你好世界 🌍';

      const todolist = await TodolistModel.create({
        name: unicodeName,
        owner: testUser._id,
      });

      expect(todolist.name).toBe(unicodeName);
    });

    it('should handle multiple todolists with same name for different owners', async () => {
      const anotherUser = await userModel.create({
        name: 'Another User',
        email: 'another@example.com',
        password: 'password123',
      });

      const todolist1 = await TodolistModel.create({
        name: 'Same Name Todolist',
        owner: testUser._id,
      });

      const todolist2 = await TodolistModel.create({
        name: 'Same Name Todolist',
        owner: anotherUser._id,
      });

      expect(todolist1._id.toString()).not.toBe(todolist2._id.toString());
      expect(todolist1.name).toBe(todolist2.name);
      expect(todolist1.owner.toString()).not.toBe(todolist2.owner.toString());
    });
  });

  describe('Performance and Indexing', () => {
    it('should efficiently find todolists by owner and creation date', async () => {
      // Create multiple todolists for the same user
      const todolists = [];
      for (let i = 0; i < 5; i++) {
        const todolist = await TodolistModel.create({
          name: `Todolist ${i}`,
          owner: testUser._id,
        });
        todolists.push(todolist);

        // Small delay to ensure different creation times
        await new Promise((resolve) => setTimeout(resolve, 1));
      }

      // Find todolists by owner, sorted by creation date (descending)
      const foundTodolists = await TodolistModel.find({
        owner: testUser._id,
      }).sort({ createdAt: -1 });

      expect(foundTodolists).toHaveLength(5);

      // Verify they are sorted by creation date (newest first)
      for (let i = 0; i < foundTodolists.length - 1; i++) {
        expect(foundTodolists[i].createdAt.getTime()).toBeGreaterThanOrEqual(
          foundTodolists[i + 1].createdAt.getTime()
        );
      }
    });
  });
});
