import { Request, Response } from 'express';
import { userModel } from '../models/userModel';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/appError';
import {
  signAccessToken,
  validatePasswordAndEmail,
} from '../services/authService';
import response from '../utils/response';

export const signup = catchAsync(async (req: Request, res: Response) => {
  const user = await userModel.create(req.body);

  const token = signAccessToken(user._id.toString());

  const jwtExpires = 90; //TODO: Add JWTExpires
  res.cookie('jwt', token, {
    expires: new Date(Date.now() + jwtExpires * 24 * 60 * 60 * 1000),
    httpOnly: true,
    // sameSite: "none",
    secure: false, // req.secure || req.headers["x-forwarded-proto"] === "https",
  });
  response.created(res, { user, token });
});

export const login = catchAsync(async (req: Request, res: Response) => {
  const user = await validatePasswordAndEmail(
    req.body.email,
    req.body.password
  );
  if (!user) throw new AppError('Wrong email or password', 400);

  const jwtExpires = 90; //TODO: Add JWTExpires
  const token = signAccessToken(user._id.toString());
  res.cookie('jwt', token, {
    expires: new Date(Date.now() + jwtExpires * 24 * 60 * 60 * 1000),
    httpOnly: true,
    // sameSite: "none",
    secure: false, // req.secure || req.headers["x-forwarded-proto"] === "https",
  });
  response.ok(res, { user, token });
});
