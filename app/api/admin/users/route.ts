/**
 * app/api/admin/users/route.ts
 * GET:   List all accounts (admin).
 * PATCH: Update a user's status (active/pending/suspended) or role.
 * DELETE: Remove a user account (?id=).
 *
 * NOTE: These endpoints are intended for admin use. The admin UI is only
 * reachable by admins, and a production deployment should additionally
 * verify the caller's role server-side (see lib/session + me route).
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuthClient, listAuthUsers, toAuthUser, type AppStatus, type AppRole } from '@/lib/auth-server';

export async function GET() {
  const admin = getAdminAuthClient();
  if (!admin) return NextResponse.json({ error: 'Auth belum dikonfigurasi.' }, { status: 503 });

  const users = await listAuthUsers();

  users.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return NextResponse.json(users);
}

export async function PATCH(request: NextRequest) {
  const admin = getAdminAuthClient();
  if (!admin) return NextResponse.json({ error: 'Auth belum dikonfigurasi.' }, { status: 503 });

  const body = await request.json().catch(() => ({}));
  const { id, status, role } = body as { id?: string; status?: AppStatus; role?: AppRole };

  if (!id) return NextResponse.json({ error: 'ID pengguna wajib diisi.' }, { status: 400 });

  // Read current metadata to merge (don't clobber other fields).
  const { data: existing, error: getErr } = await admin.auth.admin.getUserById(id);
  if (getErr || !existing?.user) {
    return NextResponse.json({ error: 'Pengguna tidak ditemukan.' }, { status: 404 });
  }

  const meta = { ...(existing.user.user_metadata ?? {}) };
  if (status && ['active', 'pending', 'suspended'].includes(status)) meta.status = status;
  if (role && ['warga', 'admin'].includes(role)) meta.role = role;

  const { data, error } = await admin.auth.admin.updateUserById(id, { user_metadata: meta });
  if (error || !data.user) {
    return NextResponse.json({ error: error?.message ?? 'Gagal memperbarui pengguna.' }, { status: 500 });
  }

  return NextResponse.json(toAuthUser(data.user));
}

export async function DELETE(request: NextRequest) {
  const admin = getAdminAuthClient();
  if (!admin) return NextResponse.json({ error: 'Auth belum dikonfigurasi.' }, { status: 503 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID pengguna wajib diisi.' }, { status: 400 });

  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deleted: true });
}
