// src/services/auth/cookieService.ts
import type { Request, Response } from 'express';
// import { apiURL } from '../../app'; // Removed to avoid circular dependency
import { validateServerEnv } from '../../config/env';
import { AppError } from '../../utils/appError';

// ============================================================================
// TYPES FOR DEPENDENCY INJECTION
// ============================================================================

type SameSite = 'lax' | 'strict' | 'none';

interface CookieDefaults {
  sameSite: SameSite;
  secure: boolean;
  domain?: string;
  accessName: string;
  refreshName: string;
}

interface RequestWithCookies extends Omit<Request, 'cookies'> {
  cookies?: Record<string, string>;
}

interface CookieOptions {
  sameSite: SameSite;
  secure: boolean;
  domain?: string;
  accessName: string;
  refreshName: string;
}

// ============================================================================
// COOKIE SERVICE CLASS
// ============================================================================

export class CookieService {
  constructor(
    private env: ReturnType<typeof validateServerEnv>,
    private baseApiURL: string = 'http://localhost:3000'
  ) {}

  private getDefaults(): CookieDefaults {
    return {
      sameSite: this.env.COOKIE_SAMESITE,
      secure: this.env.COOKIE_SECURE,
      domain: this.env.COOKIE_DOMAIN || undefined,
      accessName: this.env.ACCESS_COOKIE_NAME,
      refreshName: this.env.REFRESH_COOKIE_NAME,
    };
  }

  private validateCookieOptions(options: CookieOptions): void {
    if (options.sameSite === 'none' && !options.secure) {
      throw new AppError('SameSite=None requires Secure cookies', 400);
    }
  }

  private validateTokens(accessToken: string, refreshToken: string): void {
    if (
      !accessToken ||
      typeof accessToken !== 'string' ||
      accessToken.trim().length === 0
    ) {
      throw new AppError(
        'Access token is required and must be a non-empty string',
        400
      );
    }
    if (
      !refreshToken ||
      typeof refreshToken !== 'string' ||
      refreshToken.trim().length === 0
    ) {
      throw new AppError(
        'Refresh token is required and must be a non-empty string',
        400
      );
    }
  }

  readAccessFromRequest(
    req: RequestWithCookies,
    cookieName?: string
  ): string | null {
    const defaults = this.getDefaults();
    const name = cookieName ?? defaults.accessName;

    // Cookie (preferred)
    const cookieVal = req.cookies?.[name];
    if (typeof cookieVal === 'string' && cookieVal.length > 0) {
      return cookieVal;
    }

    // Authorization: Bearer <token>
    const auth = req.header('authorization') || req.header('Authorization');
    if (auth && auth.startsWith('Bearer ')) {
      return auth.slice('Bearer '.length).trim();
    }

    return null;
  }

  parseRefreshFromRequest(
    req: RequestWithCookies,
    cookieName?: string
  ): string | null {
    const defaults = this.getDefaults();
    const name = cookieName ?? defaults.refreshName;

    const token = req.cookies?.[name];
    return typeof token === 'string' && token.length > 0 ? token : null;
  }

  private setAccessCookie(
    res: Response,
    token: string,
    ttlMs: number,
    options: CookieOptions
  ): void {
    res.cookie(options.accessName, token, {
      httpOnly: true,
      secure: options.secure,
      sameSite: options.sameSite,
      domain: options.domain,
      path: '/',
      maxAge: ttlMs,
    });
  }

  private setRefreshCookie(
    res: Response,
    token: string,
    expiresAt: Date,
    options: CookieOptions
  ): void {
    res.cookie(options.refreshName, token, {
      httpOnly: true,
      secure: options.secure,
      sameSite: options.sameSite,
      domain: options.domain,
      path: `${this.baseApiURL}/auth/refresh`,
      expires: expiresAt,
    });
  }

