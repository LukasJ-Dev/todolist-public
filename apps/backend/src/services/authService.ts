import jwt from 'jsonwebtoken';
import { userModel } from '../models/userModel';

export const signAccessToken = (userId: string) => {
  return jwt.sign(userId, process.env.JWT_SECRET!, {
    expiresIn: '90d',
  });
};

export const verifyAccessToken = (token: string) => {
  return jwt.verify(token, process.env.JWT_SECRET!);
};

// Checks if the password and email is valid, if valid returns the user
// What should i name this function?
export const validatePasswordAndEmail = async (
  email: string,
  password: string
) => {
  const user = await userModel.findOne({ email }).select('+password');
  if (!user) return null;
  const isPasswordValid = await user?.checkPassword(password, user?.password!);
  user.password = undefined;
  return isPasswordValid ? user : null;
};
