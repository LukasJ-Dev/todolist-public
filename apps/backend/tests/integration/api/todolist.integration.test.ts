// Todolist API Integration Tests
// Tests todolist endpoints with real database and HTTP requests

import { api, createTestUser } from '../../setup/api';

describe('Todolist API Integration', () => {
  let userCookies: string[];
  let userId: string;

  beforeEach(async () => {
    // Create a test user for each test
    const { cookies, user } = await createTestUser();
    userCookies = cookies;
    userId = user._id;
  });

  describe('GET /api/v1/todolists', () => {
    it('should return user todolists when authenticated', async () => {
      const response = await api
        .get('/api/v1/todolists')
        .set('Cookie', userCookies);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.todolists).toBeDefined();
      expect(Array.isArray(response.body.data.todolists)).toBe(true);
      expect(response.body.data.todolists.length).toBeGreaterThan(0);

      // Should have default todolist
      const defaultTodolist = response.body.data.todolists[0];
      expect(defaultTodolist.name).toBe('My First Todolist');
      expect(defaultTodolist.owner).toBe(userId);
      expect(defaultTodolist.id).toBeDefined();
    });

    it('should return 401 when not authenticated', async () => {
      const response = await api.get('/api/v1/todolists');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('User not authenticated');
    });
  });

  describe('POST /api/v1/todolists', () => {
    it('should create todolist successfully', async () => {
      const todolistData = {
        name: 'Test Todolist',
      };

      const response = await api
        .post('/api/v1/todolists')
        .set('Cookie', userCookies)
        .send(todolistData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.todolist).toBeDefined();
      expect(response.body.data.todolist.name).toBe(todolistData.name);
      expect(response.body.data.todolist.owner).toBe(userId);
      expect(response.body.data.todolist.id).toBeDefined();
    });

    it('should return 409 for duplicate todolist name', async () => {
      const todolistData = {
        name: 'Duplicate Todolist',
      };

      // Create first todolist
      await api
        .post('/api/v1/todolists')
        .set('Cookie', userCookies)
        .send(todolistData);

      // Try to create second todolist with same name
      const response = await api
        .post('/api/v1/todolists')
        .set('Cookie', userCookies)
        .send(todolistData);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe(
        'A todolist with this name already exists'
      );
    });

    it('should validate todolist data', async () => {
      const response = await api
        .post('/api/v1/todolists')
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
        .post('/api/v1/todolists')
        .send({ name: 'Test Todolist' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('User not authenticated');
    });
  });

  describe('PUT /api/v1/todolists/:todolist', () => {
    let todolistId: string;

    beforeEach(async () => {
      // Create a todolist for update tests
      const response = await api
        .post('/api/v1/todolists')
        .set('Cookie', userCookies)
        .send({ name: 'Update Test Todolist' });

      todolistId = response.body.data.todolist.id;
    });

    it('should update todolist successfully', async () => {
      const updateData = {
        name: 'Updated Todolist Name',
      };

      const response = await api
        .put(`/api/v1/todolists/${todolistId}`)
        .set('Cookie', userCookies)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.todolist).toBeDefined();
      expect(response.body.data.todolist.name).toBe(updateData.name);
      expect(response.body.data.todolist.owner).toBe(userId);
      expect(response.body.data.todolist.id).toBe(todolistId);
    });

    it('should return 409 for duplicate name on update', async () => {
      // Create another todolist with different name
      await api
        .post('/api/v1/todolists')
        .set('Cookie', userCookies)
        .send({ name: 'Another Todolist' });

      // Try to update first todolist to have same name as second
      const response = await api
        .put(`/api/v1/todolists/${todolistId}`)
        .set('Cookie', userCookies)
        .send({ name: 'Another Todolist' });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe(
        'A todolist with this name already exists'
      );
    });

    it('should return 404 for non-existent todolist', async () => {
      const fakeId = '507f1f77bcf86cd799439011'; // Valid ObjectId format
      const response = await api
        .put(`/api/v1/todolists/${fakeId}`)
        .set('Cookie', userCookies)
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Todolist not found');
    });

    it('should return 400 for invalid todolist ID', async () => {
      const response = await api
        .put('/api/v1/todolists/invalid-id')
        .set('Cookie', userCookies)
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Invalid ID format');
    });

    it('should validate update data', async () => {
      const response = await api
        .put(`/api/v1/todolists/${todolistId}`)
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
        .put(`/api/v1/todolists/${todolistId}`)
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('User not authenticated');
    });
  });

  describe('DELETE /api/v1/todolists/:todolist', () => {
    let todolistId: string;

    beforeEach(async () => {
      // Create a todolist for delete tests
      const response = await api
        .post('/api/v1/todolists')
        .set('Cookie', userCookies)
        .send({ name: 'Delete Test Todolist' });

      todolistId = response.body.data.todolist.id;
    });

    it('should delete todolist successfully', async () => {
      const response = await api
        .delete(`/api/v1/todolists/${todolistId}`)
        .set('Cookie', userCookies);

      expect(response.status).toBe(204);
      // 204 responses may or may not have a body depending on implementation

      // Verify todolist is deleted
      const getResponse = await api
        .get('/api/v1/todolists')
        .set('Cookie', userCookies);

      const todolistIds = getResponse.body.data.todolists.map(
        (t: any) => t._id
      );
      expect(todolistIds).not.toContain(todolistId);
    });

    it('should return 404 for non-existent todolist', async () => {
      const fakeId = '507f1f77bcf86cd799439011'; // Valid ObjectId format
      const response = await api
        .delete(`/api/v1/todolists/${fakeId}`)
        .set('Cookie', userCookies);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Todolist not found');
    });

    it('should return 400 for invalid todolist ID', async () => {
      const response = await api
        .delete('/api/v1/todolists/invalid-id')
        .set('Cookie', userCookies);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Invalid ID format');
    });

    it('should return 401 when not authenticated', async () => {
      const response = await api.delete(`/api/v1/todolists/${todolistId}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('User not authenticated');
    });
  });

  describe('Authorization Tests', () => {
    let otherUserCookies: string[];
    let todolistId: string;

    beforeEach(async () => {
      // Create todolist with first user
      const response = await api
        .post('/api/v1/todolists')
        .set('Cookie', userCookies)
        .send({ name: 'Private Todolist' });

      todolistId = response.body.data.todolist.id;

      // Create second user
      const { cookies } = await createTestUser({
        name: 'Other User',
        email: 'other@example.com',
        password: 'password123',
      });
      otherUserCookies = cookies;
    });

    it('should not allow other users to update todolist', async () => {
      const response = await api
        .put(`/api/v1/todolists/${todolistId}`)
        .set('Cookie', otherUserCookies)
        .send({ name: 'Hacked Name' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Todolist not found');
    });

    it('should not allow other users to delete todolist', async () => {
      const response = await api
        .delete(`/api/v1/todolists/${todolistId}`)
        .set('Cookie', otherUserCookies);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Todolist not found');
    });

    it('should not show other users todolists', async () => {
      const response = await api
        .get('/api/v1/todolists')
        .set('Cookie', otherUserCookies);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.todolists).toBeDefined();

      // Should only see their own todolists (default one)
      expect(response.body.data.todolists.length).toBe(1);
      expect(response.body.data.todolists[0].name).toBe('My First Todolist');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long todolist names', async () => {
      const longName = 'A'.repeat(100); // Max length
      const response = await api
        .post('/api/v1/todolists')
        .set('Cookie', userCookies)
        .send({ name: longName });

      expect(response.status).toBe(201);
      expect(response.body.data.todolist.name).toBe(longName);
    });

    it('should reject todolist names that are too long', async () => {
      const tooLongName = 'A'.repeat(101); // Over max length
      const response = await api
        .post('/api/v1/todolists')
        .set('Cookie', userCookies)
        .send({ name: tooLongName });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('ValidationError');
    });

    it('should handle special characters in todolist names', async () => {
      const specialName = 'Todolist with Special Chars: !@#$%^&*()';
      const response = await api
        .post('/api/v1/todolists')
        .set('Cookie', userCookies)
        .send({ name: specialName });

      expect(response.status).toBe(201);
      expect(response.body.data.todolist.name).toBe(specialName);
    });

    it('should handle unicode characters in todolist names', async () => {
      const unicodeName = 'Todolist with Unicode: 🚀📝✅';
      const response = await api
        .post('/api/v1/todolists')
        .set('Cookie', userCookies)
        .send({ name: unicodeName });

      expect(response.status).toBe(201);
      expect(response.body.data.todolist.name).toBe(unicodeName);
    });
  });
});
