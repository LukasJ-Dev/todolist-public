// Refresh Tokens Model Integration Tests
// Tests refresh token model behavior with real database operations

import { refreshTokenModel } from '../../../src/models/refreshTokens';
import { userModel } from '../../../src/models/userModel';

describe('Refresh Tokens Model Integration', () => {
  let testUser: any;

  beforeEach(async () => {
    // Create a test user for each test
    testUser = await userModel.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    });
  });

  describe('Token Creation', () => {
    it('should create a refresh token with valid data', async () => {
      const tokenData = {
        tokenHash: 'a'.repeat(32), // Valid hash length
        userId: testUser._id,
        familyId: 'family-123',
        issuedAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        revoked: false,
        ipAddress: '192.168.1.1',
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        fingerprint: 'fp-123456789',
      };

      const token = await refreshTokenModel.create(tokenData);

      expect(token._id).toBeDefined();
      expect(token.tokenHash).toBe(tokenData.tokenHash);
      expect(token.userId.toString()).toBe(testUser._id.toString());
      expect(token.familyId).toBe(tokenData.familyId);
      expect(token.issuedAt).toBeDefined();
      expect(token.expiresAt).toBeDefined();
      expect(token.revoked).toBe(false);
      expect(token.ipAddress).toBe(tokenData.ipAddress);
      expect(token.userAgent).toBe(tokenData.userAgent);
      expect(token.fingerprint).toBe(tokenData.fingerprint);
    });

    it('should create a refresh token with minimal required data', async () => {
      const tokenData = {
        tokenHash: 'b'.repeat(32),
        userId: testUser._id,
        familyId: 'family-456',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day from now
      };

      const token = await refreshTokenModel.create(tokenData);

      expect(token._id).toBeDefined();
      expect(token.tokenHash).toBe(tokenData.tokenHash);
      expect(token.userId.toString()).toBe(testUser._id.toString());
      expect(token.familyId).toBe(tokenData.familyId);
      expect(token.issuedAt).toBeDefined(); // Should have default value
      expect(token.expiresAt).toBeDefined();
      expect(token.revoked).toBe(false); // Should have default value
      expect(token.replacedBy).toBeNull(); // Should have default value
    });
  });

  describe('Validation', () => {
    it('should validate token hash length (minimum)', async () => {
      const tokenData = {
        tokenHash: 'a'.repeat(31), // Too short
        userId: testUser._id,
        familyId: 'family-123',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };

      const token = new refreshTokenModel(tokenData);
      await expect(token.save()).rejects.toThrow(
        'Token hash must be at least 32 characters'
      );
    });

    it('should validate token hash length (maximum)', async () => {
      const tokenData = {
        tokenHash: 'a'.repeat(129), // Too long
        userId: testUser._id,
        familyId: 'family-123',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };

      const token = new refreshTokenModel(tokenData);
      await expect(token.save()).rejects.toThrow(
        'Token hash cannot exceed 128 characters'
      );
    });

    it('should validate family ID length (minimum)', async () => {
      const tokenData = {
        tokenHash: 'a'.repeat(32),
        userId: testUser._id,
        familyId: 'short', // Too short
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };

      const token = new refreshTokenModel(tokenData);
      await expect(token.save()).rejects.toThrow(
        'Family ID must be at least 8 characters'
      );
    });

    it('should validate family ID length (maximum)', async () => {
      const tokenData = {
        tokenHash: 'a'.repeat(32),
        userId: testUser._id,
        familyId: 'a'.repeat(65), // Too long
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };

      const token = new refreshTokenModel(tokenData);
      await expect(token.save()).rejects.toThrow(
        'Family ID cannot exceed 64 characters'
      );
    });

    it('should validate issued date is not in the future', async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const tokenData = {
        tokenHash: 'a'.repeat(32),
        userId: testUser._id,
        familyId: 'family-123',
        issuedAt: futureDate,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };

      const token = new refreshTokenModel(tokenData);
      await expect(token.save()).rejects.toThrow(
        'Issued date cannot be in the future'
      );
    });

    it('should validate expiration date is in the future', async () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const tokenData = {
        tokenHash: 'a'.repeat(32),
        userId: testUser._id,
        familyId: 'family-123',
        expiresAt: pastDate,
      };

      const token = new refreshTokenModel(tokenData);
      await expect(token.save()).rejects.toThrow(
        'Expiration date must be in the future'
      );
    });

    it('should validate last used date is not in the future', async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const tokenData = {
        tokenHash: 'a'.repeat(32),
        userId: testUser._id,
        familyId: 'family-123',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        lastUsedAt: futureDate,
      };

      const token = new refreshTokenModel(tokenData);
      await expect(token.save()).rejects.toThrow(
        'Last used date cannot be in the future'
      );
    });

    it('should validate IP address length', async () => {
      const tokenData = {
        tokenHash: 'a'.repeat(32),
        userId: testUser._id,
        familyId: 'family-123',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        ipAddress: 'a'.repeat(46), // Too long (IPv6 max is 45)
      };

      const token = new refreshTokenModel(tokenData);
      await expect(token.save()).rejects.toThrow(
        'IP address cannot exceed 45 characters'
      );
    });

    it('should validate user agent length', async () => {
      const tokenData = {
        tokenHash: 'a'.repeat(32),
        userId: testUser._id,
        familyId: 'family-123',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        userAgent: 'a'.repeat(501), // Too long
      };

      const token = new refreshTokenModel(tokenData);
      await expect(token.save()).rejects.toThrow(
        'User agent cannot exceed 500 characters'
      );
    });

    it('should validate fingerprint length', async () => {
      const tokenData = {
        tokenHash: 'a'.repeat(32),
        userId: testUser._id,
        familyId: 'family-123',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        fingerprint: 'a'.repeat(129), // Too long
      };

      const token = new refreshTokenModel(tokenData);
      await expect(token.save()).rejects.toThrow(
        'Fingerprint cannot exceed 128 characters'
      );
    });

    it('should enforce unique token hash constraint', async () => {
      const tokenHash = 'a'.repeat(32);

      // Create first token
      await refreshTokenModel.create({
        tokenHash,
        userId: testUser._id,
        familyId: 'family-123',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      // Try to create second token with same hash
      const duplicateToken = new refreshTokenModel({
        tokenHash,
        userId: testUser._id,
        familyId: 'family-456',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      await expect(duplicateToken.save()).rejects.toThrow(
        'duplicate key error'
      );
    });

    it('should require all required fields', async () => {
      const token = new refreshTokenModel({});
      await expect(token.save()).rejects.toThrow();
    });
  });

  describe('Database Operations', () => {
    it('should find tokens by user ID', async () => {
      const token1 = await refreshTokenModel.create({
        tokenHash: 'a'.repeat(32),
        userId: testUser._id,
        familyId: 'family-123',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      const token2 = await refreshTokenModel.create({
        tokenHash: 'b'.repeat(32),
        userId: testUser._id,
        familyId: 'family-456',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      const tokens = await refreshTokenModel.find({ userId: testUser._id });
      expect(tokens).toHaveLength(2);
      expect(tokens.map((t) => t._id.toString())).toContain(
        token1._id.toString()
      );
      expect(tokens.map((t) => t._id.toString())).toContain(
        token2._id.toString()
      );
    });

    it('should find tokens by family ID', async () => {
      const familyId = 'family-123';

      const token1 = await refreshTokenModel.create({
        tokenHash: 'a'.repeat(32),
        userId: testUser._id,
        familyId,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      const token2 = await refreshTokenModel.create({
        tokenHash: 'b'.repeat(32),
        userId: testUser._id,
        familyId,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      const tokens = await refreshTokenModel.find({ familyId });
      expect(tokens).toHaveLength(2);
      expect(tokens.map((t) => t._id.toString())).toContain(
        token1._id.toString()
      );
      expect(tokens.map((t) => t._id.toString())).toContain(
        token2._id.toString()
      );
    });

    it('should find tokens by token hash', async () => {
      const tokenHash = 'a'.repeat(32);

      const token = await refreshTokenModel.create({
        tokenHash,
        userId: testUser._id,
        familyId: 'family-123',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      const foundToken = await refreshTokenModel.findOne({ tokenHash });
      expect(foundToken).toBeTruthy();
      expect(foundToken?._id.toString()).toBe(token._id.toString());
    });

    it('should update token fields', async () => {
      const token = await refreshTokenModel.create({
        tokenHash: 'a'.repeat(32),
        userId: testUser._id,
        familyId: 'family-123',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      const newLastUsed = new Date();
      token.lastUsedAt = newLastUsed;
      token.revoked = true;
      await token.save();

      const updatedToken = await refreshTokenModel.findById(token._id);
      expect(updatedToken?.lastUsedAt).toEqual(newLastUsed);
      expect(updatedToken?.revoked).toBe(true);
    });

    it('should delete tokens', async () => {
      const token = await refreshTokenModel.create({
        tokenHash: 'a'.repeat(32),
        userId: testUser._id,
        familyId: 'family-123',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      await refreshTokenModel.findByIdAndDelete(token._id);

      const deletedToken = await refreshTokenModel.findById(token._id);
      expect(deletedToken).toBeNull();
    });
  });

  describe('Token Relationships', () => {
    it('should handle token replacement relationship', async () => {
      const originalToken = await refreshTokenModel.create({
        tokenHash: 'a'.repeat(32),
        userId: testUser._id,
        familyId: 'family-123',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      const replacementToken = await refreshTokenModel.create({
        tokenHash: 'b'.repeat(32),
        userId: testUser._id,
        familyId: 'family-123',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        replacedBy: originalToken._id,
      });

      expect(replacementToken.replacedBy?.toString()).toBe(
        originalToken._id.toString()
      );
    });

    it('should populate user reference', async () => {
      const token = await refreshTokenModel.create({
        tokenHash: 'a'.repeat(32),
        userId: testUser._id,
        familyId: 'family-123',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      const populatedToken = await refreshTokenModel
        .findById(token._id)
        .populate('userId');

      expect(populatedToken?.userId).toBeTruthy();
      expect((populatedToken?.userId as any).email).toBe(testUser.email);
    });
  });

  describe('TTL and Expiration', () => {
    it('should create token with future expiration', async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const token = await refreshTokenModel.create({
        tokenHash: 'a'.repeat(32),
        userId: testUser._id,
        familyId: 'family-123',
        expiresAt: futureDate,
      });

      expect(token.expiresAt).toEqual(futureDate);
    });

    it('should handle expired tokens', async () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);

      // This should fail validation, but let's test the concept
      const token = new refreshTokenModel({
        tokenHash: 'a'.repeat(32),
        userId: testUser._id,
        familyId: 'family-123',
        expiresAt: pastDate,
      });

      await expect(token.save()).rejects.toThrow(
        'Expiration date must be in the future'
      );
    });
  });
});
