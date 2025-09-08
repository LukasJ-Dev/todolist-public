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
    tokenHash: { type: String, required: true, unique: true, index: true },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'user',
      required: true,
      index: true,
    },
    familyId: { type: String, required: true, index: true },
    issuedAt: { type: Date, required: true, default: Date.now },
    expiresAt: { type: Date, required: true }, // TTL added below
    revoked: { type: Boolean, required: true, default: false },
    replacedBy: {
      type: Schema.Types.ObjectId,
      ref: 'refreshToken',
      default: null,
    },
    lastUsedAt: { type: Date },
    ipAddress: { type: String },
    userAgent: { type: String },
    fingerprint: { type: String },
  },
  { collection: 'refresh_tokens' }
);

// TTL index (auto-purge on/after expiresAt)
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const refreshTokenModel = model<IRefreshToken>(
  'refreshToken',
  RefreshTokenSchema
);
