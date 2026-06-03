/**
 * app/api/stores/[id]/route.ts
 * PATCH: Update store (admin approval/rejection or seller edit).
 */
import { NextRequest, NextResponse } from 'next/server';
import { deleteRow, getRowById, jsonError, updateRow } from '@/lib/api-helpers';
import { getCurrentAuthUser } from '@/lib/auth-server';
import { normalizeStoreProfile } from '@/lib/store-profile';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const store = await getRowById('stores', id, null);

  if (!store) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(normalizeStoreProfile(store as any));
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentAuthUser();
  if (!user) return jsonError('Login diperlukan untuk mengubah toko.', 401);

  const existing = await getRowById<any>('stores', id, null);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await request.json();
  const allowedBody = user.role === 'admin'
    ? body
    : {
        name: body.name,
        description: body.description,
        address: body.address,
        logo_url: body.logo_url,
      };

  if (user.role !== 'admin' && existing.user_id !== user.id) {
    return jsonError('Toko tidak ditemukan di akun Anda.', 404);
  }

  const { data, error } = await updateRow('stores', id, allowedBody, { id, ...allowedBody });

  if (error) return jsonError(error.message);
  return NextResponse.json(data);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentAuthUser();
  if (!user) return jsonError('Login diperlukan untuk menghapus toko.', 401);

  const { id } = await params;
  const existing = await getRowById<any>('stores', id, null);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (user.role !== 'admin' && existing.user_id !== user.id) {
    return jsonError('Toko tidak ditemukan di akun Anda.', 404);
  }

  const { error } = await deleteRow('stores', id);

  if (error) return jsonError(error.message);
  return NextResponse.json({ deleted: true });
}
