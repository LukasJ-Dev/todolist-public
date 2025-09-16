import { randomUUID } from 'crypto';
import { PipelineStage, startSession, Types } from 'mongoose';
import { refreshTokenModel } from '../../models/refreshTokens';
import { AppError } from '../../utils/appError';
import { logger } from '../../utils/logger';
import { validateServerEnv } from '../../config/env';
import { AUTH_CONSTANTS, createTokenHash, generateRandomToken, validateSecret, normalizeUserId, calculateExpiration, validateObjectId } from '../../utils/auth';
import type {
  CreateRefreshTokenInput,
  CreateRefreshTokenOutput,
  RotateRefreshTokenInput,
  RotateRefreshTokenOutput,
  RevokeRefreshTokenInput,
  RevokeRefreshTokenOutput,
  SessionSummary,
  ListUserSessionsOptions,
} from '../../types/auth';

export class RefreshTokenService {
  constructor(private env: ReturnType<typeof validateServerEnv>) {}

  async createRefreshToken({
    userId,
    familyId = randomUUID(),
    ttlMs = AUTH_CONSTANTS.DEFAULT_REFRESH_TTL_MS,
    now = new Date(),
    ipAddress,
    userAgent,
    fingerprint,
  }: CreateRefreshTokenInput): Promise<CreateRefreshTokenOutput> {
    const secret = validateSecret(this.env.REFRESH_HASH_SECRET, 'REFRESH_HASH_SECRET');
    const uid = normalizeUserId(userId);
    const expiresAt = calculateExpiration(now, ttlMs);

    for (let attempt = 0; attempt < AUTH_CONSTANTS.MAX_RETRY_ATTEMPTS; attempt++) {
      const raw = generateRandomToken();
      const tokenHash = createTokenHash(raw, secret);

      try {
        const doc = await refreshTokenModel.create({
          tokenHash,
          userId: uid,
          familyId,
          issuedAt: now,
          expiresAt,
          revoked: false,
          replacedBy: null,
          ipAddress,
          userAgent,
          fingerprint,
          lastUsedAt: now,
        });

        return {
          token: raw,
          tokenId: doc._id.toString(),
          familyId,
          expiresAt,
        };
      } catch (e: unknown) {
        const error = e as { code?: number };
        if (error?.code === 11000) continue; // rare hash collision → retry
        throw new AppError('Failed to create refresh token', 500);
      }
    }

    throw new AppError('Failed to create refresh token after retries', 500);
  }

  async rotateRefreshToken({
    token,
    ttlMs = AUTH_CONSTANTS.DEFAULT_REFRESH_TTL_MS,
    now = new Date(),
    ipAddress,
    userAgent,
  }: RotateRefreshTokenInput): Promise<RotateRefreshTokenOutput> {
    if (!token) throw new AppError('Missing refresh token', 400);

    const secret = validateSecret(this.env.REFRESH_HASH_SECRET, 'REFRESH_HASH_SECRET');
    const tokenHash = createTokenHash(token, secret);

    const session = await startSession();
    session.startTransaction();
    try {
      // 1) Atomically revoke the presented, valid token
      const oldDoc = await refreshTokenModel.findOneAndUpdate(
        { tokenHash, revoked: false, expiresAt: { $gt: now } },
        { $set: { revoked: true, lastUsedAt: now } },
        { new: false, session }
      );

      if (!oldDoc) {
        // Distinguish reuse vs garbage
        const exists = await refreshTokenModel.findOne({ tokenHash }).lean() as { familyId: string } | null;
        if (exists) {
          // Reuse detected → revoke the entire family
          await refreshTokenModel.updateMany(
            { familyId: exists.familyId, revoked: false },
            { $set: { revoked: true } },
            { session }
          );
        }
        await session.abortTransaction();
        throw new AppError('Invalid or reused refresh token', 401);
      }

      // 2) Issue replacement refresh (same familyId)
      const expiresAt = calculateExpiration(now, ttlMs);

      let newRaw = '';
      let newDocId: Types.ObjectId | null = null;

      for (let attempt = 0; attempt < AUTH_CONSTANTS.MAX_RETRY_ATTEMPTS; attempt++) {
        newRaw = generateRandomToken();
        const newHash = createTokenHash(newRaw, secret);

        try {
          const [created] = await refreshTokenModel.create(
            [
              {
                tokenHash: newHash,
                userId: oldDoc.userId,
                familyId: oldDoc.familyId,
                issuedAt: now,
                expiresAt,
                revoked: false,
                replacedBy: null,
                ipAddress,
                userAgent,
              },
            ],
            { session }
          );
          newDocId = created._id as Types.ObjectId;
          break;
        } catch (e: unknown) {
          const error = e as { code?: number };
          if (error?.code === 11000) continue; // rare hash collision → regenerate
          throw e;
        }
      }

      if (!newDocId) throw new AppError('Failed to rotate refresh token', 500);

      // 3) Link old → new for audit
      await refreshTokenModel.updateOne(
        { _id: oldDoc._id },
        { $set: { replacedBy: newDocId } },
        { session }
      );

      await session.commitTransaction();

      return {
        token: newRaw,
        userId: oldDoc.userId as Types.ObjectId,
        familyId: oldDoc.familyId,
        tokenId: newDocId.toString(),
        expiresAt,
      };
    } catch (err) {
      try {
        await session.abortTransaction();
      } catch (abortErr) {
        // Ignore abort errors as the transaction may have already been aborted
        logger.warn({ error: abortErr }, 'Failed to abort transaction during refresh rotation cleanup');
      }
      if (err instanceof AppError) throw err;
      throw new AppError('Refresh rotation failed', 500);
    } finally {
      session.endSession();
    }
  }

