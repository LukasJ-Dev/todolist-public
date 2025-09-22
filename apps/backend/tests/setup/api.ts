// API test utilities
// Provides helpers for testing HTTP endpoints

import request from 'supertest';
import app from '../../src/app';

// Create a supertest instance for API testing
export const api = request(app);

// Helper to create authenticated requests
export const createAuthenticatedRequest = (accessToken: string) => {
  return api.set('Authorization', `Bearer ${accessToken}`);
};

// Helper to create requests with cookies
export const createCookieRequest = (cookies: string[]) => {
  return api.set('Cookie', cookies);
};

// Helper to extract cookies from response
export const extractCookies = (response: {
  headers: { 'set-cookie'?: string[] };
}): string[] => {
  const setCookieHeaders = response.headers['set-cookie'];
  return setCookieHeaders || [];
};

// Helper to extract access token from cookies
export const extractAccessToken = (cookies: string[]): string | null => {
  const accessTokenCookie = cookies.find((cookie) =>
    cookie.startsWith('accessToken=')
  );

  if (!accessTokenCookie) return null;

  return accessTokenCookie.split('=')[1].split(';')[0];
};

// Helper to extract refresh token from cookies
export const extractRefreshToken = (cookies: string[]): string | null => {
  const refreshTokenCookie = cookies.find((cookie) =>
    cookie.startsWith('refreshToken=')
  );

  if (!refreshTokenCookie) return null;

  return refreshTokenCookie.split('=')[1].split(';')[0];
};

// Common test data
export const testUser = {
  name: 'John Doe',
  email: 'john@example.com',
  password: 'password123',
};

export const testTodolist = {
  name: 'Test Todolist',
};

export const testTask = {
  name: 'Test Task',
  description: 'Test task description',
};

// Helper to create a test user and return auth cookies
export const createTestUser = async (customUser?: Partial<typeof testUser>) => {
  const userData = { ...testUser, ...customUser };
  const response = await api.post('/api/v1/auth/signup').send(userData);

  expect(response.status).toBe(201);

  const cookies = extractCookies(response);
  return {
    user: response.body.data.user,
    cookies,
    accessToken: extractAccessToken(cookies),
    refreshToken: extractRefreshToken(cookies),
  };
};

// Helper to login and return auth cookies
export const loginTestUser = async (email: string, password: string) => {
  const response = await api.post('/api/auth/login').send({ email, password });

  expect(response.status).toBe(200);

  const cookies = extractCookies(response);
  return {
    user: response.body.data.user,
    cookies,
    accessToken: extractAccessToken(cookies),
    refreshToken: extractRefreshToken(cookies),
  };
};
