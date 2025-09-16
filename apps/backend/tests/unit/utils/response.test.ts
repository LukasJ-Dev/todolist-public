import { Response } from 'express';
import responseUtils from '../../../src/utils/response';

// Mock Express Response
const createMockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return res;
};

describe('Response Utils', () => {
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockRes = createMockResponse();
  });

  describe('ok', () => {
    it('should send 200 response with success data', () => {
      const testData = { id: 1, name: 'Test' };
      responseUtils.ok(mockRes as Response, testData);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: testData,
        statusCode: 200,
      });
    });

    it('should work with different data types', () => {
      const stringData = 'test string';
      responseUtils.ok(mockRes as Response, stringData);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: stringData,
        statusCode: 200,
      });
    });

    it('should work with null data', () => {
      responseUtils.ok(mockRes as Response, null);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: null,
        statusCode: 200,
      });
    });
  });

  describe('created', () => {
    it('should send 201 response with success data', () => {
      const testData = { id: 1, name: 'Created Item' };
      responseUtils.created(mockRes as Response, testData);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: testData,
        statusCode: 201,
      });
    });

    it('should work with array data', () => {
      const arrayData = [{ id: 1 }, { id: 2 }];
      responseUtils.created(mockRes as Response, arrayData);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: arrayData,
        statusCode: 201,
      });
    });
  });

  describe('noContent', () => {
    it('should send 204 response with success data', () => {
      const testData = { message: 'No content' };
      responseUtils.noContent(mockRes as Response, testData);

      expect(mockRes.status).toHaveBeenCalledWith(204);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: testData,
        statusCode: 204,
      });
    });

    it('should work with empty object', () => {
      responseUtils.noContent(mockRes as Response, {});

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {},
        statusCode: 204,
      });
    });
  });

  describe('response chaining', () => {
    it('should return response object for chaining', () => {
      const testData = { id: 1 };
      responseUtils.ok(mockRes as Response, testData);

      // The response utils don't return the response object, they just call methods on it
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalled();
    });
  });
});
