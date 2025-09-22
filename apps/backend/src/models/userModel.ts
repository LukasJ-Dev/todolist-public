import { Schema, model, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  token?: string;

  checkPassword(password: string): Promise<boolean>;
}

export interface IUserModel extends Model<IUser> {
  validateCredentials(email: string, password: string): Promise<IUser | null>;
}

const UserSchema = new Schema<IUser>({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters'],
    minlength: [2, 'Name must be at least 2 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email',
    ],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    select: false,
    minlength: [6, 'Password must be at least 6 characters'],
  },
  token: {
    type: String,
    select: false,
  },
});

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    this.password = await bcrypt.hash(this.password, 12);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Method to check password
UserSchema.methods.checkPassword = async function (
  password: string
): Promise<boolean> {
  if (!this.password) return false;
  return await bcrypt.compare(password, this.password);
};

// Static method to validate credentials and return the user
UserSchema.statics.validateCredentials = async function (
  email: string,
  password: string
): Promise<IUser | null> {
  const user = await this.findOne({ email }).select('+password');
  if (!user) return null;

  const isPasswordValid = await user.checkPassword(password);
  if (!isPasswordValid) return null;

  // Remove password from the returned user object
  user.password = undefined;
  return user;
};

export const userModel = model<IUser, IUserModel>('user', UserSchema);
