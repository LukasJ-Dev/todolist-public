import { validate } from '../../../src/middlewares/validate';
import { AppError } from '../../../src/utils/appError';
import { z } from 'zod';

describe('Validate Middleware', () => {
  let mockReq: any;
  let mockRes: any;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockReq = {
      body: {},
      params: {},
      query: {},
    };
    mockRes = {};
    mockNext = jest.fn();
  });

  describe('when all schemas are provided', () => {
    const bodySchema = z.object({
      name: z.string(),
      email: z.string().email(),
    });

    const paramsSchema = z.object({
      id: z.string(),
    });

    const querySchema = z.object({
      page: z.string().optional(),
    });

    const validateMiddleware = validate({
      body: bodySchema,
      params: paramsSchema,
      query: querySchema,
    });

    it('should call next() when all data is valid', async () => {
      mockReq.body = { name: 'John', email: 'john@example.com' };
      mockReq.params = { id: '123' };
      mockReq.query = { page: '1' };

      await validateMiddleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should call next() with AppError when body validation fails', async () => {
      mockReq.body = { name: 'John' }; // missing email
      mockReq.params = { id: '123' };
      mockReq.query = { page: '1' };

      await validateMiddleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = mockNext.mock.calls[0][0];
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('ValidationError');
      expect(error.details).toEqual([
        {
          path: 'email',
          message: 'Invalid input: expected string, received undefined',
        },
      ]);
    });

    it('should call next() with AppError when params validation fails', async () => {
      mockReq.body = { name: 'John', email: 'john@example.com' };
      mockReq.params = {}; // missing id
      mockReq.query = { page: '1' };

      await validateMiddleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = mockNext.mock.calls[0][0];
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('ValidationError');
      expect(error.details).toEqual([
        {
          path: 'id',
          message: 'Invalid input: expected string, received undefined',
        },
      ]);
    });

    it('should call next() with AppError when query validation fails', async () => {
      // Create a schema that will fail validation
      const querySchema = z.object({
        page: z.number(), // Expects number, not string
      });

      const validateMiddleware = validate({
        query: querySchema,
      });

      mockReq.query = { page: 'invalid' }; // string instead of number

      await validateMiddleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = mockNext.mock.calls[0][0];
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('ValidationError');
    });

    it('should handle multiple validation errors', async () => {
      mockReq.body = { name: 123, email: 'invalid-email' }; // wrong types
      mockReq.params = {}; // missing id
      mockReq.query = { page: 'invalid' };

      await validateMiddleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = mockNext.mock.calls[0][0];
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('ValidationError');
      expect(error.details.length).toBeGreaterThan(1);
    });
  });

  describe('when only some schemas are provided', () => {
    it('should only validate provided schemas', async () => {
      const bodySchema = z.object({
        name: z.string(),
      });

      const validateMiddleware = validate({
        body: bodySchema,
        // no params or query schemas
      });

      mockReq.body = { name: 'John' };
      mockReq.params = { invalid: 'data' }; // should be ignored
      mockReq.query = { invalid: 'data' }; // should be ignored

      await validateMiddleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should validate params only', async () => {
      const paramsSchema = z.object({
        id: z.string(),
      });

      const validateMiddleware = validate({
        params: paramsSchema,
      });

      mockReq.body = { invalid: 'data' }; // should be ignored
      mockReq.params = { id: '123' };
      mockReq.query = { invalid: 'data' }; // should be ignored

      await validateMiddleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should validate query only', async () => {
      const querySchema = z.object({
        page: z.string(),
      });

      const validateMiddleware = validate({
        query: querySchema,
      });

      mockReq.body = { invalid: 'data' }; // should be ignored
      mockReq.params = { invalid: 'data' }; // should be ignored
      mockReq.query = { page: '1' };

      await validateMiddleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe('when no schemas are provided', () => {
    it('should call next() without validation', async () => {
      const validateMiddleware = validate({});

      mockReq.body = { any: 'data' };
      mockReq.params = { any: 'data' };
      mockReq.query = { any: 'data' };

      await validateMiddleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe('error handling', () => {
    it('should handle non-ZodError exceptions', async () => {
      // Mock a schema that throws a non-ZodError
      const throwingSchema = {
        parse: jest.fn().mockImplementation(() => {
          throw new Error('Unexpected error');
        }),
      };

      const validateMiddleware = validate({
        body: throwingSchema as any,
      });

      mockReq.body = { name: 'John' };

      await validateMiddleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(mockNext.mock.calls[0][0].message).toBe('Unexpected error');
    });

    it('should properly format nested path errors', async () => {
      const bodySchema = z.object({
        user: z.object({
          profile: z.object({
            name: z.string(),
          }),
        }),
      });

      const validateMiddleware = validate({
        body: bodySchema,
      });

      mockReq.body = {
        user: {
          profile: {
            name: 123, // wrong type
          },
        },
      };

      await validateMiddleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = mockNext.mock.calls[0][0];
      expect(error.details[0].path).toBe('user.profile.name');
    });

    it('should handle array validation errors', async () => {
      const bodySchema = z.object({
        items: z.array(z.string()),
      });

      const validateMiddleware = validate({
        body: bodySchema,
      });

      mockReq.body = {
        items: ['valid', 123, 'valid'], // mixed types
      };

      await validateMiddleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = mockNext.mock.calls[0][0];
      expect(error.details[0].path).toBe('items.1');
    });
  });

  describe('edge cases', () => {
    it('should handle empty objects', async () => {
      const bodySchema = z.object({});

      const validateMiddleware = validate({
        body: bodySchema,
      });

      mockReq.body = {};

      await validateMiddleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should handle null and undefined values', async () => {
      const bodySchema = z.object({
        name: z.string().nullable().optional(),
      });

      const validateMiddleware = validate({
        body: bodySchema,
      });

      mockReq.body = { name: null };

      await validateMiddleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should handle complex nested validation', async () => {
      const bodySchema = z.object({
        users: z.array(
          z.object({
            id: z.string(),
            email: z.string().email(),
            preferences: z
              .object({
                theme: z.enum(['light', 'dark']),
                notifications: z.boolean(),
              })
              .optional(),
          })
        ),
      });

      const validateMiddleware = validate({
        body: bodySchema,
      });

      mockReq.body = {
        users: [
          {
            id: '1',
            email: 'user1@example.com',
            preferences: {
              theme: 'dark',
              notifications: true,
            },
          },
          {
            id: '2',
            email: 'user2@example.com',
            // preferences optional
          },
        ],
      };

      await validateMiddleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });
  });
});
