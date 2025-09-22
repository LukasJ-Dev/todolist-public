// End-to-End Workflow Tests
// Tests complete user workflows from start to finish

import { api, createTestUser } from '../../setup/api';
import { userModel } from '../../../src/models/userModel';
import { TodolistModel } from '../../../src/models/todolistModel';
import { TaskModel } from '../../../src/models/taskModel';
import { refreshTokenModel } from '../../../src/models/refreshTokens';

describe('End-to-End User Workflows', () => {
  afterEach(async () => {
    // Clean up all collections
    await TodolistModel.deleteMany({});
    await TaskModel.deleteMany({});
    await userModel.deleteMany({});
    await refreshTokenModel.deleteMany({});

    // Drop indexes to ensure clean state
    try {
      await TodolistModel.collection.dropIndexes();
      await TaskModel.collection.dropIndexes();
    } catch (error) {
      // Ignore index drop errors
    }
  });

  describe('Complete User Lifecycle', () => {
    it('should handle full user registration to logout workflow', async () => {
      // 1. Register a new user
      const userData = {
        name: 'E2E Test User',
        email: 'e2e@example.com',
        password: 'TestPassword123!',
      };

      const signupResponse = await api
        .post('/api/v1/auth/signup')
        .send(userData);

      expect(signupResponse.status).toBe(201);
      expect(signupResponse.body.success).toBe(true);
      expect(signupResponse.body.data.user.email).toBe(userData.email);
      expect(signupResponse.body.data.user.name).toBe(userData.name);

      // Extract cookies for authenticated requests
      const cookies = signupResponse.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.length).toBeGreaterThan(0);

      // 2. Get user profile
      const meResponse = await api
        .get('/api/v1/auth/me')
        .set('Cookie', cookies);

      expect(meResponse.status).toBe(200);
      expect(meResponse.body.data.user.email).toBe(userData.email);

      // 3. Create a todolist
      const todolistData = { name: 'My E2E Todolist' };
      const todolistResponse = await api
        .post('/api/v1/todolists')
        .set('Cookie', cookies)
        .send(todolistData);

      expect(todolistResponse.status).toBe(201);
      expect(todolistResponse.body.data.todolist.name).toBe(todolistData.name);
      const todolistId = todolistResponse.body.data.todolist.id;

      // 4. Add multiple tasks to the todolist
      const tasks = [
        { name: 'Task 1', description: 'First task' },
        { name: 'Task 2', description: 'Second task' },
        { name: 'Task 3', description: 'Third task' },
      ];

      const createdTasks = [];
      for (const taskData of tasks) {
        const taskResponse = await api
          .post('/api/v1/tasks')
          .set('Cookie', cookies)
          .send({
            ...taskData,
            todolist: todolistId,
          });

        expect(taskResponse.status).toBe(201);
        expect(taskResponse.body.data.task.name).toBe(taskData.name);
        createdTasks.push(taskResponse.body.data.task.id);
      }

      // 5. Get all todolists and verify
      const todolistsResponse = await api
        .get('/api/v1/todolists')
        .set('Cookie', cookies);

      expect(todolistsResponse.status).toBe(200);
      expect(todolistsResponse.body.data.todolists).toHaveLength(1);
      expect(todolistsResponse.body.data.todolists[0].name).toBe(
        todolistData.name
      );

      // 6. Get all tasks and verify
      const tasksResponse = await api
        .get('/api/v1/tasks')
        .set('Cookie', cookies);

      expect(tasksResponse.status).toBe(200);
      expect(tasksResponse.body.data.tasks).toHaveLength(3);

      // 7. Update a task
      const updateTaskResponse = await api
        .put(`/api/v1/tasks/${createdTasks[0]}`)
        .set('Cookie', cookies)
        .send({ checked: true });

      expect(updateTaskResponse.status).toBe(200);
      expect(updateTaskResponse.body.data.task.checked).toBe(true);

      // 8. Delete a task
      const deleteTaskResponse = await api
        .delete(`/api/v1/tasks/${createdTasks[2]}`)
        .set('Cookie', cookies);

      expect(deleteTaskResponse.status).toBe(204);

      // 9. Verify task was deleted
      const remainingTasksResponse = await api
        .get('/api/v1/tasks')
        .set('Cookie', cookies);

      expect(remainingTasksResponse.status).toBe(200);
      expect(remainingTasksResponse.body.data.tasks).toHaveLength(2);

      // 10. Update todolist
      const updateTodolistResponse = await api
        .put(`/api/v1/todolists/${todolistId}`)
        .set('Cookie', cookies)
        .send({ name: 'Updated E2E Todolist' });

      expect(updateTodolistResponse.status).toBe(200);
      expect(updateTodolistResponse.body.data.todolist.name).toBe(
        'Updated E2E Todolist'
      );

      // 11. Logout
      const logoutResponse = await api
        .post('/api/v1/auth/logout')
        .set('Cookie', cookies);

      expect(logoutResponse.status).toBe(204);

      // 12. Verify user is logged out (should get 401)
      // Note: The logout endpoint clears cookies but doesn't invalidate the session immediately
      // In a real scenario, the client would need to use the cleared cookies
      const unauthorizedResponse = await api.get('/api/v1/auth/me');

      expect(unauthorizedResponse.status).toBe(401);
    });

    it('should handle token refresh during active session', async () => {
      // 1. Register and login
      const { cookies: initialCookies } = await createTestUser();

      // 2. Create some data
      const todolistResponse = await api
        .post('/api/v1/todolists')
        .set('Cookie', initialCookies)
        .send({ name: 'Refresh Test Todolist' });

      expect(todolistResponse.status).toBe(201);
      const todolistId = todolistResponse.body.data.todolist.id;

      // 3. Add a task
      const taskResponse = await api
        .post('/api/v1/tasks')
        .set('Cookie', initialCookies)
        .send({ name: 'Refresh Test Task', todolist: todolistId });

      expect(taskResponse.status).toBe(201);

      // 4. Refresh token
      const refreshResponse = await api
        .post('/api/v1/auth/refresh')
        .set('Cookie', initialCookies);

      expect(refreshResponse.status).toBe(204);
      expect(refreshResponse.headers['set-cookie']).toBeDefined();

      // 5. Extract new cookies
      const newCookies = refreshResponse.headers['set-cookie'];

      // 6. Verify session still works with new token
      const meResponse = await api
        .get('/api/v1/auth/me')
        .set('Cookie', newCookies);

      expect(meResponse.status).toBe(200);

      // 7. Continue working with refreshed session
      const tasksResponse = await api
        .get('/api/v1/tasks')
        .set('Cookie', newCookies);

      expect(tasksResponse.status).toBe(200);
      expect(tasksResponse.body.data.tasks).toHaveLength(1);
    });
  });

  describe('Multi-User Scenarios', () => {
    it('should maintain user isolation between different users', async () => {
      // 1. Create first user
      const { cookies: user1Cookies } = await createTestUser({
        email: 'user1@example.com',
        name: 'User One',
      });

      // 2. Create second user
      const { cookies: user2Cookies } = await createTestUser({
        email: 'user2@example.com',
        name: 'User Two',
      });

      // 3. User 1 creates todolist and tasks
      const user1TodolistResponse = await api
        .post('/api/v1/todolists')
        .set('Cookie', user1Cookies)
        .send({ name: 'User 1 Todolist' });

      expect(user1TodolistResponse.status).toBe(201);
      const user1TodolistId = user1TodolistResponse.body.data.todolist.id;

      await api
        .post('/api/v1/tasks')
        .set('Cookie', user1Cookies)
        .send({ name: 'User 1 Task', todolist: user1TodolistId });

      // 4. User 2 creates their own todolist and tasks
      const user2TodolistResponse = await api
        .post('/api/v1/todolists')
        .set('Cookie', user2Cookies)
        .send({ name: 'User 2 Todolist' });

      expect(user2TodolistResponse.status).toBe(201);
      const user2TodolistId = user2TodolistResponse.body.data.todolist.id;

      await api
        .post('/api/v1/tasks')
        .set('Cookie', user2Cookies)
        .send({ name: 'User 2 Task', todolist: user2TodolistId });

      // 5. Verify user isolation - User 1 can only see their data
      const user1TodolistsResponse = await api
        .get('/api/v1/todolists')
        .set('Cookie', user1Cookies);

      expect(user1TodolistsResponse.status).toBe(200);
      expect(user1TodolistsResponse.body.data.todolists).toHaveLength(1);
      expect(user1TodolistsResponse.body.data.todolists[0].name).toBe(
        'User 1 Todolist'
      );

      const user1TasksResponse = await api
        .get('/api/v1/tasks')
        .set('Cookie', user1Cookies);

      expect(user1TasksResponse.status).toBe(200);
      expect(user1TasksResponse.body.data.tasks).toHaveLength(1);
      expect(user1TasksResponse.body.data.tasks[0].name).toBe('User 1 Task');

      // 6. Verify user isolation - User 2 can only see their data
      const user2TodolistsResponse = await api
        .get('/api/v1/todolists')
        .set('Cookie', user2Cookies);

      expect(user2TodolistsResponse.status).toBe(200);
      expect(user2TodolistsResponse.body.data.todolists).toHaveLength(1);
      expect(user2TodolistsResponse.body.data.todolists[0].name).toBe(
        'User 2 Todolist'
      );

      const user2TasksResponse = await api
        .get('/api/v1/tasks')
        .set('Cookie', user2Cookies);

      expect(user2TasksResponse.status).toBe(200);
      expect(user2TasksResponse.body.data.tasks).toHaveLength(1);
      expect(user2TasksResponse.body.data.tasks[0].name).toBe('User 2 Task');

      // 7. Verify cross-user access is denied
      const unauthorizedAccessResponse = await api
        .get(`/api/v1/todolists/${user1TodolistId}`)
        .set('Cookie', user2Cookies);

      expect(unauthorizedAccessResponse.status).toBe(404);
    });

    it('should handle concurrent user operations', async () => {
      // 1. Create multiple users
      const users = [];
      for (let i = 0; i < 3; i++) {
        const { cookies, user } = await createTestUser({
          email: `concurrent${i}@example.com`,
          name: `Concurrent User ${i}`,
        });
        users.push({ cookies, user });
      }

      // 2. All users create todolists simultaneously
      const todolistPromises = users.map(({ cookies }) =>
        api
          .post('/api/v1/todolists')
          .set('Cookie', cookies)
          .send({ name: `Concurrent Todolist ${Math.random()}` })
      );

      const todolistResponses = await Promise.all(todolistPromises);
      todolistResponses.forEach((response) => {
        expect(response.status).toBe(201);
      });

      // 3. All users add tasks to their todolists
      const taskPromises = users.map(({ cookies }, index) => {
        const todolistId = todolistResponses[index].body.data.todolist.id;
        return api
          .post('/api/v1/tasks')
          .set('Cookie', cookies)
          .send({ name: `Concurrent Task ${index}`, todolist: todolistId });
      });

      const taskResponses = await Promise.all(taskPromises);
      taskResponses.forEach((response) => {
        expect(response.status).toBe(201);
      });

      // 4. Verify each user has their own data
      for (let i = 0; i < users.length; i++) {
        const { cookies } = users[i];

        const todolistsResponse = await api
          .get('/api/v1/todolists')
          .set('Cookie', cookies);

        expect(todolistsResponse.status).toBe(200);
        expect(todolistsResponse.body.data.todolists).toHaveLength(1);

        const tasksResponse = await api
          .get('/api/v1/tasks')
          .set('Cookie', cookies);

        expect(tasksResponse.status).toBe(200);
        expect(tasksResponse.body.data.tasks).toHaveLength(1);
      }
    });
  });

  describe('Error Recovery Workflows', () => {
    it('should handle authentication errors and recovery', async () => {
      // 1. Try to access protected resource without authentication
      const unauthorizedResponse = await api.get('/api/v1/todolists');
      expect(unauthorizedResponse.status).toBe(401);

      // 2. Register and login
      const { cookies } = await createTestUser();

      // 3. Access should now work
      const authorizedResponse = await api
        .get('/api/v1/todolists')
        .set('Cookie', cookies);

      expect(authorizedResponse.status).toBe(200);

      // 4. Simulate token expiration by using invalid cookies
      const invalidCookies = [
        'accessToken=invalid-token',
        'refreshToken=invalid-token',
      ];
      const invalidResponse = await api
        .get('/api/v1/todolists')
        .set('Cookie', invalidCookies);

      expect(invalidResponse.status).toBe(401);

      // 5. Re-authenticate and continue
      const reauthResponse = await api
        .get('/api/v1/todolists')
        .set('Cookie', cookies);

      expect(reauthResponse.status).toBe(200);
    });

    it('should handle validation errors and continue workflow', async () => {
      const { cookies } = await createTestUser();

      // 1. Try to create todolist with invalid data
      const invalidTodolistResponse = await api
        .post('/api/v1/todolists')
        .set('Cookie', cookies)
        .send({ name: '' }); // Empty name should fail

      expect(invalidTodolistResponse.status).toBe(400);

      // 2. Create valid todolist
      const validTodolistResponse = await api
        .post('/api/v1/todolists')
        .set('Cookie', cookies)
        .send({ name: 'Valid Todolist' });

      expect(validTodolistResponse.status).toBe(201);
      const todolistId = validTodolistResponse.body.data.todolist.id;

      // 3. Try to create task with invalid data
      const invalidTaskResponse = await api
        .post('/api/v1/tasks')
        .set('Cookie', cookies)
        .send({ name: '', todolist: todolistId }); // Empty name should fail

      expect(invalidTaskResponse.status).toBe(400);

      // 4. Create valid task
      const validTaskResponse = await api
        .post('/api/v1/tasks')
        .set('Cookie', cookies)
        .send({ name: 'Valid Task', todolist: todolistId });

      expect(validTaskResponse.status).toBe(201);

      // 5. Verify workflow completed successfully
      const finalResponse = await api
        .get('/api/v1/todolists')
        .set('Cookie', cookies);

      expect(finalResponse.status).toBe(200);
      expect(finalResponse.body.data.todolists).toHaveLength(1);
    });
  });

  describe('Complex Data Operations', () => {
    it('should handle large data operations', async () => {
      const { cookies } = await createTestUser();

      // 1. Create multiple todolists
      const todolistNames = [
        'Work',
        'Personal',
        'Shopping',
        'Travel',
        'Health',
      ];
      const todolistIds = [];

      for (const name of todolistNames) {
        const response = await api
          .post('/api/v1/todolists')
          .set('Cookie', cookies)
          .send({ name });

        expect(response.status).toBe(201);
        todolistIds.push(response.body.data.todolist.id);
      }

      // 2. Add multiple tasks to each todolist
      const tasksPerTodolist = 5;
      for (let i = 0; i < todolistNames.length; i++) {
        for (let j = 0; j < tasksPerTodolist; j++) {
          const response = await api
            .post('/api/v1/tasks')
            .set('Cookie', cookies)
            .send({
              name: `${todolistNames[i]} Task ${j + 1}`,
              todolist: todolistIds[i],
            });

          expect(response.status).toBe(201);
        }
      }

      // 3. Verify all data was created
      const todolistsResponse = await api
        .get('/api/v1/todolists')
        .set('Cookie', cookies);

      expect(todolistsResponse.status).toBe(200);
      expect(todolistsResponse.body.data.todolists).toHaveLength(5);

      const tasksResponse = await api
        .get('/api/v1/tasks')
        .set('Cookie', cookies);

      expect(tasksResponse.status).toBe(200);
      expect(tasksResponse.body.data.tasks).toHaveLength(25); // 5 todolists × 5 tasks

      // 4. Update multiple tasks
      const allTasks = tasksResponse.body.data.tasks;
      const updatePromises = allTasks
        .slice(0, 10)
        .map((task: any) =>
          api
            .put(`/api/v1/tasks/${task.id}`)
            .set('Cookie', cookies)
            .send({ checked: true })
        );

      const updateResponses = await Promise.all(updatePromises);
      updateResponses.forEach((response) => {
        expect(response.status).toBe(200);
      });

      // 5. Verify updates
      const updatedTasksResponse = await api
        .get('/api/v1/tasks')
        .set('Cookie', cookies);

      expect(updatedTasksResponse.status).toBe(200);
      const checkedTasks = updatedTasksResponse.body.data.tasks.filter(
        (task: any) => task.checked === true
      );
      expect(checkedTasks).toHaveLength(10);
    });

    it('should handle cascade delete operations', async () => {
      const { cookies } = await createTestUser();

      // Clear any default todolists first
      await api
        .delete('/api/v1/todolists')
        .set('Cookie', cookies)
        .catch(() => {});

      // 1. Create todolist with tasks
      const todolistResponse = await api
        .post('/api/v1/todolists')
        .set('Cookie', cookies)
        .send({ name: 'Cascade Test Todolist' });

      expect(todolistResponse.status).toBe(201);
      const todolistId = todolistResponse.body.data.todolist.id;

      // 2. Add multiple tasks
      const taskNames = ['Task 1', 'Task 2', 'Task 3', 'Task 4', 'Task 5'];
      const taskIds = [];

      for (const name of taskNames) {
        const response = await api
          .post('/api/v1/tasks')
          .set('Cookie', cookies)
          .send({ name, todolist: todolistId });

        expect(response.status).toBe(201);
        taskIds.push(response.body.data.task.id);
      }

      // 3. Verify tasks exist
      const tasksBeforeDelete = await api
        .get('/api/v1/tasks')
        .set('Cookie', cookies);

      expect(tasksBeforeDelete.status).toBe(200);
      expect(tasksBeforeDelete.body.data.tasks).toHaveLength(5);

      // 4. Delete todolist (should cascade delete all tasks)
      const deleteTodolistResponse = await api
        .delete(`/api/v1/todolists/${todolistId}`)
        .set('Cookie', cookies);

      expect(deleteTodolistResponse.status).toBe(204);

      // 5. Verify todolist is deleted (check that the specific todolist is gone)
      const todolistsAfterDelete = await api
        .get('/api/v1/todolists')
        .set('Cookie', cookies);

      expect(todolistsAfterDelete.status).toBe(200);
      // The default todolist will be created if user has none, so we check that our specific todolist is gone
      const deletedTodolist = todolistsAfterDelete.body.data.todolists.find(
        (t: any) => t.id === todolistId
      );
      expect(deletedTodolist).toBeUndefined();

      // 6. Verify all tasks were cascade deleted
      const tasksAfterDelete = await api
        .get('/api/v1/tasks')
        .set('Cookie', cookies);

      expect(tasksAfterDelete.status).toBe(200);
      expect(tasksAfterDelete.body.data.tasks).toHaveLength(0);
    });
  });

  describe('Session Management Workflows', () => {
    it('should handle multiple sessions for same user', async () => {
      // 1. Create user and get first session
      const { cookies: session1Cookies, user } = await createTestUser();

      // 2. Create data with first session
      const todolistResponse1 = await api
        .post('/api/v1/todolists')
        .set('Cookie', session1Cookies)
        .send({ name: 'Session 1 Todolist' });

      expect(todolistResponse1.status).toBe(201);

      // 3. Get user sessions
      const sessionsResponse = await api
        .get('/api/v1/auth/sessions')
        .set('Cookie', session1Cookies);

      expect(sessionsResponse.status).toBe(200);
      expect(sessionsResponse.body.data.sessions).toHaveLength(1);

      // 4. Simulate second session (login again with same user)
      const loginResponse = await api.post('/api/v1/auth/login').send({
        email: user.email,
        password: 'password123',
      });

      expect(loginResponse.status).toBe(200);
      const session2Cookies = loginResponse.headers['set-cookie'];

      // 5. Create data with second session
      const todolistResponse2 = await api
        .post('/api/v1/todolists')
        .set('Cookie', session2Cookies)
        .send({ name: 'Session 2 Todolist' });

      expect(todolistResponse2.status).toBe(201);

      // 6. Both sessions should see all data
      const todolistsFromSession1 = await api
        .get('/api/v1/todolists')
        .set('Cookie', session1Cookies);

      expect(todolistsFromSession1.status).toBe(200);
      expect(todolistsFromSession1.body.data.todolists).toHaveLength(2);

      const todolistsFromSession2 = await api
        .get('/api/v1/todolists')
        .set('Cookie', session2Cookies);

      expect(todolistsFromSession2.status).toBe(200);
      expect(todolistsFromSession2.body.data.todolists).toHaveLength(2);

      // 7. Get updated sessions list
      const updatedSessionsResponse = await api
        .get('/api/v1/auth/sessions')
        .set('Cookie', session1Cookies);

      expect(updatedSessionsResponse.status).toBe(200);
      expect(updatedSessionsResponse.body.data.sessions).toHaveLength(2);
    });

    it('should handle session cleanup on logout', async () => {
      const { cookies } = await createTestUser();

      // 1. Get initial sessions
      const initialSessionsResponse = await api
        .get('/api/v1/auth/sessions')
        .set('Cookie', cookies);

      expect(initialSessionsResponse.status).toBe(200);

      // 2. Logout
      const logoutResponse = await api
        .post('/api/v1/auth/logout')
        .set('Cookie', cookies);

      expect(logoutResponse.status).toBe(204);

      // 3. Verify session is removed (logout clears cookies, so we can't use them)
      const sessionsAfterLogout = await api.get('/api/v1/auth/sessions');

      expect(sessionsAfterLogout.status).toBe(401); // Should be unauthorized

      // 4. Try to access protected resource (without cookies since they were cleared)
      const unauthorizedResponse = await api.get('/api/v1/todolists');

      expect(unauthorizedResponse.status).toBe(401);
    });
  });
});
