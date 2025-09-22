// Auth API Integration Tests
// Tests authentication endpoints with real database and HTTP requests

import { api, createTestUser, testUser } from '../../setup/api';

describe('Auth API Integration', () => {
  describe('User Registration', () => {
    it('should register user successfully', async () => {
      const response = await api.post('/api/v1/auth/signup').send(testUser);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(testUser.email);
      expect(response.body.data.user.name).toBe(testUser.name);
      expect(response.body.data.user.password).toBeUndefined();

      // Should set cookies
      const cookies = response.headers['set-cookie'] as unknown as string[];
      expect(cookies).toBeDefined();
      expect(Array.isArray(cookies)).toBe(true);
      expect(
        cookies.some((cookie: string) => cookie.includes('accessToken'))
      ).toBe(true);
      expect(
        cookies.some((cookie: string) => cookie.includes('refreshToken'))
      ).toBe(true);
    });

    it('should return 409 for duplicate email', async () => {
      // Create first user
      await createTestUser();

      // Try to create second user with same email
      const response = await api.post('/api/v1/auth/signup').send(testUser);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('User already exists');
    });

    it('should validate registration data', async () => {
      const response = await api.post('/api/v1/auth/signup').send({
        name: 'A', // Too short
        email: 'invalid-email',
        password: '123', // Too short
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('ValidationError');
    });
  });

  describe('User Login', () => {
    beforeEach(async () => {
      // Create a test user for login tests
      await createTestUser();
    });

    it('should login with valid credentials', async () => {
      const response = await api.post('/api/v1/auth/login').send({
        email: testUser.email,
        password: testUser.password,
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(testUser.email);
      expect(response.body.data.user.password).toBeUndefined();

      // Should set cookies
      const cookies = response.headers['set-cookie'] as unknown as string[];
      expect(cookies).toBeDefined();
      expect(Array.isArray(cookies)).toBe(true);
      expect(
        cookies.some((cookie: string) => cookie.includes('accessToken'))
      ).toBe(true);
      expect(
        cookies.some((cookie: string) => cookie.includes('refreshToken'))
      ).toBe(true);
    });

    it('should return 401 for invalid credentials', async () => {
      const response = await api.post('/api/v1/auth/login').send({
        email: testUser.email,
        password: 'wrongpassword',
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Invalid credentials');
    });

    it('should return 401 for non-existent user', async () => {
      const response = await api.post('/api/v1/auth/login').send({
        email: 'nonexistent@example.com',
        password: testUser.password,
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Invalid credentials');
    });
  });

  describe('User Logout', () => {
    it('should logout successfully', async () => {
      const { cookies } = await createTestUser();

      const response = await api
        .post('/api/v1/auth/logout')
        .set('Cookie', cookies);

      expect(response.status).toBe(204);
      // 204 responses may or may not have a body depending on implementation

      // Should clear cookies
      const responseCookies = response.headers[
        'set-cookie'
      ] as unknown as string[];
      expect(responseCookies).toBeDefined();
      expect(Array.isArray(responseCookies)).toBe(true);
      expect(
        responseCookies.some((cookie: string) =>
          cookie.includes('accessToken=;')
        )
      ).toBe(true);
      expect(
        responseCookies.some((cookie: string) =>
          cookie.includes('refreshToken=;')
        )
      ).toBe(true);
    });

    it('should require authentication for logout', async () => {
      const response = await api.post('/api/v1/auth/logout');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('User not authenticated');
    });
  });

  describe('Token Refresh', () => {
    it('should refresh tokens successfully', async () => {
      const { cookies } = await createTestUser();

      const response = await api
        .post('/api/v1/auth/refresh')
        .set('Cookie', cookies);

      expect(response.status).toBe(204);
      // 204 responses may or may not have a body depending on implementation
    });

    it('should return 401 for invalid refresh token', async () => {
      const response = await api
        .post('/api/v1/auth/refresh')
        .set('Cookie', ['refreshToken=invalid-token']);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return 401 when no refresh token provided', async () => {
      const response = await api.post('/api/v1/auth/refresh');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Get User Info', () => {
    it('should return user info when authenticated', async () => {
      const { cookies } = await createTestUser();

      const response = await api.get('/api/v1/auth/me').set('Cookie', cookies);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(testUser.email);
      expect(response.body.data.user.name).toBe(testUser.name);
      expect(response.body.data.user.password).toBeUndefined();
    });

    it('should return 401 when not authenticated', async () => {
      const response = await api.get('/api/v1/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('User not authenticated');
    });
  });

  describe('Get Sessions', () => {
    it('should return user sessions when authenticated', async () => {
      const { cookies } = await createTestUser();

      const response = await api
        .get('/api/v1/auth/sessions')
        .set('Cookie', cookies);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.sessions).toBeDefined();
      expect(Array.isArray(response.body.data.sessions)).toBe(true);
    });

    it('should require authentication for sessions', async () => {
      const response = await api.get('/api/v1/auth/sessions');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('User not authenticated');
    });
  });
});
