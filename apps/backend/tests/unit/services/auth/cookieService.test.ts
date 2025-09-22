import { CookieService } from '../../../../src/services/auth/cookieService';

describe('CookieService', () => {
  let service: CookieService;
  let mockEnv: any;

  beforeEach(() => {
    mockEnv = {
      COOKIE_SAMESITE: 'strict',
      COOKIE_SECURE: true,
      COOKIE_DOMAIN: 'localhost',
      ACCESS_COOKIE_NAME: 'accessToken',
      REFRESH_COOKIE_NAME: 'refreshToken',
    };

    service = new CookieService(mockEnv, 'http://localhost:3000');
  });

  describe('readAccessFromRequest', () => {
    it('should read access token from cookie', () => {
      const mockRequest = {
        cookies: { accessToken: 'test-access-token' },
        header: jest.fn(),
      };

      const result = service.readAccessFromRequest(mockRequest as any);

      expect(result).toBe('test-access-token');
    });

    it('should read access token from Authorization header', () => {
      const mockRequest = {
        cookies: {},
        header: jest.fn().mockImplementation((name: string) => {
          if (name === 'authorization') return 'Bearer test-access-token';
          return undefined;
        }),
      };

      const result = service.readAccessFromRequest(mockRequest as any);

      expect(result).toBe('test-access-token');
    });

    it('should return null when no token found', () => {
      const mockRequest = {
        cookies: {},
        header: jest.fn().mockReturnValue(undefined),
      };

      const result = service.readAccessFromRequest(mockRequest as any);

      expect(result).toBeNull();
    });
  });

  describe('parseRefreshFromRequest', () => {
    it('should read refresh token from cookie', () => {
      const mockRequest = {
        cookies: { refreshToken: 'test-refresh-token' },
      };

      const result = service.parseRefreshFromRequest(mockRequest as any);

      expect(result).toBe('test-refresh-token');
    });

    it('should return null when no cookie found', () => {
      const mockRequest = {
        cookies: {},
      };

      const result = service.parseRefreshFromRequest(mockRequest as any);

      expect(result).toBeNull();
    });
  });

  describe('issueAuthCookies', () => {
    it('should throw error for missing access token', () => {
      const mockResponse = {
        cookie: jest.fn(),
      };

      expect(() => {
        service.issueAuthCookies({
          res: mockResponse as any,
          accessToken: '',
          accessTtlMs: 900000,
          refreshToken: 'valid-token',
          refreshExpiresAt: new Date(),
        });
      }).toThrow();
    });

    it('should throw error for missing refresh token', () => {
      const mockResponse = {
        cookie: jest.fn(),
      };

      expect(() => {
        service.issueAuthCookies({
          res: mockResponse as any,
          accessToken: 'valid-token',
          accessTtlMs: 900000,
          refreshToken: '',
          refreshExpiresAt: new Date(),
        });
      }).toThrow();
    });

    it('should throw error when SameSite=None and Secure=false', () => {
      const mockResponse = {
        cookie: jest.fn(),
      };

      expect(() => {
        service.issueAuthCookies({
          res: mockResponse as any,
          accessToken: 'valid-token',
          accessTtlMs: 900000,
          refreshToken: 'valid-token',
          refreshExpiresAt: new Date(),
          sameSite: 'none',
          secure: false,
        });
      }).toThrow();
    });
  });

  describe('clearAuthCookies', () => {
    it('should clear both access and refresh cookies', () => {
      const mockResponse = {
        clearCookie: jest.fn(),
      };

      service.clearAuthCookies({ res: mockResponse as any });

      expect(mockResponse.clearCookie).toHaveBeenCalledTimes(2);
    });
  });
});
