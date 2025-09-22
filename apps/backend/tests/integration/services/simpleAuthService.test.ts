// Simple Auth Service Integration Tests
// Tests basic authentication service functionality with real database

import { AccessTokenService } from '../../../src/services/auth/accessService';
import { createRefreshTokenService } from '../../../src/services/auth/refreshService';
import { userModel } from '../../../src/models/userModel';
import { refreshTokenModel } from '../../../src/models/refreshTokens';
import { validateServerEnv } from '../../../src/config/env';

describe('Simple Auth Service Integration', () => {
  let accessTokenService: AccessTokenService;
  let refreshTokenService: any;
  let testUser: any;

  beforeAll(async () => {
    // Create service instances
    const env = validateServerEnv(process.env);
    accessTokenService = new AccessTokenService(env);
    refreshTokenService = createRefreshTokenService(env);
  });

  beforeEach(async () => {
    // Create a test user for each test
    testUser = await userModel.create({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
    });
  });

  afterEach(async () => {
    // Clean up database after each test
    await userModel.deleteMany({});
    await refreshTokenModel.deleteMany({});
  });

  describe('Access Token Service', () => {
    it('should create and verify access tokens', async () => {
      const result = await accessTokenService.createAccessToken({
        userId: testUser._id.toString(),
      });

      expect(result.token).toBeDefined();
      expect(result.exp).toBeDefined();
      expect(result.iat).toBeDefined();

      const payload = await accessTokenService.verifyAccessToken(result.token);
      expect(payload.userId).toBe(testUser._id.toString());
      expect(payload.iat).toBeDefined();
      expect(payload.exp).toBeDefined();
    });

    it('should handle invalid tokens', async () => {
      try {
        await accessTokenService.verifyAccessToken('invalid-token');
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error.message).toBe('Invalid access token');
      }
    });
  });

  describe('Refresh Token Service', () => {
    it('should create refresh tokens', async () => {
      const result = await refreshTokenService.createRefreshToken({
        userId: testUser._id.toString(),
        familyId: 'test-family-id',
      });

      expect(result.token).toBeDefined();
      expect(result.tokenId).toBeDefined();
      expect(result.familyId).toBe('test-family-id');

      // Verify token was saved to database
      const savedToken = await refreshTokenModel.findById(result.tokenId);
      expect(savedToken).toBeTruthy();
      expect(savedToken?.userId.toString()).toBe(testUser._id.toString());
    });

    it('should revoke token families', async () => {
      const familyId = 'test-family-id';

      // Create multiple tokens in the same family
      await refreshTokenService.createRefreshToken({
        userId: testUser._id.toString(),
        familyId,
      });

      await refreshTokenService.createRefreshToken({
        userId: testUser._id.toString(),
        familyId,
      });

      // Revoke the family
      await refreshTokenService.revokeRefreshToken({ familyId });

      // Verify all tokens in family are revoked
      const tokens = await refreshTokenModel.find({ familyId });
      expect(tokens).toHaveLength(2);
      expect(tokens.every((token) => token.revoked)).toBe(true);
    });
  });

  describe('Service Integration', () => {
    it('should create both access and refresh tokens', async () => {
      const refreshResult = await refreshTokenService.createRefreshToken({
        userId: testUser._id.toString(),
        familyId: 'test-family-id',
      });

      const accessResult = await accessTokenService.createAccessToken({
        userId: testUser._id.toString(),
      });

      expect(refreshResult.token).toBeDefined();
      expect(accessResult.token).toBeDefined();

      // Access token should be valid
      const accessPayload = await accessTokenService.verifyAccessToken(
        accessResult.token
      );
      expect(accessPayload.userId).toBe(testUser._id.toString());
    });
  });
});
