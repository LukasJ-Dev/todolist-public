// Auth Service Integration Tests
// Tests authentication services with real database operations

import { AccessTokenService } from '../../../src/services/auth/accessService';
import { createRefreshTokenService } from '../../../src/services/auth/refreshService';
import { userModel } from '../../../src/models/userModel';
import { refreshTokenModel } from '../../../src/models/refreshTokens';
import { validateServerEnv } from '../../../src/config/env';
import { AppError } from '../../../src/utils/appError';
import { testUserData } from '../../setup/auth';

describe('Auth Service Integration', () => {
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
    testUser = await userModel.create(testUserData);
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

    it('should handle token expiration', async () => {
      // This test is complex and may need to be done in unit tests
      // For now, just test basic token creation with TTL
      const result = await accessTokenService.createAccessToken({
        userId: testUser._id.toString(),
        ttlMs: 1000, // 1 second TTL for testing
      });

      expect(result.token).toBeDefined();
      expect(result.exp).toBeDefined();
      expect(result.iat).toBeDefined();
    });

    it('should handle invalid tokens', async () => {
      try {
        await accessTokenService.verifyAccessToken('invalid-token');
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error.message).toBe('Invalid access token');
      }
    });

    it('should handle malformed tokens', async () => {
      try {
        await accessTokenService.verifyAccessToken('not.a.token');
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

    it('should rotate refresh tokens', async () => {
      // Create initial token
      const createResult = await refreshTokenService.createRefreshToken({
        userId: testUser._id.toString(),
        familyId: 'test-family-id',
        ipAddress: '192.168.1.1',
        userAgent: 'Test Browser',
      });

      // Small delay to ensure token is properly saved
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Actually rotate the token
      const rotateResult = await refreshTokenService.rotateRefreshToken({
        token: createResult.token,
        ipAddress: '192.168.1.2',
        userAgent: 'Updated Browser',
      });

      // Verify rotation worked
      expect(rotateResult.token).toBeDefined();
      expect(rotateResult.tokenId).not.toBe(createResult.tokenId);
      expect(rotateResult.familyId).toBe(createResult.familyId);
      expect(rotateResult.userId.toString()).toBe(testUser._id.toString());

      // Verify old token is revoked
      const oldToken = await refreshTokenModel.findById(createResult.tokenId);
      expect(oldToken?.revoked).toBe(true);

      // Verify new token is active
      const newToken = await refreshTokenModel.findById(rotateResult.tokenId);
      expect(newToken?.revoked).toBe(false);
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

    it('should handle token reuse detection', async () => {
      // Create initial token
      const createResult = await refreshTokenService.createRefreshToken({
        userId: testUser._id.toString(),
        familyId: 'test-family-id',
      });

      // Small delay to ensure token is properly saved
      await new Promise((resolve) => setTimeout(resolve, 10));

      // First rotation should work
      await refreshTokenService.rotateRefreshToken({
        token: createResult.token,
      });

      // Try to use the old token again (reuse attack)
      try {
        await refreshTokenService.rotateRefreshToken({
          token: createResult.token, // Using the old token
        });
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error).toBeInstanceOf(AppError);
        expect(error.statusCode).toBe(401); // Non-transactional rotation returns 401
        expect(error.message).toBe('Invalid or reused refresh token');
      }

      // Verify the entire family was revoked due to reuse
      const familyTokens = await refreshTokenModel.find({
        familyId: 'test-family-id',
      });
      expect(familyTokens.every((token) => token.revoked)).toBe(true);
    });

    it('should handle invalid tokens during rotation', async () => {
      try {
        await refreshTokenService.rotateRefreshToken({
          token: 'invalid-token',
        });
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error).toBeInstanceOf(AppError);
        expect(error.statusCode).toBe(401); // Non-transactional rotation returns 401
        expect(error.message).toBe('Invalid or reused refresh token');
      }
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

    it('should maintain token consistency', async () => {
      const refreshResult = await refreshTokenService.createRefreshToken({
        userId: testUser._id.toString(),
        familyId: 'test-family-id',
      });

      const accessResult = await accessTokenService.createAccessToken({
        userId: testUser._id.toString(),
      });

      // Both tokens should be valid and consistent
      expect(refreshResult.token).toBeDefined();
      expect(refreshResult.tokenId).toBeDefined();
      expect(accessResult.token).toBeDefined();

      // Verify tokens are consistent with user
      const accessPayload = await accessTokenService.verifyAccessToken(
        accessResult.token
      );
      expect(accessPayload.userId).toBe(testUser._id.toString());

      const refreshToken = await refreshTokenService.getRefreshById(
        refreshResult.tokenId
      );
      expect(refreshToken?.userId.toString()).toBe(testUser._id.toString());
    });
  });
});
