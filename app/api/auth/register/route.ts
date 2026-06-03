/**
 * app/api/auth/register/route.ts
 * POST: Register a new citizen (warga) account.
 *
 * - role is always forced to 'warga' (admins are created manually).
 * - status is 'active' by default, or 'pending' when REQUIRE_ADMIN_APPROVAL=true.
 * - On success (and when active) the user is logged in immediately via cookies.
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  getAdminAuthClient,
  getAnonAuthClient,
  findUserByEmail,
  initials,
  requireApproval,
  toAuthUser,
} from '@/lib/auth-server';
import { setSessionCookies } from '@/lib/session';

export async function POST(request: NextRequest) {
  const admin = getAdminAuthClient();
  if (!admin) {
    return NextResponse.json({ error: 'Autentikasi belum dikonfigurasi (Supabase).' }, { status: 503 });
  }

  let body: { name?: string; email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Permintaan tidak valid.' }, { status: 400 });
  }

  const name = (body.name ?? '').trim();
  const email = (body.email ?? '').trim().toLowerCase();
  const password = body.password ?? '';

  if (!name) return NextResponse.json({ error: 'Nama lengkap wajib diisi.' }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Format email tidak valid.' }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password minimal 8 karakter.' }, { status: 400 });
  }

  // Reject duplicates with a clear message
  const existing = await findUserByEmail(email);
  if (existing) {
    return NextResponse.json({ error: 'Email sudah terdaftar. Silakan masuk.' }, { status: 409 });
  }

  const status = requireApproval() ? 'pending' : 'active';

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // no email verification step needed
    user_metadata: { name, role: 'warga', status, avatar: initials(name) },
  });

  if (error || !data?.user) {
    return NextResponse.json({ error: error?.message ?? 'Gagal membuat akun.' }, { status: 500 });
  }

  const user = toAuthUser(data.user);

  // If approval is required, do not log in yet.
  if (status === 'pending') {
    return NextResponse.json({
      user,
      pending: true,
      message: 'Pendaftaran berhasil. Akun Anda menunggu persetujuan admin desa.',
    });
  }

  // Otherwise, sign in immediately and set session cookies.
  const anon = getAnonAuthClient();
  const { data: signIn, error: signErr } = await anon!.auth.signInWithPassword({ email, password });
  if (signErr || !signIn.session) {
    // Account created but auto-login failed — let them log in manually.
    return NextResponse.json({ user, pending: false, autoLogin: false });
  }

  const res = NextResponse.json({ user, pending: false, autoLogin: true });
  setSessionCookies(res, signIn.session.access_token, signIn.session.refresh_token);
  return res;
}
