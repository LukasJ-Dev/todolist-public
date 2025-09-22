import { Algorithm } from 'jsonwebtoken';
import { Types } from 'mongoose';

// ============================================================================
// ACCESS TOKEN TYPES
// ============================================================================

export interface CreateAccessTokenInput {
  userId: string; // stringified ObjectId
  roles?: string[]; // optional, small list
  ttlMs?: number; // default 15m
  now?: Date; // for tests
  issuer?: string; // default from env
  audience?: string; // default from env
  kid?: string; // optional key id override
}

export interface CreateAccessTokenOutput {
  token: string; // compact JWT
  exp: number; // unix seconds
  iat: number; // unix seconds
  jti: string; // random id
}

export interface VerifyAccessTokenOptions {
  clockToleranceSec?: number; // default 60s
  issuer?: string; // default from env
  audience?: string; // default from env
}

export interface VerifiedAccessToken {
  userId: string;
  roles: string[];
  iat: number;
  exp: number;
  jti: string;
  iss: string;
  aud: string | string[];
}

export type Alg = Extract<Algorithm, 'HS256' | 'RS256'>;

export type SigningMaterial =
  | {
      alg: 'HS256';
      key: Buffer;
      kid?: string;
    }
  | {
      alg: 'RS256';
      key: string;
      kid?: string;
    };

export type VerificationMaterial =
  | {
      alg: 'HS256';
      key: Buffer;
    }
  | {
      alg: 'RS256';
      key: string;
    };

// ============================================================================
// REFRESH TOKEN TYPES
// ============================================================================

export interface CreateRefreshTokenInput {
  userId: string | Types.ObjectId;
  familyId?: string; // omit on signin/signup → will be generated
  ttlMs?: number; // default 30 days
  now?: Date;
  ipAddress?: string;
  userAgent?: string;
  fingerprint?: string;
}

export interface CreateRefreshTokenOutput {
  token: string; // raw, set as HttpOnly cookie by caller
  tokenId: string;
  familyId: string;
  expiresAt: Date;
}

export interface RotateRefreshTokenInput {
  token: string; // raw refresh from cookie
  ttlMs?: number; // default 30 days
  now?: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface RotateRefreshTokenOutput {
  token: string; // new raw refresh (set as cookie by caller)
  userId: Types.ObjectId; // to mint access JWT
  familyId: string;
  tokenId: string; // new refresh doc id
  expiresAt: Date;
}

export type RevokeRefreshTokenInput =
  | { tokenId: string; familyId?: never; userId?: never }
  | { familyId: string; tokenId?: never; userId?: never }
  | { userId: string | Types.ObjectId; tokenId?: never; familyId?: never };

export interface RevokeRefreshTokenOutput {
  revokedCount: number;
}

export interface SessionSummary {
  familyId: string;
  createdAt: Date;
  lastUsedAt: Date;
  ipAddress?: string;
  userAgent?: string;
  active: boolean;
  tokenCount: number;
}

export interface ListUserSessionsOptions {
  includeRevoked?: boolean;
  limit?: number;
  now?: Date;
}
