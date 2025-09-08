// src/services/auth/cookies.service.ts
import type { Request, Response } from 'express';
import { apiURL } from '../../app';

type SameSite = 'lax' | 'strict' | 'none';

function getDefaults() {
  const sameSite =
    (process.env.COOKIE_SAMESITE?.toLowerCase() as SameSite) || 'lax';
  const secure =
    process.env.NODE_ENV === 'production'
      ? true
      : process.env.COOKIE_SECURE === 'true';
  const domain = process.env.COOKIE_DOMAIN || undefined;
  const accessName = process.env.ACCESS_COOKIE_NAME || 'access';
  const refreshName = process.env.REFRESH_COOKIE_NAME || 'refresh';
  return { sameSite, secure, domain, accessName, refreshName };
}

/** Read the access token from cookie or Authorization header. */
export function readAccessFromRequest(
  req: Request,
  cookieName = getDefaults().accessName
): string | null {
  // Cookie (preferred)
  const cookieVal = (req as any).cookies?.[cookieName];
  if (typeof cookieVal === 'string' && cookieVal.length > 0) return cookieVal;

  // Authorization: Bearer <token>
  const auth = req.header('authorization') || req.header('Authorization');
  if (auth && auth.startsWith('Bearer '))
    return auth.slice('Bearer '.length).trim();

  return null;
}

/** Read the refresh token from cookie only (should never be in headers). */
export function parseRefreshFromRequest(
  req: Request,
  cookieName = getDefaults().refreshName
): string | null {
  const token = (req as any).cookies?.[cookieName];
  console.log(getDefaults().refreshName);
  return typeof token === 'string' && token.length > 0 ? token : null;
}

export type IssueCookiesInput = {
  res: Response;
  accessToken: string;
  accessTtlMs: number; // should match access token TTL
  refreshToken: string; // raw (from create/rotate)
  refreshExpiresAt: Date; // absolute expiry for the refresh cookie
  cookieDomain?: string;
  sameSite?: SameSite;
  secure?: boolean;
  accessName?: string;
  refreshName?: string;
};

/** Set HttpOnly, Secure cookies for access and refresh tokens. */
export function issueAuthCookies({
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
}: IssueCookiesInput): void {
  const defs = getDefaults();
  const _sameSite = (sameSite ?? defs.sameSite) as SameSite;
  const _secure = secure ?? defs.secure;
  const _domain = cookieDomain ?? defs.domain;
  const _accessName = accessName ?? defs.accessName;
  const _refreshName = refreshName ?? defs.refreshName;

  // If SameSite=None, cookie MUST be Secure
  if (_sameSite === 'none' && !_secure) {
    throw new Error('SameSite=None requires Secure cookies');
  }

  // Access cookie (short path, short TTL)
  res.cookie(_accessName, accessToken, {
    httpOnly: true,
    secure: _secure,
    sameSite: _sameSite,
    domain: _domain,
    path: '/',
    maxAge: accessTtlMs,
  });

  // Refresh cookie (scoped path, absolute expiry)
  res.cookie(_refreshName, refreshToken, {
    httpOnly: true,
    secure: _secure,
    sameSite: _sameSite,
    domain: _domain,
    path: `${apiURL}/auth/refresh`,
    expires: refreshExpiresAt,
  });
}

export type ClearCookiesInput = {
  res: Response;
  cookieDomain?: string;
  accessName?: string;
  refreshName?: string;
};

export function clearAuthCookies({
  res,
  cookieDomain,
  accessName,
  refreshName,
}: ClearCookiesInput): void {
  const defs = getDefaults();
  const _domain = cookieDomain ?? defs.domain;
  const _accessName = accessName ?? defs.accessName;
  const _refreshName = refreshName ?? defs.refreshName;

  const base = {
    httpOnly: true,
    secure: true, // keep secure on clears
    domain: _domain,
  } as const;

  res.clearCookie(_accessName, { ...base, path: '/' });
  res.clearCookie(_refreshName, { ...base, path: '/auth/refresh' });
}
