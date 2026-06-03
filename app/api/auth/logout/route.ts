/**
 * app/api/auth/logout/route.ts
 * POST: Clear the session cookies.
 */
import { NextResponse } from 'next/server';
import { clearSessionCookies } from '@/lib/session';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  clearSessionCookies(res);
  return res;
}