  issueAuthCookies({
    res,
    accessToken,
    accessTtlMs,
    refreshToken,
    refreshExpiresAt,
    cookieDomain,
    sameSite,
    secure,
    accessName,
    refreshName,
  }: {
    res: Response;
    accessToken: string;
    accessTtlMs: number;
    refreshToken: string;
    refreshExpiresAt: Date;
    cookieDomain?: string;
    sameSite?: SameSite;
    secure?: boolean;
    accessName?: string;
    refreshName?: string;
  }): void {
    // Validate inputs
    this.validateTokens(accessToken, refreshToken);

    const defaults = this.getDefaults();
    const options: CookieOptions = {
      sameSite: (sameSite ?? defaults.sameSite) as SameSite,
      secure: secure ?? defaults.secure,
      domain: cookieDomain ?? defaults.domain,
      accessName: accessName ?? defaults.accessName,
      refreshName: refreshName ?? defaults.refreshName,
    };

    // Validate cookie options
    this.validateCookieOptions(options);

    // Set cookies
    this.setAccessCookie(res, accessToken, accessTtlMs, options);
    this.setRefreshCookie(res, refreshToken, refreshExpiresAt, options);
  }

  clearAuthCookies({
    res,
    cookieDomain,
    accessName,
    refreshName,
  }: {
    res: Response;
    cookieDomain?: string;
    accessName?: string;
    refreshName?: string;
  }): void {
    const defaults = this.getDefaults();
    const domain = cookieDomain ?? defaults.domain;
    const accessNameFinal = accessName ?? defaults.accessName;
    const refreshNameFinal = refreshName ?? defaults.refreshName;

    const baseOptions = {
      httpOnly: true,
      secure: true, // keep secure on clears
      domain,
    } as const;

    res.clearCookie(accessNameFinal, { ...baseOptions, path: '/' });
    res.clearCookie(refreshNameFinal, {
      ...baseOptions,
      path: '/auth/refresh',
    });
  }
}

// ============================================================================
// FACTORY FUNCTION FOR EASY INSTANTIATION
// ============================================================================

/**
 * Creates a CookieService instance with default dependencies
 * @param env - Server environment configuration
 * @param baseApiURL - Base API URL for cookie paths (optional)
 * @returns CookieService instance
 */
export function createCookieService(
  env: ReturnType<typeof validateServerEnv>,
  baseApiURL: string = 'http://localhost:3000'
): CookieService {
  return new CookieService(env, baseApiURL);
}

// ============================================================================
// LEGACY FUNCTION EXPORTS FOR BACKWARD COMPATIBILITY
// ============================================================================

/**
 * @deprecated Use CookieService class instead. This function will be removed in a future version.
 */
export function readAccessFromRequest(
  req: Request,
  cookieName?: string
): string | null {
  const service = createCookieService(validateServerEnv(process.env));
  return service.readAccessFromRequest(req as any, cookieName);
}

/**
 * @deprecated Use CookieService class instead. This function will be removed in a future version.
 */
export function parseRefreshFromRequest(
  req: Request,
  cookieName?: string
): string | null {
  const service = createCookieService(validateServerEnv(process.env));
  return service.parseRefreshFromRequest(req as any, cookieName);
}

/**
 * @deprecated Use CookieService class instead. This function will be removed in a future version.
 */
export function issueAuthCookies(input: {
  res: Response;
  accessToken: string;
  accessTtlMs: number;
  refreshToken: string;
  refreshExpiresAt: Date;
  cookieDomain?: string;
  sameSite?: SameSite;
  secure?: boolean;
  accessName?: string;
  refreshName?: string;
}): void {
  const service = createCookieService(validateServerEnv(process.env));
  service.issueAuthCookies(input);
}

/**
 * @deprecated Use CookieService class instead. This function will be removed in a future version.
 */
export function clearAuthCookies(input: {
  res: Response;
  cookieDomain?: string;
  accessName?: string;
  refreshName?: string;
}): void {
  const service = createCookieService(validateServerEnv(process.env));
  service.clearAuthCookies(input);
}
