/**
 * app/api/auth/login/route.ts
 * POST: Authenticate with email + password.
 * Blocks login for 'pending' (awaiting approval) and 'suspended' accounts.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAnonAuthClient, toAuthUser } from '@/lib/auth-server';
import { setSessionCookies } from '@/lib/session';

export async function POST(request: NextRequest) {
  const anon = getAnonAuthClient();
  if (!anon) {
    return NextResponse.json({ error: 'Autentikasi belum dikonfigurasi (Supabase).' }, { status: 503 });
  }

  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Permintaan tidak valid.' }, { status: 400 });
  }

  const email = (body.email ?? '').trim().toLowerCase();
  const password = body.password ?? '';

  if (!email || !password) {
    return NextResponse.json({ error: 'Email dan password wajib diisi.' }, { status: 400 });
  }

  const { data, error } = await anon.auth.signInWithPassword({ email, password });
  if (error || !data.session || !data.user) {
    return NextResponse.json({ error: 'Email atau password salah.' }, { status: 401 });
  }

  const user = toAuthUser(data.user);

  if (user.status === 'pending') {
    return NextResponse.json(
      { error: 'Akun Anda masih menunggu persetujuan admin desa.' },
      { status: 403 }
    );
  }
  if (user.status === 'suspended') {
    return NextResponse.json(
      { error: 'Akun Anda dinonaktifkan. Hubungi admin desa.' },
      { status: 403 }
    );
  }

  const res = NextResponse.json({ user });
  setSessionCookies(res, data.session.access_token, data.session.refresh_token);
  return res;
}
