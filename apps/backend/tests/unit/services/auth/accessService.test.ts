import jwt, { TokenExpiredError, JsonWebTokenError } from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { AppError } from '../../../../src/utils/appError';
import { AccessTokenService } from '../../../../src/services/auth/accessService';

// Mock dependencies
jest.mock('jsonwebtoken');
jest.mock('crypto');

const mockJwt = jwt as jest.Mocked<typeof jwt>;
const mockRandomUUID = randomUUID as jest.MockedFunction<typeof randomUUID>;

describe('AccessTokenService', () => {
  let service: AccessTokenService;
  let mockEnv: any;

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
      DATABASE_SERVER_SELECTION_TIMEOUT_MS: 5000,
      DATABASE_MAX_IDLE_TIME_MS: 30000,
      DATABASE_HEARTBEAT_FREQUENCY_MS: 10000,
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
    };

    service = new AccessTokenService(mockEnv);
    mockRandomUUID.mockReturnValue('mock-jti-123' as any);
  });

  describe('createAccessToken', () => {
    it('should create a valid access token', () => {
      const mockToken = 'mock.jwt.token';
      const mockDecoded = {
        iat: 1234567890,
        exp: 1234567890 + 900,
        sub: 'user123',
        jti: 'mock-jti-123',
      };

      mockJwt.sign.mockReturnValue(mockToken as any);
      mockJwt.decode.mockReturnValue(mockDecoded as any);

      const result = service.createAccessToken({
        userId: 'user123',
        roles: ['admin'],
      });

      expect(result).toEqual({
        token: mockToken,
        exp: expect.any(Number),
        iat: mockDecoded.iat,
        jti: 'mock-jti-123',
      });

      expect(mockJwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          roles: ['admin'],
          exp: expect.any(Number),
          jti: 'mock-jti-123',
          sub: 'user123',
        }),
        expect.any(Buffer),
        expect.objectContaining({
          algorithm: 'HS256',
          issuer: 'test-issuer',
          audience: 'test-audience',
        })
      );
    });

    it('should handle very short TTL gracefully', () => {
      const mockToken = 'mock.jwt.token';
      const mockDecoded = { iat: 1234567890, exp: 1234567890 + 60, sub: 'user123', jti: 'mock-jti-123' };
      
      mockJwt.sign.mockReturnValue(mockToken as any);
      mockJwt.decode.mockReturnValue(mockDecoded as any);

      // Should not throw error even with very short TTL
      expect(() => {
        service.createAccessToken({
          userId: 'user123',
          ttlMs: 1000, // 1 second
        });
      }).not.toThrow();

      expect(mockJwt.sign).toHaveBeenCalled();
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify a valid token', () => {
      const mockDecoded = {
        sub: 'user123',
        exp: 1234567890 + 900,
        iat: 1234567890,
        jti: 'mock-jti-123',
        iss: 'test-issuer',
        aud: 'test-audience',
        roles: ['admin'],
      };

      mockJwt.verify.mockReturnValue(mockDecoded as any);

      const result = service.verifyAccessToken('valid.jwt.token');

      expect(result).toEqual({
        userId: 'user123',
        roles: ['admin'],
        iat: 1234567890,
        exp: 1234567890 + 900,
        jti: 'mock-jti-123',
        iss: 'test-issuer',
        aud: 'test-audience',
      });
    });

    it('should throw error for missing token', () => {
      expect(() => service.verifyAccessToken('')).toThrow(AppError);
      expect(() => service.verifyAccessToken('')).toThrow('Missing access token');
    });

    it('should throw error for expired token', () => {
      const expiredError = new TokenExpiredError('Token expired', new Date());
      mockJwt.verify.mockImplementation(() => {
        throw expiredError;
      });

      expect(() => service.verifyAccessToken('expired.token')).toThrow(AppError);
      expect(() => service.verifyAccessToken('expired.token')).toThrow('Access token expired');
    });

    it('should throw error for invalid token', () => {
      const invalidError = new JsonWebTokenError('Invalid token');
      mockJwt.verify.mockImplementation(() => {
        throw invalidError;
      });

      expect(() => service.verifyAccessToken('invalid.token')).toThrow(AppError);
      expect(() => service.verifyAccessToken('invalid.token')).toThrow('Invalid access token');
    });

    it('should handle unexpected token format gracefully', () => {
      const malformedDecoded = {
        sub: 'user123',
        // Missing exp and jti
      };
      mockJwt.verify.mockReturnValue(malformedDecoded as any);

      expect(() => service.verifyAccessToken('malformed.token')).toThrow(AppError);
      expect(() => service.verifyAccessToken('malformed.token')).toThrow('Access token verification failed');
    });
  });

  describe('error handling', () => {
    it('should throw error for weak JWT secret', () => {
      const invalidEnv = { ...mockEnv, JWT_SECRET: 'short' };
      const invalidService = new AccessTokenService(invalidEnv);
      
      expect(() => {
        invalidService.createAccessToken({ userId: 'user123' });
      }).toThrow(AppError);
    });

    it('should throw error for missing JWT private key in RS256', () => {
      const invalidEnv = { ...mockEnv, JWT_ALG: 'RS256', JWT_PRIVATE_KEY: undefined };
      const invalidService = new AccessTokenService(invalidEnv);
      
      expect(() => {
        invalidService.createAccessToken({ userId: 'user123' });
      }).toThrow(AppError);
    });
  });

  describe('RS256 algorithm support', () => {
    beforeEach(() => {
      mockEnv.JWT_ALG = 'RS256';
      service = new AccessTokenService(mockEnv);
    });

    it('should work with RS256 algorithm', () => {
      const mockToken = 'mock.jwt.token';
      const mockDecoded = { iat: 1234567890, exp: 1234567890 + 900, sub: 'user123', jti: 'mock-jti-123' };
      
      mockJwt.sign.mockReturnValue(mockToken as any);
      mockJwt.decode.mockReturnValue(mockDecoded as any);

      // Should not throw error with RS256
      expect(() => {
        service.createAccessToken({ userId: 'user123' });
      }).not.toThrow();

      expect(mockJwt.sign).toHaveBeenCalled();
    });
  });
});