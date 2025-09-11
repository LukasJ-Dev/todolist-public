// src/services/auth/refresh.service.ts
import { randomBytes, createHmac, randomUUID } from 'crypto';
import { PipelineStage, startSession, Types } from 'mongoose';
import { refreshTokenModel } from '../../models/refreshTokens';
import { AppError } from '../../utils/appError';
import { validateServerEnv } from '../../config/env';

const env = validateServerEnv(process.env);

export type CreateRefreshTokenInput = {
  userId: string | Types.ObjectId;
  familyId?: string; // omit on signin/signup → will be generated
  ttlMs?: number; // default 30 days
  now?: Date;
  ipAddress?: string;
  userAgent?: string;
  fingerprint?: string;
};

export type CreateRefreshTokenOutput = {
  token: string; // raw, set as HttpOnly cookie by caller
  tokenId: string;
  familyId: string;
  expiresAt: Date;
};

export async function createRefreshToken({
  userId,
  familyId = randomUUID(),
  ttlMs = 30 * 24 * 60 * 60 * 1000,
  now = new Date(),
  ipAddress,
  userAgent,
  fingerprint,
}: CreateRefreshTokenInput): Promise<CreateRefreshTokenOutput> {
  const secret = env.REFRESH_HASH_SECRET;
  if (!secret) throw new AppError('Missing REFRESH_HASH_SECRET', 500);

  const uid =
    userId instanceof Types.ObjectId ? userId : new Types.ObjectId(userId);
  const expiresAt = new Date(now.getTime() + ttlMs);

  for (let attempt = 0; attempt < 3; attempt++) {
    const raw = randomBytes(32).toString('base64url'); // 256-bit opaque token
    const tokenHash = createHmac('sha256', secret).update(raw).digest('hex');

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
    } catch (e: any) {
      if (e?.code === 11000) continue; // rare hash collision → retry
      throw new AppError('Failed to create refresh token', 500);
    }
  }

  throw new AppError('Failed to create refresh token after retries', 500);
}

// src/services/auth/refresh.service.ts (add below createRefreshToken)

export type RotateRefreshTokenInput = {
  token: string; // raw refresh from cookie
  ttlMs?: number; // default 30 days
  now?: Date;
  ipAddress?: string;
  userAgent?: string;
};

export type RotateRefreshTokenOutput = {
  token: string; // new raw refresh (set as cookie by caller)
  userId: Types.ObjectId; // to mint access JWT
  familyId: string;
  tokenId: string; // new refresh doc id
  expiresAt: Date;
};

export async function rotateRefreshToken({
  token,
  ttlMs = 30 * 24 * 60 * 60 * 1000,
  now = new Date(),
  ipAddress,
  userAgent,
}: RotateRefreshTokenInput): Promise<RotateRefreshTokenOutput> {
  if (!token) throw new AppError('Missing refresh token', 400);

  const secret = env.REFRESH_HASH_SECRET;
  if (!secret) throw new AppError('Missing REFRESH_HASH_SECRET', 500);

  const tokenHash = createHmac('sha256', secret).update(token).digest('hex');

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
      const exists = await refreshTokenModel.findOne({ tokenHash }).lean();
      if (exists) {
        // Reuse detected → revoke the entire family
        await refreshTokenModel.updateMany(
          { familyId: (exists as any).familyId, revoked: false },
          { $set: { revoked: true } },
          { session }
        );
      }
      await session.abortTransaction();
      throw new AppError('Invalid or reused refresh token', 401);
    }

    // 2) Issue replacement refresh (same familyId)
    const expiresAt = new Date(now.getTime() + ttlMs);

    let newRaw = '';
    let newDocId: Types.ObjectId | null = null;

    for (let attempt = 0; attempt < 3; attempt++) {
      newRaw = randomBytes(32).toString('base64url');
      const newHash = createHmac('sha256', secret).update(newRaw).digest('hex');

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
      } catch (e: any) {
        if (e?.code === 11000) continue; // rare hash collision → regenerate
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
    } catch {}
    if (err instanceof AppError) throw err;
    throw new AppError('Refresh rotation failed', 500);
  } finally {
    session.endSession();
  }
}

// src/services/auth/refresh.service.ts (add below rotateRefreshToken)

export type RevokeRefreshTokenInput =
  | { tokenId: string; familyId?: never; userId?: never }
  | { familyId: string; tokenId?: never; userId?: never }
  | { userId: string | Types.ObjectId; tokenId?: never; familyId?: never };

export type RevokeRefreshTokenOutput = { revokedCount: number };

export async function revokeRefreshToken(
  input: RevokeRefreshTokenInput
): Promise<RevokeRefreshTokenOutput> {
  let filter: Record<string, any> = { revoked: false };

  if ('tokenId' in input) {
    if (!input.tokenId) throw new AppError('tokenId required', 400);
    filter._id = new Types.ObjectId(input.tokenId);
  } else if ('familyId' in input) {
    if (!input.familyId) throw new AppError('familyId required', 400);
    filter.familyId = input.familyId;
  } else if ('userId' in input) {
    const uid =
      input.userId instanceof Types.ObjectId
        ? input.userId
        : new Types.ObjectId(input.userId);
    filter.userId = uid;
  } else {
    throw new AppError('Must provide tokenId, familyId, or userId', 400);
  }

  const res = await refreshTokenModel.updateMany(filter, {
    $set: { revoked: true },
  });

  return { revokedCount: res.modifiedCount ?? 0 };
}

export type SessionSummary = {
  familyId: string;
  createdAt: Date;
  lastUsedAt: Date;
  ipAddress?: string;
  userAgent?: string;
  active: boolean;
  tokenCount: number;
};

export async function listUserSessions(
  userId: string | Types.ObjectId,
  {
    includeRevoked = false,
    limit = 20,
    now = new Date(),
  }: { includeRevoked?: boolean; limit?: number; now?: Date } = {}
): Promise<SessionSummary[]> {
  const uid =
    userId instanceof Types.ObjectId ? userId : new Types.ObjectId(userId);

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
    { $limit: Math.max(1, Math.min(limit, 100)) }
  );

  const rows = await refreshTokenModel
    .aggregate<SessionSummary>(pipeline)
    .exec();
  return rows;
}

export async function getRefreshById(tokenId: string) {
  if (!Types.ObjectId.isValid(tokenId))
    throw new AppError('Invalid tokenId', 400);
  const doc = await refreshTokenModel
    .findById(new Types.ObjectId(tokenId))
    .select('-tokenHash')
    .lean();
  return doc; // null if not found
}
