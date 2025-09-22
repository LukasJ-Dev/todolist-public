import { randomUUID } from 'crypto';
import {
  PipelineStage,
  startSession,
  Types,
  ClientSession,
  Model,
  Document,
} from 'mongoose';
import { refreshTokenModel, IRefreshToken } from '../../models/refreshTokens';
import { AppError } from '../../utils/appError';
import { logger } from '../../utils/logger';
import { validateServerEnv } from '../../config/env';
import pino from 'pino';
import {
  AUTH_CONSTANTS,
  createTokenHash,
  generateRandomToken,
  validateSecret,
  normalizeUserId,
  calculateExpiration,
  validateObjectId,
} from '../../utils/auth';
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

// ============================================================================
// TYPES FOR DEPENDENCY INJECTION
// ============================================================================

interface MongoError {
  code?: number;
  codeName?: string;
}

// Use the actual Mongoose model type
export type RefreshTokenModelType = Model<IRefreshToken>;

// Use the actual Pino logger type
export type LoggerType = pino.Logger;

// Session factory type
export type SessionFactory = () => Promise<ClientSession>;

// Type for refresh token document with Mongoose properties
type RefreshTokenDocument = IRefreshToken & Document;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function isMongoError(err: unknown): err is MongoError {
  return typeof err === 'object' && err !== null && 'code' in err;
}

function isDuplicateKeyError(err: unknown): boolean {
  return isMongoError(err) && err.code === 11000;
}

export class RefreshTokenService {
  constructor(
    private env: ReturnType<typeof validateServerEnv>,
    private refreshTokenModel: RefreshTokenModelType = refreshTokenModel,
    private logger: LoggerType = logger,
    private sessionFactory: SessionFactory = startSession
  ) {
    // Dependencies are injected via constructor parameters
    // Default values use the imported instances for backward compatibility
  }

  async createRefreshToken({
    userId,
    familyId = randomUUID(),
    ttlMs = AUTH_CONSTANTS.DEFAULT_REFRESH_TTL_MS,
    now = new Date(),
    ipAddress,
    userAgent,
    fingerprint,
  }: CreateRefreshTokenInput): Promise<CreateRefreshTokenOutput> {
    const secret = validateSecret(
      this.env.REFRESH_HASH_SECRET,
      'REFRESH_HASH_SECRET'
    );
    const uid = normalizeUserId(userId);
    const expiresAt = calculateExpiration(now, ttlMs);

    for (
      let attempt = 0;
      attempt < AUTH_CONSTANTS.MAX_RETRY_ATTEMPTS;
      attempt++
    ) {
      const raw = generateRandomToken();
      const tokenHash = createTokenHash(raw, secret);

      try {
        const [doc] = await this.refreshTokenModel.create([
          {
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
          },
        ]);

        return {
          token: raw,
          tokenId: doc._id.toString(),
          familyId,
          expiresAt,
        };
      } catch (e: unknown) {
        if (isDuplicateKeyError(e)) continue; // rare hash collision → retry
        throw new AppError('Failed to create refresh token', 500);
      }
    }

    throw new AppError('Failed to create refresh token after retries', 500);
  }

  // ============================================================================
  // PRIVATE HELPER METHODS FOR ROTATION
  // ============================================================================

  private async findAndRevokeOldToken(
    token: string,
    now: Date,
    session?: ClientSession
  ): Promise<RefreshTokenDocument> {
    const secret = validateSecret(
      this.env.REFRESH_HASH_SECRET,
      'REFRESH_HASH_SECRET'
    );
    const tokenHash = createTokenHash(token, secret);

    // Atomically revoke the presented, valid token
    const oldDoc = await this.refreshTokenModel.findOneAndUpdate(
      { tokenHash, revoked: false, expiresAt: { $gt: now } },
      { $set: { revoked: true, lastUsedAt: now } },
      { new: false, session }
    );

    if (!oldDoc) {
      // Distinguish reuse vs garbage
      const exists = await this.refreshTokenModel.findOne({ tokenHash }).lean();

      if (exists) {
        // Reuse detected → revoke the entire family
        await this.refreshTokenModel.updateMany(
          { familyId: exists.familyId, revoked: false },
          { $set: { revoked: true } },
          { session }
        );
      }
      throw new AppError('Invalid or reused refresh token', 401);
    }

    return oldDoc;
  }

