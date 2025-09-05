import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../types';
import jwt from 'jsonwebtoken';
import { userModel } from '../models/userModel';
import { AppError } from '../utils/appError';
import { catchAsync } from '../utils/catchAsync';

export const requireAuth = catchAsync(
  async (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    const authHeader = req.header('authorization');

    const token = req.cookies?.jwt
      ? authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.slice(7).trim()
        : undefined
      : undefined;

    if (!token) throw new AppError('Unauthorized', 401);

    const payload = jwt.verify(token, process.env.JWT_SECRET!, {
      algorithms: ['HS256'],
    }) as jwt.JwtPayload & { userId: string };

    const userId = payload.userId;

    const user = await userModel.findById(userId).select('_id, name, email');
    if (!user) throw new AppError('Unauthorized', 401);
    req.user = user;
    next();
  }
);
