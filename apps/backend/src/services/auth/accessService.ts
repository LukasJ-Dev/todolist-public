import jwt, {
  JsonWebTokenError,
  JwtPayload,
  TokenExpiredError,
} from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { AppError } from '../../utils/appError';
import { validateServerEnv } from '../../config/env';
import { AUTH_CONSTANTS, clampTtl, validateSecret, validateKey } from '../../utils/auth';
import type {
  CreateAccessTokenInput,
  CreateAccessTokenOutput,
  VerifyAccessTokenOptions,
  VerifiedAccessToken,
  SigningMaterial,
  VerificationMaterial,
  Alg,
} from '../../types/auth';

// ============================================================================
// ACCESS TOKEN SERVICE CLASS
// ============================================================================

export class AccessTokenService {
  private cachedSigningMaterial: SigningMaterial | null = null;
  private cachedVerificationMaterial: VerificationMaterial | null = null;

  constructor(private env: ReturnType<typeof validateServerEnv>) {}

  createAccessToken({
    userId,
    roles = [],
    ttlMs = AUTH_CONSTANTS.DEFAULT_ACCESS_TTL_MS,
    now = new Date(),
    issuer = this.env.JWT_ISS,
    audience = this.env.JWT_AUD,
    kid,
  }: CreateAccessTokenInput): CreateAccessTokenOutput {
    const mat = this.resolveSigningMaterial();

    // Clamp TTL to sensible bounds (≥60s, ≤1h)
    const ttlSec = clampTtl(ttlMs);
    const iat = Math.floor(now.getTime() / 1000);
    const exp = iat + ttlSec;
    const jti = randomUUID();

    const payload: Record<string, unknown> = {
      roles,
      exp,
      jti,
      sub: userId,
    };

    const token = jwt.sign(payload, mat.key as string | Buffer, {
      algorithm: mat.alg,
      ...(kid && kid.trim() !== '' ? { keyid: kid } : {}),
      issuer,
      audience,
      // Let JWT library handle iat automatically
    });

    // Get the actual iat from the decoded token
    const decoded = jwt.decode(token) as Record<string, unknown> | null;
    const actualIat = (typeof decoded?.iat === 'number' ? decoded.iat : iat);

    return { token, exp, iat: actualIat, jti };
  }

  verifyAccessToken(
    token: string,
    {
      clockToleranceSec = AUTH_CONSTANTS.DEFAULT_CLOCK_TOLERANCE_SEC,
      issuer = this.env.JWT_ISS,
      audience = this.env.JWT_AUD,
    }: VerifyAccessTokenOptions = {}
  ): VerifiedAccessToken {
    if (!token) throw new AppError('Missing access token', 401);

    const mat = this.resolveVerificationMaterial();

    try {
      const decoded = jwt.verify(token, mat.key as string | Buffer, {
        algorithms: [mat.alg],
        issuer,
        audience,
        clockTolerance: clockToleranceSec,
      }) as JwtPayload;

      if (!(decoded.sub && decoded.exp && decoded.jti)) {
        throw new AppError('Malformed access token', 401);
      }

      // Handle iat separately - ensure it's properly decoded
      if (typeof decoded.iat !== 'number') {
        throw new AppError('Malformed access token - missing iat', 401);
      }

      return {
        userId: String(decoded.sub),
        roles: Array.isArray((decoded as Record<string, unknown>).roles)
          ? ((decoded as Record<string, unknown>).roles as string[])
          : [],
        iat: decoded.iat,
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

  private resolveSigningMaterial(): SigningMaterial {
    if (this.cachedSigningMaterial) return this.cachedSigningMaterial;

    const alg = this.env.JWT_ALG;
    const kid =
      this.env.JWT_KID && this.env.JWT_KID.trim() !== ''
        ? this.env.JWT_KID
        : undefined;

    // Clear cache if kid has changed (to handle empty string to undefined transition)
    if (this.cachedSigningMaterial && 'kid' in this.cachedSigningMaterial) {
      const cachedKid = (this.cachedSigningMaterial as { kid?: string }).kid;
      if (cachedKid !== kid) {
        this.cachedSigningMaterial = null;
      }
    }

    if (alg === 'HS256') {
      const secret = validateSecret(this.env.JWT_SECRET, 'JWT_SECRET');
      this.cachedSigningMaterial = {
        alg,
        key: Buffer.from(secret, 'utf8'),
        kid,
      };
      return this.cachedSigningMaterial;
    }

    // RS256
    const pk = validateKey(this.env.JWT_PRIVATE_KEY, 'JWT_PRIVATE_KEY');
    this.cachedSigningMaterial = { alg: 'RS256' as const, key: pk, kid } as unknown as SigningMaterial;
    return this.cachedSigningMaterial;
  }

  private resolveVerificationMaterial(): VerificationMaterial {
    if (this.cachedVerificationMaterial) return this.cachedVerificationMaterial;

    const alg = ((this.env.JWT_ALG as Alg) || 'HS256') as Alg;

    if (alg === 'HS256') {
      const secret = validateSecret(this.env.JWT_SECRET, 'JWT_SECRET');
      this.cachedVerificationMaterial = {
        alg,
        key: Buffer.from(secret, 'utf8'),
      };
      return this.cachedVerificationMaterial;
    }

    // RS256: verify with public key
    const pub = validateKey(this.env.JWT_PUBLIC_KEY, 'JWT_PUBLIC_KEY');
    this.cachedVerificationMaterial = { alg: 'RS256' as const, key: pub } as unknown as VerificationMaterial;
    return this.cachedVerificationMaterial;
  }

  // Public utility methods
  public static clampTtl(ttlMs: number): number {
    return clampTtl(ttlMs);
  }
}

// ============================================================================
// PUBLIC API - STANDALONE FUNCTIONS
// ============================================================================

// Environment setup
const env = validateServerEnv(process.env);

// Default service instance
const defaultService = new AccessTokenService(env);

// Standalone functions for backward compatibility
export function createAccessToken(
  input: CreateAccessTokenInput
): CreateAccessTokenOutput {
  return defaultService.createAccessToken(input);
}

export function verifyAccessToken(
  token: string,
  options?: VerifyAccessTokenOptions
): VerifiedAccessToken {
  return defaultService.verifyAccessToken(token, options);
}

// Export the service class and default instance
export { defaultService as accessTokenService };
export default defaultService;