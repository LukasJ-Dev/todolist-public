// Task Model Integration Tests
// Tests task model behavior with real database operations

import { TaskModel } from '../../../src/models/taskModel';
import { TodolistModel } from '../../../src/models/todolistModel';
import { userModel } from '../../../src/models/userModel';

describe('Task Model Integration', () => {
  let testUser: any;
  let testTodolist: any;

  beforeEach(async () => {
    // Create a test user for each test
    testUser = await userModel.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    });

    // Create a test todolist for each test
    testTodolist = await TodolistModel.create({
      name: 'Test Todolist',
      owner: testUser._id,
    });
  });

  describe('Task Creation', () => {
    it('should create a task with valid data', async () => {
      const taskData = {
        name: 'Test Task',
        todolist: testTodolist._id,
        owner: testUser._id,
        checked: false,
        description: 'This is a test task description',
      };

      const task = await TaskModel.create(taskData);

      expect(task._id).toBeDefined();
      expect(task.name).toBe(taskData.name);
      expect(task.todolist.toString()).toBe(testTodolist._id.toString());
      expect(task.owner.toString()).toBe(testUser._id.toString());
      expect(task.checked).toBe(false);
      expect(task.description).toBe(taskData.description);
      expect(task.createdAt).toBeDefined();
      expect(task.updatedAt).toBeDefined();
    });

    it('should create a task with minimal required data', async () => {
      const taskData = {
        name: 'Minimal Task',
        todolist: testTodolist._id,
        owner: testUser._id,
      };

      const task = await TaskModel.create(taskData);

      expect(task._id).toBeDefined();
      expect(task.name).toBe(taskData.name);
      expect(task.todolist.toString()).toBe(testTodolist._id.toString());
      expect(task.owner.toString()).toBe(testUser._id.toString());
      expect(task.checked).toBe(false); // Should have default value
      expect(task.description).toBeUndefined();
      expect(task.createdAt).toBeDefined();
      expect(task.updatedAt).toBeDefined();
    });

    it('should trim task name whitespace', async () => {
      const taskData = {
        name: '  Trimmed Task  ',
        todolist: testTodolist._id,
        owner: testUser._id,
      };

      const task = await TaskModel.create(taskData);

      expect(task.name).toBe('Trimmed Task');
    });

    it('should trim task description whitespace', async () => {
      const taskData = {
        name: 'Task with Description',
        todolist: testTodolist._id,
        owner: testUser._id,
        description: '  Trimmed description  ',
      };

      const task = await TaskModel.create(taskData);

      expect(task.description).toBe('Trimmed description');
    });
  });

  describe('Validation', () => {
    it('should validate task name is required', async () => {
      const taskData = {
        todolist: testTodolist._id,
        owner: testUser._id,
      };

      const task = new TaskModel(taskData);
      await expect(task.save()).rejects.toThrow('Task name is required');
    });

    it('should validate task name minimum length', async () => {
      const taskData = {
        name: '', // Empty string
        todolist: testTodolist._id,
        owner: testUser._id,
      };

      const task = new TaskModel(taskData);
      await expect(task.save()).rejects.toThrow('Task name is required');
    });

    it('should validate task name maximum length', async () => {
      const taskData = {
        name: 'a'.repeat(201), // Too long
        todolist: testTodolist._id,
        owner: testUser._id,
      };

      const task = new TaskModel(taskData);
      await expect(task.save()).rejects.toThrow(
        'Task name cannot exceed 200 characters'
      );
    });

    it('should validate todolist reference is required', async () => {
      const taskData = {
        name: 'Test Task',
        owner: testUser._id,
      };

      const task = new TaskModel(taskData);
      await expect(task.save()).rejects.toThrow(
        'Todolist reference is required'
      );
    });

    it('should validate owner is required', async () => {
      const taskData = {
        name: 'Test Task',
        todolist: testTodolist._id,
      };

      const task = new TaskModel(taskData);
      await expect(task.save()).rejects.toThrow('Owner is required');
    });

    it('should validate description maximum length', async () => {
      const taskData = {
        name: 'Test Task',
        todolist: testTodolist._id,
        owner: testUser._id,
        description: 'a'.repeat(1001), // Too long
      };

      const task = new TaskModel(taskData);
      await expect(task.save()).rejects.toThrow(
        'Task description cannot exceed 1000 characters'
      );
    });

    it('should validate checked field is boolean', async () => {
      const taskData = {
        name: 'Test Task',
        todolist: testTodolist._id,
        owner: testUser._id,
        checked: 'not-a-boolean' as any,
      };

      const task = new TaskModel(taskData);
      await expect(task.save()).rejects.toThrow();
    });
  });

  describe('Database Operations', () => {
    it('should find tasks by owner', async () => {
      const task1 = await TaskModel.create({
        name: 'Task 1',
        todolist: testTodolist._id,
        owner: testUser._id,
      });

      const task2 = await TaskModel.create({
        name: 'Task 2',
        todolist: testTodolist._id,
        owner: testUser._id,
      });

      const tasks = await TaskModel.find({ owner: testUser._id });
      expect(tasks).toHaveLength(2);
      expect(tasks.map((t) => t._id.toString())).toContain(
        task1._id.toString()
      );
      expect(tasks.map((t) => t._id.toString())).toContain(
        task2._id.toString()
      );
    });

    it('should find tasks by todolist', async () => {
      const task1 = await TaskModel.create({
        name: 'Task 1',
        todolist: testTodolist._id,
        owner: testUser._id,
      });

      const task2 = await TaskModel.create({
        name: 'Task 2',
        todolist: testTodolist._id,
        owner: testUser._id,
      });

      const tasks = await TaskModel.find({ todolist: testTodolist._id });
      expect(tasks).toHaveLength(2);
      expect(tasks.map((t) => t._id.toString())).toContain(
        task1._id.toString()
      );
      expect(tasks.map((t) => t._id.toString())).toContain(
        task2._id.toString()
      );
    });

    it('should find tasks by owner and todolist', async () => {
      const task1 = await TaskModel.create({
        name: 'Task 1',
        todolist: testTodolist._id,
        owner: testUser._id,
      });

      const task2 = await TaskModel.create({
        name: 'Task 2',
        todolist: testTodolist._id,
        owner: testUser._id,
      });

      const tasks = await TaskModel.find({
        owner: testUser._id,
        todolist: testTodolist._id,
      });
      expect(tasks).toHaveLength(2);
      expect(tasks.map((t) => t._id.toString())).toContain(
        task1._id.toString()
      );
      expect(tasks.map((t) => t._id.toString())).toContain(
        task2._id.toString()
      );
    });

    it('should find tasks by checked status', async () => {
      const checkedTask = await TaskModel.create({
        name: 'Checked Task',
        todolist: testTodolist._id,
        owner: testUser._id,
        checked: true,
      });

      const uncheckedTask = await TaskModel.create({
        name: 'Unchecked Task',
        todolist: testTodolist._id,
        owner: testUser._id,
        checked: false,
      });

      const checkedTasks = await TaskModel.find({ checked: true });
      expect(checkedTasks).toHaveLength(1);
      expect(checkedTasks[0]._id.toString()).toBe(checkedTask._id.toString());

      const uncheckedTasks = await TaskModel.find({ checked: false });
      expect(uncheckedTasks).toHaveLength(1);
      expect(uncheckedTasks[0]._id.toString()).toBe(
        uncheckedTask._id.toString()
      );
    });

    it('should update task fields', async () => {
      const task = await TaskModel.create({
        name: 'Original Task',
        todolist: testTodolist._id,
        owner: testUser._id,
        checked: false,
        description: 'Original description',
      });

      const originalUpdatedAt = task.updatedAt;

      // Wait a bit to ensure updatedAt changes
      await new Promise((resolve) => setTimeout(resolve, 10));

      task.name = 'Updated Task';
      task.checked = true;
      task.description = 'Updated description';
      await task.save();

      const updatedTask = await TaskModel.findById(task._id);
      expect(updatedTask?.name).toBe('Updated Task');
      expect(updatedTask?.checked).toBe(true);
      expect(updatedTask?.description).toBe('Updated description');
      expect(updatedTask?.updatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime()
      );
    });

    it('should delete tasks', async () => {
      const task = await TaskModel.create({
        name: 'Task to Delete',
        todolist: testTodolist._id,
        owner: testUser._id,
      });

      await TaskModel.findByIdAndDelete(task._id);

      const deletedTask = await TaskModel.findById(task._id);
      expect(deletedTask).toBeNull();
    });
  });

  describe('Task Relationships', () => {
    it('should populate todolist reference', async () => {
      const task = await TaskModel.create({
        name: 'Task with Todolist',
        todolist: testTodolist._id,
        owner: testUser._id,
      });

      const populatedTask = await TaskModel.findById(task._id).populate(
        'todolist'
      );

      expect(populatedTask?.todolist).toBeTruthy();
      expect((populatedTask?.todolist as any).name).toBe(testTodolist.name);
    });

    it('should populate owner reference', async () => {
      const task = await TaskModel.create({
        name: 'Task with Owner',
        todolist: testTodolist._id,
        owner: testUser._id,
      });

      const populatedTask = await TaskModel.findById(task._id).populate(
        'owner'
      );

      expect(populatedTask?.owner).toBeTruthy();
      expect((populatedTask?.owner as any).email).toBe(testUser.email);
    });

    it('should populate both references', async () => {
      const task = await TaskModel.create({
        name: 'Task with Both References',
        todolist: testTodolist._id,
        owner: testUser._id,
      });

      const populatedTask = await TaskModel.findById(task._id)
        .populate('todolist')
        .populate('owner');

      expect(populatedTask?.todolist).toBeTruthy();
      expect(populatedTask?.owner).toBeTruthy();
      expect((populatedTask?.todolist as any).name).toBe(testTodolist.name);
      expect((populatedTask?.owner as any).email).toBe(testUser.email);
    });
  });

  describe('JSON Transformation', () => {
    it('should transform to JSON with id field', async () => {
      const task = await TaskModel.create({
        name: 'JSON Test Task',
        todolist: testTodolist._id,
        owner: testUser._id,
      });

      const json = task.toJSON();

      expect(json.id).toBeDefined();
      expect(json._id).toBeUndefined();
      expect(json.__v).toBeUndefined();
      expect(json.name).toBe('JSON Test Task');
    });

    it('should transform to object with id field', async () => {
      const task = await TaskModel.create({
        name: 'Object Test Task',
        todolist: testTodolist._id,
        owner: testUser._id,
      });

      const obj = task.toObject();

      expect(obj.id).toBeDefined();
      expect(obj._id).toBeDefined(); // _id is still present in toObject
      expect(obj.__v).toBeDefined(); // __v is still present in toObject
      expect(obj.name).toBe('Object Test Task');
    });
  });

  describe('Timestamps', () => {
    it('should automatically set createdAt and updatedAt', async () => {
      const beforeCreate = new Date();

      const task = await TaskModel.create({
        name: 'Timestamp Test Task',
        todolist: testTodolist._id,
        owner: testUser._id,
      });

      const afterCreate = new Date();

      expect(task.createdAt.getTime()).toBeGreaterThanOrEqual(
        beforeCreate.getTime()
      );
      expect(task.createdAt.getTime()).toBeLessThanOrEqual(
        afterCreate.getTime()
      );
      expect(task.updatedAt.getTime()).toBeGreaterThanOrEqual(
        beforeCreate.getTime()
      );
      expect(task.updatedAt.getTime()).toBeLessThanOrEqual(
        afterCreate.getTime()
      );
    });

    it('should update updatedAt when task is modified', async () => {
      const task = await TaskModel.create({
        name: 'Original Name',
        todolist: testTodolist._id,
        owner: testUser._id,
      });

      const originalUpdatedAt = task.updatedAt;

      // Wait a bit to ensure updatedAt changes
      await new Promise((resolve) => setTimeout(resolve, 10));

      task.name = 'Updated Name';
      await task.save();

      expect(task.updatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime()
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle task with maximum length name', async () => {
      const maxName = 'a'.repeat(200);

      const task = await TaskModel.create({
        name: maxName,
        todolist: testTodolist._id,
        owner: testUser._id,
      });

      expect(task.name).toBe(maxName);
    });

    it('should handle task with maximum length description', async () => {
      const maxDescription = 'a'.repeat(1000);

      const task = await TaskModel.create({
        name: 'Task with Max Description',
        todolist: testTodolist._id,
        owner: testUser._id,
        description: maxDescription,
      });

      expect(task.description).toBe(maxDescription);
    });

    it('should handle task with special characters in name', async () => {
      const specialName = 'Task with Special Chars: !@#$%^&*()_+-=[]{}|;:,.<>?';

      const task = await TaskModel.create({
        name: specialName,
        todolist: testTodolist._id,
        owner: testUser._id,
      });

      expect(task.name).toBe(specialName);
    });

    it('should handle task with unicode characters', async () => {
      const unicodeName = 'Task with Unicode: 你好世界 🌍';

      const task = await TaskModel.create({
        name: unicodeName,
        todolist: testTodolist._id,
        owner: testUser._id,
      });

      expect(task.name).toBe(unicodeName);
    });
  });
});
