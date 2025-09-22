import {
  createRequireAuth,
  createRequireAuthWithUser,
} from '../../../src/middlewares/auth';
import { CookieService } from '../../../src/services/auth/cookieService';
import { AccessTokenService } from '../../../src/services/auth/accessService';
import { AppError } from '../../../src/utils/appError';

// Mock the services
jest.mock('../../../src/services/auth/cookieService');
jest.mock('../../../src/services/auth/accessService');

describe('Auth Middleware', () => {
  let mockCookieService: jest.Mocked<CookieService>;
  let mockAccessTokenService: jest.Mocked<AccessTokenService>;
  let mockUserModel: any;
  let mockReq: any;
  let mockRes: any;
  let mockNext: jest.Mock;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock services
    mockCookieService = {
      readAccessFromRequest: jest.fn(),
    } as any;

    mockAccessTokenService = {
      verifyAccessToken: jest.fn(),
    } as any;

    // Create mock user model with chaining
    mockUserModel = {
      findById: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      lean: jest.fn(),
    };

    // Create mock request and response
    mockReq = {
      auth: undefined,
      user: undefined,
      headers: {},
      cookies: {},
      get: jest.fn(),
    };
    mockRes = {};
    mockNext = jest.fn();
  });

  describe('createRequireAuth', () => {
    let requireAuth: any;

    beforeEach(() => {
      requireAuth = createRequireAuth(
        mockCookieService,
        mockAccessTokenService
      );
    });

    describe('when no token is provided', () => {
      it('should call next() with AppError 401', () => {
        mockCookieService.readAccessFromRequest.mockReturnValue(null);

        requireAuth(mockReq, mockRes, mockNext);

        expect(mockCookieService.readAccessFromRequest).toHaveBeenCalledWith(
          mockReq
        );
        expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
        expect(mockNext.mock.calls[0][0].statusCode).toBe(401);
        expect(mockNext.mock.calls[0][0].message).toBe('Unauthorized');
      });

      it('should call next() with AppError 401 when token is empty string', () => {
        mockCookieService.readAccessFromRequest.mockReturnValue('');

        requireAuth(mockReq, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
        expect(mockNext.mock.calls[0][0].statusCode).toBe(401);
      });
    });

    describe('when token is provided', () => {
      const mockPayload = {
        userId: 'user123',
        roles: ['user'],
        iat: 1234567890,
        exp: 1234567890 + 3600,
        jti: 'token-id',
        iss: 'todolist-api',
        aud: 'todolist-client',
      };

      it('should set req.auth and call next() when token is valid', () => {
        mockCookieService.readAccessFromRequest.mockReturnValue('valid-token');
        mockAccessTokenService.verifyAccessToken.mockReturnValue(mockPayload);

        requireAuth(mockReq, mockRes, mockNext);

        expect(mockCookieService.readAccessFromRequest).toHaveBeenCalledWith(
          mockReq
        );
        expect(mockAccessTokenService.verifyAccessToken).toHaveBeenCalledWith(
          'valid-token'
        );
        expect(mockReq.auth).toEqual(mockPayload);
        expect(mockNext).toHaveBeenCalledWith();
      });

      it('should call next() with AppError when token verification fails', () => {
        const verificationError = new AppError('Token expired', 401);
        mockCookieService.readAccessFromRequest.mockReturnValue(
          'expired-token'
        );
        mockAccessTokenService.verifyAccessToken.mockImplementation(() => {
          throw verificationError;
        });

        requireAuth(mockReq, mockRes, mockNext);

        expect(mockAccessTokenService.verifyAccessToken).toHaveBeenCalledWith(
          'expired-token'
        );
        expect(mockNext).toHaveBeenCalledWith(verificationError);
        expect(mockReq.auth).toBeUndefined();
      });

      it('should call next() with generic AppError when non-AppError is thrown', () => {
        mockCookieService.readAccessFromRequest.mockReturnValue(
          'invalid-token'
        );
        mockAccessTokenService.verifyAccessToken.mockImplementation(() => {
          throw new Error('Unexpected error');
        });

        requireAuth(mockReq, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
        expect(mockNext.mock.calls[0][0].statusCode).toBe(401);
        expect(mockNext.mock.calls[0][0].message).toBe('Unauthorized');
      });
    });
  });

  describe('createRequireAuthWithUser', () => {
    let requireAuthWithUser: any;

    beforeEach(() => {
      requireAuthWithUser = createRequireAuthWithUser(
        mockCookieService,
        mockAccessTokenService,
        mockUserModel
      );
    });

    describe('when no token is provided', () => {
      it('should call next() with AppError 401', async () => {
        mockCookieService.readAccessFromRequest.mockReturnValue(null);

        await requireAuthWithUser(mockReq, mockRes, mockNext);

        expect(mockCookieService.readAccessFromRequest).toHaveBeenCalledWith(
          mockReq
        );
        expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
        expect(mockNext.mock.calls[0][0].statusCode).toBe(401);
        expect(mockNext.mock.calls[0][0].message).toBe(
          'User not authenticated'
        );
      });
    });

    describe('when token is provided', () => {
      const mockPayload = {
        userId: 'user123',
        roles: ['user'],
        iat: 1234567890,
        exp: 1234567890 + 3600,
        jti: 'token-id',
        iss: 'todolist-api',
        aud: 'todolist-client',
      };

      const mockUserDoc = {
        _id: 'user123',
        name: 'John Doe',
        email: 'john@example.com',
      };

      it('should set req.auth and req.user and call next() when everything is valid', async () => {
        mockCookieService.readAccessFromRequest.mockReturnValue('valid-token');
        mockAccessTokenService.verifyAccessToken.mockReturnValue(mockPayload);
        mockUserModel.lean.mockResolvedValue(mockUserDoc);

        await requireAuthWithUser(mockReq, mockRes, mockNext);

        expect(mockCookieService.readAccessFromRequest).toHaveBeenCalledWith(
          mockReq
        );
        expect(mockAccessTokenService.verifyAccessToken).toHaveBeenCalledWith(
          'valid-token'
        );
        expect(mockUserModel.findById).toHaveBeenCalledWith('user123');
        expect(mockUserModel.select).toHaveBeenCalledWith('name email');
        expect(mockUserModel.lean).toHaveBeenCalled();

        expect(mockReq.auth).toEqual(mockPayload);
        expect(mockReq.user).toEqual({
          id: 'user123',
          name: 'John Doe',
          email: 'john@example.com',
        });
        expect(mockNext).toHaveBeenCalledWith();
      });

      it('should call next() with AppError when user is not found', async () => {
        mockCookieService.readAccessFromRequest.mockReturnValue('valid-token');
        mockAccessTokenService.verifyAccessToken.mockReturnValue(mockPayload);
        mockUserModel.lean.mockResolvedValue(null);

        await requireAuthWithUser(mockReq, mockRes, mockNext);

        expect(mockUserModel.findById).toHaveBeenCalledWith('user123');
        expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
        expect(mockNext.mock.calls[0][0].statusCode).toBe(401);
        expect(mockNext.mock.calls[0][0].message).toBe('Unauthorized');
        expect(mockReq.user).toBeUndefined();
      });

      it('should call next() with AppError when token verification fails', async () => {
        const verificationError = new AppError('Token expired', 401);
        mockCookieService.readAccessFromRequest.mockReturnValue(
          'expired-token'
        );
        mockAccessTokenService.verifyAccessToken.mockImplementation(() => {
          throw verificationError;
        });

        await requireAuthWithUser(mockReq, mockRes, mockNext);

        expect(mockAccessTokenService.verifyAccessToken).toHaveBeenCalledWith(
          'expired-token'
        );
        expect(mockNext).toHaveBeenCalledWith(verificationError);
        expect(mockUserModel.findById).not.toHaveBeenCalled();
        expect(mockReq.auth).toBeUndefined();
        expect(mockReq.user).toBeUndefined();
      });

      it('should call next() with AppError when database query fails', async () => {
        mockCookieService.readAccessFromRequest.mockReturnValue('valid-token');
        mockAccessTokenService.verifyAccessToken.mockReturnValue(mockPayload);
        mockUserModel.lean.mockRejectedValue(new Error('Database error'));

        await requireAuthWithUser(mockReq, mockRes, mockNext);

        expect(mockUserModel.findById).toHaveBeenCalledWith('user123');
        expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
        expect(mockNext.mock.calls[0][0].statusCode).toBe(401);
        expect(mockNext.mock.calls[0][0].message).toBe('Unauthorized');
      });

      it('should call next() with generic AppError when non-AppError is thrown during token verification', async () => {
        mockCookieService.readAccessFromRequest.mockReturnValue(
          'invalid-token'
        );
        mockAccessTokenService.verifyAccessToken.mockImplementation(() => {
          throw new Error('Unexpected error');
        });

        await requireAuthWithUser(mockReq, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
        expect(mockNext.mock.calls[0][0].statusCode).toBe(401);
        expect(mockNext.mock.calls[0][0].message).toBe('Unauthorized');
      });
    });
  });

  describe('factory function behavior', () => {
    it('should create independent middleware instances', () => {
      const middleware1 = createRequireAuth(
        mockCookieService,
        mockAccessTokenService
      );
      const middleware2 = createRequireAuth(
        mockCookieService,
        mockAccessTokenService
      );

      expect(middleware1).not.toBe(middleware2);
      expect(typeof middleware1).toBe('function');
      expect(typeof middleware2).toBe('function');
    });

    it('should use the provided services in the created middleware', () => {
      const customCookieService = { readAccessFromRequest: jest.fn() } as any;
      const customAccessService = { verifyAccessToken: jest.fn() } as any;

      const middleware = createRequireAuth(
        customCookieService,
        customAccessService
      );

      customCookieService.readAccessFromRequest.mockReturnValue('token');
      customAccessService.verifyAccessToken.mockReturnValue({ userId: 'test' });

      middleware(mockReq, mockRes, mockNext);

      expect(customCookieService.readAccessFromRequest).toHaveBeenCalledWith(
        mockReq
      );
      expect(customAccessService.verifyAccessToken).toHaveBeenCalledWith(
        'token'
      );
    });
  });
});
