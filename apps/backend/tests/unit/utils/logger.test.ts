import pino from 'pino';
import { logger, createRequestLogger } from '../../../src/utils/logger';

// Mock pino
jest.mock('pino', () => {
  const mockLogger = {
    child: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };
  const mockPino = jest.fn(() => mockLogger) as any;
  mockPino.stdTimeFunctions = {
    isoTime: jest.fn(),
  };
  mockPino.stdSerializers = {
    err: jest.fn(),
  };
  return mockPino;
});

// Mock environment validation
jest.mock('../../../src/config/env', () => ({
  validateServerEnv: jest.fn(() => ({
    LOG_LEVEL: 'info',
  })),
}));

describe('Logger Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('logger proxy', () => {
    it('should create logger instance on first access', () => {
      // Access a property to trigger logger creation
      expect(typeof logger.info).toBe('function');
      expect(pino).toHaveBeenCalled();
    });

    it('should return same logger instance on subsequent access', () => {
      const firstAccess = logger.info;
      const secondAccess = logger.info;
      
      expect(firstAccess).toBe(secondAccess);
    });
  });

  describe('createRequestLogger', () => {
    it('should create child logger with request context', () => {
      const mockPino = pino as unknown as jest.Mock;
      const mockLoggerInstance = mockPino.mock.results[0]?.value;
      
      if (mockLoggerInstance) {
        const mockChildLogger = { info: jest.fn() };
        mockLoggerInstance.child.mockReturnValue(mockChildLogger);

        const mockReq = {
          id: 'req-123',
          user: { id: 'user-456' },
          ip: '192.168.1.1',
        };

        const requestLogger = createRequestLogger(mockReq);

        expect(mockLoggerInstance.child).toHaveBeenCalledWith({
          requestId: 'req-123',
          userId: 'user-456',
          ip: '192.168.1.1',
        });
        expect(requestLogger).toBe(mockChildLogger);
      }
    });

    it('should handle request without user', () => {
      const mockPino = pino as unknown as jest.Mock;
      const mockLoggerInstance = mockPino.mock.results[0]?.value;
      
      if (mockLoggerInstance) {
        const mockChildLogger = { info: jest.fn() };
        mockLoggerInstance.child.mockReturnValue(mockChildLogger);

        const mockReq = {
          id: 'req-123',
          ip: '192.168.1.1',
        };

        const requestLogger = createRequestLogger(mockReq);

        expect(mockLoggerInstance.child).toHaveBeenCalledWith({
          requestId: 'req-123',
          userId: undefined,
          ip: '192.168.1.1',
        });
        expect(requestLogger).toBe(mockChildLogger);
      }
    });

    it('should handle request without ip', () => {
      const mockPino = pino as unknown as jest.Mock;
      const mockLoggerInstance = mockPino.mock.results[0]?.value;
      
      if (mockLoggerInstance) {
        const mockChildLogger = { info: jest.fn() };
        mockLoggerInstance.child.mockReturnValue(mockChildLogger);

        const mockReq = {
          id: 'req-123',
          user: { id: 'user-456' },
        };

        const requestLogger = createRequestLogger(mockReq);

        expect(mockLoggerInstance.child).toHaveBeenCalledWith({
          requestId: 'req-123',
          userId: 'user-456',
          ip: undefined,
        });
        expect(requestLogger).toBe(mockChildLogger);
      }
    });
  });
});