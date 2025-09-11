// src/services/auth/access.service.ts
import jwt, {
  Algorithm,
  JsonWebTokenError,
  JwtPayload,
  TokenExpiredError,
} from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { AppError } from '../../utils/appError';
import { validateServerEnv } from '../../config/env';

const env = validateServerEnv(process.env);

export type CreateAccessTokenInput = {
  userId: string; // stringified ObjectId
  roles?: string[]; // optional, small list
  ttlMs?: number; // default 15m
  now?: Date; // for tests
  issuer?: string; // default from env
  audience?: string; // default from env
  kid?: string; // optional key id override
};

export type CreateAccessTokenOutput = {
  token: string; // compact JWT
  exp: number; // unix seconds
  iat: number; // unix seconds
  jti: string; // random id
};

type Alg = Extract<Algorithm, 'HS256' | 'RS256'>;

let cachedMaterial:
  | { alg: 'HS256'; key: Buffer; kid?: string }
  | { alg: 'RS256'; key: string; kid?: string }
  | null = null;

function resolveSigningMaterial():
  | { alg: 'HS256'; key: Buffer; kid?: string }
  | { alg: 'RS256'; key: string; kid?: string } {
  if (cachedMaterial) return cachedMaterial;

  const alg = env.JWT_ALG;
  const kid =
    env.JWT_KID && env.JWT_KID.trim() !== '' ? env.JWT_KID : undefined;

  // Clear cache if kid has changed (to handle empty string to undefined transition)
  if (cachedMaterial && cachedMaterial.kid !== kid) {
    cachedMaterial = null;
  }

  if (alg === 'HS256') {
    const secret = env.JWT_SECRET;
    if (!secret || secret.length < 32)
      throw new AppError('JWT_SECRET missing/weak', 500);
    cachedMaterial = { alg, key: Buffer.from(secret, 'utf8'), kid };
    return cachedMaterial;
  }

  // RS256
  const pk = env.JWT_PRIVATE_KEY;
  if (!pk) throw new Error('JWT_PRIVATE_KEY missing');
  cachedMaterial = { alg: 'RS256', key: pk, kid };
  return cachedMaterial;
}

export function createAccessToken({
  userId,
  roles = [],
  ttlMs = 15 * 60 * 1000,
  now = new Date(),
  issuer = env.JWT_ISS,
  audience = env.JWT_AUD,
  kid,
}: CreateAccessTokenInput): CreateAccessTokenOutput {
  const mat = resolveSigningMaterial();

  // clamp TTL to sensible bounds (≥60s, ≤1h)
  const ttlSec = Math.max(60, Math.min(Math.floor(ttlMs / 1000), 60 * 60));
  const iat = Math.floor(now.getTime() / 1000);
  const exp = iat + ttlSec;
  const jti = randomUUID();

  const payload: Record<string, unknown> = {
    roles,
    exp,
    jti,
    sub: userId,
  };

  const token = jwt.sign(payload, mat.key as any, {
    algorithm: mat.alg,
    ...(kid && kid.trim() !== '' ? { keyid: kid } : {}),
    issuer,
    audience,
    // Let JWT library handle iat automatically
  });

  // Get the actual iat from the decoded token
  const decoded = jwt.decode(token) as any;
  const actualIat = decoded?.iat || iat;

  return { token, exp, iat: actualIat, jti };
}

let cachedVerify:
  | { alg: 'HS256'; key: Buffer }
  | { alg: 'RS256'; key: string }
  | null = null;

function resolveVerificationMaterial():
  | { alg: 'HS256'; key: Buffer }
  | { alg: 'RS256'; key: string } {
  if (cachedVerify) return cachedVerify;

  const alg = ((process.env.JWT_ALG as Alg) || 'HS256') as Alg;

  if (alg === 'HS256') {
    const secret = env.JWT_SECRET;
    if (!secret || secret.length < 32)
      throw new AppError('JWT_SECRET missing/weak', 500);
    cachedVerify = { alg, key: Buffer.from(secret, 'utf8') };
    return cachedVerify;
  }

  // RS256: verify with public key
  const pub = env.JWT_PUBLIC_KEY;
  if (!pub) throw new AppError('JWT_PUBLIC_KEY missing', 500);
  cachedVerify = { alg: 'RS256', key: pub };
  return cachedVerify;
}

export type VerifyAccessTokenOptions = {
  clockToleranceSec?: number; // default 60s
  issuer?: string; // default from env
  audience?: string; // default from env
};

export type VerifiedAccessToken = {
  userId: string;
  roles: string[];
  iat: number;
  exp: number;
  jti: string;
  iss: string;
  aud: string | string[];
};

export function verifyAccessToken(
  token: string,
  {
    clockToleranceSec = 60,
    issuer = env.JWT_ISS,
    audience = env.JWT_AUD,
  }: VerifyAccessTokenOptions = {}
): VerifiedAccessToken {
  if (!token) throw new AppError('Missing access token', 401);

  const mat = resolveVerificationMaterial();

  try {
    const decoded = jwt.verify(token, mat.key as any, {
      algorithms: [mat.alg],
      issuer,
      audience,
      clockTolerance: clockToleranceSec,
    }) as JwtPayload;

    const sub = decoded.sub;

    if (!sub || !decoded.exp || !decoded.jti) {
      throw new AppError('Malformed access token', 401);
    }

    // Handle iat separately - ensure it's properly decoded
    let iat: number;
    if (typeof decoded.iat === 'number') {
      iat = decoded.iat;
    } else {
      // If iat is not in decoded payload, we can't verify the token properly
      // This is a critical security issue, so we reject the token
      throw new AppError('Malformed access token - missing iat', 401);
    }

    return {
      userId: String(sub),
      roles: Array.isArray((decoded as any).roles)
        ? ((decoded as any).roles as string[])
        : [],
      iat: iat,
      exp: decoded.exp!,
      jti: decoded.jti as string,
      iss: decoded.iss as string,
      aud: decoded.aud!,
    };
  } catch (err) {
    if (err instanceof TokenExpiredError) {
      throw new AppError('Access token expired', 401);
    }
    if (err instanceof JsonWebTokenError) {
      throw new AppError('Invalid access token', 401);
    }
    throw new AppError('Access token verification failed', 500);
  }
}
