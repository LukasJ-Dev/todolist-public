// Task API Integration Tests
// Tests task endpoints with real database and HTTP requests

import { api, createTestUser } from '../../setup/api';

describe('Task API Integration', () => {
  let userCookies: string[];
  let todolistId: string;

  beforeEach(async () => {
    // Create a test user for each test
    const { cookies } = await createTestUser();
    userCookies = cookies;

    // Create a todolist for task operations
    const todolistResponse = await api
      .post('/api/v1/todolists')
      .set('Cookie', userCookies)
      .send({ name: 'Test Todolist' });

    todolistId = todolistResponse.body.data.todolist.id;
  });

  describe('GET /api/v1/tasks', () => {
    it('should return user tasks when authenticated', async () => {
      // Create a test task first
      await api.post('/api/v1/tasks').set('Cookie', userCookies).send({
        name: 'Test Task',
        todolist: todolistId,
        description: 'Test task description',
      });

      const response = await api
        .get('/api/v1/tasks')
        .set('Cookie', userCookies);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.tasks).toBeDefined();
      expect(Array.isArray(response.body.data.tasks)).toBe(true);
      expect(response.body.data.tasks.length).toBeGreaterThan(0);

      const task = response.body.data.tasks[0];
      expect(task.name).toBe('Test Task');
      expect(task.description).toBe('Test task description');
      expect(task.checked).toBe(false);
      expect(task.owner).toBeDefined();
      expect(task.todolist).toBeDefined();
      expect(task.id).toBeDefined();
    });

    it('should filter tasks by todolist when query parameter provided', async () => {
      // Create another todolist
      const anotherTodolistResponse = await api
        .post('/api/v1/todolists')
        .set('Cookie', userCookies)
        .send({ name: 'Another Todolist' });

      const anotherTodolistId = anotherTodolistResponse.body.data.todolist.id;

      // Create tasks in different todolists
      await api.post('/api/v1/tasks').set('Cookie', userCookies).send({
        name: 'Task in First Todolist',
        todolist: todolistId,
      });

      await api.post('/api/v1/tasks').set('Cookie', userCookies).send({
        name: 'Task in Second Todolist',
        todolist: anotherTodolistId,
      });

      // Get tasks for first todolist only
      const response = await api
        .get(`/api/v1/tasks?todolist=${todolistId}`)
        .set('Cookie', userCookies);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.tasks).toBeDefined();
      expect(response.body.data.tasks.length).toBe(1);
      expect(response.body.data.tasks[0].name).toBe('Task in First Todolist');
    });

    it('should return 404 for non-existent todolist filter', async () => {
      const fakeId = '507f1f77bcf86cd799439011'; // Valid ObjectId format
      const response = await api
        .get(`/api/v1/tasks?todolist=${fakeId}`)
        .set('Cookie', userCookies);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Todolist not found');
    });

    it('should return 400 for invalid todolist ID in query', async () => {
      const response = await api
        .get('/api/v1/tasks?todolist=invalid-id')
        .set('Cookie', userCookies);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Invalid ID format');
    });

    it('should return 401 when not authenticated', async () => {
      const response = await api.get('/api/v1/tasks');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('User not authenticated');
    });
  });

  describe('POST /api/v1/tasks', () => {
    it('should create task successfully', async () => {
      const taskData = {
        name: 'New Task',
        todolist: todolistId,
        description: 'Task description',
      };

      const response = await api
        .post('/api/v1/tasks')
        .set('Cookie', userCookies)
        .send(taskData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.task).toBeDefined();
      expect(response.body.data.task.name).toBe(taskData.name);
      expect(response.body.data.task.description).toBe(taskData.description);
      expect(response.body.data.task.checked).toBe(false);
      expect(response.body.data.task.owner).toBeDefined();
      expect(response.body.data.task.todolist).toBeDefined();
      expect(response.body.data.task.id).toBeDefined();
    });

    it('should create task with minimal data', async () => {
      const taskData = {
        name: 'Minimal Task',
        todolist: todolistId,
      };

      const response = await api
        .post('/api/v1/tasks')
        .set('Cookie', userCookies)
        .send(taskData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.task.name).toBe(taskData.name);
      expect(response.body.data.task.description).toBeUndefined();
      expect(response.body.data.task.checked).toBe(false);
    });

    it('should return 404 for non-existent todolist', async () => {
      const fakeId = '507f1f77bcf86cd799439011'; // Valid ObjectId format
      const response = await api
        .post('/api/v1/tasks')
        .set('Cookie', userCookies)
        .send({
          name: 'Test Task',
          todolist: fakeId,
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Todolist not found');
    });

    it('should return 400 for invalid todolist ID', async () => {
      const response = await api
        .post('/api/v1/tasks')
        .set('Cookie', userCookies)
        .send({
          name: 'Test Task',
          todolist: 'invalid-id',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Invalid ID format');
    });

    it('should validate task data', async () => {
      const response = await api
        .post('/api/v1/tasks')
        .set('Cookie', userCookies)
        .send({
          name: '', // Empty name
          todolist: todolistId,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('ValidationError');
    });

    it('should return 401 when not authenticated', async () => {
      const response = await api.post('/api/v1/tasks').send({
        name: 'Test Task',
        todolist: todolistId,
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('User not authenticated');
    });
  });

  describe('PUT /api/v1/tasks/:task', () => {
    let taskId: string;

    beforeEach(async () => {
      // Create a task for update tests
      const response = await api
        .post('/api/v1/tasks')
        .set('Cookie', userCookies)
        .send({
          name: 'Update Test Task',
          todolist: todolistId,
          description: 'Original description',
        });

      taskId = response.body.data.task.id;
    });

    it('should update task successfully', async () => {
      const updateData = {
        name: 'Updated Task Name',
        description: 'Updated description',
        checked: true,
      };

      const response = await api
        .put(`/api/v1/tasks/${taskId}`)
        .set('Cookie', userCookies)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.task).toBeDefined();
      expect(response.body.data.task.name).toBe(updateData.name);
      expect(response.body.data.task.description).toBe(updateData.description);
      expect(response.body.data.task.checked).toBe(updateData.checked);
      expect(response.body.data.task.owner).toBeDefined();
      expect(response.body.data.task.id).toBe(taskId);
    });

    it('should update task todolist', async () => {
      // Create another todolist
      const anotherTodolistResponse = await api
        .post('/api/v1/todolists')
        .set('Cookie', userCookies)
        .send({ name: 'Another Todolist' });

      const anotherTodolistId = anotherTodolistResponse.body.data.todolist.id;

      const updateData = {
        todolist: anotherTodolistId,
      };

      const response = await api
        .put(`/api/v1/tasks/${taskId}`)
        .set('Cookie', userCookies)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.task.todolist).toBeDefined();
    });

    it('should return 404 for non-existent task', async () => {
      const fakeId = '507f1f77bcf86cd799439011'; // Valid ObjectId format
      const response = await api
        .put(`/api/v1/tasks/${fakeId}`)
        .set('Cookie', userCookies)
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Task not found');
    });

    it('should return 400 for invalid task ID', async () => {
      const response = await api
        .put('/api/v1/tasks/invalid-id')
        .set('Cookie', userCookies)
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Invalid ID format');
    });

    it('should return 404 for non-existent todolist when updating todolist', async () => {
      const fakeId = '507f1f77bcf86cd799439011'; // Valid ObjectId format
      const response = await api
        .put(`/api/v1/tasks/${taskId}`)
        .set('Cookie', userCookies)
        .send({ todolist: fakeId });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Todolist not found');
    });

    it('should validate update data', async () => {
      const response = await api
        .put(`/api/v1/tasks/${taskId}`)
        .set('Cookie', userCookies)
        .send({
          name: '', // Empty name
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('ValidationError');
    });

    it('should return 401 when not authenticated', async () => {
      const response = await api
        .put(`/api/v1/tasks/${taskId}`)
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('User not authenticated');
    });
  });

  describe('DELETE /api/v1/tasks/:task', () => {
    let taskId: string;

    beforeEach(async () => {
      // Create a task for delete tests
      const response = await api
        .post('/api/v1/tasks')
        .set('Cookie', userCookies)
        .send({
          name: 'Delete Test Task',
          todolist: todolistId,
        });

      taskId = response.body.data.task.id;
    });

    it('should delete task successfully', async () => {
      const response = await api
        .delete(`/api/v1/tasks/${taskId}`)
        .set('Cookie', userCookies);

      expect(response.status).toBe(204);
      // 204 responses may or may not have a body depending on implementation

      // Verify task is deleted
      const getResponse = await api
        .get('/api/v1/tasks')
        .set('Cookie', userCookies);

      const taskIds = getResponse.body.data.tasks.map((t: any) => t.id);
      expect(taskIds).not.toContain(taskId);
    });

    it('should return 404 for non-existent task', async () => {
      const fakeId = '507f1f77bcf86cd799439011'; // Valid ObjectId format
      const response = await api
        .delete(`/api/v1/tasks/${fakeId}`)
        .set('Cookie', userCookies);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Task not found');
    });

    it('should return 400 for invalid task ID', async () => {
      const response = await api
        .delete('/api/v1/tasks/invalid-id')
        .set('Cookie', userCookies);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Invalid ID format');
    });

    it('should return 401 when not authenticated', async () => {
      const response = await api.delete(`/api/v1/tasks/${taskId}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('User not authenticated');
    });
  });

  describe('Authorization Tests', () => {
    let otherUserCookies: string[];
    let taskId: string;

    beforeEach(async () => {
      // Create task with first user
      const taskResponse = await api
        .post('/api/v1/tasks')
        .set('Cookie', userCookies)
        .send({
          name: 'Private Task',
          todolist: todolistId,
          description: 'This is a private task',
        });

      taskId = taskResponse.body.data.task.id;

      // Create second user
      const { cookies } = await createTestUser({
        name: 'Other User',
        email: 'other@example.com',
        password: 'password123',
      });
      otherUserCookies = cookies;
    });

    it('should not allow other users to update task', async () => {
      const response = await api
        .put(`/api/v1/tasks/${taskId}`)
        .set('Cookie', otherUserCookies)
        .send({ name: 'Hacked Task Name' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Task not found');
    });

    it('should not allow other users to delete task', async () => {
      const response = await api
        .delete(`/api/v1/tasks/${taskId}`)
        .set('Cookie', otherUserCookies);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Task not found');
    });

    it('should not show other users tasks', async () => {
      const response = await api
        .get('/api/v1/tasks')
        .set('Cookie', otherUserCookies);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.tasks).toBeDefined();
      expect(response.body.data.tasks.length).toBe(0);
    });

    it('should not allow other users to create tasks in other users todolists', async () => {
      const response = await api
        .post('/api/v1/tasks')
        .set('Cookie', otherUserCookies)
        .send({
          name: 'Hacked Task',
          todolist: todolistId,
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Todolist not found');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long task names', async () => {
      const longName = 'A'.repeat(100); // Max length
      const response = await api
        .post('/api/v1/tasks')
        .set('Cookie', userCookies)
        .send({
          name: longName,
          todolist: todolistId,
        });

      expect(response.status).toBe(201);
      expect(response.body.data.task.name).toBe(longName);
    });

    it('should reject task names that are too long', async () => {
      const tooLongName = 'A'.repeat(101); // Over max length
      const response = await api
        .post('/api/v1/tasks')
        .set('Cookie', userCookies)
        .send({
          name: tooLongName,
          todolist: todolistId,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('ValidationError');
    });

    it('should handle very long task descriptions', async () => {
      const longDescription = 'A'.repeat(500); // Max length
      const response = await api
        .post('/api/v1/tasks')
        .set('Cookie', userCookies)
        .send({
          name: 'Task with Long Description',
          todolist: todolistId,
          description: longDescription,
        });

      expect(response.status).toBe(201);
      expect(response.body.data.task.description).toBe(longDescription);
    });

    it('should reject task descriptions that are too long', async () => {
      const tooLongDescription = 'A'.repeat(1001); // Over max length (1000)
      const response = await api
        .post('/api/v1/tasks')
        .set('Cookie', userCookies)
        .send({
          name: 'Task with Too Long Description',
          todolist: todolistId,
          description: tooLongDescription,
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Internal Server Error');
    });

    it('should handle special characters in task names', async () => {
      const specialName = 'Task with Special Chars: !@#$%^&*()';
      const response = await api
        .post('/api/v1/tasks')
        .set('Cookie', userCookies)
        .send({
          name: specialName,
          todolist: todolistId,
        });

      expect(response.status).toBe(201);
      expect(response.body.data.task.name).toBe(specialName);
    });

    it('should handle unicode characters in task names', async () => {
      const unicodeName = 'Task with Unicode: 🚀📝✅';
      const response = await api
        .post('/api/v1/tasks')
        .set('Cookie', userCookies)
        .send({
          name: unicodeName,
          todolist: todolistId,
        });

      expect(response.status).toBe(201);
      expect(response.body.data.task.name).toBe(unicodeName);
    });

    it('should handle boolean checked field correctly', async () => {
      // Create task (checked field is ignored during creation)
      const response = await api
        .post('/api/v1/tasks')
        .set('Cookie', userCookies)
        .send({
          name: 'Checked Task',
          todolist: todolistId,
        });

      expect(response.status).toBe(201);
      expect(response.body.data.task.checked).toBe(false); // Default value
    });

    it('should handle task filtering by todolist with multiple tasks', async () => {
      // Create another todolist
      const anotherTodolistResponse = await api
        .post('/api/v1/todolists')
        .set('Cookie', userCookies)
        .send({ name: 'Another Todolist' });

      const anotherTodolistId = anotherTodolistResponse.body.data.todolist.id;

      // Create multiple tasks in different todolists
      await api.post('/api/v1/tasks').set('Cookie', userCookies).send({
        name: 'Task 1 in First Todolist',
        todolist: todolistId,
      });

      await api.post('/api/v1/tasks').set('Cookie', userCookies).send({
        name: 'Task 2 in First Todolist',
        todolist: todolistId,
      });

      await api.post('/api/v1/tasks').set('Cookie', userCookies).send({
        name: 'Task in Second Todolist',
        todolist: anotherTodolistId,
      });

      // Get tasks for first todolist only
      const response = await api
        .get(`/api/v1/tasks?todolist=${todolistId}`)
        .set('Cookie', userCookies);

      expect(response.status).toBe(200);
      expect(response.body.data.tasks.length).toBe(2);
      expect(
        response.body.data.tasks.every(
          (task: any) => task.todolist.id === todolistId
        )
      ).toBe(true);
    });
  });
});
