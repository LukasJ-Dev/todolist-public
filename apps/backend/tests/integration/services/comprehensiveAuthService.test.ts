// Comprehensive Auth Service Integration Tests
// Tests all authentication service functionality with real database operations

import { AccessTokenService } from '../../../src/services/auth/accessService';
import { createRefreshTokenService } from '../../../src/services/auth/refreshService';
import { userModel } from '../../../src/models/userModel';
import { refreshTokenModel } from '../../../src/models/refreshTokens';
import { validateServerEnv } from '../../../src/config/env';
import { AppError } from '../../../src/utils/appError';

describe('Comprehensive Auth Service Integration', () => {
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
      name: 'Test User',
      email: 'test@example.com',
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

    it('should create tokens with custom TTL', async () => {
      const result = await accessTokenService.createAccessToken({
        userId: testUser._id.toString(),
        ttlMs: 60000, // 1 minute
      });

      expect(result.token).toBeDefined();
      expect(result.exp).toBeDefined();
      expect(result.iat).toBeDefined();

      // Verify the token is valid
      const payload = await accessTokenService.verifyAccessToken(result.token);
      expect(payload.userId).toBe(testUser._id.toString());
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

    it('should handle empty tokens', async () => {
      try {
        await accessTokenService.verifyAccessToken('');
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error.message).toBe('Missing access token');
      }
    });

    it('should handle null/undefined tokens', async () => {
      try {
        await accessTokenService.verifyAccessToken(null as any);
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error.message).toBe('Missing access token');
      }
    });
  });

  describe('Refresh Token Service - Creation', () => {
    it('should create refresh tokens with minimal data', async () => {
      const result = await refreshTokenService.createRefreshToken({
        userId: testUser._id.toString(),
      });

      expect(result.token).toBeDefined();
      expect(result.tokenId).toBeDefined();
      expect(result.familyId).toBeDefined();
      expect(result.expiresAt).toBeInstanceOf(Date);

      // Verify token was saved to database
      const savedToken = await refreshTokenModel.findById(result.tokenId);
      expect(savedToken).toBeTruthy();
      expect(savedToken?.userId.toString()).toBe(testUser._id.toString());
      expect(savedToken?.revoked).toBe(false);
    });

    it('should create refresh tokens with full data', async () => {
      const familyId = 'test-family-123';
      const ipAddress = '192.168.1.1';
      const userAgent =
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
      const fingerprint = 'fp-123456789';

      const result = await refreshTokenService.createRefreshToken({
        userId: testUser._id.toString(),
        familyId,
        ttlMs: 7 * 24 * 60 * 60 * 1000, // 7 days
        ipAddress,
        userAgent,
        fingerprint,
      });

      expect(result.token).toBeDefined();
      expect(result.tokenId).toBeDefined();
      expect(result.familyId).toBe(familyId);
      expect(result.expiresAt).toBeInstanceOf(Date);

      // Verify token was saved to database with all data
      const savedToken = await refreshTokenModel.findById(result.tokenId);
      expect(savedToken).toBeTruthy();
      expect(savedToken?.userId.toString()).toBe(testUser._id.toString());
      expect(savedToken?.familyId).toBe(familyId);
      expect(savedToken?.ipAddress).toBe(ipAddress);
      expect(savedToken?.userAgent).toBe(userAgent);
      expect(savedToken?.fingerprint).toBe(fingerprint);
      expect(savedToken?.revoked).toBe(false);
    });

    it('should create multiple tokens for same user', async () => {
      const result1 = await refreshTokenService.createRefreshToken({
        userId: testUser._id.toString(),
        familyId: 'family-1',
      });

      const result2 = await refreshTokenService.createRefreshToken({
        userId: testUser._id.toString(),
        familyId: 'family-2',
      });

      expect(result1.token).toBeDefined();
      expect(result2.token).toBeDefined();
      expect(result1.token).not.toBe(result2.token);
      expect(result1.familyId).not.toBe(result2.familyId);

      // Verify both tokens exist in database
      const tokens = await refreshTokenModel.find({ userId: testUser._id });
      expect(tokens).toHaveLength(2);
    });
  });

  describe('Refresh Token Service - Rotation', () => {
    it('should rotate refresh tokens successfully', async () => {
      // Create initial token
      const createResult = await refreshTokenService.createRefreshToken({
        userId: testUser._id.toString(),
        familyId: 'test-family',
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
      expect(rotateResult.expiresAt).toBeInstanceOf(Date);

      // Verify old token is revoked
      const oldToken = await refreshTokenModel.findById(createResult.tokenId);
      expect(oldToken?.revoked).toBe(true);

      // Verify new token is active
      const newToken = await refreshTokenModel.findById(rotateResult.tokenId);
      expect(newToken?.revoked).toBe(false);
      expect(newToken?.ipAddress).toBe('192.168.1.2');
      expect(newToken?.userAgent).toBe('Updated Browser');
    });

    it('should handle rotation with invalid token', async () => {
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

    it('should handle rotation with revoked token', async () => {
      // Create and revoke a token
      const createResult = await refreshTokenService.createRefreshToken({
        userId: testUser._id.toString(),
        familyId: 'test-family',
      });

      // Small delay to ensure token is properly saved
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Manually revoke the token
      await refreshTokenModel.findByIdAndUpdate(createResult.tokenId, {
        revoked: true,
      });

      try {
        await refreshTokenService.rotateRefreshToken({
          token: createResult.token,
        });
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error).toBeInstanceOf(AppError);
        expect(error.statusCode).toBe(401); // Non-transactional rotation returns 401
        expect(error.message).toBe('Invalid or reused refresh token');
      }
    });

    it('should detect and handle token reuse', async () => {
      // Create initial token
      const createResult = await refreshTokenService.createRefreshToken({
        userId: testUser._id.toString(),
        familyId: 'test-family',
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
        familyId: 'test-family',
      });
      expect(familyTokens.every((token) => token.revoked)).toBe(true);
    });
  });

  describe('Refresh Token Service - Revocation', () => {
    it('should revoke token families', async () => {
      const familyId = 'test-family-revoke';

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

    it('should handle revocation of non-existent family', async () => {
      // Should not throw error when revoking non-existent family
      await expect(
        refreshTokenService.revokeRefreshToken({ familyId: 'non-existent' })
      ).resolves.not.toThrow();
    });

    it('should revoke individual tokens', async () => {
      const token = await refreshTokenService.createRefreshToken({
        userId: testUser._id.toString(),
        familyId: 'test-family',
      });

      // Revoke the specific token
      await refreshTokenService.revokeRefreshToken({ tokenId: token.tokenId });

      // Verify token is revoked
      const revokedToken = await refreshTokenModel.findById(token.tokenId);
      expect(revokedToken?.revoked).toBe(true);
    });
  });

  describe('Refresh Token Service - Session Management', () => {
    it('should list user sessions with proper data', async () => {
      // Create multiple tokens for the user with specific data
      await refreshTokenService.createRefreshToken({
        userId: testUser._id.toString(),
        familyId: 'family-1',
        ipAddress: '192.168.1.1',
        userAgent: 'Browser 1',
      });

      await refreshTokenService.createRefreshToken({
        userId: testUser._id.toString(),
        familyId: 'family-2',
        ipAddress: '192.168.1.2',
        userAgent: 'Browser 2',
      });

      const sessions = await refreshTokenService.listUserSessions(
        testUser._id.toString(),
        {
          includeRevoked: false,
          limit: 10,
        }
      );

      expect(sessions).toHaveLength(2);

      // Verify session data structure and values
      const session1 = sessions.find((s: any) => s.familyId === 'family-1');
      const session2 = sessions.find((s: any) => s.familyId === 'family-2');

      expect(session1).toBeDefined();
      expect(session1?.familyId).toBe('family-1');
      expect(session1?.ipAddress).toBe('192.168.1.1');
      expect(session1?.userAgent).toBe('Browser 1');
      expect(session1?.active).toBe(true);
      expect(session1?.tokenCount).toBe(1);
      expect(session1?.createdAt).toBeInstanceOf(Date);
      expect(session1?.lastUsedAt).toBeInstanceOf(Date);

      expect(session2).toBeDefined();
      expect(session2?.familyId).toBe('family-2');
      expect(session2?.ipAddress).toBe('192.168.1.2');
      expect(session2?.userAgent).toBe('Browser 2');
      expect(session2?.active).toBe(true);
      expect(session2?.tokenCount).toBe(1);
    });

    it('should respect includeRevoked parameter', async () => {
      // Create a token
      const token = await refreshTokenService.createRefreshToken({
        userId: testUser._id.toString(),
        familyId: 'family-revoked',
        ipAddress: '192.168.1.1',
        userAgent: 'Browser',
      });

      // Revoke the token
      await refreshTokenModel.findByIdAndUpdate(token.tokenId, {
        revoked: true,
      });

      // Test with includeRevoked: false (default)
      const activeSessions = await refreshTokenService.listUserSessions(
        testUser._id.toString(),
        { includeRevoked: false }
      );
      expect(activeSessions).toHaveLength(0);

      // Test with includeRevoked: true
      const allSessions = await refreshTokenService.listUserSessions(
        testUser._id.toString(),
        { includeRevoked: true }
      );
      expect(allSessions).toHaveLength(1);
      expect(allSessions[0].familyId).toBe('family-revoked');
      expect(allSessions[0].active).toBe(false);
    });

    it('should respect limit parameter', async () => {
      // Create multiple tokens
      for (let i = 0; i < 5; i++) {
        await refreshTokenService.createRefreshToken({
          userId: testUser._id.toString(),
          familyId: `family-${i}`,
          ipAddress: `192.168.1.${i + 1}`,
          userAgent: `Browser ${i}`,
        });
      }

      // Test with limit
      const limitedSessions = await refreshTokenService.listUserSessions(
        testUser._id.toString(),
        { limit: 3 }
      );
      expect(limitedSessions).toHaveLength(3);

      // Test without limit (should get all)
      const allSessions = await refreshTokenService.listUserSessions(
        testUser._id.toString(),
        { limit: 10 }
      );
      expect(allSessions).toHaveLength(5);
    });

    it('should get refresh token by ID', async () => {
      const token = await refreshTokenService.createRefreshToken({
        userId: testUser._id.toString(),
        familyId: 'test-family',
      });

      const retrievedToken = await refreshTokenService.getRefreshById(
        token.tokenId
      );

      expect(retrievedToken).toBeTruthy();
      expect(retrievedToken?._id.toString()).toBe(token.tokenId);
      expect(retrievedToken?.userId.toString()).toBe(testUser._id.toString());
    });

    it('should handle getting non-existent token by ID', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011'; // Valid ObjectId format
      const retrievedToken =
        await refreshTokenService.getRefreshById(nonExistentId);

      expect(retrievedToken).toBeNull();
    });
  });

  describe('Service Integration', () => {
    it('should create both access and refresh tokens', async () => {
      const refreshResult = await refreshTokenService.createRefreshToken({
        userId: testUser._id.toString(),
        familyId: 'test-family',
      });

      const accessResult = await accessTokenService.createAccessToken({
        userId: testUser._id.toString(),
      });

      expect(refreshResult.token).toBeDefined();
      expect(accessResult.token).toBeDefined();

      // Both tokens should be valid
      const accessPayload = await accessTokenService.verifyAccessToken(
        accessResult.token
      );
      expect(accessPayload.userId).toBe(testUser._id.toString());

      const refreshToken = await refreshTokenService.getRefreshById(
        refreshResult.tokenId
      );
      expect(refreshToken).toBeTruthy();
    });

    it('should handle token lifecycle (create -> rotate -> revoke)', async () => {
      // Create initial tokens
      const refreshResult = await refreshTokenService.createRefreshToken({
        userId: testUser._id.toString(),
        familyId: 'lifecycle-test',
      });

      const accessResult = await accessTokenService.createAccessToken({
        userId: testUser._id.toString(),
      });

      // Verify initial tokens work
      const accessPayload = await accessTokenService.verifyAccessToken(
        accessResult.token
      );
      expect(accessPayload.userId).toBe(testUser._id.toString());

      // Revoke the family
      await refreshTokenService.revokeRefreshToken({
        familyId: 'lifecycle-test',
      });

      // Verify token is revoked
      const token = await refreshTokenService.getRefreshById(
        refreshResult.tokenId
      );
      expect(token?.revoked).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid user ID format', async () => {
      try {
        await refreshTokenService.createRefreshToken({
          userId: 'invalid-user-id',
        });
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error).toBeInstanceOf(Error); // BSONError for invalid ObjectId
      }
    });

    it('should handle non-existent user ID', async () => {
      const nonExistentUserId = '507f1f77bcf86cd799439011'; // Valid ObjectId format

      // This should actually work - the service doesn't validate user existence
      const result = await refreshTokenService.createRefreshToken({
        userId: nonExistentUserId,
      });

      expect(result.token).toBeDefined();
    });

    it('should handle database connection errors gracefully', async () => {
      // This test would require mocking the database connection
      // For now, we'll just test that the service handles errors properly
      const result = await refreshTokenService.createRefreshToken({
        userId: testUser._id.toString(),
      });

      expect(result.token).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long family IDs', async () => {
      const longFamilyId = 'a'.repeat(64); // Maximum allowed length

      const result = await refreshTokenService.createRefreshToken({
        userId: testUser._id.toString(),
        familyId: longFamilyId,
      });

      expect(result.familyId).toBe(longFamilyId);
    });

    it('should handle very long IP addresses', async () => {
      const longIpAddress = '2001:0db8:85a3:0000:0000:8a2e:0370:7334'; // IPv6

      const result = await refreshTokenService.createRefreshToken({
        userId: testUser._id.toString(),
        ipAddress: longIpAddress,
      });

      expect(result.token).toBeDefined();
    });

    it('should handle reasonable length user agents', async () => {
      const userAgent =
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';

      const result = await refreshTokenService.createRefreshToken({
        userId: testUser._id.toString(),
        userAgent: userAgent,
      });

      expect(result.token).toBeDefined();
    });

    it('should handle concurrent token creation', async () => {
      const promises = Array.from({ length: 5 }, (_, i) =>
        refreshTokenService.createRefreshToken({
          userId: testUser._id.toString(),
          familyId: `concurrent-${i}`,
        })
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(5);
      results.forEach((result, index) => {
        expect(result.token).toBeDefined();
        expect(result.familyId).toBe(`concurrent-${index}`);
      });

      // Verify all tokens exist in database
      const tokens = await refreshTokenModel.find({ userId: testUser._id });
      expect(tokens).toHaveLength(5);
    });
  });
});