  async revokeRefreshToken(input: RevokeRefreshTokenInput): Promise<RevokeRefreshTokenOutput> {
    let filter: Record<string, unknown> = { revoked: false };

    if ('tokenId' in input) {
      if (!input.tokenId) throw new AppError('tokenId required', 400);
      filter._id = normalizeUserId(input.tokenId);
    } else if ('familyId' in input) {
      if (!input.familyId) throw new AppError('familyId required', 400);
      filter.familyId = input.familyId;
    } else if ('userId' in input) {
      const uid = normalizeUserId(input.userId);
      filter.userId = uid;
    } else {
      throw new AppError('Must provide tokenId, familyId, or userId', 400);
    }

    const res = await refreshTokenModel.updateMany(filter, {
      $set: { revoked: true },
    });

    return { revokedCount: res.modifiedCount ?? 0 };
  }

  async listUserSessions(
    userId: string | Types.ObjectId,
    {
      includeRevoked = false,
      limit = AUTH_CONSTANTS.DEFAULT_SESSION_LIMIT,
      now = new Date(),
    }: ListUserSessionsOptions = {}
  ): Promise<SessionSummary[]> {
    const uid = normalizeUserId(userId);

    const pipeline: PipelineStage[] = [
      { $match: { userId: uid } },
      { $sort: { issuedAt: -1 } as const }, // keep literal -1 for TS
      {
        $group: {
          _id: '$familyId',
          createdAt: { $min: '$issuedAt' },
          lastUsedAt: { $max: { $ifNull: ['$lastUsedAt', '$issuedAt'] } },
          ipAddress: { $first: '$ipAddress' },
          userAgent: { $first: '$userAgent' },
          tokenCount: { $sum: 1 },
          activeCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$revoked', false] },
                    { $gt: ['$expiresAt', now] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      } as PipelineStage,
    ];

    if (!includeRevoked) {
      pipeline.push({ $match: { activeCount: { $gt: 0 } } } as PipelineStage);
    }

    pipeline.push(
      {
        $project: {
          _id: 0,
          familyId: '$_id',
          createdAt: 1,
          lastUsedAt: 1,
          ipAddress: 1,
          userAgent: 1,
          tokenCount: 1,
          active: { $gt: ['$activeCount', 0] },
        },
      } as PipelineStage,
      { $sort: { lastUsedAt: -1 } as const },
      { $limit: Math.max(1, Math.min(limit, AUTH_CONSTANTS.MAX_SESSION_LIMIT)) }
    );

    const rows = await refreshTokenModel
      .aggregate<SessionSummary>(pipeline)
      .exec();
    return rows;
  }

  async getRefreshById(tokenId: string) {
    validateObjectId(tokenId, 'tokenId');
    const doc = await refreshTokenModel
      .findById(normalizeUserId(tokenId))
      .select('-tokenHash')
      .lean();
    return doc; // null if not found
  }
}

// Environment setup
const env = validateServerEnv(process.env);

// Default service instance
const defaultService = new RefreshTokenService(env);

// Standalone functions for backward compatibility
export async function createRefreshToken(
  input: CreateRefreshTokenInput
): Promise<CreateRefreshTokenOutput> {
  return defaultService.createRefreshToken(input);
}

export async function rotateRefreshToken(
  input: RotateRefreshTokenInput
): Promise<RotateRefreshTokenOutput> {
  return defaultService.rotateRefreshToken(input);
}

export async function revokeRefreshToken(
  input: RevokeRefreshTokenInput
): Promise<RevokeRefreshTokenOutput> {
  return defaultService.revokeRefreshToken(input);
}

export async function listUserSessions(
  userId: string | Types.ObjectId,
  options?: ListUserSessionsOptions
): Promise<SessionSummary[]> {
  return defaultService.listUserSessions(userId, options);
}

export async function getRefreshById(tokenId: string) {
  return defaultService.getRefreshById(tokenId);
}

// Export the service class and default instance
export { defaultService as refreshTokenService };
export default defaultService;