import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuthClient, getAnonAuthClient, getCurrentAuthUser } from '@/lib/auth-server';
import { setSessionCookies } from '@/lib/session';

export async function POST(request: NextRequest) {
  const user = await getCurrentAuthUser();
  if (!user) {
    return NextResponse.json({ error: 'Login diperlukan untuk mengganti password.' }, { status: 401 });
  }

  const admin = getAdminAuthClient();
  const anon = getAnonAuthClient();
  if (!admin || !anon) {
    return NextResponse.json({ error: 'Auth belum dikonfigurasi.' }, { status: 503 });
  }

  const body = await request.json().catch(() => ({}));
  const currentPassword = String(body.current_password ?? '');
  const newPassword = String(body.new_password ?? '');

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: 'Password lama dan password baru wajib diisi.' }, { status: 400 });
  }

  if (newPassword.length < 8) {
    return NextResponse.json({ error: 'Password baru minimal 8 karakter.' }, { status: 400 });
  }

  const { error: verifyError } = await anon.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });

  if (verifyError) {
    return NextResponse.json({ error: 'Password lama tidak sesuai.' }, { status: 403 });
  }

  const { error: updateError } = await admin.auth.admin.updateUserById(user.id, {
    password: newPassword,
  });

  if (updateError) {
    return NextResponse.json({ error: updateError.message || 'Gagal mengganti password.' }, { status: 500 });
  }

  const { data: signIn, error: signInError } = await anon.auth.signInWithPassword({
    email: user.email,
    password: newPassword,
  });

  const response = NextResponse.json({ ok: true });
  if (!signInError && signIn.session?.access_token && signIn.session.refresh_token) {
    setSessionCookies(response, signIn.session.access_token, signIn.session.refresh_token);
  }

  return response;
}
