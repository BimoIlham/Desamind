/**
 * lib/session.ts
 * Helpers for managing the auth session via httpOnly cookies.
 *
 * We store the Supabase access + refresh tokens in httpOnly cookies so the
 * browser JS cannot read them (mitigates XSS token theft). The server reads
 * them to resolve the current user.
 */
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const ACCESS_COOKIE = 'dm_access';
export const REFRESH_COOKIE = 'dm_refresh';

const COMMON = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
};

export function setSessionCookies(res: NextResponse, accessToken: string, refreshToken: string) {
  res.cookies.set(ACCESS_COOKIE, accessToken, { ...COMMON, maxAge: 60 * 60 }); // 1 hour
  res.cookies.set(REFRESH_COOKIE, refreshToken, { ...COMMON, maxAge: 60 * 60 * 24 * 30 }); // 30 days
}

export function clearSessionCookies(res: NextResponse) {
  res.cookies.set(ACCESS_COOKIE, '', { ...COMMON, maxAge: 0 });
  res.cookies.set(REFRESH_COOKIE, '', { ...COMMON, maxAge: 0 });
}

/** Read the current tokens from the request cookie store (server components/routes). */
export async function readSessionTokens() {
  const store = await cookies();
  return {
    accessToken: store.get(ACCESS_COOKIE)?.value ?? null,
    refreshToken: store.get(REFRESH_COOKIE)?.value ?? null,
  };
}
