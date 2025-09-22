import { Types } from 'mongoose';
import { AppError } from '../../../../src/utils/appError';
import {
  RefreshTokenService,
  createRefreshTokenService,
} from '../../../../src/services/auth/refreshService';
import { validateServerEnv } from '../../../../src/config/env';
import { AUTH_CONSTANTS } from '../../../../src/utils/auth';
import type {
  RefreshTokenModelType,
  LoggerType,
  SessionFactory,
} from '../../../../src/services/auth/refreshService';

// Mock dependencies
jest.mock('../../../../src/config/env');
jest.mock('../../../../src/utils/auth', () => ({
  ...jest.requireActual('../../../../src/utils/auth'),
  createTokenHash: jest.fn(),
  generateRandomToken: jest.fn(),
  validateSecret: jest.fn(),
  normalizeUserId: jest.fn(),
  calculateExpiration: jest.fn(),
  validateObjectId: jest.fn(),
}));

const mockValidateServerEnv = validateServerEnv as jest.MockedFunction<
  typeof validateServerEnv
>;
const mockCreateTokenHash = require('../../../../src/utils/auth')
  .createTokenHash as jest.MockedFunction<
  (token: string, secret: string) => string
>;
const mockGenerateRandomToken = require('../../../../src/utils/auth')
  .generateRandomToken as jest.MockedFunction<() => string>;
const mockValidateSecret = require('../../../../src/utils/auth')
  .validateSecret as jest.MockedFunction<
  (secret: string | undefined, name: string) => string
>;
const mockNormalizeUserId = require('../../../../src/utils/auth')
  .normalizeUserId as jest.MockedFunction<
  (id: string | Types.ObjectId) => Types.ObjectId
>;
const mockCalculateExpiration = require('../../../../src/utils/auth')
  .calculateExpiration as jest.MockedFunction<
  (now: Date, ttlMs: number) => Date
>;
const mockValidateObjectId = require('../../../../src/utils/auth')
  .validateObjectId as jest.MockedFunction<
  (id: string, fieldName: string) => void
>;

