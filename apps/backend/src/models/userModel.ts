import { Schema, model, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string | undefined;
  token: string;

  checkPassword(password: string, userPassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
});

UserSchema.pre('save', async function (next) {
  if (!this.password) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

UserSchema.methods.checkPassword = async function (
  password: string,
  userPassword: string | undefined
) {
  if (!userPassword) return false;
  const compare = await bcrypt.compare(password, userPassword);
  return compare;
};

export const userModel = model<IUser>('user', UserSchema);
