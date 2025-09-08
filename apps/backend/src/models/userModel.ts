import { Schema, model, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string | undefined;
  token: string;

  checkPassword(password: string, userPassword: string): Promise<boolean>;
}

export interface IUserModel extends Model<IUser> {
  validateCredentials(email: string, password: string): Promise<IUser | null>;
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

// validate credentials and return the user
UserSchema.statics.validateCredentials = async function (
  email: string,
  password: string
) {
  const user = await this.findOne({ email }).select('+password');
  if (!user) return null;
  const isPasswordValid = await user?.checkPassword(password, user?.password!);
  user.password = undefined;
  return isPasswordValid ? user : null;
};

export const userModel = model<IUser, IUserModel>('user', UserSchema);