describe('RefreshTokenService', () => {
  let service: RefreshTokenService;
  let mockRefreshTokenModel: jest.Mocked<RefreshTokenModelType>;
  let mockLogger: jest.Mocked<LoggerType>;
  let mockSessionFactory: jest.MockedFunction<SessionFactory>;
  let mockSession: any;
  let mockEnv: ReturnType<typeof validateServerEnv>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock environment
    mockEnv = {
      NODE_ENV: 'test' as const,
      PORT: 3000,
      HOST: 'localhost',
      DATABASE: 'mongodb://localhost:27017/test',
      DATABASE_POOL_SIZE: 10,
      DATABASE_CONNECT_TIMEOUT_MS: 10000,
      DATABASE_SOCKET_TIMEOUT_MS: 45000,
      JWT_ALG: 'HS256',
      JWT_SECRET: 'a'.repeat(32),
      JWT_PRIVATE_KEY: 'mock-private-key',
      JWT_PUBLIC_KEY: 'mock-public-key',
      JWT_ISS: 'test-issuer',
      JWT_AUD: 'test-audience',
      JWT_KID: 'test-kid',
      LOG_LEVEL: 'info',
      CORS_ORIGIN: 'http://localhost:3000',
      RATE_LIMIT_WINDOW_MS: 900000,
      RATE_LIMIT_MAX_REQUESTS: 100,
      SESSION_SECRET: 'session-secret',
      REFRESH_HASH_SECRET: 'refresh-hash-secret-32-chars-long',
    } as ReturnType<typeof validateServerEnv>;

    // Mock session
    mockSession = {
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      abortTransaction: jest.fn(),
      endSession: jest.fn(),
    };

    // Mock model
    mockRefreshTokenModel = {
      create: jest.fn(),
      findOneAndUpdate: jest.fn(),
      updateMany: jest.fn(),
      updateOne: jest.fn(),
      aggregate: jest.fn(),
      findById: jest.fn(),
      findOne: jest.fn(),
    } as unknown as jest.Mocked<RefreshTokenModelType>;

    // Mock logger
    mockLogger = {
      warn: jest.fn(),
      error: jest.fn(),
    } as unknown as jest.Mocked<LoggerType>;

    // Mock session factory
    mockSessionFactory = jest.fn().mockResolvedValue(mockSession);

    // Mock utility functions
    mockValidateServerEnv.mockReturnValue(mockEnv);
    mockCreateTokenHash.mockReturnValue('hashed-token');
    mockGenerateRandomToken.mockReturnValue('raw-token');
    mockValidateSecret.mockReturnValue('valid-secret');
    mockNormalizeUserId.mockImplementation(
      (id: string | Types.ObjectId) => new Types.ObjectId(id)
    );
    mockCalculateExpiration.mockReturnValue(new Date('2024-12-31'));
    mockValidateObjectId.mockImplementation(() => {});

    // Create service instance
    service = new RefreshTokenService(
      mockEnv,
      mockRefreshTokenModel,
      mockLogger,
      mockSessionFactory
    );
  });

  describe('createRefreshToken', () => {
    const mockUserId = '507f1f77bcf86cd799439011';
    const mockFamilyId = 'family-123';
    const mockNow = new Date('2024-01-01');
    const mockExpiresAt = new Date('2024-12-31');

    beforeEach(() => {
      mockCalculateExpiration.mockReturnValue(mockExpiresAt);
    });

    it('should create a refresh token successfully', async () => {
      const mockDoc = { _id: new Types.ObjectId() } as any;
      mockRefreshTokenModel.create.mockResolvedValue([mockDoc]);

      const result = await service.createRefreshToken({
        userId: mockUserId,
        familyId: mockFamilyId,
        now: mockNow,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        fingerprint: 'fp-123',
      });

      expect(result).toEqual({
        token: 'raw-token',
        tokenId: mockDoc._id.toString(),
        familyId: mockFamilyId,
        expiresAt: mockExpiresAt,
      });

      expect(mockRefreshTokenModel.create).toHaveBeenCalledWith([
        {
          tokenHash: 'hashed-token',
          userId: expect.any(Types.ObjectId),
          familyId: mockFamilyId,
          issuedAt: mockNow,
          expiresAt: mockExpiresAt,
          revoked: false,
          replacedBy: null,
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          fingerprint: 'fp-123',
          lastUsedAt: mockNow,
        },
      ]);
    });

    it('should handle hash collision with retry', async () => {
      const mockDoc = { _id: new Types.ObjectId() } as any;

      // First call fails with duplicate key error, second succeeds
      mockRefreshTokenModel.create
        .mockRejectedValueOnce({ code: 11000 }) // Duplicate key error
        .mockResolvedValueOnce([mockDoc]);

      const result = await service.createRefreshToken({
        userId: mockUserId,
        familyId: mockFamilyId,
        now: mockNow,
      });

      expect(result.token).toBe('raw-token');
      expect(mockRefreshTokenModel.create).toHaveBeenCalledTimes(2);
      expect(mockGenerateRandomToken).toHaveBeenCalledTimes(2);
    });

    it('should throw error after max retries', async () => {
      // All attempts fail with duplicate key error
      mockRefreshTokenModel.create.mockRejectedValue({ code: 11000 });

      await expect(
        service.createRefreshToken({
          userId: mockUserId,
          familyId: mockFamilyId,
          now: mockNow,
        })
      ).rejects.toThrow(AppError);

      expect(mockRefreshTokenModel.create).toHaveBeenCalledTimes(
        AUTH_CONSTANTS.MAX_RETRY_ATTEMPTS
      );
    });

    it('should throw error for non-duplicate key errors', async () => {
      mockRefreshTokenModel.create.mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(
        service.createRefreshToken({
          userId: mockUserId,
          familyId: mockFamilyId,
          now: mockNow,
        })
      ).rejects.toThrow('Failed to create refresh token');
    });

    it('should use default values when not provided', async () => {
      const mockDoc = { _id: new Types.ObjectId() } as any;
      mockRefreshTokenModel.create.mockResolvedValue([mockDoc]);

      await service.createRefreshToken({
        userId: mockUserId,
      });

      expect(mockRefreshTokenModel.create).toHaveBeenCalledWith([
        expect.objectContaining({
          familyId: expect.any(String), // Should generate a UUID
          issuedAt: expect.any(Date),
          expiresAt: mockExpiresAt,
        }),
      ]);
    });
  });

  describe('rotateRefreshToken', () => {
    const mockToken = 'valid-refresh-token';
    const mockNow = new Date('2024-01-01');
    const mockOldDoc = {
      _id: new Types.ObjectId(),
      userId: new Types.ObjectId(),
      familyId: 'family-123',
    } as any;
    const mockNewDoc = { _id: new Types.ObjectId() } as any;

    beforeEach(() => {
      mockSessionFactory.mockResolvedValue(mockSession);
    });

    it('should rotate refresh token successfully', async () => {
      // Mock the rotation flow
      mockRefreshTokenModel.findOneAndUpdate.mockResolvedValue(mockOldDoc);
      mockRefreshTokenModel.create.mockResolvedValue([mockNewDoc]);
      mockRefreshTokenModel.updateOne.mockResolvedValue({
        modifiedCount: 1,
        acknowledged: true,
        matchedCount: 1,
        upsertedCount: 0,
        upsertedId: null,
      } as any);

      const result = await service.rotateRefreshToken({
        token: mockToken,
        now: mockNow,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      });

      expect(result).toEqual({
        token: 'raw-token',
        userId: mockOldDoc.userId,
        familyId: mockOldDoc.familyId,
        tokenId: mockNewDoc._id.toString(),
        expiresAt: expect.any(Date),
      });

      expect(mockSession.startTransaction).toHaveBeenCalled();
      expect(mockSession.commitTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
    });

    it('should throw error for missing token', async () => {
      await expect(
        service.rotateRefreshToken({
          token: '',
          now: mockNow,
        })
      ).rejects.toThrow('Missing refresh token');
    });

    it('should detect and handle token reuse', async () => {
      // Token not found in valid tokens, but exists in database (reuse)
      mockRefreshTokenModel.findOneAndUpdate.mockResolvedValue(null);
      mockRefreshTokenModel.findOne.mockResolvedValue({
        familyId: 'family-123',
      });
      mockRefreshTokenModel.updateMany.mockResolvedValue({
        modifiedCount: 5,
        acknowledged: true,
        matchedCount: 5,
        upsertedCount: 0,
        upsertedId: null,
      } as any);

      await expect(
        service.rotateRefreshToken({
          token: mockToken,
          now: mockNow,
        })
      ).rejects.toThrow('Refresh rotation failed');

      // Verify that the family revocation was attempted (if the token exists)
      expect(mockRefreshTokenModel.findOne).toHaveBeenCalledWith({
        tokenHash: 'hashed-token',
      });
      expect(mockSession.abortTransaction).toHaveBeenCalled();
    });

    it('should handle transaction failures', async () => {
      const dbError = new Error('Database connection failed');
      mockRefreshTokenModel.findOneAndUpdate.mockRejectedValue(dbError);

      await expect(
        service.rotateRefreshToken({
          token: mockToken,
          now: mockNow,
        })
      ).rejects.toThrow('Refresh rotation failed');

      expect(mockSession.abortTransaction).toHaveBeenCalled();
      // Note: endSession is called in handleRotationError, not in the main catch block
    });

    it('should handle abort transaction errors gracefully', async () => {
      const dbError = new Error('Database connection failed');
      const abortError = new Error('Transaction already aborted');

      mockRefreshTokenModel.findOneAndUpdate.mockRejectedValue(dbError);
      mockSession.abortTransaction.mockRejectedValue(abortError);

      await expect(
        service.rotateRefreshToken({
          token: mockToken,
          now: mockNow,
        })
      ).rejects.toThrow('Refresh rotation failed');

      expect(mockLogger.warn).toHaveBeenCalledWith(
        { error: abortError },
        'Failed to abort transaction during refresh rotation cleanup'
      );
    });
  });

  describe('revokeRefreshToken', () => {
    it('should revoke token by tokenId', async () => {
      const tokenId = '507f1f77bcf86cd799439011';
      mockRefreshTokenModel.updateMany.mockResolvedValue({
        modifiedCount: 1,
        acknowledged: true,
        matchedCount: 1,
        upsertedCount: 0,
        upsertedId: null,
      } as any);

      const result = await service.revokeRefreshToken({ tokenId });

      expect(result).toEqual({ revokedCount: 1 });
      expect(mockRefreshTokenModel.updateMany).toHaveBeenCalledWith(
        { revoked: false, _id: expect.any(Types.ObjectId) },
        { $set: { revoked: true } }
      );
    });

    it('should revoke tokens by familyId', async () => {
      const familyId = 'family-123';
      mockRefreshTokenModel.updateMany.mockResolvedValue({
        modifiedCount: 3,
        acknowledged: true,
        matchedCount: 3,
        upsertedCount: 0,
        upsertedId: null,
      } as any);

      const result = await service.revokeRefreshToken({ familyId });

      expect(result).toEqual({ revokedCount: 3 });
      expect(mockRefreshTokenModel.updateMany).toHaveBeenCalledWith(
        { revoked: false, familyId },
        { $set: { revoked: true } }
      );
    });

    it('should revoke tokens by userId', async () => {
      const userId = '507f1f77bcf86cd799439011';
      mockRefreshTokenModel.updateMany.mockResolvedValue({
        modifiedCount: 5,
        acknowledged: true,
        matchedCount: 5,
        upsertedCount: 0,
        upsertedId: null,
      } as any);

      const result = await service.revokeRefreshToken({ userId });

      expect(result).toEqual({ revokedCount: 5 });
      expect(mockRefreshTokenModel.updateMany).toHaveBeenCalledWith(
        { revoked: false, userId: expect.any(Types.ObjectId) },
        { $set: { revoked: true } }
      );
    });

    it('should throw error for missing tokenId', async () => {
      await expect(service.revokeRefreshToken({ tokenId: '' })).rejects.toThrow(
        'tokenId required'
      );
    });

    it('should throw error for missing familyId', async () => {
      await expect(
        service.revokeRefreshToken({ familyId: '' })
      ).rejects.toThrow('familyId required');
    });

    it('should throw error when no input provided', async () => {
      await expect(service.revokeRefreshToken({} as never)).rejects.toThrow(
        'Must provide tokenId, familyId, or userId'
      );
    });
  });

  describe('listUserSessions', () => {
    const mockUserId = '507f1f77bcf86cd799439011';
    const mockSessions = [
      {
        familyId: 'family-1',
        createdAt: new Date('2024-01-01'),
        lastUsedAt: new Date('2024-01-02'),
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        tokenCount: 2,
        active: true,
      },
    ];

    beforeEach(() => {
      const mockAggregate = {
        exec: jest.fn().mockResolvedValue(mockSessions),
      };
      mockRefreshTokenModel.aggregate.mockReturnValue(
        mockAggregate as unknown as ReturnType<
          RefreshTokenModelType['aggregate']
        >
      );
    });

    it('should list active user sessions', async () => {
      const result = await service.listUserSessions(mockUserId);

      expect(result).toEqual(mockSessions);
      expect(mockRefreshTokenModel.aggregate).toHaveBeenCalledWith(
        expect.arrayContaining([
          { $match: { userId: expect.any(Types.ObjectId) } },
          { $sort: { issuedAt: -1 } },
          expect.objectContaining({
            $group: expect.objectContaining({
              _id: '$familyId',
              createdAt: { $min: '$issuedAt' },
              lastUsedAt: { $max: { $ifNull: ['$lastUsedAt', '$issuedAt'] } },
            }),
          }),
        ])
      );
    });

    it('should include revoked sessions when requested', async () => {
      await service.listUserSessions(mockUserId, { includeRevoked: true });

      const pipeline = mockRefreshTokenModel.aggregate.mock.calls[0][0];
      expect(pipeline).not.toContainEqual(
        expect.objectContaining({
          $match: { activeCount: { $gt: 0 } },
        })
      );
    });

    it('should respect limit constraints', async () => {
      await service.listUserSessions(mockUserId, { limit: 5 });

      const pipeline = mockRefreshTokenModel.aggregate.mock.calls[0][0];
      expect(pipeline).toContainEqual({ $limit: 5 });
    });

    it('should enforce maximum session limit', async () => {
      await service.listUserSessions(mockUserId, { limit: 200 });

      const pipeline = mockRefreshTokenModel.aggregate.mock.calls[0][0];
      expect(pipeline).toContainEqual({
        $limit: AUTH_CONSTANTS.MAX_SESSION_LIMIT,
      });
    });

    it('should enforce minimum session limit', async () => {
      await service.listUserSessions(mockUserId, { limit: 0 });

      const pipeline = mockRefreshTokenModel.aggregate.mock.calls[0][0];
      expect(pipeline).toContainEqual({ $limit: 1 });
    });
  });

  describe('getRefreshById', () => {
    const mockTokenId = '507f1f77bcf86cd799439011';
    const mockDoc = {
      _id: new Types.ObjectId(),
      userId: new Types.ObjectId(),
      familyId: 'family-123',
      issuedAt: new Date(),
      expiresAt: new Date(),
      revoked: false,
    };

    it('should get refresh token by id', async () => {
      const mockFindById = {
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockDoc),
        }),
      };
      mockRefreshTokenModel.findById.mockReturnValue(
        mockFindById as unknown as ReturnType<RefreshTokenModelType['findById']>
      );

      const result = await service.getRefreshById(mockTokenId);

      expect(result).toEqual(mockDoc);
      expect(mockValidateObjectId).toHaveBeenCalledWith(mockTokenId, 'tokenId');
      expect(mockRefreshTokenModel.findById).toHaveBeenCalledWith(
        expect.any(Types.ObjectId)
      );
      expect(mockFindById.select).toHaveBeenCalledWith('-tokenHash');
    });

    it('should return null when token not found', async () => {
      const mockFindById = {
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(null),
        }),
      };
      mockRefreshTokenModel.findById.mockReturnValue(
        mockFindById as unknown as ReturnType<RefreshTokenModelType['findById']>
      );

      const result = await service.getRefreshById(mockTokenId);

      expect(result).toBeNull();
    });

    it('should throw error for invalid tokenId', async () => {
      mockValidateObjectId.mockImplementation(() => {
        throw new AppError('Invalid tokenId', 400);
      });

      await expect(service.getRefreshById('invalid-id')).rejects.toThrow(
        'Invalid tokenId'
      );
    });
  });

  describe('createRefreshTokenService factory function', () => {
    it('should create service with default dependencies', () => {
      const service = createRefreshTokenService(mockEnv);

      expect(service).toBeInstanceOf(RefreshTokenService);
    });
  });

  describe('error handling', () => {
    it('should handle environment validation errors', async () => {
      mockValidateSecret.mockImplementation(() => {
        throw new AppError('REFRESH_HASH_SECRET missing/weak', 500);
      });

      await expect(
        service.createRefreshToken({
          userId: '507f1f77bcf86cd799439011',
        })
      ).rejects.toThrow('REFRESH_HASH_SECRET missing/weak');
    });

    it('should handle user ID normalization errors', async () => {
      mockNormalizeUserId.mockImplementation(() => {
        throw new AppError('Invalid user ID', 400);
      });

      await expect(
        service.createRefreshToken({
          userId: 'invalid-user-id',
        })
      ).rejects.toThrow('Invalid user ID');
    });
  });
});
