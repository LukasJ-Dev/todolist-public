// Auth test utilities
// Provides helpers for testing authentication flows

import { Types } from 'mongoose';
import { userModel } from '../../src/models/userModel';
import { refreshTokenModel } from '../../src/models/refreshTokens';
import { AccessTokenService } from '../../src/services/auth/accessService';
import { createRefreshTokenService } from '../../src/services/auth/refreshService';
import { validateServerEnv } from '../../src/config/env';

// Create service instances for testing
const env = validateServerEnv(process.env);
const accessTokenService = new AccessTokenService(env);
const refreshTokenService = createRefreshTokenService(env);

// Helper to create a test user in the database
export const createTestUserInDb = async (userData: {
  name: string;
  email: string;
  password: string;
}) => {
  const user = await userModel.create(userData);
  return user;
};

// Helper to create an access token for testing
export const createTestAccessToken = async (userId: string) => {
  const result = await accessTokenService.createAccessToken({ userId });
  return result.token;
};

// Helper to create a refresh token for testing
export const createTestRefreshToken = async (
  userId: string,
  familyId?: string
) => {
  const result = await refreshTokenService.createRefreshToken({
    userId,
    familyId: familyId || 'test-family-id',
  });
  return result;
};

// Helper to create a complete auth session
export const createTestAuthSession = async (userData: {
  name: string;
  email: string;
  password: string;
}) => {
  // Create user
  const user = await createTestUserInDb(userData);

  // Create tokens
  const accessToken = await createTestAccessToken(user._id.toString());
  const refreshTokenResult = await createTestRefreshToken(user._id.toString());

  return {
    user,
    accessToken,
    refreshToken: refreshTokenResult.token,
    refreshTokenHash: refreshTokenResult.token,
  };
};

// Helper to verify access token
export const verifyTestAccessToken = async (token: string) => {
  return await accessTokenService.verifyAccessToken(token);
};

// Helper to rotate refresh token
export const rotateTestRefreshToken = async (token: string) => {
  return await refreshTokenService.rotateRefreshToken({ token });
};

// Helper to revoke refresh token family
export const revokeTestRefreshTokenFamily = async (familyId: string) => {
  return await refreshTokenService.revokeRefreshToken({ familyId });
};

// Helper to get user's refresh tokens
export const getTestUserRefreshTokens = async (userId: string) => {
  return await refreshTokenModel.find({ userId: new Types.ObjectId(userId) });
};

// Helper to create mock request with auth
export const createMockRequest = (user?: any, auth?: any) => {
  return {
    user,
    auth,
    headers: {},
    cookies: {},
    get: jest.fn(),
    ip: '127.0.0.1',
    originalUrl: '/test',
    method: 'GET',
  } as any;
};

// Helper to create mock response
export const createMockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  return res;
};

// Helper to create mock next function
export const createMockNext = () => jest.fn();

// Test data constants
export const testUserData = {
  name: 'John Doe',
  email: 'john@example.com',
  password: 'password123',
};

export const testUserData2 = {
  name: 'Jane Smith',
  email: 'jane@example.com',
  password: 'password456',
};
