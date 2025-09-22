import { Schema, model, Types } from 'mongoose';

export interface IRefreshToken {
  tokenHash: string;
  userId: Types.ObjectId;
  familyId: string;
  issuedAt: Date;
  expiresAt: Date;
  revoked: boolean;
  ipAddress?: string;
  userAgent?: string;
  fingerprint?: string;
  replacedBy?: Types.ObjectId | null;
  lastUsedAt?: Date;
}

const RefreshTokenSchema = new Schema<IRefreshToken>(
  {
    tokenHash: {
      type: String,
      required: [true, 'Token hash is required'],
      unique: true,
      index: true,
      minlength: [32, 'Token hash must be at least 32 characters'],
      maxlength: [128, 'Token hash cannot exceed 128 characters'],
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'user',
      required: [true, 'User ID is required'],
      index: true,
    },
    familyId: {
      type: String,
      required: [true, 'Family ID is required'],
      index: true,
      minlength: [8, 'Family ID must be at least 8 characters'],
      maxlength: [64, 'Family ID cannot exceed 64 characters'],
    },
    issuedAt: {
      type: Date,
      required: [true, 'Issued date is required'],
      default: Date.now,
      validate: {
        validator: function (value: Date) {
          return value <= new Date();
        },
        message: 'Issued date cannot be in the future',
      },
    },
    expiresAt: {
      type: Date,
      required: [true, 'Expiration date is required'],
      validate: {
        validator: function (value: Date) {
          return value > new Date();
        },
        message: 'Expiration date must be in the future',
      },
    },
    revoked: {
      type: Boolean,
      required: [true, 'Revoked status is required'],
      default: false,
    },
    replacedBy: {
      type: Schema.Types.ObjectId,
      ref: 'refreshToken',
      default: null,
    },
    lastUsedAt: {
      type: Date,
      validate: {
        validator: function (value: Date) {
          return !value || value <= new Date();
        },
        message: 'Last used date cannot be in the future',
      },
    },
    ipAddress: {
      type: String,
      maxlength: [45, 'IP address cannot exceed 45 characters'], // IPv6 max length
    },
    userAgent: {
      type: String,
      maxlength: [500, 'User agent cannot exceed 500 characters'],
    },
    fingerprint: {
      type: String,
      maxlength: [128, 'Fingerprint cannot exceed 128 characters'],
    },
  },
  {
    collection: 'refresh_tokens',
    timestamps: false, // We manage our own timestamps
  }
);

// TTL index (auto-purge on/after expiresAt)
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound indexes for common queries
RefreshTokenSchema.index({ userId: 1, revoked: 1 });
RefreshTokenSchema.index({ familyId: 1, revoked: 1 });
RefreshTokenSchema.index({ tokenHash: 1, revoked: 1 });

export const refreshTokenModel = model<IRefreshToken>(
  'refreshToken',
  RefreshTokenSchema
);
