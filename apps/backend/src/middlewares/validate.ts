import { ZodObject, ZodRawShape, ZodError } from 'zod';
import { NextFunction, Response, Request } from 'express';
import { AppError } from '../utils/appError';

type Schemas = {
  body?: ZodObject<ZodRawShape>;
  params?: ZodObject<ZodRawShape>;
  query?: ZodObject<ZodRawShape>;
};

export const validate =
  (schema: Schemas) =>
  async (req: Request, _: Response, next: NextFunction) => {
    try {
      schema.body && schema.body.parse(req.body);
      schema.params && schema.params.parse(req.params);
      schema.query && schema.query.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.issues.map((i) => ({
          path: i.path.join('.'),
          message: i.message,
        }));
        const z = new AppError('ValidationError', 400);
        z.details = details;
        return next(z);
      }
      next(error);
    }
  };