  private async createReplacementToken(
    oldDoc: RefreshTokenDocument,
    ttlMs: number,
    now: Date,
    ipAddress?: string,
    userAgent?: string,
    session?: ClientSession
  ): Promise<{ raw: string; docId: Types.ObjectId }> {
    const secret = validateSecret(
      this.env.REFRESH_HASH_SECRET,
      'REFRESH_HASH_SECRET'
    );
    const expiresAt = calculateExpiration(now, ttlMs);

    for (
      let attempt = 0;
      attempt < AUTH_CONSTANTS.MAX_RETRY_ATTEMPTS;
      attempt++
    ) {
      const raw = generateRandomToken();
      const tokenHash = createTokenHash(raw, secret);

      try {
        const [created] = await this.refreshTokenModel.create(
          [
            {
              tokenHash,
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
        return { raw, docId: created._id as Types.ObjectId };
      } catch (e: unknown) {
        if (isDuplicateKeyError(e)) continue; // rare hash collision → regenerate
        throw e;
      }
    }

    throw new AppError('Failed to rotate refresh token', 500);
  }

  private async linkTokens(
    oldDoc: RefreshTokenDocument,
    newDocId: Types.ObjectId,
    session?: ClientSession
  ): Promise<void> {
    await this.refreshTokenModel.updateOne(
      { _id: oldDoc._id },
      { $set: { replacedBy: newDocId } },
      { session }
    );
  }

  private formatRotationOutput(
    newToken: { raw: string; docId: Types.ObjectId },
    oldDoc: RefreshTokenDocument,
    expiresAt: Date
  ): RotateRefreshTokenOutput {
    return {
      token: newToken.raw,
      userId: oldDoc.userId as Types.ObjectId,
      familyId: oldDoc.familyId,
      tokenId: newToken.docId.toString(),
      expiresAt,
    };
  }

  private async handleRotationError(
    session: ClientSession,
    err: unknown
  ): Promise<never> {
    try {
      await session.abortTransaction();
    } catch (abortErr) {
      // Ignore abort errors as the transaction may have already been aborted
      this.logger.warn(
        { error: abortErr },
        'Failed to abort transaction during refresh rotation cleanup'
      );
    }
    if (err instanceof AppError) throw err;
    // Preserve original error message for debugging
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    throw new AppError(`Refresh rotation failed: ${errorMessage}`, 500);
  }

  async rotateRefreshToken({
    token,
    ttlMs = AUTH_CONSTANTS.DEFAULT_REFRESH_TTL_MS,
    now = new Date(),
    ipAddress,
    userAgent,
  }: RotateRefreshTokenInput): Promise<RotateRefreshTokenOutput> {
    if (!token) throw new AppError('Missing refresh token', 400);

    // Always try transactional first, fall back to non-transactional if needed
    const session = await this.sessionFactory();

    try {
      // Try to start transaction
      session.startTransaction();
    } catch (err) {
      // If transactions are not supported (e.g., standalone MongoDB), fall back to non-transactional
      this.logger.warn(
        'Transactions not supported, falling back to non-transactional rotation'
      );
      session.endSession();
      return this.rotateRefreshTokenWithoutTransaction(
        token,
        ttlMs,
        now,
        ipAddress,
        userAgent
      );
    }

    try {
      // 1) Find and revoke the old token
      const oldDoc = await this.findAndRevokeOldToken(token, now, session);

      // 2) Create replacement token
      const newToken = await this.createReplacementToken(
        oldDoc,
        ttlMs,
        now,
        ipAddress,
        userAgent,
        session
      );

      // 3) Link old → new for audit
      await this.linkTokens(oldDoc, newToken.docId, session);

      // 4) Commit transaction
      await session.commitTransaction();

      // 5) Format and return result
      const expiresAt = calculateExpiration(now, ttlMs);
      const result = this.formatRotationOutput(newToken, oldDoc, expiresAt);

      // Clean up session on success
      session.endSession();
      return result;
    } catch (err) {
      // Check if this is a transaction-related error BEFORE handling it
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      if (
        errorMessage.includes(
          'Transaction numbers are only allowed on a replica set'
        ) ||
        errorMessage.includes('not supported') ||
        errorMessage.includes('transaction')
      ) {
        // Fall back to non-transactional rotation
        this.logger.warn(
          'Transaction failed, falling back to non-transactional rotation'
        );
        // Don't call handleRotationError for transaction errors
        try {
          session.endSession();
        } catch (endErr) {
          // Ignore session end errors
        }
        return this.rotateRefreshTokenWithoutTransaction(
          token,
          ttlMs,
          now,
          ipAddress,
          userAgent
        );
      }

      // For other errors, handle normally
      await this.handleRotationError(session, err);
      throw err; // This will never be reached due to handleRotationError throwing, but satisfies TypeScript
    }
  }

  private async rotateRefreshTokenWithoutTransaction(
    token: string,
    ttlMs: number,
    now: Date,
    ipAddress?: string,
    userAgent?: string
  ): Promise<RotateRefreshTokenOutput> {
    // 1) Find and revoke the old token (without session)
    const oldDoc = await this.findAndRevokeOldToken(token, now);

    // 2) Create replacement token (without session)
    const newToken = await this.createReplacementToken(
      oldDoc,
      ttlMs,
      now,
      ipAddress,
      userAgent
    );

    // 3) Link old → new for audit (without session)
    await this.linkTokens(oldDoc, newToken.docId);

    // 4) Format and return result
    const expiresAt = calculateExpiration(now, ttlMs);
    return this.formatRotationOutput(newToken, oldDoc, expiresAt);
  }

  async revokeRefreshToken(
    input: RevokeRefreshTokenInput
  ): Promise<RevokeRefreshTokenOutput> {
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

    const res = await this.refreshTokenModel.updateMany(filter, {
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

    const rows = await this.refreshTokenModel
      .aggregate<SessionSummary>(pipeline)
      .exec();
    return rows;
  }

  async getRefreshById(tokenId: string) {
    validateObjectId(tokenId, 'tokenId');
    const doc = await this.refreshTokenModel
      .findById(normalizeUserId(tokenId))
      .select('-tokenHash')
      .lean();
    return doc; // null if not found
  }
}

// ============================================================================
// FACTORY FUNCTION FOR EASY INSTANTIATION
// ============================================================================

/**
 * Creates a RefreshTokenService instance with default dependencies
 * @param env - Server environment configuration
 * @returns RefreshTokenService instance
 */
export function createRefreshTokenService(
  env: ReturnType<typeof validateServerEnv>
): RefreshTokenService {
  return new RefreshTokenService(env, refreshTokenModel, logger, startSession);
}
