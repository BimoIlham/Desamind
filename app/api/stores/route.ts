import { NextRequest, NextResponse } from 'next/server';
import { deleteRow, insertRow, jsonError, listRows } from '@/lib/api-helpers';
import { getCurrentAuthUser } from '@/lib/auth-server';
import { normalizeStoreProfiles } from '@/lib/store-profile';


export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const owner = searchParams.get('owner');
  const currentUser = owner === 'me' ? await getCurrentAuthUser() : null;

  if (owner === 'me' && !currentUser) {
    return NextResponse.json([]);
  }

  const user_id = owner === 'me' ? currentUser?.id : searchParams.get('user_id');
  const status = searchParams.get('status');
  const stores = await listRows('stores', [], {
    filters: { user_id, status },
    order: { column: 'created_at', ascending: false },
  });

  return NextResponse.json(normalizeStoreProfiles(stores as any[]));
}

export async function POST(req: Request) {
  const user = await getCurrentAuthUser();
  if (!user) return jsonError('Login diperlukan untuk mendaftarkan toko.', 401);

  const body = await req.json();
  const name = String(body.name ?? '').trim();

  if (!name) return jsonError('Nama toko wajib diisi.', 400);

  const existingStores = await listRows<any>('stores', [], {
    filters: { user_id: user.id },
    order: { column: 'created_at', ascending: false },
    limit: 1,
  });

  if (existingStores.length > 0) {
    return jsonError('Akun ini sudah memiliki pendaftaran toko.', 409);
  }

  const fallback = {
    id: `store-${Date.now()}`,
    user_id: user.id,
    name,
    description: body.description ?? '',
    address: body.address ?? '',
    logo_url: body.logo_url ?? null,
    status: 'pending',
    created_at: new Date().toISOString(),
  };

  const { data, error } = await insertRow('stores', fallback, fallback);
  if (error) return jsonError(error.message);

  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentAuthUser();
  if (!user) return jsonError('Login diperlukan untuk menghapus toko.', 401);

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) return jsonError('Missing store id', 400);

  const stores = await listRows<any>('stores', [], {
    filters: { id },
    limit: 1,
  });
  const store = stores[0];
  if (!store) return jsonError('Toko tidak ditemukan.', 404);

  if (user.role !== 'admin' && store.user_id !== user.id) {
    return jsonError('Toko tidak ditemukan di akun Anda.', 404);
  }

  const { error } = await deleteRow('stores', id);
  if (error) return jsonError(error.message);
  return NextResponse.json({ deleted: true });
}
