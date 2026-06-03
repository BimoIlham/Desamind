/**
 * app/api/auth/me/route.ts
 * GET: Resolve the current logged-in user from session cookies.
 * Refreshes the access token if it has expired but a refresh token is valid.
 */
import { NextResponse } from 'next/server';
import { getAnonAuthClient, toAuthUser } from '@/lib/auth-server';
import { readSessionTokens, setSessionCookies, clearSessionCookies } from '@/lib/session';

export async function GET() {
  const anon = getAnonAuthClient();
  if (!anon) return NextResponse.json({ user: null });

  const { accessToken, refreshToken } = await readSessionTokens();
  if (!accessToken && !refreshToken) {
    return NextResponse.json({ user: null });
  }

  // Try the access token first.
  if (accessToken) {
    const { data, error } = await anon.auth.getUser(accessToken);
    if (!error && data.user) {
      const user = toAuthUser(data.user);
      if (user.status === 'suspended') {
        const res = NextResponse.json({ user: null });
        clearSessionCookies(res);
        return res;
      }
      return NextResponse.json({ user });
    }
  }

  // Access token missing/expired — try to refresh.
  if (refreshToken) {
    const { data, error } = await anon.auth.refreshSession({ refresh_token: refreshToken });
    if (!error && data.session && data.user) {
      const user = toAuthUser(data.user);
      const res = NextResponse.json({ user });
      setSessionCookies(res, data.session.access_token, data.session.refresh_token);
      return res;
    }
  }

  // Both failed — clear cookies.
  const res = NextResponse.json({ user: null });
  clearSessionCookies(res);
  return res;
}
